param(
    [Parameter(Mandatory = $true)] [string] $InputPath,
    [Parameter(Mandatory = $true)] [string] $OutDir
)
$ErrorActionPreference = 'Continue'
$validator = 'E:/code/Smart-WorkFlow-Agent-Workspace/.codex/governance/validate-terminal.ps1'
$child = "& '$validator' -InputJson ([System.IO.File]::ReadAllText('$InputPath'))"
$output = & powershell -NoProfile -ExecutionPolicy Bypass -Command $child 2>&1 | Out-String
$code = $LASTEXITCODE
$output | Out-File -FilePath "$OutDir/diagnostics.txt" -Encoding utf8
'' | Out-File -FilePath "$OutDir/validator.stdout.txt" -Encoding utf8 -NoNewline
'' | Out-File -FilePath "$OutDir/validator.stderr.txt" -Encoding utf8 -NoNewline
"VALIDATOR_EXIT=$code" | Out-File -FilePath "$OutDir/validator.exit.txt" -Encoding utf8
Write-Output ("exit=" + $code + " diagnostics_bytes=" + (Get-Item "$OutDir/diagnostics.txt").Length)
