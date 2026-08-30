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
    $featureStatusValue = if (Test-Property $payload 'feature_status') { $payload.feature_status } else { $null }
    if (@($stateContract.allowedFeatureStatus).Count -gt 0 -and $featureStatusValue -notin @($stateContract.allowedFeatureStatus)) {
        Add-Diagnostic $diagnostics "feature_status: incompatible with state $($payload.state)"
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
