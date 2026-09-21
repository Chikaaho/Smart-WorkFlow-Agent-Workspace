# 只读核对：三仓远端默认分支 README 的版本登记、tags 与 latest Release（不输出凭据）
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
    $rel = Invoke-RestMethod -Uri ('https://api.github.com/repos/Chikaaho/' + $repo + '/releases/latest') -Headers $headers
    Write-Output ('latest_release=' + $rel.tag_name + ' name=' + $rel.name + ' created=' + $rel.created_at)
  }
  catch { Write-Output ('latest_release ERROR ' + $_.Exception.Message) }
  try {
    $tags = Invoke-RestMethod -Uri ('https://api.github.com/repos/Chikaaho/' + $repo + '/tags?per_page=5') -Headers $headers
    Write-Output ('tags=' + (($tags | ForEach-Object { $_.name }) -join ','))
  }
  catch { Write-Output ('tags ERROR ' + $_.Exception.Message) }
  try {
    $rd = Invoke-RestMethod -Uri ('https://api.github.com/repos/Chikaaho/' + $repo + '/readme') -Headers $headers
    $txt = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($rd.content))
    $lines = $txt -split $nl
    Write-Output ('readme_path=' + $rd.path + ' lines=' + $lines.Count)
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match '0\.0\.[0-9]|0\.1\.[0-9]|版本|version') {
        Write-Output ('   [' + ($i + 1) + '] ' + $lines[$i])
      }
    }
  }
  catch { Write-Output ('readme ERROR ' + $_.Exception.Message) }
}
