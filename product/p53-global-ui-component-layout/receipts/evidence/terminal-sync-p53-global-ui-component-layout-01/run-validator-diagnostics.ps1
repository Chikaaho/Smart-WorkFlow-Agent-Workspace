param(
  [Parameter(Mandatory = $true)] [string] $EvidenceDir
)
$validator = "E:/code/Smart-WorkFlow-Agent-Workspace/.codex/governance/validate-terminal.ps1"
$cases = @(
  @{ Name = "positive"; InPath = "$EvidenceDir/validator/input.json"; OutPath = "$EvidenceDir/validator/diagnostics.txt"; ExitPath = "$EvidenceDir/validator/validator.exit.txt" },
  @{ Name = "negative"; InPath = "$EvidenceDir/validator/negative-input.json"; OutPath = "$EvidenceDir/validator-negative/diagnostics.txt"; ExitPath = "$EvidenceDir/validator-negative/validator.exit.txt" }
)
foreach ($case in $cases) {
  $json = [System.IO.File]::ReadAllText($case.InPath)
  $out = & $validator -InputJson $json *>&1
  $code = $LASTEXITCODE
  $lines = @()
  $lines += "CASE=" + $case.Name
  $lines += "INPUT=" + $case.InPath
  if ($out) { foreach ($item in $out) { $lines += [string]$item } }
  $lines += "VALIDATOR_EXIT=$code"
  $lines | Out-File -FilePath $case.OutPath -Encoding utf8
  "VALIDATOR_EXIT=$code" | Out-File -FilePath $case.ExitPath -Encoding utf8
  Write-Output ($case.Name + " diagnostics -> " + $case.OutPath)
  Write-Output ("VALIDATOR_EXIT=" + $code)
}

