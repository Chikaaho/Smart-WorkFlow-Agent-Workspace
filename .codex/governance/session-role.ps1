# ZCode UserPromptSubmit 入口：会话角色绑定
#
# system.md §0.2 要求会话角色只能由用户显式声明，不得从任务内容、目录或历史猜测。
# 本入口只做一件事：把用户提示词里的显式角色声明归一化为会话角色记录，
# 供 Stop Gate 判定该会话是否属于受治理的 Executor 执行会话。
#
# 本文件不包含任何终态规则；输出只注入一行门禁状态（角色、是否上膛、上次拦截、清单与上下文实测），
# 供 Owner 与模型确认门禁是否在运行。角色写入失败不阻断提示词，但会写审计。

[CmdletBinding()]
param(
    [string] $InputJson = '',
    [string] $InputFile = '',
    [string] $EngineRoot = '',
    [string] $RuntimeRoot = '',
    [string] $FirstPromptText = '',
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

# 角色绑定是提示词时点的尽力而为：stdin 管道异常不得阻断用户提示词，直接降级退出。
try {
    $payloadText = Read-GatePayload -InlineJson $InputJson -FromFile $InputFile
} catch {
    exit 0
}
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
$roleSource = 'user_prompt_submit'
if ($declaration.reason -eq 'declared') {
    $role = $declaration.role
} elseif ($null -eq $existing) {
    # 回填：hook 尚未生效（或首次派发失败）的历史会话，其角色声明只存在于宿主保存的首个提示词里。
    # 只读宿主记录、只在角色未绑定时执行，且仍然要求显式声明结构。
    $firstPrompt = $FirstPromptText
    if ([string]::IsNullOrWhiteSpace($firstPrompt)) {
        $readerPath = Join-Path $PSScriptRoot 'session-observation.py'
        $python = Resolve-ObservationReader -Runtime $runtime
        if (-not [string]::IsNullOrWhiteSpace($python) -and (Test-Path -LiteralPath $readerPath -PathType Leaf)) {
            try {
                $raw = & $python $readerPath --session-id $sessionId 2>$null | Out-String
                $firstPrompt = Get-GateJsonText (ConvertFrom-HookJson -Text $raw) 'first_prompt'
            } catch { $firstPrompt = '' }
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($firstPrompt)) {
        $backfill = Get-DeclaredRole -Prompt $firstPrompt
        if ($backfill.reason -eq 'declared') {
            $role = $backfill.role
            $roleSource = 'host_first_prompt'
            $action = 'backfilled'
        } elseif ($backfill.reason -eq 'ambiguous') {
            $action = 'ambiguous'
        }
    }
} elseif ($declaration.reason -eq 'ambiguous') {
    $action = 'ambiguous'
}

if (-not [string]::IsNullOrWhiteSpace($role)) {
    $digest = [System.BitConverter]::ToString(
        [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($sessionId))
    ).Replace('-', '').Substring(0, 16).ToLowerInvariant()
    Write-GateState -Path $rolePath -State ([ordered] @{
        schema            = 'agent-coding-engine.zcode-session-role.v1'
        session_id_digest = $digest
        role              = $role
        source            = $roleSource
        declared_at       = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    })
    if ($action -eq 'unchanged') {
        $action = if ($null -ne $existing -and (Get-GateJsonText $existing 'role') -eq $role) { 'confirmed' } else { 'bound' }
    }
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

# 把门禁状态注入对话：Owner 与模型都能看到门禁是否上膛、清单还剩多少、上次拦截原因，
# 不必靠猜或事后翻日志。状态行只报事实，不做裁决。
$effectiveRole = $role
$roleOrigin = ''
if ([string]::IsNullOrWhiteSpace($effectiveRole)) {
    $stored = Read-GateState -Path $rolePath
    $effectiveRole = Get-GateJsonText $stored 'role'
    $storedSource = Get-GateJsonText $stored 'source'
    if ($storedSource -eq 'host_first_prompt') { $roleOrigin = '（首个提示词回填）' }
}
$statusParts = [System.Collections.Generic.List[string]]::new()
if ([string]::IsNullOrWhiteSpace($effectiveRole)) {
    $statusParts.Add('会话角色=未声明（执行门禁不启用）')
} else {
    $statusParts.Add("会话角色=$effectiveRole$roleOrigin")
}

$declarationPath = Join-Path $root '.codex/governance/zcode-hooks-declaration.json'
$userConfigPath = Join-Path $env:USERPROFILE '.zcode/cli/config.json'
$armedNote = '已上膛'
if (-not (Test-Path -LiteralPath $declarationPath -PathType Leaf)) {
    $armedNote = '未上膛（仓库声明缺失）'
} elseif (-not (Test-Path -LiteralPath $userConfigPath -PathType Leaf)) {
    $armedNote = '未上膛（机器级声明缺失，运行 install-zcode-hooks.ps1）'
} else {
    $declaredHooks = Get-GateJsonProperty (ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($declarationPath, [System.Text.Encoding]::UTF8))) 'hooks'
    $installedHooks = Get-GateJsonProperty (ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($userConfigPath, [System.Text.Encoding]::UTF8))) 'hooks'
    $declaredJson = if ($null -eq $declaredHooks) { '' } else { $declaredHooks | ConvertTo-Json -Depth 16 -Compress }
    $installedJson = if ($null -eq $installedHooks) { '' } else { $installedHooks | ConvertTo-Json -Depth 16 -Compress }
    if ($declaredJson -ne $installedJson) { $armedNote = '未上膛（声明漂移，运行 install-zcode-hooks.ps1 修复）' }
}
$statusParts.Add("门禁=$armedNote")

$sessionState = Read-GateState -Path (Join-Path (Join-Path $runtime 'sessions') "$sessionKey.state.json")
$lastReason = Get-GateJsonText $sessionState 'last_reason_code'
$lastBlocks = Get-GateJsonInt $sessionState 'consecutive_blocks'
if (-not [string]::IsNullOrWhiteSpace($lastReason)) {
    $statusParts.Add("上次拦截=$lastReason（连续 $lastBlocks 次）")
} else {
    $statusParts.Add('上次拦截=无')
}

$readerPath = Join-Path $root '.codex/governance/session-observation.py'
$python = Resolve-ObservationReader -Runtime $runtime
$observation = $null
if (-not [string]::IsNullOrWhiteSpace($python) -and (Test-Path -LiteralPath $readerPath -PathType Leaf)) {
    try {
        $raw = & $python $readerPath --session-id $sessionId 2>$null | Out-String
        $observation = ConvertFrom-HookJson -Text $raw
        $todo = Get-GateJsonProperty $observation 'todo'
        if ((Get-GateJsonProperty $todo 'available') -eq $true) {
            $statusParts.Add("自定清单未完成=$(Get-GateJsonInt $todo 'open') 项")
        }
        $context = Get-GateJsonProperty $observation 'context'
        if ((Get-GateJsonProperty $context 'available') -eq $true) {
            $statusParts.Add("上下文=$(Get-GateJsonInt $context 'tokens')/$(Get-GateJsonInt $context 'limit')（$((Get-GateJsonProperty $context 'percent'))%）")
        }
    } catch { }
}

# 上回合收尾检测：宿主对 Stop hook 的派发实测可能静默缺失（门禁零裁决也不留失败日志），
# 因此在提示词时点独立核查"上一回合是否以合法终态行结束"。上一回合带正文且无终态行时，
# 状态行直接标注未过门禁，并向模型注入纠偏要求；同时写审计以度量宿主派发缺失频率。
$previousTurnUngated = $false
if ($effectiveRole -eq 'executor' -and $null -ne $observation) {
    $lastAssistant = Get-GateJsonProperty $observation 'last_assistant'
    if ((Get-GateJsonProperty $lastAssistant 'available') -eq $true -and (Get-GateJsonInt $lastAssistant 'text_chars') -gt 0) {
        if ((Get-GateJsonProperty $lastAssistant 'has_marker') -eq $true) {
            $statusParts.Add('上回合=已带终态')
        } else {
            $previousTurnUngated = $true
            $statusParts.Add('上回合=未过门禁（无终态契约收尾）')
        }
    }
}

$entryFailuresPath = Join-Path $runtime 'entry-failures.log'
if (Test-Path -LiteralPath $entryFailuresPath -PathType Leaf) { $statusParts.Add('入口失败台账=有记录') }

if ($previousTurnUngated) {
    if (-not $NoAudit) {
        Write-GateAudit -Path $auditPath -Record ([ordered] @{
            ts          = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
            event       = 'UserPromptSubmit'
            session     = $sessionKey
            role        = $effectiveRole
            action      = 'previous_turn_ungated'
            reason_code = 'STOP_DISPATCH_MISSED'
            engine_root = $root
        })
    }
    $correction = '纠偏要求：上回合以无契约收尾且未被 Stop 门禁拦截（宿主派发缺失），宿主漏放不等于终态被接受；本回合不得默认接受上回合的中途汇报，先核对其声明的剩余工作项并继续执行，完成本轮实际工作后再按 .codex/governance/terminal-contract.json 输出唯一合法终态行。'
    $hookOutput = [ordered] @{
        hookSpecificOutput = [ordered] @{
            hookEventName     = 'UserPromptSubmit'
            additionalContext = "【执行门禁】" + ($statusParts -join ' | ') + "。$correction"
        }
    }
} else {
    $hookOutput = [ordered] @{
        hookSpecificOutput = [ordered] @{
            hookEventName     = 'UserPromptSubmit'
            additionalContext = "【执行门禁】" + ($statusParts -join ' | ') + '。门禁只拒绝无终态契约的收尾与无证据的上下文收尾理由；上下文压缩由宿主自动完成。'
        }
    }
}
Write-Output ($hookOutput | ConvertTo-Json -Compress)

exit 0
