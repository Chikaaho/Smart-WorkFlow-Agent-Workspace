[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Start', 'Pause', 'Resume', 'Cancel', 'Heartbeat', 'Status')]
    [string] $Action,
    [Parameter(Mandatory = $true)]
    [string] $TaskId,
    [string] $HostName,
    [string] $ThreadId,
    [int] $ContractRevision = 0,
    [string] $ContractFile,
    [string] $SupervisorUrl
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$supervisor = Join-Path $PSScriptRoot 'supervisor.ps1'

if ($Action -eq 'Status') {
    & powershell -NoProfile -File $supervisor status --task-id $TaskId
    exit $LASTEXITCODE
}

if ([string]::IsNullOrWhiteSpace($HostName)) {
    throw "HostName is required for $Action."
}
if ([string]::IsNullOrWhiteSpace($ThreadId)) {
    throw "ThreadId is required for $Action."
}

$eventType = @{
    Start = 'TASK_STARTED'
    Pause = 'USER_PAUSED'
    Resume = 'USER_RESUMED'
    Cancel = 'USER_CANCELLED'
    Heartbeat = 'HEARTBEAT'
}[$Action]

$event = [ordered]@{
    schema = 'agent-coding-engine.supervisor-event.v1'
    event_type = $eventType
    event_id = "control-$($Action.ToLowerInvariant())-$([guid]::NewGuid().ToString('N'))"
    task_id = $TaskId
    host = $HostName
    workspace = $rootDir
    thread_id = $ThreadId
    active_role = 'executor'
}
if ($Action -eq 'Start') {
    $event.contract_revision = $ContractRevision
    if (-not [string]::IsNullOrWhiteSpace($ContractFile)) {
        $event.terminal_payload = Get-Content -LiteralPath $ContractFile -Raw | ConvertFrom-Json
    }
}

$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("ace-task-event-{0}.json" -f [guid]::NewGuid().ToString('N'))
try {
    [System.IO.File]::WriteAllText($temp, ($event | ConvertTo-Json -Depth 100), [System.Text.UTF8Encoding]::new($false))
    $cliArgs = @('event', '--file', $temp)
    if (-not [string]::IsNullOrWhiteSpace($SupervisorUrl)) {
        $cliArgs += @('--url', $SupervisorUrl)
    }
    & powershell -NoProfile -File $supervisor @cliArgs
    exit $LASTEXITCODE
} finally {
    if (Test-Path -LiteralPath $temp) {
        Remove-Item -LiteralPath $temp -Force
    }
}
