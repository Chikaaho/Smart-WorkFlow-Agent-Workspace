# Process/argv host entry with replayable stdin, one retry and fail-closed projection.
[CmdletBinding()]
param([string] $GateScript = '', [string] $RuntimeRoot = '')
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
# —— 派发回执（必须是脚本最前期的可执行语句）——
# 宿主实测存在 Stop hook 进程在任何脚本体语句执行前即死亡的形态（170-309ms、零脚本
# 痕迹，见 stop-gate.ps1 同名回执注释）。本回执把不可观测窗口从"进程启动→gate 启动"
# 收窄到"进程启动→本语句"：无 launcher-invoked 为宿主/OS 层 spawn 或引擎早期死亡；
# 有 launcher-invoked 而无 gate invoked 为 launcher 体早期中断。写失败不得影响裁决。
try {
    $launcherRuntime = if (-not [string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot } else { Join-Path $PSScriptRoot 'runtime/zcode' }
    [void][System.IO.Directory]::CreateDirectory($launcherRuntime)
    $launcherReceipt = [ordered] @{ ts = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); event = 'Stop'; dispatch = 'launcher-invoked'; session = ''; bytes = 0 }
    [System.IO.File]::AppendAllText((Join-Path $launcherRuntime 'invocations.log'), ($launcherReceipt | ConvertTo-Json -Compress) + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
} catch { }
function Write-LauncherBlock {
    param([string] $Code)
    [Console]::WriteLine((@{ decision = 'block'; reason = "执行会话不能结束：Stop 入口无法裁决（$Code）。下一步动作：运行 hook-selfcheck 并修复入口；保留当前工作，禁止按此故障宣称完成。" } | ConvertTo-Json -Compress))
}
try {
    . (Join-Path $PSScriptRoot 'windows-validator-runtime.ps1')
    $reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput(), [System.Text.UTF8Encoding]::new($false), $true)
    try {
        $pending = $reader.ReadToEndAsync()
        if (-not $pending.Wait(15000)) { throw [System.TimeoutException]::new() }
        $payload = $pending.Result
    } finally { $reader.Dispose() }
    if (-not $GateScript) { $GateScript = Join-Path $PSScriptRoot 'stop-gate.ps1' }
    if (-not $RuntimeRoot) { $RuntimeRoot = Join-Path $PSScriptRoot 'runtime/zcode' }
    $powerShell = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
    $arguments = @('-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',$GateScript,'-RuntimeRoot',$RuntimeRoot)
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        $result = Invoke-GovernanceProcess -Executable $powerShell -Arguments $arguments -InputText $payload -TimeoutMs 30000
        $valid = $false
        if ($result.exitCode -eq 0 -and -not $result.failure) {
            if ([string]::IsNullOrWhiteSpace($result.stdout) -and [string]::IsNullOrWhiteSpace($result.stderr)) { exit 0 }
            try {
                $decision = $result.stdout | ConvertFrom-Json
                $valid = $decision.decision -eq 'block' -and -not [string]::IsNullOrWhiteSpace($decision.reason)
            } catch { }
        }
        if ($valid) { [Console]::Write($result.stdout); exit 0 }
        # No raw stdout/stderr or payload in the failure ledger.
        try {
            [void][System.IO.Directory]::CreateDirectory($RuntimeRoot)
            $entry = @{ ts = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); event = 'Stop'; attempt = $attempt; exit_code = $result.exitCode; failure = $result.failure; exception_type = $result.exception_type }
            [System.IO.File]::AppendAllText((Join-Path $RuntimeRoot 'entry-failures.log'), ($entry | ConvertTo-Json -Compress) + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
        } catch { }
    }
    Write-LauncherBlock 'ENTRY_FAILED_TWICE'
} catch { Write-LauncherBlock ('ENTRY_EXCEPTION:' + $_.Exception.GetType().Name) }
exit 0
