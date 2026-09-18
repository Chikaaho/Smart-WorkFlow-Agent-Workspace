[CmdletBinding()]
param(
    [ValidateSet('Probe', 'Read', 'Forward', 'Deliver')]
    [string] $Mode = 'Probe',
    [string] $EventFile,
    [string] $DecisionFile,
    [string] $SessionId,
    [string] $Workspace,
    [string] $SupervisorUrl = 'http://127.0.0.1:8765'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$supervisor = Join-Path $PSScriptRoot 'supervisor.ps1'
$adapter = Join-Path $PSScriptRoot 'zcode-host-adapter.py'
$workspacePath = if ([string]::IsNullOrWhiteSpace($Workspace)) { $rootDir } else { $Workspace }
$pythonCandidates = @(
    $env:AGENT_CODING_ENGINE_PYTHON,
    (Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe')
)
$python = $pythonCandidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and (Test-Path -LiteralPath $_ -PathType Leaf) } | Select-Object -First 1
if ($null -eq $python) {
    throw 'ZCode adapter requires Python 3. Set AGENT_CODING_ENGINE_PYTHON or install the bundled Codex workspace runtime.'
}

if ($Mode -eq 'Probe') {
    & $python $adapter probe --workspace $workspacePath
    exit $LASTEXITCODE
}

if ($Mode -eq 'Read') {
    if ([string]::IsNullOrWhiteSpace($SessionId)) { throw 'Read requires -SessionId.' }
    & $python $adapter read --workspace $workspacePath --session-id $SessionId
    exit $LASTEXITCODE
}

if ($Mode -eq 'Forward') {
    if ([string]::IsNullOrWhiteSpace($EventFile) -or -not (Test-Path -LiteralPath $EventFile -PathType Leaf)) {
        throw 'Forward requires -EventFile.'
    }
    $event = Get-Content -LiteralPath $EventFile -Raw | ConvertFrom-Json
    if ($event.host -ne 'zcode') { throw 'ZCode adapter only accepts host=zcode.' }
    if ([string]::IsNullOrWhiteSpace([string] $event.thread_id)) { throw 'ZCode adapter refuses events without a stable thread_id.' }
    Get-Content -LiteralPath $EventFile -Raw | & powershell -NoProfile -File $supervisor event --url $SupervisorUrl
    exit $LASTEXITCODE
}

if ([string]::IsNullOrWhiteSpace($DecisionFile) -or -not (Test-Path -LiteralPath $DecisionFile -PathType Leaf)) {
    throw 'Deliver requires -DecisionFile.'
}
$decision = Get-Content -LiteralPath $DecisionFile -Raw | ConvertFrom-Json
if ($decision.schema -ne 'agent-coding-engine.supervisor-decision.v1') { throw 'Unsupported Supervisor decision schema.' }
if ($decision.target.host -ne 'zcode') { throw 'Decision target host is not zcode.' }
if ($decision.target.thread_id -ne $SessionId) { throw 'Decision target thread does not match -SessionId.' }
if ((Resolve-Path -LiteralPath $decision.target.workspace).Path -ne (Resolve-Path -LiteralPath $workspacePath).Path) { throw 'Decision target workspace does not match.' }
if ($decision.send_required -ne $true -or $decision.decision -notin @('reinject', 'replan')) { throw 'Decision does not authorize a reinjection.' }

$promptFile = Join-Path ([System.IO.Path]::GetTempPath()) ("ace-zcode-prompt-{0}.txt" -f [guid]::NewGuid().ToString('N'))
try {
    [System.IO.File]::WriteAllText($promptFile, [string] $decision.follow_up_prompt, [System.Text.UTF8Encoding]::new($false))
    & $python $adapter send --workspace $workspacePath --session-id $SessionId --prompt-file $promptFile
    exit $LASTEXITCODE
} finally {
    if (Test-Path -LiteralPath $promptFile) { Remove-Item -LiteralPath $promptFile -Force }
}
