# Native Windows transport for the existing POSIX/Codex gate. No terminal rules.
[CmdletBinding()]
param([string] $InputJson = '', [string] $RuntimeRoot = '', [int] $GateTimeoutMs = 30000)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$runtime = if ($RuntimeRoot) { $RuntimeRoot } else { Join-Path $root '.codex/governance/runtime/codex' }
$record = [ordered] @{ ts = (Get-Date).ToUniversalTime().ToString('o'); event = 'Stop'; host = 'codex'; phase = 'entry'; session = ''; decision = ''; reason_code = '' }
function Write-AdapterAudit {
    try {
        [void][System.IO.Directory]::CreateDirectory($runtime)
        [System.IO.File]::AppendAllText((Join-Path $runtime 'audit.jsonl'), ($record | ConvertTo-Json -Compress) + "`n", [System.Text.UTF8Encoding]::new($false))
    } catch { }
}
function Block-Adapter([string] $Code) {
    $record.decision = 'block'; $record.reason_code = $Code
    Write-AdapterAudit
    # Only stable diagnostic categories reach the host, never raw stderr or paths.
    [Console]::WriteLine((@{ decision = 'block'; reason = "Codex Stop Gate cannot decide ($Code). Continue authorized work; repair the hook transport before submitting a terminal result." } | ConvertTo-Json -Compress))
    exit 0
}
function Invoke-CodexGate([string] $Shell, [string] $Text) {
    $process = [System.Diagnostics.Process]::new()
    $result = @{ exitCode = 1; stdout = ''; stderr = ''; failure = '' }
    try {
        $start = [System.Diagnostics.ProcessStartInfo]::new()
        $start.FileName = $Shell
        $start.Arguments = ConvertTo-NativeArgument ((Join-Path $PSScriptRoot 'codex-stop-adapter.sh').Replace('\', '/'))
        $start.UseShellExecute = $false; $start.CreateNoWindow = $true
        $start.RedirectStandardInput = $true; $start.RedirectStandardOutput = $true; $start.RedirectStandardError = $true
        $start.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
        $start.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
        $start.EnvironmentVariables['PYTHONIOENCODING'] = 'utf-8'; $start.EnvironmentVariables['PYTHONUTF8'] = '1'
        $process.StartInfo = $start; [void]$process.Start()
        $record.gate_pid = $process.Id
        $watch = [System.Diagnostics.Stopwatch]::StartNew()
        $stdout = $process.StandardOutput.ReadToEndAsync(); $stderr = $process.StandardError.ReadToEndAsync()
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        $write = $process.StandardInput.BaseStream.WriteAsync($bytes, 0, $bytes.Length)
        if (-not $write.Wait($GateTimeoutMs)) { throw [System.TimeoutException]::new() }
        $process.StandardInput.Close()
        if (-not $process.WaitForExit([Math]::Max(1, $GateTimeoutMs - [int]$watch.ElapsedMilliseconds))) { throw [System.TimeoutException]::new() }
        if (-not $stdout.Wait(1000) -or -not $stderr.Wait(1000)) { throw [System.TimeoutException]::new() }
        $result.exitCode = $process.ExitCode
        $result.stdout = $stdout.GetAwaiter().GetResult(); $result.stderr = $stderr.GetAwaiter().GetResult()
    } catch {
        $result.failure = $_.Exception.GetType().Name
        # Cancel only this exact shell and its descendants, including Validators.
        if ($process.Id -and -not $process.HasExited) {
            $cleanup = Invoke-GovernanceProcess -Executable (Join-Path $env:SystemRoot 'System32/taskkill.exe') -Arguments @('/PID', [string]$process.Id, '/T', '/F') -TimeoutMs 5000
            $record.cleanup_exit = $cleanup.exitCode
            if (-not $process.WaitForExit(1000)) { $process.Kill(); [void]$process.WaitForExit(1000) }
            $record.gate_exited = $process.HasExited
        }
    } finally { $process.Dispose() }
    return $result
}
Write-AdapterAudit
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    . (Join-Path $root '.codex/governance/windows-validator-runtime.ps1')
    if (-not $InputJson) {
        $reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput(), [System.Text.UTF8Encoding]::new($false), $true)
        $read = $reader.ReadToEndAsync()
        if (-not $read.Wait(15000)) { Block-Adapter 'STDIN_TIMEOUT' }
        $InputJson = $read.GetAwaiter().GetResult()
    }
    if (-not $InputJson.TrimStart().StartsWith('{')) { Block-Adapter 'PAYLOAD_INVALID' }
    try { $payload = $InputJson | ConvertFrom-Json } catch { Block-Adapter 'PAYLOAD_INVALID' }
    $record.phase = 'payload'
    if ($payload.PSObject.Properties['session_id']) {
        $hash = [System.Security.Cryptography.SHA256]::Create()
        try { $record.session = ([BitConverter]::ToString($hash.ComputeHash([System.Text.Encoding]::UTF8.GetBytes([string]$payload.session_id)))).Replace('-', '').Substring(0,16).ToLowerInvariant() } finally { $hash.Dispose() }
    }
    # Bind only this native session's explicit user declaration. Native Stop
    # does not carry the custom active_role field used by component fixtures.
    $role = if ($payload.PSObject.Properties['active_role']) { [string]$payload.active_role } else { '' }
    if (-not $role) { $role = $env:AGENT_CODING_ENGINE_ACTIVE_ROLE }
    $record.role_source = if ($role) { 'explicit_binding' } else { 'unbound' }
    if (-not $role -and $payload.PSObject.Properties['transcript_path'] -and $payload.transcript_path) {
        $rolePython = Resolve-ValidatorPython -Root $root
        if (-not $rolePython.available) { Block-Adapter 'PYTHON_UNAVAILABLE' }
        $bindingResult = Invoke-GovernanceProcess -Executable $rolePython.path -Arguments @('-X', 'utf8', (Join-Path $root '.codex/governance/codex-session-role.py'), '--workspace', $root) -InputText $InputJson -TimeoutMs 10000
        if ($bindingResult.failure) { Block-Adapter 'ROLE_OBSERVATION_UNAVAILABLE' }
        $binding = $bindingResult.stdout | ConvertFrom-Json
        if ($bindingResult.exitCode -ne 0) {
            if ($binding.error -match '^ROLE_[A-Z_]+$') { Block-Adapter $binding.error }
            Block-Adapter 'ROLE_OBSERVATION_UNAVAILABLE'
        }
        $role = [string]$binding.active_role
        $record.role_source = [string]$binding.source
        $payload | Add-Member -NotePropertyName active_role -NotePropertyValue $role -Force
        $InputJson = $payload | ConvertTo-Json -Compress -Depth 100
    }
    $record.active_role = $role
    if ($role -eq 'planner') {
        $plannerPython = Resolve-ValidatorPython -Root $root
        if (-not $plannerPython.available) { Block-Adapter 'PYTHON_UNAVAILABLE' }
        $result = Invoke-GovernanceProcess -Executable $plannerPython.path -Arguments @('-X', 'utf8', (Join-Path $root '.codex/governance/planner-convergence.py'), '--workspace', $root) -InputText $InputJson -TimeoutMs 15000
        if ($result.failure) { Block-Adapter 'PLANNER_VALIDATOR_UNAVAILABLE' }
        try { $decision = $result.stdout | ConvertFrom-Json } catch { Block-Adapter 'PLANNER_OUTPUT_INVALID' }
        if ($decision.ok -ne $true) {
            if (-not $decision.reason) { Block-Adapter 'PLANNER_OUTPUT_INVALID' }
            $record.decision = 'block'; $record.reason_code = 'PLANNER_CONVERGENCE_REJECTED'; Write-AdapterAudit
            [Console]::WriteLine((@{ decision = 'block'; reason = [string]$decision.reason } | ConvertTo-Json -Compress))
            exit 0
        }
        if ($result.exitCode -ne 0) { Block-Adapter 'PLANNER_PROCESS_FAILED' }
        $record.decision = 'pass'; $record.reason_code = 'PLANNER_CONVERGENCE_ACCEPTED'; Write-AdapterAudit
        exit 0
    }
    if ($role -ne 'executor') {
        $record.decision = 'pass'; $record.reason_code = if ($role) { 'ROLE_NOT_EXECUTOR' } else { 'ROLE_UNBOUND' }; Write-AdapterAudit
        exit 0
    }
    $shells = @()
    if ($env:AGENT_CODING_ENGINE_SH) { $shells = @($env:AGENT_CODING_ENGINE_SH) }
    else {
        foreach ($git in @(Get-Command git -CommandType Application -ErrorAction SilentlyContinue)) {
            $shells += Join-Path (Split-Path -Parent (Split-Path -Parent $git.Source)) 'bin/sh.exe'
            $shells += Join-Path (Split-Path -Parent (Split-Path -Parent $git.Source)) 'usr/bin/sh.exe'
        }
        $shells += Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/usr/bin/sh.exe'
    }
    $shell = ''
    foreach ($candidate in $shells) {
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        $probe = Invoke-GovernanceProcess -Executable $candidate -Arguments @('-c', 'printf ACE_SH_OK')
        if ($probe.exitCode -eq 0 -and -not $probe.failure -and $probe.stdout -eq 'ACE_SH_OK') { $shell = $candidate; break }
    }
    if (-not $shell) { Block-Adapter 'SHELL_UNAVAILABLE' }
    $jq = if ($env:AGENT_CODING_ENGINE_JQ) { $env:AGENT_CODING_ENGINE_JQ } else { '' }
    if (-not $jq) {
        $jqCommand = Get-Command jq -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($jqCommand) { $jq = $jqCommand.Source }
        else { $jq = Join-Path $env:USERPROFILE '.cache/agent-coding-engine/jq-1.8.2/jq.exe' }
    }
    if (-not (Test-Path -LiteralPath $jq -PathType Leaf)) { Block-Adapter 'JQ_UNAVAILABLE' }
    $probe = Invoke-GovernanceProcess -Executable $jq -Arguments @('-cn', '"ACE_JQ_OK"')
    if ($probe.exitCode -ne 0 -or $probe.failure -or $probe.stdout.Trim() -ne '"ACE_JQ_OK"') { Block-Adapter 'JQ_UNAVAILABLE' }
    $python = Resolve-ValidatorPython -Root $root
    if (-not $python.available) { Block-Adapter 'PYTHON_UNAVAILABLE' }
    # Environment changes are scoped to this short-lived hook process.
    $env:AGENT_CODING_ENGINE_JQ = $jq.Replace('\', '/')
    $env:AGENT_CODING_ENGINE_PYTHON = $python.path.Replace('\', '/')
    $env:AGENT_CODING_ENGINE_VALIDATOR_AUDIT = (Join-Path $runtime 'validator.jsonl').Replace('\', '/')
    $env:AGENT_CODING_ENGINE_AUDIT_SESSION = $record.session
    $record.phase = 'gate'; $record.interpreter = $python.identity
    $contractHash = [System.Security.Cryptography.SHA256]::Create()
    try { $record.contract_sha256 = ([BitConverter]::ToString($contractHash.ComputeHash([System.IO.File]::ReadAllBytes((Join-Path $root '.codex/governance/terminal-contract.json'))))).Replace('-', '').ToLowerInvariant() } finally { $contractHash.Dispose() }
    $result = Invoke-CodexGate -Shell $shell -Text $InputJson
    $record.gate_exit = $result.exitCode; $record.failure = $result.failure; $record.stderr_bytes = [System.Text.Encoding]::UTF8.GetByteCount($result.stderr)
    if ($result.exitCode -ne 0 -or $result.failure) { Block-Adapter 'GATE_PROCESS_FAILED' }
    if ($result.stdout.Trim()) {
        $decision = $result.stdout | ConvertFrom-Json
        if ($decision.decision -eq 'block' -and $decision.reason -is [string] -and $decision.reason.Trim()) {
            $record.decision = 'block'; $record.reason_code = 'GATE_REJECTED'; Write-AdapterAudit
            [Console]::WriteLine((@{ decision = 'block'; reason = $decision.reason } | ConvertTo-Json -Compress))
            exit 0
        }
        Block-Adapter 'GATE_OUTPUT_INVALID'
    }
    $record.decision = 'pass'; $record.reason_code = 'GATE_ACCEPTED'; Write-AdapterAudit
    exit 0
} catch {
    $record.exception_type = $_.Exception.GetType().Name
    Block-Adapter 'ADAPTER_EXCEPTION'
}
