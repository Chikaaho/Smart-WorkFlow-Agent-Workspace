# 只读核对：三仓 GitHub 名称/描述/主页/主题/分支（不输出任何凭据）
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'never'
$nl = [char]10
$cred = ("protocol=https" + $nl + "host=github.com" + $nl + $nl) | git credential fill 2>$null
$pw = ($cred | Where-Object { $_ -like 'password=*' } | Select-Object -First 1)
$usr = ($cred | Where-Object { $_ -like 'username=*' } | Select-Object -First 1)
if (-not $pw) { Write-Output 'NO_STORED_CREDENTIAL'; exit 0 }
$token = $pw.Substring(9)
Write-Output ('credential_present=true user=' + $usr.Substring(9))
$headers = @{
  Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('x-access-token:' + $token))
  'User-Agent'  = 'ch-aPaaS-verify'
  Accept        = 'application/vnd.github+json'
}
foreach ($repo in 'Smart-WorkFlow-Agent-Workspace', 'Smart-WorkFlow-aPaaS-server', 'Smart-WorkFlow-aPaaS-Web') {
  try {
    $r = Invoke-RestMethod -Uri ('https://api.github.com/repos/Chikaaho/' + $repo) -Headers $headers -Method Get
    Write-Output ('REPO ' + $repo)
    Write-Output ('   description=[' + $r.description + ']')
    Write-Output ('   homepage=[' + $r.homepage + ']')
    Write-Output ('   topics=' + (($r.topics) -join ','))
    Write-Output ('   default_branch=' + $r.default_branch + ' pushed_at=' + $r.pushed_at + ' updated_at=' + $r.updated_at)
  }
  catch { Write-Output ('REPO ' + $repo + ' ERROR ' + $_.Exception.Message) }
}
