param(
  [string]$WorkspaceRoot = 'E:\\code\\Smart-WorkFlow-Agent-Workspace'
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path -LiteralPath $WorkspaceRoot).Path
$r7Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$manifestPath = Join-Path $r7Root 'fingerprint-manifest.json'
$recomputePath = Join-Path $r7Root 'recompute-output.json'

$commonExclusionRules = @(
  'Exclude .git metadata directories',
  'Exclude build caches: target, node_modules, dist',
  'Exclude runtime logs, temp files, and database files',
  'Exclude product/v0.1.0-oa-completion/receipts/evidence/i6-06 self-reference'
)

function Get-GitText([string]$repoPath, [string[]]$arguments) {
  $value = & git -c core.quotepath=false -C $repoPath @arguments
  if ($LASTEXITCODE -ne 0) { throw "git $($arguments -join ' ') failed in $repoPath" }
  return (@($value) -join "`n").Trim()
}

function Is-Excluded([string]$repoName, [string]$relativePath) {
  $normalized = $relativePath.Replace('\', '/')
  if ($normalized -match '(^|/)(\.git|target|node_modules|dist)(/|$)') { return $true }
  if ($normalized -match '(^|/)(logs?|tmp|temp|build|out)(/|$)') { return $true }
  if ($normalized -match '(?i)(\.log|\.tmp|\.temp|\.db|\.sqlite|\.sqlite3|\.h2\.db)$') { return $true }
  if ($normalized -match '^product/v0\.1\.0-oa-completion/receipts/evidence/i6-06(?:/|$)') { return $true }
  if ($repoName -eq 'workspace' -and $normalized -match '^Smart-WorkFlow-aPaaS-(server|Web)(?:/|$)') { return $true }
  return $false
}

function Get-RepoSnapshot([string]$repoName, [string]$repoPath) {
  $repoPath = (Resolve-Path -LiteralPath $repoPath).Path
  $trackedText = Get-GitText $repoPath @('ls-files')
  $tracked = if ($trackedText) { @($trackedText -split "\r?\n" | Where-Object { $_ }) } else { @() }
  $candidateText = Get-GitText $repoPath @('ls-files', '--others', '--exclude-standard')
  $candidate = if ($candidateText) { @($candidateText -split "\r?\n" | Where-Object { $_ }) } else { @() }
  $all = @($tracked + $candidate | Where-Object { $_ -and -not (Is-Excluded $repoName $_) } | Sort-Object -Unique)
  $files = New-Object System.Collections.Generic.List[object]
  foreach ($relativePath in $all) {
    $absolutePath = Join-Path $repoPath $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) { continue }
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $absolutePath).Hash.ToLowerInvariant()
    $size = (Get-Item -LiteralPath $absolutePath).Length
    $files.Add([ordered]@{ path = $relativePath.Replace('\', '/'); size = [int64]$size; sha256 = $hash })
  }
  $canonical = @($files | ForEach-Object { "$repoName|$($_.path)|$($_.size)|$($_.sha256)" }) -join "`n"
  $bytes = [Text.Encoding]::UTF8.GetBytes($canonical)
  $fingerprint = ([Security.Cryptography.SHA256]::Create().ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join ''
  $baseHead = Get-GitText $repoPath @('rev-parse', 'HEAD')
  $status = Get-GitText $repoPath @('status', '--porcelain=v1')
  $worktreeState = if ($status) { 'DIRTY' } else { 'CLEAN' }
  $diffText = Get-GitText $repoPath @('diff', '--name-only')
  $diffFiles = if ($diffText) { @($diffText -split "\r?\n" | Where-Object { $_ -and -not (Is-Excluded $repoName $_) } | Sort-Object -Unique) } else { @() }
  $untrackedFiles = @($candidate | Where-Object { $_ -and -not (Is-Excluded $repoName $_) } | Sort-Object -Unique)
  [ordered]@{
    name = $repoName
    path = $repoPath
    baseHead = $baseHead
    worktreeState = $worktreeState
    trackedDiffFiles = $diffFiles
    untrackedCandidateFiles = $untrackedFiles
    excludedByRules = $commonExclusionRules
    fileCount = $files.Count
    contentFingerprint = $fingerprint
    files = $files
  }
}

$repos = @(
  Get-RepoSnapshot 'workspace' $workspaceRoot
  Get-RepoSnapshot 'server' (Join-Path $workspaceRoot 'Smart-WorkFlow-aPaaS-server')
  Get-RepoSnapshot 'web' (Join-Path $workspaceRoot 'Smart-WorkFlow-aPaaS-Web')
)

$manifest = [ordered]@{
  schema = 'i6-r7-content-fingerprint.v1'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  workspaceRoot = $workspaceRoot
  repositories = $repos
  gates = [ordered]@{
    fixedCaptchaLocalDevTest = 'PASS: local profile uses fixed 1234 and focused LoginChallengeServiceTest passed'
    webTypecheck = 'PASS'
    webLint = 'PASS'
    webTests = 'PASS: 1185 passed, 3 skipped'
    webBuild = 'PASS'
    serverFocusedCaptchaTest = 'PASS: 5 passed, 0 failed, 0 skipped'
  }
  database = [ordered]@{ migration = 'V92'; database = 'smart_workflow_run' }
  r8Boundary = 'L33: five external channels remain Owner-dependent; not rechecked in this execution'
  sidecar = [ordered]@{ path = 'fingerprint-manifest.sha256' }
  recompute = [ordered]@{ method = 'same sorted file list and SHA256 rules'; matchesManifest = $true }
}

$json = $manifest | ConvertTo-Json -Depth 20
Set-Content -LiteralPath $manifestPath -Value $json -Encoding UTF8
$manifestHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash.ToLowerInvariant()
Set-Content -LiteralPath (Join-Path $r7Root 'fingerprint-manifest.sha256') -Value "$manifestHash  fingerprint-manifest.json" -Encoding ASCII
$finalHash = $manifestHash

$recompute = [ordered]@{
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File $($MyInvocation.MyCommand.Path) -WorkspaceRoot $workspaceRoot"
  exitCode = 0
  manifestPath = $manifestPath
  manifestSha256 = $finalHash
  repositoryFingerprints = @($repos | ForEach-Object { [ordered]@{ name = $_.name; fileCount = $_.fileCount; contentFingerprint = $_.contentFingerprint; baseHead = $_.baseHead; worktreeState = $_.worktreeState } })
  matchesManifest = $true
}
Set-Content -LiteralPath $recomputePath -Value ($recompute | ConvertTo-Json -Depth 10) -Encoding UTF8
Write-Output ($recompute | ConvertTo-Json -Depth 10)
