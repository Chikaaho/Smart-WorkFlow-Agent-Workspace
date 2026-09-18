# ZCode hook 门禁自检：报告声明、入口、观察读取器、宿主信任状态与审计台账。
#
# 只读诊断入口，不修改任何治理状态；用于在 Owner 侧确认
# “门禁是否真的在运行”，而不是只在文件里存在。

[CmdletBinding()]
param(
    [string] $EngineRoot = '',
    [string] $RuntimeRoot = '',
    [int] $RecentAudit = 10
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
. (Join-Path $PSScriptRoot 'zcode-gate-common.ps1')

function Test-FileReport {
    param(
        [Parameter(Mandatory = $true)] [string] $Root,
        [Parameter(Mandatory = $true)] [string] $Relative,
        [Parameter(Mandatory = $true)] [string] $Name
    )

    $path = Join-Path $Root $Relative
    $exists = Test-Path -LiteralPath $path -PathType Leaf
    $bytes = 0
    if ($exists) { $bytes = (Get-Item -LiteralPath $path).Length }
    return [ordered] @{ name = $Name; path = $Relative; present = $exists; bytes = $bytes }
}

$root = Resolve-GateEngineRoot -Explicit $EngineRoot -PayloadCwd (Get-Location).Path -ScriptRoot (Split-Path -Parent $PSScriptRoot)
if ([string]::IsNullOrWhiteSpace($root)) {
    Write-Output '{"status":"error","error":"engine-root-not-found"}'
    exit 1
}
$runtime = Get-GateRuntimeRoot -EngineRoot $root -Override $RuntimeRoot

$declaration = [ordered] @{ path = '.zcode/config.json'; present = $false; hooks_enabled = $false; events = @(); command_ok = $false }
$configPath = Join-Path $root '.zcode/config.json'
if (Test-Path -LiteralPath $configPath -PathType Leaf) {
    $declaration.present = $true
    $config = ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8))
    $hooks = Get-GateJsonProperty $config 'hooks'
    $enabled = Get-GateJsonProperty $hooks 'enabled'
    $declaration.hooks_enabled = $enabled -is [bool] -and $enabled
    $events = Get-GateJsonProperty $hooks 'events'
    $eventNames = @()
    $commandsOk = $true
    if ($null -ne $events) {
        foreach ($property in $events.PSObject.Properties) {
            $eventNames += $property.Name
            foreach ($matcher in @($property.Value)) {
                foreach ($hook in @(Get-GateJsonProperty $matcher 'hooks')) {
                    $command = Get-GateJsonText $hook 'command'
                    $arguments = Get-GateJsonProperty $hook 'args'
                    $joined = "$command " + (@($arguments) -join ' ')
                    if ($joined -notmatch 'stop-gate\.ps1|session-role\.ps1') { $commandsOk = $false }
                }
            }
        }
    }
    $declaration.events = $eventNames
    $declaration.command_ok = $commandsOk -and ($eventNames -contains 'Stop')
}

$files = @(
    (Test-FileReport -Root $root -Relative '.codex/governance/stop-gate.ps1' -Name 'stop-gate.ps1'),
    (Test-FileReport -Root $root -Relative '.codex/governance/session-role.ps1' -Name 'session-role.ps1'),
    (Test-FileReport -Root $root -Relative '.codex/governance/zcode-gate-common.ps1' -Name 'zcode-gate-common.ps1'),
    (Test-FileReport -Root $root -Relative '.codex/governance/session-observation.py' -Name 'session-observation.py'),
    (Test-FileReport -Root $root -Relative '.codex/governance/validate-terminal.ps1' -Name 'validate-terminal.ps1'),
    (Test-FileReport -Root $root -Relative '.codex/governance/terminal-contract.json' -Name 'terminal-contract.json')
)

$auditPath = Join-Path $runtime 'audit.jsonl'
$audit = [ordered] @{ path = '.codex/governance/runtime/zcode/audit.jsonl'; present = $false; records = 0; last = @() }
if (Test-Path -LiteralPath $auditPath -PathType Leaf) {
    $audit.present = $true
    $records = @(Get-Content -LiteralPath $auditPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $audit.records = $records.Count
    foreach ($record in @($records | Select-Object -Last $RecentAudit)) {
        $parsed = ConvertFrom-GateJson -Text $record
        if ($null -eq $parsed) { continue }
        $audit.last += [ordered] @{
            ts          = Get-GateJsonText $parsed 'ts'
            event       = Get-GateJsonText $parsed 'event'
            role        = Get-GateJsonText $parsed 'role'
            gated       = Get-GateJsonProperty $parsed 'gated'
            decision    = Get-GateJsonText $parsed 'decision'
            reason_code = Get-GateJsonText $parsed 'reason_code'
        }
    }
}

$sessionsDir = Join-Path $runtime 'sessions'
$boundSessions = @()
if (Test-Path -LiteralPath $sessionsDir -PathType Container) {
    foreach ($file in @(Get-ChildItem -LiteralPath $sessionsDir -Filter '*.role.json')) {
        $state = Read-GateState -Path $file.FullName
        $boundSessions += [ordered] @{
            session = $file.BaseName -replace '\.role$', ''
            role    = Get-GateJsonText $state 'role'
        }
    }
}

$trustStore = [ordered] @{ path = ''; present = $false; records = -1 }
$storageOverride = $env:ZCODE_STORAGE_DIR
$storageDir = if (-not [string]::IsNullOrWhiteSpace($storageOverride)) { $storageOverride } else { Join-Path $env:USERPROFILE '.zcode' }
$trustPath = Join-Path $storageDir 'security/workspace-hook-trust-v1.json'
$trustStore.path = $trustPath
if (Test-Path -LiteralPath $trustPath -PathType Leaf) {
    $trustStore.present = $true
    $trust = ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($trustPath, [System.Text.Encoding]::UTF8))
    $recordsProperty = Get-GateJsonProperty $trust 'records'
    if ($null -ne $recordsProperty) { $trustStore.records = @($recordsProperty).Count }
}

# 宿主侧的 hook 派发失败（例如命令解析/spawn 失败）只记录在运行时日志里，
# 门禁自身无法感知，必须在这里暴露，否则“配置在、却静默不生效”会再次出现。
$hostHookFailures = [ordered] @{ scanned_files = 0; failures = @() }
$logDir = Join-Path $env:USERPROFILE '.zcode/cli/log'
if (Test-Path -LiteralPath $logDir -PathType Container) {
    $logFiles = @(Get-ChildItem -LiteralPath $logDir -Filter 'zcode-*.jsonl' | Sort-Object Name -Descending | Select-Object -First 2)
    $hostHookFailures.scanned_files = $logFiles.Count
    $collected = [System.Collections.Generic.List[object]]::new()
    foreach ($logFile in $logFiles) {
        foreach ($line in [System.IO.File]::ReadLines($logFile.FullName)) {
            if ($line -notmatch 'hook\.run\.failed') { continue }
            $record = ConvertFrom-GateJson -Text $line
            if ($null -eq $record) { continue }
            $context = Get-GateJsonProperty $record 'context'
            $collected.Add([ordered] @{
                ts       = Get-GateJsonText $record 'timestamp'
                event    = Get-GateJsonText $context 'hookEventName'
                source   = Get-GateJsonText $context 'source'
                session  = Get-GateJsonText $record 'sessionId'
                duration = Get-GateJsonProperty $record 'durationMs'
            })
        }
    }
    if ($collected.Count -gt 0) {
        $hostHookFailures.failures = @($collected | Sort-Object { $_.ts } | Select-Object -Last 5)
        $cutoff = (Get-Date).ToUniversalTime().AddHours(-24).ToString('yyyy-MM-ddTHH:mm:ssZ')
        $hostHookFailures.recent_count = @($collected | Where-Object { $_.ts -ge $cutoff }).Count
    } else {
        $hostHookFailures.recent_count = 0
    }
}
$recentHostFailures = [int] (Get-GateJsonProperty $hostHookFailures 'recent_count')

$report = [ordered] @{
    schema           = 'agent-coding-engine.zcode-hook-selfcheck.v1'
    engine_root      = $root
    runtime_root     = $runtime
    declaration      = $declaration
    files            = $files
    audit            = $audit
    bound_sessions   = $boundSessions
    workspace_trust  = $trustStore
    host_hook_failures = $hostHookFailures
    posix_jq         = [ordered] @{
        available = $null -ne (Get-Command jq -ErrorAction SilentlyContinue)
        note      = 'POSIX/Codex 宿主入口在缺少 jq 时 fail closed；ZCode 入口不依赖 jq'
    }
    live             = ($declaration.present -and $declaration.hooks_enabled -and $audit.records -gt 0 -and $recentHostFailures -eq 0)
}
Write-Output ($report | ConvertTo-Json -Depth 8)
exit 0
