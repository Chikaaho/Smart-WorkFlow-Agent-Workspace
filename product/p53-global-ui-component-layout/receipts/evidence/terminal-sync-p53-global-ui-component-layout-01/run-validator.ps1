param(
  [Parameter(Mandatory = $true)] [string] $InputPath,
  [Parameter(Mandatory = $true)] [string] $OutDir
)
$ErrorActionPreference = "Continue"
$json = [System.IO.File]::ReadAllText($InputPath)
$validator = "E:/code/Smart-WorkFlow-Agent-Workspace/.codex/governance/validate-terminal.ps1"
& $validator -InputJson $json 1>"$OutDir/validator.stdout.txt" 2>"$OutDir/validator.stderr.txt"
$code = $LASTEXITCODE
"VALIDATOR_EXIT=$code" | Out-File -FilePath "$OutDir/validator.exit.txt" -Encoding utf8
"exit=" + $code
"stdout_bytes=" + (Get-Item "$OutDir/validator.stdout.txt").Length
"stderr_bytes=" + (Get-Item "$OutDir/validator.stderr.txt").Length

