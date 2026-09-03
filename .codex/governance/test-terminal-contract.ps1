[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$validator = Join-Path $rootDir '.codex/governance/validate-terminal.ps1'
$contractPath = Join-Path $rootDir '.codex/governance/terminal-contract.json'
$powerShellExe = (Get-Process -Id $PID).Path
$passed = 0
$failed = 0

function Invoke-ValidatorCase {
    param(
        [string] $Name,
        [ValidateSet('pass', 'fail', 'parse')] [string] $Expected,
        [string] $Payload,
        [string] $ExpectedText = ''
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = $Payload | & $powerShellExe -NoProfile -File $validator 2>&1 | Out-String
    $actual = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $expectedExit = @{ pass = 0; fail = 1; parse = 2 }[$Expected]
    $ok = $actual -eq $expectedExit -and ([string]::IsNullOrEmpty($ExpectedText) -or $output.Contains($ExpectedText))
    if ($ok) {
        $script:passed++
    } else {
        $script:failed++
        Write-Output "FAIL validator/$Name expected=$Expected exit=$actual output=$output"
    }
}

$directS = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"S","evidence":["focused-check:0"]}'
$directM = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"M","evidence":["targeted-test:0"]}'
$execution = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/completion.md","evidence":["gate:0"],"feature_status":"VERIFYING","work_items":[{"id":"implementation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待 Planner 验收"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 验收","next_action_type":"WAIT_PLANNER","progress_fingerprint":"fp-execution-1","stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}'
$sync = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/sync.md","evidence":["audit:0"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":10,"after_bytes":8},"work_items":[{"id":"synchronization","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待 Planner 复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 复核","next_action_type":"WAIT_PLANNER","progress_fingerprint":"fp-sync-1","stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}'
$blocked = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/blocked.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"user secret supplied","work_items":[{"id":"browser-login","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待用户提供秘密"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待用户提供秘密","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-blocked-1","stop_reason":"EXTERNAL_DEPENDENCY","tool_results":[{"tool":"browser.login","outcome":"REQUIRES_SECRET","detail":"受支持会话要求用户秘密，当前未提供"}],"browser_status":"REQUIRES_SECRET"}'
$executionObject = $execution | ConvertFrom-Json
$executionObject | Add-Member -NotePropertyName progress_basis -NotePropertyValue ([pscustomobject]@{files_changed=@('implementation');tool_actions=@('verify');new_evidence=@('gate:0');closed_work_items=@('implementation')})
$execution = $executionObject | ConvertTo-Json -Compress
$syncObject = $sync | ConvertFrom-Json
$syncObject | Add-Member -NotePropertyName progress_basis -NotePropertyValue ([pscustomobject]@{files_changed=@('synchronization');tool_actions=@('audit');new_evidence=@('audit:0');closed_work_items=@('synchronization')})
$sync = $syncObject | ConvertTo-Json -Compress
$blockedObject = $blocked | ConvertFrom-Json
$blockedObject | Add-Member -NotePropertyName progress_basis -NotePropertyValue ([pscustomobject]@{files_changed=@('login-check');tool_actions=@('browser.login');new_evidence=@('error');closed_work_items=@()})
$blocked = $blockedObject | ConvertTo-Json -Compress

Invoke-ValidatorCase direct_s pass $directS
Invoke-ValidatorCase direct_m pass $directM
Invoke-ValidatorCase execution pass $execution
Invoke-ValidatorCase sync pass $sync
Invoke-ValidatorCase blocked pass $blocked
Invoke-ValidatorCase unknown_state fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"completed","task_level":"S","evidence":["x"]}' 'state: unknown terminal state'
Invoke-ValidatorCase missing fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","evidence":["x"],"feature_status":"VERIFYING"}' 'receipt: required for state EXECUTION_SUBMITTED'
Invoke-ValidatorCase null_payload fail 'null' 'terminal: payload: expected object'
Invoke-ValidatorCase array_payload fail '[]' 'terminal: payload: expected object'
Invoke-ValidatorCase string_payload fail '"text"' 'terminal: payload: expected object'
Invoke-ValidatorCase number_payload fail '7' 'terminal: payload: expected object'
Invoke-ValidatorCase boolean_payload fail 'false' 'terminal: payload: expected object'
Invoke-ValidatorCase invalid_json parse '{' 'terminal: payload: invalid JSON'
Invoke-ValidatorCase missing_level fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","evidence":["x"]}' 'task_level: missing required field'
Invoke-ValidatorCase wrong_level fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"L","evidence":["x"]}' 'task_level: incompatible with state TASK_COMPLETED'
Invoke-ValidatorCase light_receipt fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"S","receipt":"product/demo/receipts/x.md","evidence":["x"]}' 'receipt: forbidden for state TASK_COMPLETED'
Invoke-ValidatorCase blocked_l_receipt fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","evidence":["x"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'receipt: required for task_level L in state BLOCKED'
Invoke-ValidatorCase blank_null fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"   ","evidence":null,"feature_status":"VERIFYING"}' 'evidence: expected array'
Invoke-ValidatorCase wrong_type fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":3,"evidence":"x","feature_status":"VERIFYING"}' 'receipt: expected string'
Invoke-ValidatorCase out_of_range fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":-1,"after_bytes":0}}' 'memory_compression.before_bytes: expected non-negative integer'
Invoke-ValidatorCase extra fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","surprise":true}' 'surprise: unknown field'
Invoke-ValidatorCase mismatch fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'feature_status: incompatible with state TERMINAL_SYNC_SUBMITTED'
Invoke-ValidatorCase wrong_role fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"planner","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING"}' 'role: must be executor'
Invoke-ValidatorCase blocked_completed fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'feature_status: forbidden for state BLOCKED'
Invoke-ValidatorCase blocked_memory fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'memory_compression: forbidden for state BLOCKED'
Invoke-ValidatorCase execution_block_fields fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'block_type: forbidden for state EXECUTION_SUBMITTED'
Invoke-ValidatorCase execution_memory fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'memory_compression: forbidden for state EXECUTION_SUBMITTED'
Invoke-ValidatorCase sync_block_fields fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":1,"after_bytes":1},"release_condition":"restored"}' 'release_condition: forbidden for state TERMINAL_SYNC_SUBMITTED'
Invoke-ValidatorCase actionable_execution fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","work_items":[{"id":"pending","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":true,"next_action":"运行下一项"}],"remaining_actionable_count":1,"independent_work_exhausted":false,"next_action":"运行下一项","next_action_type":"CONTINUE","progress_fingerprint":"fp-actionable","stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}' 'next_action: continue actionable work before submitting EXECUTION_SUBMITTED'
Invoke-ValidatorCase actionable_sync fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":1,"after_bytes":1},"work_items":[{"id":"pending","status":"IN_PROGRESS","authorized":true,"dependency_satisfied":true,"actionable":true,"next_action":"完成同步"}],"remaining_actionable_count":1,"independent_work_exhausted":false,"next_action":"完成同步","next_action_type":"CONTINUE","progress_fingerprint":"fp-sync-actionable","progress_basis":{"files_changed":["x"],"tool_actions":["sync"],"new_evidence":["x"],"closed_work_items":[]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}' 'next_action: continue actionable work before submitting TERMINAL_SYNC_SUBMITTED'
Invoke-ValidatorCase independent_work_left fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"service restored","work_items":[{"id":"blocked","status":"BLOCKED","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待服务"},{"id":"independent","status":"IN_PROGRESS","authorized":true,"dependency_satisfied":true,"actionable":true,"next_action":"继续独立项"}],"remaining_actionable_count":1,"independent_work_exhausted":false,"next_action":"继续独立项","next_action_type":"CONTINUE","progress_fingerprint":"fp-independent","stop_reason":"EXTERNAL_DEPENDENCY","tool_results":[{"tool":"service","outcome":"UNAVAILABLE","detail":"服务返回不可用"}],"browser_status":"NOT_APPLICABLE"}' 'next_action: independent actionable work remains; do not submit BLOCKED'
Invoke-ValidatorCase browser_operable_block fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"M","evidence":["login claim"],"block_type":"EVIDENCE_GAP","attempted":["inspect page"],"release_condition":"captcha visible","work_items":[{"id":"login","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"填写可见验证码"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"填写可见验证码","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-browser","stop_reason":"EVIDENCE_GAP","tool_results":[{"tool":"browser.snapshot","outcome":"SUCCEEDED","detail":"页面、DOM 和网络仍可操作"}],"browser_status":"OPERABLE"}' 'browser_status: OPERABLE browser session remains'
Invoke-ValidatorCase permission_without_denial fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"M","evidence":["permission claim"],"block_type":"PERMISSION_DENIED","attempted":["run tool"],"release_condition":"permission granted","work_items":[{"id":"local-action","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"重试工具"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"重试工具","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-permission","stop_reason":"PERMISSION_DENIED","tool_results":[{"tool":"shell","outcome":"FAILED","detail":"命令未返回权限拒绝"}],"browser_status":"NOT_APPLICABLE"}' 'PERMISSION_DENIED requires an actual DENIED tool result'

$contract = Get-Content -LiteralPath $contractPath -Raw | ConvertFrom-Json
$propertyNames = @($contract.properties.PSObject.Properties.Name | Sort-Object)
$partitionFailures = @()
foreach ($stateProperty in $contract.states.PSObject.Properties) {
    $partition = @(($stateProperty.Value.allowed + $stateProperty.Value.forbidden) | Sort-Object -Unique)
    if (($partition -join "`n") -ne ($propertyNames -join "`n")) {
        $partitionFailures += $stateProperty.Name
    }
}
if ($partitionFailures.Count -eq 0) {
    $passed++
} else {
    $failed++
    Write-Output "FAIL contract/state_field_partition states=$($partitionFailures -join ',')"
}

Write-Output "terminal-governance-windows cases=$($passed + $failed) passed=$passed failed=$failed"
if ($failed -gt 0) { exit 1 }
exit 0
