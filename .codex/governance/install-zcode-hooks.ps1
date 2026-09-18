# 把仓库内的 ZCode hook 声明同步到机器级配置（安装 / 漂移检查）。
#
# 仓库是唯一来源：`.codex/governance/zcode-hooks-declaration.json`。
# 生效位置是用户级 `~/.zcode/cli/config.json`——工作区级声明（`.zcode/config.json`）
# 受宿主工作区信任层约束，实测批准后仍会回到 pending_trust 并被静默禁用。
#
# 用法：
#   powershell -File .codex/governance/install-zcode-hooks.ps1            # 安装/修复
#   powershell -File .codex/governance/install-zcode-hooks.ps1 -Check     # 只检查漂移
# 输出为 JSON 摘要；-Check 在存在漂移时以 exit 3 结束，便于自动化。

[CmdletBinding()]
param(
    [string] $EngineRoot = '',
    [string] $UserConfigPath = '',
    [switch] $Check
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'zcode-gate-common.ps1')

function ConvertTo-CanonicalJson {
    param([AllowNull()] [object] $Value)

    return ($Value | ConvertTo-Json -Depth 16 -Compress)
}

$root = Resolve-GateEngineRoot -Explicit $EngineRoot -PayloadCwd (Get-Location).Path -ScriptRoot (Split-Path -Parent $PSScriptRoot)
if ([string]::IsNullOrWhiteSpace($root)) {
    Write-Output '{"status":"error","error":"engine-root-not-found"}'
    exit 1
}

$declarationPath = Join-Path $root '.codex/governance/zcode-hooks-declaration.json'
if (-not (Test-Path -LiteralPath $declarationPath -PathType Leaf)) {
    Write-Output ('{"status":"error","error":"declaration-missing","path":"' + $declarationPath.Replace('\', '\\') + '"}')
    exit 1
}
$declaration = ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($declarationPath, [System.Text.Encoding]::UTF8))
$expectedHooks = Get-GateJsonProperty $declaration 'hooks'
if ($null -eq $expectedHooks) {
    Write-Output '{"status":"error","error":"declaration-has-no-hooks"}'
    exit 1
}

$userConfig = if ([string]::IsNullOrWhiteSpace($UserConfigPath)) { Join-Path $env:USERPROFILE '.zcode/cli/config.json' } else { $UserConfigPath }
$userDocument = @{}
if (Test-Path -LiteralPath $userConfig -PathType Leaf) {
    $parsed = ConvertFrom-GateJson -Text ([System.IO.File]::ReadAllText($userConfig, [System.Text.Encoding]::UTF8))
    if ($null -ne $parsed) {
        foreach ($property in $parsed.PSObject.Properties) { $userDocument[$property.Name] = $property.Value }
    }
}
$currentHooks = $null
if ($userDocument.ContainsKey('hooks')) { $currentHooks = $userDocument['hooks'] }

$drift = $true
if ($null -ne $currentHooks) {
    $drift = (ConvertTo-CanonicalJson $currentHooks) -ne (ConvertTo-CanonicalJson $expectedHooks)
}

$result = [ordered] @{
    status           = if ($drift) { 'drift' } else { 'in-sync' }
    declaration      = '.codex/governance/zcode-hooks-declaration.json'
    effective_scope  = 'user'
    user_config      = $userConfig
    drift            = $drift
    applied          = $false
    backup           = ''
}

if (-not $drift) {
    Write-Output ($result | ConvertTo-Json -Compress)
    exit 0
}

if ($Check) {
    Write-Output ($result | ConvertTo-Json -Compress)
    exit 3
}

if (Test-Path -LiteralPath $userConfig -PathType Leaf) {
    $backup = "$userConfig.bak-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item -LiteralPath $userConfig -Destination $backup -Force
    $result.backup = $backup
}
$userDocument['hooks'] = $expectedHooks
$directory = Split-Path -Parent $userConfig
if (-not (Test-Path -LiteralPath $directory -PathType Container)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
[System.IO.File]::WriteAllText($userConfig, (($userDocument | ConvertTo-Json -Depth 16) + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
$result.applied = $true
$result.status = 'installed'
Write-Output ($result | ConvertTo-Json -Compress)
exit 0
