# ZCode Stop Gate：受治理执行会话的回合结束门禁（Windows/ZCode 宿主入口）
#
# 与 `.codex/governance/stop-gate.sh`（POSIX/Codex 宿主入口）同源：终态 schema 只来自
# `terminal-contract.json`，裁决只由公共 Validator 给出；本文件只负责 ZCode 宿主接入、
# 宿主观察核对和宿主支持的 block 输出投影，不定义任何终态字段或状态。
#
# 拒绝提前结束时输出 ZCode Stop hook 支持的 `{decision:"block", reason:...}`，
# 由宿主把 reason 作为 additional context 自动回注原线程（每回合最多 3 次续行）。
#
# 诊断/测试参数（宿主 hook 声明不使用）：-InputJson/-InputFile/-SessionId/-RoleOverride/
# -ObservationFile/-SessionDb/-RuntimeRoot/-NoAudit。

[CmdletBinding()]
param(
    [string] $InputJson = '',
    [string] $InputFile = '',
    [string] $EngineRoot = '',
    [string] $RuntimeRoot = '',
    [string] $SessionId = '',
    [string] $RoleOverride = '',
    [string] $ObservationFile = '',
    [string] $SessionDb = '',
    [switch] $NoAudit
)

$ErrorActionPreference = 'Stop'

# —— 派发回执（必须是脚本最前期的可执行语句）——
# 宿主长时高负载窗口实测存在 Stop hook 进程启动最初期即崩溃的形态（170-309ms、
# 无任何脚本痕迹）。回执越靠前，越能区分"spawn/启动早期失败"（无 invoked 回执）
# 与"脚本内失败"（有 invoked、后续 outcome 缺失）。写失败不得影响裁决。
function Write-GateInvocationReceipt {
    param(
        [Parameter(Mandatory = $true)] [AllowEmptyString()] [string] $Runtime,
        [Parameter(Mandatory = $true)] [AllowEmptyString()] [string] $Outcome,
        [AllowEmptyString()] [string] $Session = '',
        [int] $Bytes = 0,
        [AllowEmptyString()] [string] $Detail = ''
    )

    try {
        $receiptPath = if ([string]::IsNullOrWhiteSpace($Runtime)) { Join-Path $PSScriptRoot 'runtime/zcode/invocations.log' } else { Join-Path $Runtime 'invocations.log' }
        $receiptDirectory = Split-Path -Parent $receiptPath
        if (-not (Test-Path -LiteralPath $receiptDirectory -PathType Container)) {
            New-Item -ItemType Directory -Path $receiptDirectory -Force | Out-Null
        }
        $receipt = [ordered] @{
            ts       = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
            event    = 'Stop'
            dispatch = $Outcome
            session  = $Session
            bytes    = $Bytes
        }
        if (-not [string]::IsNullOrWhiteSpace($Detail)) { $receipt.detail = $Detail.Substring(0, [Math]::Min(240, $Detail.Length)) }
        [System.IO.File]::AppendAllText($receiptPath, ($receipt | ConvertTo-Json -Compress) + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
    } catch { }
}

Write-GateInvocationReceipt -Runtime $RuntimeRoot -Outcome 'invoked'

Set-StrictMode -Version Latest
# 宿主按 UTF-8 解码 hook 输出；Windows PowerShell 5.1 默认按 OEM 代码页写 stdout/stderr，
# 不显式指定会让回注的中文 reason 变成乱码。
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
. (Join-Path $PSScriptRoot 'zcode-gate-common.ps1')

# 低于该占用率时，“上下文已满”只能是无工具证据的自我估计，必须拒绝并回注宿主实测值。
$contextClaimThresholdPercent = 85

function Get-TerminalExtraction {
    param(
        [AllowNull()] [string] $Message,
        [Parameter(Mandatory = $true)] [string] $MarkerPrefix
    )

    # 与 stop-gate.sh 同义：marker 必须恰好出现一次，且位于正文物理末行。
    $lines = [System.Collections.Generic.List[string]]::new()
    foreach ($line in ($Message -split "`n")) { $lines.Add($line.TrimEnd("`r")) }
    if ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -eq '') { $lines.RemoveAt($lines.Count - 1) }

    $count = 0
    $markerIndex = -1
    $payload = ''
    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index].StartsWith($MarkerPrefix)) {
            $count++
            $markerIndex = $index
            $payload = $lines[$index].Substring($MarkerPrefix.Length)
        }
    }
    if ($count -eq 0) { return @{ ok = $false; code = 'MARKER_MISSING'; payload = ''; message = '最后回复没有契约终态行' } }
    if ($count -gt 1) { return @{ ok = $false; code = 'MARKER_DUPLICATED'; payload = ''; message = '终态行出现多次；每次结束只允许一条终态行' } }
    if ($markerIndex -ne $lines.Count - 1) { return @{ ok = $false; code = 'MARKER_NOT_LAST'; payload = ''; message = '终态行不是正文物理末行' } }
    return @{ ok = $true; code = ''; payload = $payload.Trim(); message = '' }
}

function Invoke-TerminalValidator {
    param(
        [Parameter(Mandatory = $true)] [string] $ValidatorPath,
        [Parameter(Mandatory = $true)] [string] $TerminalJson
    )

    $errorWriter = [System.IO.StringWriter]::new()
    $originalError = [Console]::Error
    try {
        [Console]::SetError($errorWriter)
        $null = & $ValidatorPath -InputJson $TerminalJson
        $exitCode = $LASTEXITCODE
    } finally {
        [Console]::SetError($originalError)
    }
    $diagnostics = @($errorWriter.ToString() -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    return @{ exitCode = $exitCode; diagnostics = $diagnostics }
}


function New-ContextObservation {
    return @{ available = $false; error = 'context-observation-missing'; tokens = 0; limit = 0; percent = -1.0; model = ''; exceeded = $false }
}

function Get-ContextObservation {
    param([AllowNull()] [object] $Observation)

    $context = New-ContextObservation
    $raw = Get-GateJsonProperty $Observation 'context'
    if ($null -eq $raw) { return $context }
    $available = Get-GateJsonProperty $raw 'available'
    if ($available -isnot [bool] -or -not $available) {
        $context.error = Get-GateJsonText $raw 'error'
        return $context
    }
    $limit = Get-GateJsonInt $raw 'limit'
    $tokens = Get-GateJsonInt $raw 'tokens'
    $percent = -1.0
    if ($limit -gt 0) { $percent = [Math]::Round($tokens / $limit * 100, 1) }
    return @{
        available = $true
        error     = ''
        tokens    = $tokens
        limit     = $limit
        percent   = $percent
        model     = Get-GateJsonText $raw 'model'
        exceeded  = ((Get-GateJsonProperty $raw 'context_exceeded') -eq $true)
    }
}

function Test-ContextExhaustionClaim {
    # 只匹配“自称上下文/窗口已满、即将压缩而收尾”这类无工具证据的说法。
    param([AllowNull()] [string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
    $patterns = @(
        '(上下文|context|窗口|window|token)[^。\n]{0,16}(满|极限|上限|耗尽|用完|接近|不足)',
        '(即将|快要|马上|就要|接近)[^。\n]{0,8}(压缩|截断|compact|compaction)',
        'context\s*(window\s*)?(is\s*)?(full|exhausted|at\s+the\s+limit)',
        'running\s+out\s+of\s+context'
    )
    foreach ($pattern in $patterns) {
        if ([regex]::Matches($Text, $pattern, 'IgnoreCase').Count -gt 0) { return $true }
    }
    return $false
}

function ConvertFrom-Observation {
    param([AllowNull()] [object] $Observation)

    $todo = Get-GateJsonProperty $Observation 'todo'
    if ($null -eq $todo) { return @{ available = $false; error = 'observation-shape-invalid'; open = -1; items = @(); context = (New-ContextObservation) } }
    $available = Get-GateJsonProperty $todo 'available'
    if ($available -isnot [bool] -or -not $available) {
        return @{ available = $false; error = (Get-GateJsonText $todo 'error'); open = -1; items = @(); context = (Get-ContextObservation $Observation) }
    }
    $items = @()
    $rawItems = Get-GateJsonProperty $todo 'open_items'
    if ($null -ne $rawItems) {
        foreach ($item in @($rawItems)) {
            $items += [pscustomobject] @{
                position = Get-GateJsonInt $item 'position'
                status   = Get-GateJsonText $item 'status'
                content  = Get-GateJsonText $item 'content'
            }
        }
    }
    return @{ available = $true; error = ''; open = (Get-GateJsonInt $todo 'open'); items = $items; context = (Get-ContextObservation $Observation) }
}

function Invoke-SessionObservation {
    param(
        [string] $ObservationPath,
        [string] $Session,
        [string] $Root,
        [string] $DatabasePath,
        [string] $Runtime
    )

    if (-not [string]::IsNullOrWhiteSpace($ObservationPath)) {
        $injected = Read-GateState -Path $ObservationPath
        if ($null -eq $injected) { return @{ available = $false; error = 'injected-observation-invalid'; open = -1; items = @(); context = (New-ContextObservation) } }
        return (ConvertFrom-Observation -Observation $injected)
    }
    if ([string]::IsNullOrWhiteSpace($Session)) { return @{ available = $false; error = 'session-id-missing'; open = -1; items = @(); context = (New-ContextObservation) } }

    $python = Resolve-ObservationReader -Runtime $Runtime
    if ([string]::IsNullOrWhiteSpace($python)) { return @{ available = $false; error = 'observation-reader-unavailable'; open = -1; items = @(); context = (New-ContextObservation) } }

    $reader = Join-Path $Root '.codex/governance/session-observation.py'
    if (-not (Test-Path -LiteralPath $reader -PathType Leaf)) { return @{ available = $false; error = 'observation-reader-missing'; open = -1; items = @(); context = (New-ContextObservation) } }

    $arguments = @($reader, '--session-id', $Session)
    if (-not [string]::IsNullOrWhiteSpace($DatabasePath)) { $arguments += @('--db', $DatabasePath) }
    try {
        $raw = & $python @arguments 2>$null | Out-String
    } catch {
        return @{ available = $false; error = 'observation-reader-failed'; open = -1; items = @(); context = (New-ContextObservation) }
    }
    $parsed = ConvertFrom-GateJson -Text $raw
    if ($null -eq $parsed) { return @{ available = $false; error = 'observation-output-invalid'; open = -1; items = @(); context = (New-ContextObservation) } }
    return (ConvertFrom-Observation -Observation $parsed)
}

function New-ReasonText {
    param(
        [Parameter(Mandatory = $true)] [string] $Diagnostic,
        [Parameter(Mandatory = $true)] [string] $NextAction,
        [int] $Escalation = 0
    )

    $escalationText = ''
    if ($Escalation -eq 1) { $escalationText = '同一无进展状态重复出现：本轮只做一个最小原子动作，完成后重新核对剩余项。' }
    elseif ($Escalation -eq 2) { $escalationText = '同一无进展状态再次重复：切换到另一条可行路径，不要重复上一次动作。' }
    elseif ($Escalation -ge 3) { $escalationText = '同一无进展状态已多次重复：停止重复动作，重新规划剩余路径并说明新路径。' }
    $reason = "执行会话不能结束：$Diagnostic。下一步动作：$NextAction"
    if (-not [string]::IsNullOrWhiteSpace($escalationText)) { $reason = "$reason $escalationText" }
    return $reason
}

# trap 作用于整个脚本作用域（含其声明位置之前的语句），因此审计路径与会话键必须
# 在任何可能抛出的语句之前完成初始化，否则早期异常会让 trap 自身再炸一次。
$auditPath = ''
$sessionKey = 'unknown-session'
$toolCallCount = 0

# 载荷读取必须在 trap 生效前自行兜底：stdin 管道异常（宿主写入中断/管道损坏）会从这里
# 抛出，历史上直接导致整脚本 rc=1、宿主记 hook.run.failed、回合静默漏放。按宪法
# "入口缺少裁决所需能力时必须 fail closed"，读取失败时以可裁决的 block 收场并留痕。
$payloadText = ''
try {
    $payloadText = Read-GatePayload -InlineJson $InputJson -FromFile $InputFile
} catch {
    $payloadError = "$($_.Exception.GetType().FullName): $($_.Exception.Message)"
    Write-GateInvocationReceipt -Runtime $RuntimeRoot -Outcome 'payload-read-error' -Detail $payloadError
    [Console]::Error.WriteLine("执行会话不能结束：停止门禁无法读取宿主载荷（$payloadError），按 fail-closed 拦截。下一步动作：继续执行授权内工作项并按 .codex/governance/terminal-contract.json 输出终态行；把该记录交给管理员。")
    Write-Output (@{ decision = 'block'; reason = "执行会话不能结束：停止门禁无法读取宿主载荷（$payloadError），fail-closed 拦截。下一步动作：继续执行授权内工作项，并在正文最后一行输出唯一合法终态行。" } | ConvertTo-Json -Compress)
    exit 0
}
$receiptPayload = $null
try { if (-not [string]::IsNullOrWhiteSpace($payloadText)) { $receiptPayload = ConvertFrom-GateJson -Text $payloadText } } catch { }
Write-GateInvocationReceipt -Runtime $RuntimeRoot -Outcome 'payload-read' -Session $(if ($null -ne $receiptPayload) { Get-GateJsonText $receiptPayload 'session_id' }) -Bytes $payloadText.Length
if ([string]::IsNullOrWhiteSpace($payloadText)) { exit 0 }
$payload = ConvertFrom-GateJson -Text $payloadText
if ($null -eq $payload) {
    [Console]::Error.WriteLine('执行会话不能结束：Stop hook 载荷不是合法 JSON，门禁无法裁决。')
    exit 2
}

$message = Get-GateJsonText $payload 'last_assistant_message'
$hookSessionId = Get-GateJsonText $payload 'session_id'
if ([string]::IsNullOrWhiteSpace($SessionId)) { $SessionId = $hookSessionId }
$toolCallCount = Get-GateJsonInt $payload 'toolCallCount'
$stopHookActive = Get-GateJsonProperty $payload 'stop_hook_active'
$continuation = $stopHookActive -is [bool] -and $stopHookActive

$root = Resolve-GateEngineRoot -Explicit $EngineRoot -PayloadCwd (Get-GateJsonText $payload 'cwd') -ScriptRoot (Split-Path -Parent $PSScriptRoot)
if ([string]::IsNullOrWhiteSpace($root)) { exit 0 }

$runtime = Get-GateRuntimeRoot -EngineRoot $root -Override $RuntimeRoot
$auditPath = Join-Path $runtime 'audit.jsonl'
$sessionKey = Get-GateSessionKey -SessionId $SessionId

# 门禁自身故障不得静默放行：任何未捕获异常都以宿主可识别的 block 形式暴露，
# 并写入审计（decision=error），而不是让宿主按“hook 失败”直接结束回合。
trap {
    $detail = "$($_.Exception.GetType().Name): $($_.Exception.Message)"
    if (-not $NoAudit) {
        Write-GateAudit -Path $auditPath -Record ([ordered] @{
            ts              = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
            event           = 'Stop'
            session         = $sessionKey
            role            = 'executor'
            decision        = 'error'
            reason_code     = 'GATE_INTERNAL_ERROR'
            tool_call_count = $toolCallCount
            detail          = $detail.Substring(0, [Math]::Min(300, $detail.Length))
        })
    }
    [Console]::Error.WriteLine("执行会话不能结束：停止门禁执行异常，无法裁决（$detail）。下一步动作：继续执行授权内工作项；若该异常重复出现，运行 .codex/governance/hook-selfcheck.ps1 并把诊断交给管理员。")
    exit 2
}

function Write-GateDecision {
    param(
        [Parameter(Mandatory = $true)] [string] $Decision,
        [Parameter(Mandatory = $true)] [string] $ReasonCode,
        [string] $TerminalState = '',
        [string] $Diagnostic = '',
        [string] $NextAction = '',
        [int] $TodoOpen = -1,
        [string] $ObservationError = '',
        [int] $Escalation = 0,
        [int] $Gated = 1,
        [double] $ContextPercent = -1.0,
        [bool] $ContextExceeded = $false
    )

    if (-not $NoAudit) {
        Write-GateAudit -Path $auditPath -Record ([ordered] @{
            ts                = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
            event             = 'Stop'
            session           = $sessionKey
            role              = 'executor'
            gated             = $Gated
            decision          = $Decision
            reason_code       = $ReasonCode
            terminal_state    = $TerminalState
            tool_call_count   = $toolCallCount
            continuation      = $continuation
            todo_open         = $TodoOpen
            observation       = $ObservationError
            context_percent   = $ContextPercent
            context_exceeded  = $ContextExceeded
            escalation        = $Escalation
        })
    }
    if ($Decision -eq 'block') {
        $output = [ordered] @{ decision = 'block'; reason = (New-ReasonText -Diagnostic $Diagnostic -NextAction $NextAction -Escalation $Escalation) }
        Write-Output ($output | ConvertTo-Json -Compress)
    }
}

# 角色绑定：未声明执行角色的会话不启用执行门禁（system.md §0.2）。
$role = $RoleOverride
if ([string]::IsNullOrWhiteSpace($role)) { $role = $env:AGENT_CODING_ENGINE_ACTIVE_ROLE }
if ([string]::IsNullOrWhiteSpace($role)) {
    $roleFile = Join-Path (Join-Path $runtime 'sessions') "$sessionKey.role.json"
    $roleState = Read-GateState -Path $roleFile
    $role = Get-GateJsonText $roleState 'role'
}
if ($role -ne 'executor') { exit 0 }

$observation = Invoke-SessionObservation -ObservationPath $ObservationFile -Session $SessionId -Root $root -DatabasePath $SessionDb -Runtime $runtime
$observationError = ''
$todoOpen = -1
if ($observation.available) { $todoOpen = $observation.open } else { $observationError = [string] $observation.error }
$context = $observation.context
$contextPercent = -1.0
$contextExceeded = $false
if ($context.available) {
    $contextPercent = [double] $context.percent
    $contextExceeded = [bool] $context.exceeded
}

# 门禁适用范围：本回合有真实工具动作、自定清单仍有未完成项，或模型以上下文为由收尾
# （第三条即便没有任何工具动作也必须裁决——压缩是宿主职责，不是停止理由）。
$contextClaim = Test-ContextExhaustionClaim -Text $message
$gated = ($toolCallCount -ge 1) -or ($observation.available -and $observation.open -gt 0) -or $contextClaim
if (-not $gated) {
    Write-GateDecision -Decision 'pass' -ReasonCode 'NO_EXECUTION_ACTIVITY' -TodoOpen $todoOpen -ObservationError $observationError -Gated 0 -ContextPercent $contextPercent -ContextExceeded $contextExceeded
    exit 0
}

$contractPath = Join-Path $root '.codex/governance/terminal-contract.json'
$contract = ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($contractPath, [System.Text.Encoding]::UTF8))
$marker = Get-GateJsonText $contract 'marker'
if ([string]::IsNullOrWhiteSpace($marker)) { $marker = 'ENGINE_TERMINAL' }
$markerPrefix = "$marker "

$extraction = Get-TerminalExtraction -Message $message -MarkerPrefix $markerPrefix
$terminalState = ''
$reasonCode = ''
$diagnostic = ''
$nextAction = ''

# 一次回注里给全所有证据：模型在同一轮就能看到缺失的契约、未收敛的清单和
# 宿主实测的上下文占用，不必靠多次续行逐条试错。
$findings = [System.Collections.Generic.List[string]]::new()
$actions = [System.Collections.Generic.List[string]]::new()
$contractAccepted = $false

if (-not $extraction.ok) {
    if ([string]::IsNullOrWhiteSpace($reasonCode)) { $reasonCode = $extraction.code }
    $findings.Add($extraction.message)
    $actions.Add("在正文最后一行输出唯一一条以 $markerPrefix 开头的终态行；schema、状态与字段组合以 .codex/governance/terminal-contract.json 为准。")
} else {
    $terminalPayload = ConvertFrom-GateJson -Text $extraction.payload
    if ($null -eq $terminalPayload) {
        if ([string]::IsNullOrWhiteSpace($reasonCode)) { $reasonCode = 'MARKER_INVALID_JSON' }
        $findings.Add('终态行不是合法 JSON')
        $actions.Add('只修正终态行的 JSON 语法后重新提交，不重跑已完成的工作。')
    } else {
        $terminalState = Get-GateJsonText $terminalPayload 'state'
        $validatorPath = Join-Path $root '.codex/governance/validate-terminal.ps1'
        $validation = Invoke-TerminalValidator -ValidatorPath $validatorPath -TerminalJson $extraction.payload
        if ($validation.exitCode -ne 0) {
            if ([string]::IsNullOrWhiteSpace($reasonCode)) { $reasonCode = 'CONTRACT_REJECTED' }
            $findings.Add('终态契约未通过公共 Validator：' + (@($validation.diagnostics) -join '；'))
            $actions.Add('按诊断逐项修正终态字段后重新提交；仍有授权内可执行项时先完成动作，不得提前结束。')
        } else {
            $contractAccepted = $true
        }
    }
}

# 上下文声明放在契约之后判定：只有被 Validator 接受、且携带真实工具证据的 BLOCKED
# 才是合法终止，此时不再追加“上下文不是停止依据”。其余情况下把该声明作为首要证据前置。
if ($contextClaim -and -not ($contractAccepted -and $terminalState -eq 'BLOCKED')) {
    if ($context.available) {
        if ($context.percent -lt $contextClaimThresholdPercent) {
            $measured = "宿主实测最近一次模型请求输入 $($context.tokens) / 上限 $($context.limit) tokens（$contextPercent%），未接近上限"
        } else {
            $measured = "宿主实测最近一次模型请求输入 $($context.tokens) / 上限 $($context.limit) tokens（$contextPercent%）"
            if ($context.exceeded) { $measured = "$measured；宿主的超限处理是按自动压缩并重试请求完成的" }
        }
    } else {
        $measured = '宿主未提供上下文实测值'
    }
    $findings.Insert(0, "本回合以「上下文/窗口已满」为由收尾，但 $measured，上下文压缩由宿主自动完成，该理由不构成停止依据")
    $actions.Insert(0, '继续执行清单中的原子项；接近上限时宿主会自动压缩，不需要主动收尾，直到全部完成或出现真实外部阻塞。')
    if ([string]::IsNullOrWhiteSpace($reasonCode)) { $reasonCode = 'CONTEXT_CLAIM_UNSUPPORTED' }
}

if ($observation.available -and $observation.open -gt 0) {
    $firstOpen = @($observation.items)[0]
    $firstOpenText = ''
    if ($null -ne $firstOpen) {
        $firstOpenText = "（$(Get-GateJsonText $firstOpen 'status')：$(Get-GateJsonText $firstOpen 'content')）"
    }
    if ([string]::IsNullOrWhiteSpace($reasonCode)) { $reasonCode = 'TODO_OPEN_ON_TERMINATION' }
    $findings.Add("会话自定任务清单仍有 $($observation.open) 项未完成$firstOpenText")
    $actions.Add('先完成清单项并执行验证；不再属于本次授权的项要按授权重写清单移出。清单收敛到无未完成项后再提交终态。')
}

$diagnostic = ($findings -join '；')
$nextAction = ($actions -join ' ')

if (-not [string]::IsNullOrWhiteSpace($reasonCode)) {
    $statePath = Join-Path (Join-Path $runtime 'sessions') "$sessionKey.state.json"
    $previousState = Read-GateState -Path $statePath
    $previousCode = Get-GateJsonText $previousState 'last_reason_code'
    $previousToolCalls = Get-GateJsonInt $previousState 'last_tool_call_count'
    $previousBlocks = Get-GateJsonInt $previousState 'consecutive_blocks'
    # 重复同一无进展状态：依次要求最小原子动作、切换路径、重新规划。
    $escalation = 0
    if ($reasonCode -eq $previousCode -and $toolCallCount -le $previousToolCalls) { $escalation = [Math]::Min($previousBlocks, 3) }
    Write-GateDecision -Decision 'block' -ReasonCode $reasonCode -TerminalState $terminalState -Diagnostic $diagnostic -NextAction $nextAction -TodoOpen $todoOpen -ObservationError $observationError -Escalation $escalation -ContextPercent $contextPercent -ContextExceeded $contextExceeded
    Write-GateState -Path $statePath -State ([ordered] @{
        schema               = 'agent-coding-engine.zcode-stop-state.v1'
        updated_at           = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        consecutive_blocks   = ($previousBlocks + 1)
        last_reason_code     = $reasonCode
        last_tool_call_count = $toolCallCount
        last_terminal_state  = $terminalState
    })
    exit 0
}

$statePath = Join-Path (Join-Path $runtime 'sessions') "$sessionKey.state.json"
Write-GateDecision -Decision 'pass' -ReasonCode 'TERMINAL_ACCEPTED' -TerminalState $terminalState -TodoOpen $todoOpen -ObservationError $observationError -ContextPercent $contextPercent -ContextExceeded $contextExceeded
Write-GateState -Path $statePath -State ([ordered] @{
    schema               = 'agent-coding-engine.zcode-stop-state.v1'
    updated_at           = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    consecutive_blocks   = 0
    last_reason_code     = ''
    last_tool_call_count = $toolCallCount
    last_terminal_state  = $terminalState
})
exit 0
