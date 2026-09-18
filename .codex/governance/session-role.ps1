# ZCode UserPromptSubmit 入口：会话角色绑定
#
# system.md §0.2 要求会话角色只能由用户显式声明，不得从任务内容、目录或历史猜测。
# 本入口只做一件事：把用户提示词里的显式角色声明归一化为会话角色记录，
# 供 Stop Gate 判定该会话是否属于受治理的 Executor 执行会话。
#
# 本文件不包含任何终态规则，也不产生任何输出（静默通过）。

[CmdletBinding()]
param(
    [string] $InputJson = '',
    [string] $InputFile = '',
    [string] $EngineRoot = '',
    [string] $RuntimeRoot = '',
    [switch] $NoAudit
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# 宿主按 UTF-8 解码 hook 输出；Windows PowerShell 5.1 默认按 OEM 代码页写 stdout/stderr。
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
. (Join-Path $PSScriptRoot 'zcode-gate-common.ps1')

# 角色声明的锚定模式：必须出现显式声明结构，避免把任务描述里的角色名词当作声明。
$rolePatterns = [ordered] @{
    'declarative_role_field' = '(?:角色|身份)\s*(?:是|为|＝|=|：|:)\s*(?<role>规划|执行|管理员)'
    'declarative_subject'    = '(?:你|本会话|当前会话|本任务|本次|这次)\s*(?:现在)?\s*(?:是|为|＝|=)\s*(?<role>规划|执行|管理员)'
    'declarative_as'         = '作为\s*(?<role>规划|执行|管理员)'
    'declarative_in_role'    = '以\s*(?<role>规划|执行|管理员)\s*(?:的)?\s*(?:身份|角色)'
}

$roleAliases = [ordered] @{
    '规划'   = 'planner'
    '执行'   = 'executor'
    '管理员' = 'admin'
}

function Get-DeclaredRole {
    param([string] $Prompt)

    $found = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($pattern in $rolePatterns.Values) {
        foreach ($match in [regex]::Matches($Prompt, $pattern)) {
            $role = $match.Groups['role'].Value
            if (-not [string]::IsNullOrWhiteSpace($role)) { [void] $found.Add($roleAliases[$role]) }
        }
    }
    if ($Prompt -match '授权执行') { [void] $found.Add('executor') }
    if ($found.Count -eq 0) { return @{ role = ''; reason = 'none' } }
    if ($found.Count -gt 1) { return @{ role = ''; reason = 'ambiguous' } }
    return @{ role = @($found)[0]; reason = 'declared' }
}

$payloadText = Read-GatePayload -InlineJson $InputJson -FromFile $InputFile
$payload = ConvertFrom-GateJson -Text $payloadText
if ($null -eq $payload) { exit 0 }

$prompt = Get-GateJsonText $payload 'prompt'
$sessionId = Get-GateJsonText $payload 'session_id'
if ([string]::IsNullOrWhiteSpace($prompt) -or [string]::IsNullOrWhiteSpace($sessionId)) { exit 0 }

$root = Resolve-GateEngineRoot -Explicit $EngineRoot -PayloadCwd (Get-GateJsonText $payload 'cwd') -ScriptRoot (Split-Path -Parent $PSScriptRoot)
if ([string]::IsNullOrWhiteSpace($root)) { exit 0 }

$runtime = Get-GateRuntimeRoot -EngineRoot $root -Override $RuntimeRoot
$sessionKey = Get-GateSessionKey -SessionId $sessionId
$rolePath = Join-Path (Join-Path $runtime 'sessions') "$sessionKey.role.json"
$auditPath = Join-Path $runtime 'audit.jsonl'

# 角色绑定失败不得阻断用户提示词，但必须留下可见记录：审计出现 decision=error 时，
# 说明该会话的角色没有绑定，Stop 门禁不会启用，需要管理员检查入口环境。
trap {
    $detail = "$($_.Exception.GetType().Name): $($_.Exception.Message)"
    if (-not $NoAudit) {
        Write-GateAudit -Path $auditPath -Record ([ordered] @{
            ts          = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
            event       = 'UserPromptSubmit'
            session     = $sessionKey
            action      = 'error'
            reason_code = 'ROLE_BIND_INTERNAL_ERROR'
            detail      = $detail.Substring(0, [Math]::Min(300, $detail.Length))
        })
    }
    exit 0
}
$existing = Read-GateState -Path $rolePath

$declaration = Get-DeclaredRole -Prompt $prompt
$action = 'unchanged'
$role = ''
if ($declaration.reason -eq 'declared') {
    $role = $declaration.role
    $digest = [System.BitConverter]::ToString(
        [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($sessionId))
    ).Replace('-', '').Substring(0, 16).ToLowerInvariant()
    Write-GateState -Path $rolePath -State ([ordered] @{
        schema            = 'agent-coding-engine.zcode-session-role.v1'
        session_id_digest = $digest
        role              = $role
        source            = 'user_prompt_submit'
        declared_at       = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    })
    $action = if ($null -ne $existing -and (Get-GateJsonText $existing 'role') -eq $role) { 'confirmed' } else { 'bound' }
} elseif ($declaration.reason -eq 'ambiguous') {
    $action = 'ambiguous'
}

if (-not $NoAudit) {
    Write-GateAudit -Path $auditPath -Record ([ordered] @{
        ts         = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        event      = 'UserPromptSubmit'
        session    = $sessionKey
        role       = $role
        action     = $action
        engine_root = $root
    })
}

exit 0
