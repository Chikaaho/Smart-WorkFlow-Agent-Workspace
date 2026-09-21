# 远端回读：develop 上的《功能清单》内容 + 0.1.0 Release 元数据 + main/tag 参照
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'never'
$nl = [char]10
$ev = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-02'
$enc = New-Object System.Text.UTF8Encoding($false)
$lines = New-Object System.Collections.Generic.List[string]

$rawUrl = 'https://raw.githubusercontent.com/Chikaaho/Smart-WorkFlow-aPaaS-server/develop/%E5%8A%9F%E8%83%BD%E6%B8%85%E5%8D%95.md'
$raw = (Invoke-WebRequest -Uri $rawUrl -UseBasicParsing).Content
$lines.Add('raw_url=' + $rawUrl)
$lines.Add('raw_bytes=' + [Text.Encoding]::UTF8.GetByteCount($raw))
$focus = ($raw -split $nl | Where-Object { $_ -like '> 当前焦点：*' })
$lines.Add('focus_lines_found=' + ($focus | Measure-Object).Count)
$f = $focus | Select-Object -First 1
$checks = @(
  @('Server main/tag 新值', 'd18e9a39c552918615be8b158dfe0cc278cb309f'),
  @('Web main/tag 新值', '039f987437ed6369c3c131631bd7622c6ae482e7'),
  @('Server Release ID', '392753737'),
  @('Web Release ID', '392753751'),
  @('Server CI run', '35569219107'),
  @('Web CI run', '35569219967'),
  @('Server 门禁 1423', '1423 tests / 0 failures / 0 errors / 0 skipped'),
  @('Web 门禁 1217+3', '1217 tests passed + 3 skipped'),
  @('演示库 V93', '应用数据库 V93（0 failed）'),
  @('Owner 登录通过', 'Owner 登录通过'),
  @('发布任务状态', 'COMPLETED（待规划确认，2026-09-21）'),
  @('唯一下一动作', '等待 Owner 自行体验，发现问题另行立项'),
  @('功能数 45 未变', '功能数 **45**'),
  @('清单计数未变', '**✅46/🟦22/⬜22**')
)
foreach ($c in $checks) { $lines.Add('remote_has[' + $c[0] + ']=' + $f.Contains($c[1])) }
$olds = @(
  @('旧 Server SHA', 'c15428f0002f6bb0ceeff05c7cbcf842bd3d3148'),
  @('旧 Web SHA', '963df360ed18bc1c604652a13edb2a7ed0be8963'),
  @('旧 Server Actions', '34946504087'),
  @('旧 Web Actions', '34942666025'),
  @('旧 1362', '1362'),
  @('旧 1185', '1185')
)
foreach ($c in $olds) { $lines.Add('remote_old_absent[' + $c[0] + ']=' + (-not $f.Contains($c[1]))) }
$rows = ($raw -split $nl | Where-Object { $_ -match '^\| M\d\d-F\d\d-\d\d ' } | Measure-Object).Count
$lines.Add('remote_m_rows=' + $rows)

$cred = ("protocol=https" + $nl + "host=github.com" + $nl + $nl) | git credential fill 2>$null
$pw = ($cred | Where-Object { $_ -like 'password=*' } | Select-Object -First 1)
if ($pw) {
  $token = $pw.Substring(9)
  $headers = @{
    Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('x-access-token:' + $token))
    'User-Agent'  = 'ch-aPaaS-verify'
    Accept        = 'application/vnd.github+json'
  }
  $rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/392753737' -Headers $headers
  $lines.Add('release_id=' + $rel.id + ' tag=' + $rel.tag_name + ' name=[' + $rel.name + '] draft=' + $rel.draft + ' prerelease=' + $rel.prerelease + ' created=' + $rel.created_at)
  $line = Invoke-RestMethod -Uri 'https://api.github.com/repos/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/latest' -Headers $headers
  $lines.Add('latest_release_id=' + $line.id + ' tag=' + $line.tag_name + ' created=' + $line.created_at)
  $repoMeta = Invoke-RestMethod -Uri 'https://api.github.com/repos/Chikaaho/Smart-WorkFlow-aPaaS-server' -Headers $headers
  $lines.Add('repo_default_branch=' + $repoMeta.default_branch + ' pushed_at=' + $repoMeta.pushed_at)
}
[System.IO.File]::WriteAllText($ev + '/remote-readback.txt', ($lines -join $nl) + $nl, $enc)
$lines | ForEach-Object { $_ }
