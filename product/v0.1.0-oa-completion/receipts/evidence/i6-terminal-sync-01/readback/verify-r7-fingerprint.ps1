param(
  [string]$WorkspaceRoot = 'E:\code\Smart-WorkFlow-Agent-Workspace',
  [ValidateSet('pre', 'post')]
  [string]$Phase = 'pre'
)

# Read-only recomputation of the R7 content fingerprints (evidence/i6-06/R7-CONTENT-FINGERPRINT).
# Mirrors the exclusion rules of the R7 generator byte for byte and never writes the locked
# manifest/sidecar. Native git output is decoded as UTF-8 explicitly so that non-ASCII paths
# are compared as real paths instead of code-page mangled strings.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)

$workspaceRoot = (Resolve-Path -LiteralPath $WorkspaceRoot).Path
$r7Root = Join-Path $workspaceRoot 'product\v0.1.0-oa-completion\receipts\evidence\i6-06\R7-CONTENT-FINGERPRINT'
$manifestPath = Join-Path $r7Root 'fingerprint-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir = Join-Path $workspaceRoot 'product\v0.1.0-oa-completion\receipts\evidence\i6-terminal-sync-01\readback'

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

function Get-DiskMap([string]$repoName, [string]$repoPath) {
  $repoPath = (Resolve-Path -LiteralPath $repoPath).Path
  $trackedText = Get-GitText $repoPath @('ls-files')
  $tracked = if ($trackedText) { @($trackedText -split "\r?\n" | Where-Object { $_ }) } else { @() }
  $candidateText = Get-GitText $repoPath @('ls-files', '--others', '--exclude-standard')
  $candidate = if ($candidateText) { @($candidateText -split "\r?\n" | Where-Object { $_ }) } else { @() }
  $all = @($tracked + $candidate | Where-Object { $_ -and -not (Is-Excluded $repoName $_) } | Sort-Object -Unique)
  $map = New-Object System.Collections.Specialized.OrderedDictionary
  foreach ($relativePath in $all) {
    $absolutePath = Join-Path $repoPath $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) { continue }
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $absolutePath).Hash.ToLowerInvariant()
    $map[$relativePath.Replace('\', '/')] = [ordered]@{ size = [int64](Get-Item -LiteralPath $absolutePath).Length; sha256 = $hash }
  }
  return $map
}

function Get-CanonicalFingerprint([string]$repoName, [string[]]$orderedPaths, $diskMap, $recordedMap) {
  $lines = foreach ($path in $orderedPaths) {
    if ($diskMap.Contains($path)) { "$repoName|$path|$($diskMap[$path].size)|$($diskMap[$path].sha256)" }
    elseif ($recordedMap.Contains($path)) { "$repoName|$path|$($recordedMap[$path].size)|$($recordedMap[$path].sha256)" }
    else { "$repoName|$path|MISSING|MISSING" }
  }
  $bytes = [Text.Encoding]::UTF8.GetBytes((@($lines) -join "`n"))
  return ([Security.Cryptography.SHA256]::Create().ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join ''
}

$repos = @(
  @{ name = 'workspace'; path = $workspaceRoot }
  @{ name = 'server'; path = (Join-Path $workspaceRoot 'Smart-WorkFlow-aPaaS-server') }
  @{ name = 'web'; path = (Join-Path $workspaceRoot 'Smart-WorkFlow-aPaaS-Web') }
)

$report = [ordered]@{
  schema = 'i6-terminal-sync-01.r7-readonly-recompute.v2'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  manifestPath = $manifestPath
  manifestSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash.ToLowerInvariant()
  sidecarText = (Get-Content -LiteralPath (Join-Path $r7Root 'fingerprint-manifest.sha256') -Raw -Encoding ASCII).Trim()
  pathEncoding = 'UTF-8 (Console.OutputEncoding forced)'
  repositories = @()
}
$summary = New-Object System.Collections.Generic.List[string]

foreach ($repo in $repos) {
  $recorded = $manifest.repositories | Where-Object { $_.name -eq $repo.name }
  $recordedMap = New-Object System.Collections.Specialized.OrderedDictionary
  $recordedOrder = New-Object System.Collections.Generic.List[string]
  foreach ($file in $recorded.files) {
    $recordedMap[$file.path] = [ordered]@{ size = [int64]$file.size; sha256 = $file.sha256 }
    $recordedOrder.Add($file.path)
  }
  $diskMap = Get-DiskMap $repo.name $repo.path

  $missing = @($recordedOrder | Where-Object { -not $diskMap.Contains($_) })
  $changed = @($recordedOrder | Where-Object { $diskMap.Contains($_) -and ($diskMap[$_].sha256 -ne $recordedMap[$_].sha256 -or $diskMap[$_].size -ne $recordedMap[$_].size) })
  $added = @($diskMap.Keys | Where-Object { -not $recordedMap.Contains($_) })
  $matched = @($recordedOrder | Where-Object { $diskMap.Contains($_) -and $diskMap[$_].sha256 -eq $recordedMap[$_].sha256 -and $diskMap[$_].size -eq $recordedMap[$_].size })

  # fingerprint recomputed with current disk content, in the recorded canonical order
  $fpRecordedOrder = Get-CanonicalFingerprint $repo.name $recordedOrder $diskMap $recordedMap
  # fingerprint recomputed from the manifest's own recorded values in recorded order (self-consistency)
  $fpSelf = Get-CanonicalFingerprint $repo.name $recordedOrder $recordedMap $recordedMap
  $head = Get-GitText $repo.path @('rev-parse', 'HEAD')
  $status = Get-GitText $repo.path @('status', '--porcelain=v1')

  $report.repositories += [ordered]@{
    name = $repo.name
    baseHead = $head
    recordedBaseHead = $recorded.baseHead
    baseHeadMatches = ($head -eq $recorded.baseHead)
    worktreeState = $(if ($status) { 'DIRTY' } else { 'CLEAN' })
    diskFileCount = $diskMap.Count
    recordedFileCount = $recorded.fileCount
    recordedContentFingerprint = $recorded.contentFingerprint
    recomputedFromRecordedOrder = $fpRecordedOrder
    recordedOrderMatches = ($fpRecordedOrder -eq $recorded.contentFingerprint)
    manifestSelfConsistent = ($fpSelf -eq $recorded.contentFingerprint)
    matchedCount = $matched.Count
    missingFiles = $missing
    changedFiles = $changed
    addedFiles = $added
  }

  $summary.Add(("{0}: diskFiles={1} recorded={2} matched={3} changed={4} missing={5} added={6} | recomputedFp(recordedOrder)={7} recordedFp={8} MATCH={9} | manifestSelfConsistent={10} | baseHeadMatch={11}" -f `
    $repo.name, $diskMap.Count, $recorded.fileCount, $matched.Count, $changed.Count, $missing.Count, $added.Count, `
    $fpRecordedOrder, $recorded.contentFingerprint, ($fpRecordedOrder -eq $recorded.contentFingerprint), ($fpSelf -eq $recorded.contentFingerprint), ($head -eq $recorded.baseHead)))
}

$report.phase = $Phase
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $outDir "r7-recompute-$Phase.json") -Encoding UTF8
$summary -join "`n" | Set-Content -LiteralPath (Join-Path $outDir "r7-recompute-$Phase.txt") -Encoding UTF8
$summary -join "`n"
