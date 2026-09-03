[CmdletBinding()]
param(
    [Parameter(ValueFromPipeline = $true)]
    [AllowNull()]
    [AllowEmptyString()]
    [string] $InputJson
)

begin {
    $ErrorActionPreference = 'Stop'
    Set-StrictMode -Version Latest
    $pipelineChunks = [System.Collections.Generic.List[string]]::new()
}

process {
    if ($PSBoundParameters.ContainsKey('InputJson')) {
        $pipelineChunks.Add($InputJson)
    }
}

end {

function Test-Property {
    param(
        [Parameter(Mandatory = $true)] [object] $InputObject,
        [Parameter(Mandatory = $true)] [string] $Name
    )

    return $null -ne $InputObject.PSObject.Properties[$Name]
}

function Test-NonBlankString {
    param([AllowNull()] [object] $Value)

    return $Value -is [string] -and -not [string]::IsNullOrWhiteSpace($Value)
}

function Add-Diagnostic {
    param(
        [Parameter(Mandatory = $true)] [AllowEmptyCollection()] [System.Collections.Generic.List[string]] $List,
        [Parameter(Mandatory = $true)] [string] $Message
    )

    $List.Add($Message)
}

function Test-NonNegativeInteger {
    param([AllowNull()] [object] $Value)

    if ($null -eq $Value) { return $false }
    $isInteger = $Value -is [byte] -or $Value -is [int16] -or $Value -is [int32] -or $Value -is [int64]
    if ($isInteger) { return $Value -ge 0 }
    $isDecimal = $Value -is [single] -or $Value -is [double] -or $Value -is [decimal]
    return $isDecimal -and $Value -ge 0 -and [math]::Floor([double] $Value) -eq [double] $Value
}

function Test-ActionableItem {
    param([AllowNull()] [object] $Item)

    return $Item -is [pscustomobject] -and
        (Test-Property $Item 'status') -and
        ($Item.status -eq 'PENDING' -or $Item.status -eq 'IN_PROGRESS') -and
        (Test-Property $Item 'authorized') -and $Item.authorized -eq $true -and
        (Test-Property $Item 'dependency_satisfied') -and $Item.dependency_satisfied -eq $true -and
        (Test-Property $Item 'actionable') -and $Item.actionable -eq $true
}

function Test-FailureOutcome {
    param([AllowNull()] [object] $Result)

    return $Result -is [pscustomobject] -and
        (Test-Property $Result 'outcome') -and
        $Result.outcome -in @('FAILED', 'DENIED', 'UNAVAILABLE', 'TIMEOUT', 'REQUIRES_SECRET', 'REQUIRES_MFA', 'REQUIRES_HUMAN_VERIFICATION')
}

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$contractPath = Join-Path $rootDir '.codex/governance/terminal-contract.json'
$payloadText = if ($pipelineChunks.Count -gt 0) {
    $pipelineChunks -join [Environment]::NewLine
} else {
    [Console]::In.ReadToEnd()
}

try {
    $trimmedPayload = $payloadText.Trim()
    $payload = $payloadText | ConvertFrom-Json
} catch {
    [Console]::Error.WriteLine('terminal: payload: invalid JSON')
    exit 2
}

if (-not $trimmedPayload.StartsWith('{') -or $payload -isnot [pscustomobject]) {
    [Console]::Error.WriteLine('terminal: payload: expected object')
    exit 1
}

try {
    $contract = Get-Content -LiteralPath $contractPath -Raw | ConvertFrom-Json
} catch {
    [Console]::Error.WriteLine("terminal: contract: cannot load $contractPath")
    exit 2
}

$diagnostics = [System.Collections.Generic.List[string]]::new()
$payloadNames = @($payload.PSObject.Properties.Name)
$contractNames = @($contract.properties.PSObject.Properties.Name)

foreach ($name in @($contract.required)) {
    if (-not (Test-Property -InputObject $payload -Name $name)) {
        Add-Diagnostic $diagnostics "$name`: missing required field"
    }
}

foreach ($name in $payloadNames) {
    if ($name -notin $contractNames) {
        Add-Diagnostic $diagnostics "$name`: unknown field"
    }
}

if (Test-Property $payload 'schema') {
    if ($payload.schema -isnot [string]) {
        Add-Diagnostic $diagnostics 'schema: expected string'
    } elseif ($payload.schema -ne $contract.properties.schema.const) {
        Add-Diagnostic $diagnostics 'schema: unsupported value'
    }
}

if (Test-Property $payload 'role') {
    if ($payload.role -isnot [string]) {
        Add-Diagnostic $diagnostics 'role: expected string'
    } elseif ($payload.role -ne $contract.properties.role.const) {
        Add-Diagnostic $diagnostics 'role: must be executor'
    }
}

if (Test-Property $payload 'state') {
    if ($payload.state -isnot [string]) {
        Add-Diagnostic $diagnostics 'state: expected string'
    } elseif ($payload.state -notin @($contract.properties.state.enum)) {
        Add-Diagnostic $diagnostics 'state: unknown terminal state'
    }
}

if (Test-Property $payload 'task_level') {
    if ($payload.task_level -isnot [string]) {
        Add-Diagnostic $diagnostics 'task_level: expected string'
    } elseif ($payload.task_level -notin @($contract.properties.task_level.enum)) {
        Add-Diagnostic $diagnostics 'task_level: unknown value'
    }
}

if (Test-Property $payload 'receipt') {
    if ($payload.receipt -isnot [string]) {
        Add-Diagnostic $diagnostics 'receipt: expected string'
    } elseif (-not (Test-NonBlankString $payload.receipt)) {
        Add-Diagnostic $diagnostics 'receipt: must be non-blank'
    } elseif ($payload.receipt -notmatch $contract.properties.receipt.pattern) {
        Add-Diagnostic $diagnostics 'receipt: invalid path format'
    }
}

if (Test-Property $payload 'evidence') {
    if ($payload.evidence -isnot [System.Array]) {
        Add-Diagnostic $diagnostics 'evidence: expected array'
    } elseif ($payload.evidence.Count -lt 1) {
        Add-Diagnostic $diagnostics 'evidence: must contain at least one item'
    } elseif (@($payload.evidence | Where-Object { -not (Test-NonBlankString $_) }).Count -gt 0) {
        Add-Diagnostic $diagnostics 'evidence: items must be non-blank strings'
    }
}

if (Test-Property $payload 'feature_status') {
    if ($payload.feature_status -isnot [string]) {
        Add-Diagnostic $diagnostics 'feature_status: expected string'
    } elseif ($payload.feature_status -notin @($contract.properties.feature_status.enum)) {
        Add-Diagnostic $diagnostics 'feature_status: unknown value'
    }
}

if (Test-Property $payload 'block_type') {
    if ($payload.block_type -isnot [string]) {
        Add-Diagnostic $diagnostics 'block_type: expected string'
    } elseif ($payload.block_type -notin @($contract.properties.block_type.enum)) {
        Add-Diagnostic $diagnostics 'block_type: unknown value'
    }
}

if (Test-Property $payload 'attempted') {
    if ($payload.attempted -isnot [System.Array]) {
        Add-Diagnostic $diagnostics 'attempted: expected array'
    } elseif ($payload.attempted.Count -lt 1) {
        Add-Diagnostic $diagnostics 'attempted: must contain at least one item'
    } elseif (@($payload.attempted | Where-Object { -not (Test-NonBlankString $_) }).Count -gt 0) {
        Add-Diagnostic $diagnostics 'attempted: items must be non-blank strings'
    }
}

if (Test-Property $payload 'release_condition') {
    if ($payload.release_condition -isnot [string]) {
        Add-Diagnostic $diagnostics 'release_condition: expected string'
    } elseif (-not (Test-NonBlankString $payload.release_condition)) {
        Add-Diagnostic $diagnostics 'release_condition: must be non-blank'
    }
}

if (Test-Property $payload 'memory_compression') {
    if ($payload.memory_compression -isnot [pscustomobject]) {
        Add-Diagnostic $diagnostics 'memory_compression: expected object'
    } else {
        $memoryNames = @($payload.memory_compression.PSObject.Properties.Name)
        $allowedMemoryNames = @($contract.properties.memory_compression.properties.PSObject.Properties.Name)
        foreach ($name in $memoryNames) {
            if ($name -notin $allowedMemoryNames) {
                Add-Diagnostic $diagnostics "memory_compression.$name`: unknown field"
            }
        }
        foreach ($name in @($contract.properties.memory_compression.required)) {
            if (-not (Test-Property $payload.memory_compression $name)) {
                Add-Diagnostic $diagnostics "memory_compression.$name`: missing required field"
            }
        }
        foreach ($name in @('before_bytes', 'after_bytes')) {
            if (Test-Property $payload.memory_compression $name) {
                $value = $payload.memory_compression.$name
                $isInteger = ($value -is [byte] -or $value -is [int16] -or $value -is [int32] -or $value -is [int64])
                if (-not $isInteger -or $value -lt 0) {
                    Add-Diagnostic $diagnostics "memory_compression.$name`: expected non-negative integer"
                }
            }
        }
    }
}

if (Test-Property $payload 'work_items') {
    if ($payload.work_items -isnot [System.Array]) {
        Add-Diagnostic $diagnostics 'work_items: expected array'
    } elseif ($payload.work_items.Count -lt 1) {
        Add-Diagnostic $diagnostics 'work_items: must contain at least one item'
    } else {
        foreach ($item in @($payload.work_items)) {
            if ($item -isnot [pscustomobject]) {
                Add-Diagnostic $diagnostics 'work_items: items must be objects'
                continue
            }
            foreach ($name in @($item.PSObject.Properties.Name)) {
                if ($name -notin @('id', 'status', 'authorized', 'dependency_satisfied', 'actionable', 'next_action')) {
                    Add-Diagnostic $diagnostics "work_items.$name`: unknown field"
                }
            }
            foreach ($name in @('id', 'status', 'authorized', 'dependency_satisfied', 'actionable', 'next_action')) {
                if (-not (Test-Property $item $name)) {
                    Add-Diagnostic $diagnostics "work_items.$name`: missing required field"
                }
            }
            if ((Test-Property $item 'id') -and -not (Test-NonBlankString $item.id)) {
                Add-Diagnostic $diagnostics 'work_items.id: must be non-blank string'
            }
            if ((Test-Property $item 'status') -and ($item.status -isnot [string] -or $item.status -notin @('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'))) {
                Add-Diagnostic $diagnostics 'work_items.status: unknown value'
            }
            if ((Test-Property $item 'authorized') -and $item.authorized -isnot [bool]) {
                Add-Diagnostic $diagnostics 'work_items.authorized: expected boolean'
            }
            if ((Test-Property $item 'dependency_satisfied') -and $item.dependency_satisfied -isnot [bool]) {
                Add-Diagnostic $diagnostics 'work_items.dependency_satisfied: expected boolean'
            }
            if ((Test-Property $item 'actionable') -and $item.actionable -isnot [bool]) {
                Add-Diagnostic $diagnostics 'work_items.actionable: expected boolean'
            }
            if ((Test-Property $item 'next_action') -and -not (Test-NonBlankString $item.next_action)) {
                Add-Diagnostic $diagnostics 'work_items.next_action: must be non-blank string'
            }
        }
    }
}

if ((Test-Property $payload 'remaining_actionable_count') -and -not (Test-NonNegativeInteger $payload.remaining_actionable_count)) {
    Add-Diagnostic $diagnostics 'remaining_actionable_count: expected non-negative integer'
}

if ((Test-Property $payload 'independent_work_exhausted') -and $payload.independent_work_exhausted -isnot [bool]) {
    Add-Diagnostic $diagnostics 'independent_work_exhausted: expected boolean'
}

if ((Test-Property $payload 'next_action') -and -not (Test-NonBlankString $payload.next_action)) {
    Add-Diagnostic $diagnostics 'next_action: must be non-blank string'
}

if (Test-Property $payload 'next_action_type') {
    if ($payload.next_action_type -isnot [string]) {
        Add-Diagnostic $diagnostics 'next_action_type: expected string'
    } elseif ($payload.next_action_type -notin @('CONTINUE', 'WAIT_PLANNER', 'WAIT_EXTERNAL', 'REPLAN')) {
        Add-Diagnostic $diagnostics 'next_action_type: unknown value'
    }
}

if ((Test-Property $payload 'progress_fingerprint') -and -not (Test-NonBlankString $payload.progress_fingerprint)) {
    Add-Diagnostic $diagnostics 'progress_fingerprint: must be non-blank string'
}

if (Test-Property $payload 'progress_basis') {
    if ($payload.progress_basis -isnot [pscustomobject]) {
        Add-Diagnostic $diagnostics 'progress_basis: expected object'
    } else {
        foreach ($name in @('files_changed', 'tool_actions', 'new_evidence', 'closed_work_items')) {
            if (-not (Test-Property $payload.progress_basis $name)) {
                Add-Diagnostic $diagnostics "progress_basis.$name`: missing required field"
            } elseif ($payload.progress_basis.$name -isnot [System.Array]) {
                Add-Diagnostic $diagnostics "progress_basis.$name`: expected array"
            } elseif (@($payload.progress_basis.$name | Where-Object { -not (Test-NonBlankString $_) }).Count -gt 0) {
                Add-Diagnostic $diagnostics "progress_basis.$name`: items must be non-blank strings"
            }
        }
        foreach ($name in @($payload.progress_basis.PSObject.Properties.Name)) {
            if ($name -notin @('files_changed', 'tool_actions', 'new_evidence', 'closed_work_items')) {
                Add-Diagnostic $diagnostics "progress_basis.$name`: unknown field"
            }
        }
    }
}

if (Test-Property $payload 'stop_reason') {
    if ($payload.stop_reason -isnot [string]) {
        Add-Diagnostic $diagnostics 'stop_reason: expected string'
    } elseif ($payload.stop_reason -notin @('WAITING_FOR_PLANNER', 'EXTERNAL_DEPENDENCY', 'DIRECTION_CONFLICT', 'ENVIRONMENT_UNAVAILABLE', 'EVIDENCE_GAP', 'PERMISSION_DENIED', 'CAPABILITY_UNAVAILABLE')) {
        Add-Diagnostic $diagnostics 'stop_reason: unknown value'
    }
}

if (Test-Property $payload 'tool_results') {
    if ($payload.tool_results -isnot [System.Array]) {
        Add-Diagnostic $diagnostics 'tool_results: expected array'
    } else {
        foreach ($result in @($payload.tool_results)) {
            if ($result -isnot [pscustomobject]) {
                Add-Diagnostic $diagnostics 'tool_results: items must be objects'
                continue
            }
            foreach ($name in @($result.PSObject.Properties.Name)) {
                if ($name -notin @('tool', 'outcome', 'detail')) {
                    Add-Diagnostic $diagnostics "tool_results.$name`: unknown field"
                }
            }
            foreach ($name in @('tool', 'outcome', 'detail')) {
                if (-not (Test-Property $result $name)) {
                    Add-Diagnostic $diagnostics "tool_results.$name`: missing required field"
                }
            }
            if ((Test-Property $result 'tool') -and -not (Test-NonBlankString $result.tool)) {
                Add-Diagnostic $diagnostics 'tool_results.tool: must be non-blank string'
            }
            if (Test-Property $result 'outcome') {
                if ($result.outcome -isnot [string]) {
                    Add-Diagnostic $diagnostics 'tool_results.outcome: expected string'
                } elseif ($result.outcome -notin @('SUCCEEDED', 'FAILED', 'DENIED', 'UNAVAILABLE', 'TIMEOUT', 'REQUIRES_SECRET', 'REQUIRES_MFA', 'REQUIRES_HUMAN_VERIFICATION')) {
                    Add-Diagnostic $diagnostics 'tool_results.outcome: unknown value'
                }
            }
            if ((Test-Property $result 'detail') -and -not (Test-NonBlankString $result.detail)) {
                Add-Diagnostic $diagnostics 'tool_results.detail: must be non-blank string'
            }
        }
    }
}

if (Test-Property $payload 'browser_status') {
    if ($payload.browser_status -isnot [string]) {
        Add-Diagnostic $diagnostics 'browser_status: expected string'
    } elseif ($payload.browser_status -notin @('NOT_APPLICABLE', 'OPERABLE', 'UNAVAILABLE', 'REQUIRES_SECRET', 'REQUIRES_MFA', 'REQUIRES_HUMAN_VERIFICATION')) {
        Add-Diagnostic $diagnostics 'browser_status: unknown value'
    }
}

if ((Test-Property $payload 'state') -and $payload.state -is [string] -and (Test-Property $contract.states $payload.state)) {
    $stateContract = $contract.states.($payload.state)
    foreach ($name in @($stateContract.required)) {
        if (-not (Test-Property $payload $name)) {
            Add-Diagnostic $diagnostics "$name`: required for state $($payload.state)"
        }
    }
    foreach ($name in $payloadNames) {
        if ($name -in @($stateContract.forbidden)) {
            Add-Diagnostic $diagnostics "$name`: forbidden for state $($payload.state)"
        } elseif ($name -notin @($stateContract.allowed)) {
            Add-Diagnostic $diagnostics "$name`: not allowed for state $($payload.state)"
        }
    }
    $taskLevelValue = if (Test-Property $payload 'task_level') { $payload.task_level } else { $null }
    if ($taskLevelValue -notin @($stateContract.allowedTaskLevels)) {
        Add-Diagnostic $diagnostics "task_level: incompatible with state $($payload.state)"
    }
    if ($taskLevelValue -in @($stateContract.receiptRequiredTaskLevels) -and -not (Test-Property $payload 'receipt')) {
        Add-Diagnostic $diagnostics "receipt: required for task_level $taskLevelValue in state $($payload.state)"
    }
    $featureStatusValue = if (Test-Property $payload 'feature_status') { $payload.feature_status } else { $null }
    if (@($stateContract.allowedFeatureStatus).Count -gt 0 -and $featureStatusValue -notin @($stateContract.allowedFeatureStatus)) {
        Add-Diagnostic $diagnostics "feature_status: incompatible with state $($payload.state)"
    }
}

$contextStates = @('EXECUTION_SUBMITTED', 'TERMINAL_SYNC_SUBMITTED', 'BLOCKED')
if ((Test-Property $payload 'state') -and $payload.state -in $contextStates -and
    (Test-Property $payload 'work_items') -and $payload.work_items -is [System.Array] -and
    (Test-Property $payload 'remaining_actionable_count') -and (Test-NonNegativeInteger $payload.remaining_actionable_count) -and
    (Test-Property $payload 'independent_work_exhausted') -and $payload.independent_work_exhausted -is [bool]) {
    $actionableItems = @($payload.work_items | Where-Object { Test-ActionableItem $_ })
    $observedCount = $actionableItems.Count
    if ($observedCount -ne $payload.remaining_actionable_count) {
        Add-Diagnostic $diagnostics "remaining_actionable_count`: declared $($payload.remaining_actionable_count), observed $observedCount"
    }
    if ($payload.independent_work_exhausted -ne ($observedCount -eq 0)) {
        Add-Diagnostic $diagnostics 'independent_work_exhausted: inconsistent with remaining actionable work'
    }
    $progressBasisNames = @('files_changed', 'tool_actions', 'new_evidence', 'closed_work_items')
    $validProgressBasisNames = @()
    if ((Test-Property $payload 'progress_basis') -and $payload.progress_basis -is [pscustomobject]) {
        $validProgressBasisNames = @($progressBasisNames | Where-Object { (Test-Property $payload.progress_basis $_) -and $payload.progress_basis.$_ -is [System.Array] })
    }
    if ((Test-Property $payload 'progress_basis') -and $payload.progress_basis -is [pscustomobject] -and $validProgressBasisNames.Count -eq $progressBasisNames.Count) {
        $progressEventCount = ($progressBasisNames | ForEach-Object { @($payload.progress_basis.$_).Count } | Measure-Object -Sum).Sum
        if ($progressEventCount -lt 1) {
            Add-Diagnostic $diagnostics 'progress_basis: must record a file change, tool action, new evidence, or closed work item'
        }
    }
    if ($payload.state -in @('EXECUTION_SUBMITTED', 'TERMINAL_SYNC_SUBMITTED') -and $observedCount -ne 0) {
        Add-Diagnostic $diagnostics "next_action`: continue actionable work before submitting $($payload.state)"
    }
    $nextActionTypeValue = if (Test-Property $payload 'next_action_type') { $payload.next_action_type } else { $null }
    if ($payload.state -in @('EXECUTION_SUBMITTED', 'TERMINAL_SYNC_SUBMITTED') -and $nextActionTypeValue -ne 'WAIT_PLANNER') {
        Add-Diagnostic $diagnostics "next_action_type`: $($payload.state) requires WAIT_PLANNER when work is exhausted"
    }
    if ($payload.state -eq 'BLOCKED' -and $observedCount -ne 0) {
        Add-Diagnostic $diagnostics 'next_action: independent actionable work remains; do not submit BLOCKED'
    }
}

if ((Test-Property $payload 'state') -and $payload.state -eq 'EXECUTION_SUBMITTED' -and
    (Test-Property $payload 'stop_reason') -and $payload.stop_reason -ne 'WAITING_FOR_PLANNER') {
    Add-Diagnostic $diagnostics 'stop_reason: EXECUTION_SUBMITTED requires WAITING_FOR_PLANNER'
}

if ((Test-Property $payload 'state') -and $payload.state -eq 'TERMINAL_SYNC_SUBMITTED' -and
    (Test-Property $payload 'stop_reason') -and $payload.stop_reason -ne 'WAITING_FOR_PLANNER') {
    Add-Diagnostic $diagnostics 'stop_reason: TERMINAL_SYNC_SUBMITTED requires WAITING_FOR_PLANNER'
}

if ((Test-Property $payload 'state') -and $payload.state -eq 'BLOCKED' -and
    (Test-Property $payload 'tool_results') -and $payload.tool_results -is [System.Array]) {
    $blockTypeValue = if (Test-Property $payload 'block_type') { $payload.block_type } else { $null }
    $browserStatusValue = if (Test-Property $payload 'browser_status') { $payload.browser_status } else { $null }
    if ($payload.tool_results.Count -lt 1) {
        Add-Diagnostic $diagnostics 'tool_results: BLOCKED requires at least one actual tool result'
    }
    if ($browserStatusValue -eq 'OPERABLE') {
        Add-Diagnostic $diagnostics 'browser_status: OPERABLE browser session remains; continue browser actions before blocking'
    }
    if ($blockTypeValue -eq 'PERMISSION_DENIED' -and -not (@($payload.tool_results | Where-Object { (Test-Property $_ 'outcome') -and $_.outcome -eq 'DENIED' }).Count -gt 0)) {
        Add-Diagnostic $diagnostics 'tool_results: PERMISSION_DENIED requires an actual DENIED tool result'
    }
    if ($blockTypeValue -eq 'CAPABILITY_UNAVAILABLE' -and -not (@($payload.tool_results | Where-Object { (Test-Property $_ 'outcome') -and $_.outcome -eq 'UNAVAILABLE' }).Count -gt 0)) {
        Add-Diagnostic $diagnostics 'tool_results: CAPABILITY_UNAVAILABLE requires an actual UNAVAILABLE tool result'
    }
    if ($blockTypeValue -in @('EXTERNAL', 'ENVIRONMENT') -and -not (@($payload.tool_results | Where-Object { Test-FailureOutcome $_ }).Count -gt 0)) {
        Add-Diagnostic $diagnostics 'tool_results: EXTERNAL or ENVIRONMENT block requires an actual failed, unavailable, timeout, or external-input result'
    }
    $requiredBrowserOutcome = @{
        REQUIRES_SECRET = 'REQUIRES_SECRET'
        REQUIRES_MFA = 'REQUIRES_MFA'
        REQUIRES_HUMAN_VERIFICATION = 'REQUIRES_HUMAN_VERIFICATION'
    }[$browserStatusValue]
    if ($null -ne $requiredBrowserOutcome -and -not (@($payload.tool_results | Where-Object { (Test-Property $_ 'outcome') -and $_.outcome -eq $requiredBrowserOutcome }).Count -gt 0)) {
        Add-Diagnostic $diagnostics "browser_status: $browserStatusValue requires a matching tool result"
    }
    foreach ($result in @($payload.tool_results)) {
        if (Test-FailureOutcome $result -and -not (Test-NonBlankString $result.detail)) {
            Add-Diagnostic $diagnostics 'tool_results: failed or externally blocked results require non-blank detail'
        }
    }
    $expectedStopReason = @{
        EXTERNAL = 'EXTERNAL_DEPENDENCY'
        DIRECTION_CONFLICT = 'DIRECTION_CONFLICT'
        ENVIRONMENT = 'ENVIRONMENT_UNAVAILABLE'
        EVIDENCE_GAP = 'EVIDENCE_GAP'
        PERMISSION_DENIED = 'PERMISSION_DENIED'
        CAPABILITY_UNAVAILABLE = 'CAPABILITY_UNAVAILABLE'
    }[$blockTypeValue]
    if ((Test-Property $payload 'stop_reason') -and $payload.stop_reason -ne $expectedStopReason) {
        Add-Diagnostic $diagnostics 'stop_reason: does not match block_type'
    }
}

if ($diagnostics.Count -gt 0) {
    foreach ($message in @($diagnostics | Sort-Object -Unique)) {
        [Console]::Error.WriteLine("terminal: $message")
    }
    exit 1
}

exit 0
}
