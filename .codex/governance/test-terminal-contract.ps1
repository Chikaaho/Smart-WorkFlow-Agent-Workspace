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
$execution = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/completion.md","evidence":["gate:0"],"feature_status":"VERIFYING"}'
$sync = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/sync.md","evidence":["audit:0"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":10,"after_bytes":8}}'
$blocked = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/blocked.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"service restored"}'

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
