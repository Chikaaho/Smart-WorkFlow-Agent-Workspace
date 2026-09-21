# 只读核对：三仓全部 tag 与全部 release（不输出凭据）
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'never'
$nl = [char]10
$cred = ("protocol=https" + $nl + "host=github.com" + $nl + $nl) | git credential fill 2>$null
$pw = ($cred | Where-Object { $_ -like 'password=*' } | Select-Object -First 1)
if (-not $pw) { Write-Output 'NO_STORED_CREDENTIAL'; exit 0 }
$token = $pw.Substring(9)
$headers = @{
  Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('x-access-token:' + $token))
  'User-Agent'  = 'ch-aPaaS-verify'
  Accept        = 'application/vnd.github+json'
}
foreach ($repo in 'Smart-WorkFlow-Agent-Workspace', 'Smart-WorkFlow-aPaaS-server', 'Smart-WorkFlow-aPaaS-Web') {
  Write-Output ('===== ' + $repo + ' =====')
  try {
    $tags = Invoke-RestMethod -Uri ('https://api.github.com/repos/Chikaaho/' + $repo + '/tags?per_page=100') -Headers $headers
    Write-Output ('all_tags=' + (($tags | ForEach-Object { $_.name }) -join ','))
  }
  catch { Write-Output ('tags ERROR ' + $_.Exception.Message) }
  try {
    $rels = Invoke-RestMethod -Uri ('https://api.github.com/repos/Chikaaho/' + $repo + '/releases?per_page=100') -Headers $headers
    Write-Output ('releases_count=' + ($rels | Measure-Object).Count)
    foreach ($x in $rels) { Write-Output ('   tag=' + $x.tag_name + ' name=[' + $x.name + '] draft=' + $x.draft + ' prerelease=' + $x.prerelease + ' created=' + $x.created_at) }
  }
  catch { Write-Output ('releases ERROR ' + $_.Exception.Message) }
}
