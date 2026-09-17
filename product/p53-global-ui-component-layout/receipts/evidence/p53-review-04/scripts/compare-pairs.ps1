param([string]$PairsDir, [string]$OutJson)
Add-Type -AssemblyName System.Drawing
$refs = [string[]]@("System.Drawing.dll")
Add-Type -ReferencedAssemblies $refs -TypeDefinition "using System; using System.Drawing; using System.Drawing.Imaging; public static class DiffTool { public static object Compare(string refPath, string runPath, int[][] masks) { Bitmap a = new Bitmap(refPath); Bitmap b = new Bitmap(runPath); int w = Math.Min(a.Width, b.Width); int h = Math.Min(a.Height, b.Height); BitmapData da = a.LockBits(new Rectangle(0,0,a.Width,a.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb); BitmapData db = b.LockBits(new Rectangle(0,0,b.Width,b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb); long[] total = new long[3]; long[] diff = new long[3]; Func<int,int,bool> masked = (x,y) => { foreach (var m in masks) { if (x>=m[0] && y>=m[1] && x<m[0]+m[2] && y<m[1]+m[3]) return true; } return false; }; for (int y=0; y<h; y++) { for (int x=0; x<w; x++) { bool isMasked = masked(x,y); int region; if (y<64) region=0; else if (x<224) region=1; else region=2; if (!isMasked) total[region]++; Color ca = a.GetPixel(x,y); Color cb = b.GetPixel(x,y); if (!isMasked && (Math.Abs(ca.R-cb.R)>8 || Math.Abs(ca.G-cb.G)>8 || Math.Abs(ca.B-cb.B)>8)) diff[region]++; } } a.UnlockBits(da); b.UnlockBits(db); a.Dispose(); b.Dispose(); return new { topbar = new { total = total[0], diff = diff[0] }, sidebar = new { total = total[1], diff = diff[1] }, main = new { total = total[2], diff = diff[2] } } } }"
$index = Get-ChildItem $PairsDir -Filter "*-reference.png" | ForEach-Object {
  $seq = $_.Name.Substring(0,2)
  $run = Join-Path $PairsDir ($seq + "-runtime.png")
  if (-not (Test-Path $run)) { [pscustomobject]@{ seq = [int]$seq; reference = $_.Name; runtime = $null; skipped = $true }; return }
  $maskFile = Join-Path $PairsDir ($seq + "-masks.json")
  $masks = @()
  if (Test-Path $maskFile) {
    $masks = (Get-Content $maskFile -Raw -Encoding UTF8 | ConvertFrom-Json) | ForEach-Object { ,@([int]$_.x, [int]$_.y, [int]$_.w, [int]$_.h) }
  }
  $m2 = [int[][]]$masks
  $r = [DiffTool]::Compare($_.FullName, $run, $m2)
  [pscustomobject]@{ seq = [int]$seq; reference = $_.Name; runtime = (Split-Path $run -Leaf); topbar = $r.topbar; sidebar = $r.sidebar; main = $r.main }
}
$index | ConvertTo-Json -Depth 5 | Out-File $OutJson -Encoding utf8
Write-Output ("compared=" + $index.Count)