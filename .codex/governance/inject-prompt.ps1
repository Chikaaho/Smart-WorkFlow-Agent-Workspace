# 宿主外监督器的提示词注入执行器。
#
# 用法（由 execution-watchdog.py 调用）：
#   powershell -File inject-prompt.ps1 -TitlePattern "<会话标题前缀>" -PromptText "<纠偏提示词>"
#
# 行为：按标题前缀定位 ZCode 主窗口（唯一 ZCode 主窗口时不挑标题），激活窗口、
# 点击底部输入区、经剪贴板粘贴纠偏提示词并回车——等效用户亲自打字，走
# UserPromptSubmit 通道（实测在所有窗口 100% 可靠，不依赖已崩溃的 Stop hook）。
# 输出单行 JSON：{"ok":true|false,"window":"...","detail":"..."}

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [AllowEmptyString()] [string] $TitlePattern,
    [Parameter(Mandatory = $true)] [string] $PromptText
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Out-Result {
    param([bool] $Ok, [string] $Window, [string] $Detail)
    Write-Output (@{ ok = $Ok; window = $Window; detail = $Detail } | ConvertTo-Json -Compress)
    exit 0
}

Add-Type -Namespace Native -Name Win32 -MemberDefinition @"
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool GetWindowRect(System.IntPtr hWnd, out RECT rect);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool SetForegroundWindow(System.IntPtr hWnd);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool SetCursorPos(int x, int y);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, System.UIntPtr dwExtraInfo);
"@

$candidates = @(Get-Process -Name 'ZCode' -ErrorAction SilentlyContinue |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_.MainWindowTitle) } |
    Select-Object -Property Id, MainWindowTitle)
if ($candidates.Count -eq 0) { Out-Result $false '' 'no-zcode-window' }

$target = $null
if (-not [string]::IsNullOrWhiteSpace($TitlePattern)) {
    # 标题可能被宿主截断（以 … 结尾），只按前缀包含匹配。
    $prefix = $TitlePattern.Trim()
    if ($prefix.Length -gt 12) { $prefix = $prefix.Substring(0, 12) }
    $target = @($candidates | Where-Object { $_.MainWindowTitle.Contains($prefix) })
}
if (@($target).Count -ge 1) { $target = @($target)[0] }
elseif ($candidates.Count -eq 1) { $target = $candidates[0] }
else {
    Out-Result $false '' ("ambiguous-windows: " + (($candidates | ForEach-Object { $_.MainWindowTitle }) -join ' | ').Substring(0, 200))
}

$activated = (New-Object -ComObject WScript.Shell).AppActivate($target.Id)
Start-Sleep -Milliseconds 500
if (-not $activated) { Out-Result $false $target.MainWindowTitle 'activate-failed' }

$rect = New-Object Native.Win32+RECT
if (-not [Native.Win32]::GetWindowRect($target.MainWindowHandle, [ref]$rect)) {
    Out-Result $false $target.MainWindowTitle 'rect-failed'
}
# 点击窗口底部输入区（水平居中、底部上移 90px）：ZCode 布局固定，输入区位于窗口底部。
$clickX = [int](($rect.Left + $rect.Right) / 2)
$clickY = [int]($rect.Bottom - 90)
[void][Native.Win32]::SetCursorPos($clickX, $clickY)
Start-Sleep -Milliseconds 120
[Native.Win32]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)  # LEFTDOWN
[Native.Win32]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)  # LEFTUP
Start-Sleep -Milliseconds 350

Set-Clipboard -Value $PromptText
Start-Sleep -Milliseconds 150
(New-Object -ComObject WScript.Shell).SendKeys('^v')
Start-Sleep -Milliseconds 400
(New-Object -ComObject WScript.Shell).SendKeys('{ENTER}')
Start-Sleep -Milliseconds 300
Out-Result $true $target.MainWindowTitle "injected-at $clickX,$clickY"
