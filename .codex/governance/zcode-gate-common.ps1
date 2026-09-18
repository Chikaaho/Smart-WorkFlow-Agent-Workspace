# ZCode 宿主门禁公共入口辅助（无终态规则）
#
# 本文件只承载宿主接入所需的纯机械操作：读取 hook 载荷、定位 engine root、
# 生成会话文件键、脱敏审计写入。任何终态判定规则都不得写在这里；终态 schema
# 只来自 `.codex/governance/terminal-contract.json`，裁决只来自公共 Validator。

function Get-GateJsonProperty {
    param(
        [AllowNull()] [object] $InputObject,
        [Parameter(Mandatory = $true)] [string] $Name
    )

    if ($null -eq $InputObject) { return $null }
    if ($InputObject -is [System.Collections.IDictionary]) {
        if ($InputObject.Contains($Name)) { return $InputObject[$Name] }
        return $null
    }
    if ($InputObject -isnot [psobject]) { return $null }
    $property = $InputObject.PSObject.Properties[$Name]
    if ($null -eq $property) { return $null }
    return $property.Value
}

function Get-GateJsonText {
    param(
        [AllowNull()] [object] $InputObject,
        [Parameter(Mandatory = $true)] [string] $Name
    )

    $value = Get-GateJsonProperty $InputObject $Name
    if ($value -is [string]) { return $value }
    return ''
}

function Get-GateJsonInt {
    param(
        [AllowNull()] [object] $InputObject,
        [Parameter(Mandatory = $true)] [string] $Name
    )

    $value = Get-GateJsonProperty $InputObject $Name
    if ($value -is [int] -or $value -is [long] -or $value -is [int16] -or $value -is [byte]) { return [int64] $value }
    if ($value -is [double] -or $value -is [single] -or $value -is [decimal]) { return [int64] [math]::Floor([double] $value) }
    return 0
}

function Read-GatePayload {
    param(
        [string] $InlineJson = '',
        [string] $FromFile = ''
    )

    if (-not [string]::IsNullOrWhiteSpace($FromFile)) {
        return [System.IO.File]::ReadAllText($FromFile, [System.Text.Encoding]::UTF8)
    }
    if (-not [string]::IsNullOrWhiteSpace($InlineJson)) { return $InlineJson }
    # 宿主以 argv 模式启动 hook 并把载荷写入 stdin；读取设上限，避免手工运行或
    # 上游不关闭管道时把回合卡到宿主超时（超时会被宿主判为 hook 失败）。
    if ([Console]::IsInputRedirected) {
        $reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput(), [System.Text.UTF8Encoding]::new($false), $true)
        try {
            $pending = $reader.ReadToEndAsync()
            if (-not $pending.Wait(15000)) { return '' }
            return $pending.Result
        } finally { $reader.Dispose() }
    }
    return ''
}

function ConvertFrom-GateJson {
    param([AllowNull()] [string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) { return $null }
    try { return $Text | ConvertFrom-Json } catch { return $null }
}

function Resolve-GateEngineRoot {
    param(
        [string] $Explicit = '',
        [string] $PayloadCwd = '',
        [string] $ScriptRoot = ''
    )

    $candidates = [System.Collections.Generic.List[string]]::new()
    foreach ($candidate in @($Explicit, $env:ZCODE_PROJECT_DIR, $env:CLAUDE_PROJECT_DIR, $PayloadCwd, (Get-Location).Path, $ScriptRoot)) {
        if (-not [string]::IsNullOrWhiteSpace($candidate)) { $candidates.Add($candidate) }
    }
    foreach ($candidate in $candidates) {
        $current = $candidate
        for ($depth = 0; $depth -lt 16 -and -not [string]::IsNullOrWhiteSpace($current); $depth++) {
            $marker = Join-Path $current '.codex/governance/terminal-contract.json'
            if (Test-Path -LiteralPath $marker -PathType Leaf) {
                return (Resolve-Path -LiteralPath $current).Path
            }
            $parent = Split-Path -Parent $current
            if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current) { break }
            $current = $parent
        }
    }
    return ''
}

function Get-GateRuntimeRoot {
    param(
        [Parameter(Mandatory = $true)] [string] $EngineRoot,
        [string] $Override = ''
    )

    if (-not [string]::IsNullOrWhiteSpace($Override)) { return $Override }
    return (Join-Path $EngineRoot '.codex/governance/runtime/zcode')
}

function Get-GateSessionKey {
    param([AllowNull()] [string] $SessionId)

    if ([string]::IsNullOrWhiteSpace($SessionId)) { return 'unknown-session' }
    $invalid = [System.IO.Path]::GetInvalidFileNameChars()
    $builder = [System.Text.StringBuilder]::new()
    foreach ($character in $SessionId.ToCharArray()) {
        if ($invalid -contains $character -or $character -eq '/' -or $character -eq '\') {
            [void] $builder.Append('_')
        } else {
            [void] $builder.Append($character)
        }
    }
    return $builder.ToString()
}

function Write-GateAudit {
    param(
        [Parameter(Mandatory = $true)] [string] $Path,
        [Parameter(Mandatory = $true)] [object] $Record
    )

    try {
        $directory = Split-Path -Parent $Path
        if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }
        $line = ($Record | ConvertTo-Json -Compress -Depth 6)
        [System.IO.File]::AppendAllText($Path, $line + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
    } catch {
        # 审计写入失败不得改变门禁裁决。
    }
}

function Write-GateState {
    param(
        [Parameter(Mandatory = $true)] [string] $Path,
        [Parameter(Mandatory = $true)] [object] $State
    )

    try {
        $directory = Split-Path -Parent $Path
        if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }
        $json = ($State | ConvertTo-Json -Compress -Depth 6)
        $temporary = "$Path.tmp"
        [System.IO.File]::WriteAllText($temporary, $json, [System.Text.UTF8Encoding]::new($false))
        Move-Item -LiteralPath $temporary -Destination $Path -Force
    } catch {
        # 状态写入失败不得改变门禁裁决。
    }
}

function Read-GateState {
    param([Parameter(Mandatory = $true)] [string] $Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    try { return ([System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8) | ConvertFrom-Json) } catch { return $null }
}
