[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $SupervisorArgs
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$scriptPath = Join-Path $PSScriptRoot 'execution-supervisor.py'
$candidates = [System.Collections.Generic.List[string]]::new()

if (-not [string]::IsNullOrWhiteSpace($env:AGENT_CODING_ENGINE_PYTHON)) {
    $candidates.Add($env:AGENT_CODING_ENGINE_PYTHON)
}

$bundledPython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
$candidates.Add($bundledPython)

foreach ($name in @('python3', 'python')) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        $candidates.Add($command.Source)
    }
}

$python = $null
foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        $python = $candidate
        break
    }
}

if ($null -eq $python) {
    throw 'Supervisor requires Python 3. Set AGENT_CODING_ENGINE_PYTHON or install the bundled Codex workspace runtime.'
}

$shouldReadStdin = $SupervisorArgs -contains 'event' -and $SupervisorArgs -notcontains '--file'
$stdin = if ($shouldReadStdin) { [Console]::In.ReadToEnd() } else { '' }
$tempInput = $null
try {
    $effectiveArgs = @('--root', $rootDir) + @($SupervisorArgs)
    if (-not [string]::IsNullOrWhiteSpace($stdin) -and $shouldReadStdin) {
        $tempInput = Join-Path ([System.IO.Path]::GetTempPath()) ("ace-supervisor-{0}.json" -f [guid]::NewGuid().ToString('N'))
        [System.IO.File]::WriteAllText($tempInput, $stdin, [System.Text.UTF8Encoding]::new($false))
        $effectiveArgs += @('--file', $tempInput)
    }
    & $python $scriptPath @effectiveArgs
    exit $LASTEXITCODE
} finally {
    if ($null -ne $tempInput -and (Test-Path -LiteralPath $tempInput)) {
        Remove-Item -LiteralPath $tempInput -Force
    }
}
