# Windows native execution mechanics. Terminal rules remain in the public contract/Validator.
function ConvertTo-NativeArgument {
    param([AllowEmptyString()] [string] $Value)
    # CommandLineToArgvW quoting, including quotes and trailing backslashes.
    return '"' + [regex]::Replace([regex]::Replace($Value, '(\\*)"', '$1$1\"'), '(\\+)$', '$1$1') + '"'
}

function Invoke-GovernanceProcess {
    param([string] $Executable, [string[]] $Arguments, [AllowEmptyString()] [string] $InputText = '', [int] $TimeoutMs = 5000)
    $result = @{ exitCode = 1; stdout = ''; stderr = ''; failure = ''; exception_type = '' }
    $process = $null
    try {
        $start = [System.Diagnostics.ProcessStartInfo]::new()
        $start.FileName = $Executable
        $start.Arguments = (@($Arguments | ForEach-Object { ConvertTo-NativeArgument $_ }) -join ' ')
        $start.UseShellExecute = $false
        $start.CreateNoWindow = $true
        $start.RedirectStandardInput = $true
        $start.RedirectStandardOutput = $true
        $start.RedirectStandardError = $true
        $start.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
        $start.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
        $start.EnvironmentVariables['PYTHONIOENCODING'] = 'utf-8'
        $start.EnvironmentVariables['PYTHONUTF8'] = '1'
        $process = [System.Diagnostics.Process]::Start($start)
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        $watch = [System.Diagnostics.Stopwatch]::StartNew()
        # Write bytes explicitly: Windows PowerShell's default pipeline encoding is ASCII.
        $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($InputText)
        $write = $process.StandardInput.BaseStream.WriteAsync($bytes, 0, $bytes.Length)
        if (-not $write.Wait($TimeoutMs)) { throw [System.TimeoutException]::new() }
        $process.StandardInput.Close()
        $remaining = [Math]::Max(1, $TimeoutMs - [int]$watch.ElapsedMilliseconds)
        if (-not $process.WaitForExit($remaining)) { throw [System.TimeoutException]::new() }
        $result.exitCode = $process.ExitCode
        $result.stdout = $stdout.GetAwaiter().GetResult()
        $result.stderr = $stderr.GetAwaiter().GetResult()
    } catch {
        $result.exception_type = $_.Exception.GetType().Name
        $result.failure = if ($_.Exception -is [System.TimeoutException]) { 'TIMEOUT' } else { 'PROCESS_ERROR' }
        # Only this exact child is ours; never clean user services by name/port.
        if ($null -ne $process -and -not $process.HasExited) { $process.Kill(); $process.WaitForExit() }
    } finally {
        if ($null -ne $process) { $process.Dispose() }
    }
    return $result
}

function Get-ValidatorInterpreterIdentity {
    param([string] $Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
    return [regex]::Replace($Path, '(?i)([/\\]Users[/\\])[^/\\]+', '$1<user>')
}

function Resolve-ValidatorPython {
    param([string] $Root, [string] $Explicit = '')
    $candidates = [System.Collections.Generic.List[string]]::new()
    $override = if ($Explicit) { $Explicit } else { $env:AGENT_CODING_ENGINE_PYTHON }
    if ($override) { $candidates.Add($override) }
    else {
        $cached = Join-Path $Root '.codex/governance/runtime/zcode/reader.json'
        try { $record = Get-Content -LiteralPath $cached -Raw -ErrorAction Stop | ConvertFrom-Json; if ($record.python) { $candidates.Add([string]$record.python) } } catch { }
        if ($env:USERPROFILE) {
            $candidates.Add((Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'))
            $installed = Join-Path $env:USERPROFILE 'AppData/Local/Programs/Python'
            if (Test-Path -LiteralPath $installed) {
                foreach ($directory in @(Get-ChildItem -LiteralPath $installed -Directory -Filter 'Python3*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 10)) {
                    $candidates.Add((Join-Path $directory.FullName 'python.exe'))
                }
            }
        }
        foreach ($name in @('python3', 'python')) {
            foreach ($command in @(Get-Command $name -CommandType Application -ErrorAction SilentlyContinue)) { $candidates.Add($command.Source) }
        }
    }
    $seen = @{}
    $failures = [System.Collections.Generic.List[string]]::new()
    foreach ($candidate in $candidates) {
        if ($seen.ContainsKey($candidate)) { continue }; $seen[$candidate] = $true
        $identity = Get-ValidatorInterpreterIdentity $candidate
        if ($candidate -match '[/\\]WindowsApps[/\\]') { $failures.Add("$identity`: WINDOWSAPPS_ALIAS"); continue }
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { $failures.Add("$identity`: MISSING"); continue }
        $probe = Invoke-GovernanceProcess -Executable $candidate -Arguments @('-c', 'import json,sys; assert sys.version_info >= (3,10); print("ACE_PYTHON_OK")')
        if ($probe.exitCode -eq 0 -and -not $probe.failure -and $probe.stdout.Trim() -eq 'ACE_PYTHON_OK') {
            return @{ available = $true; path = $candidate; identity = $identity; diagnostics = @($failures.ToArray()) }
        }
        $failures.Add("$identity`: probe exit=$($probe.exitCode), failure=$($probe.failure), exception=$($probe.exception_type)")
    }
    if ($failures.Count -eq 0) { $failures.Add('Python 3.10+ not found') }
    return @{ available = $false; path = ''; identity = ''; diagnostics = @($failures.ToArray()) }
}
