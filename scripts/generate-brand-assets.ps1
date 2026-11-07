# Draws the Scannova mark and writes every app icon and splash image.
# Run from the project root: powershell -File scripts/generate-brand-assets.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path (Get-Location) 'assets/images'
New-Item -ItemType Directory -Force $out | Out-Null
$blue = [System.Drawing.ColorTranslator]::FromHtml('#2563EB')
$white = [System.Drawing.Color]::White

function New-Canvas($size) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function New-RoundedPath($x, $y, $w, $h, $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

# The mark: four viewfinder corners around a page with two text lines.
# It is centred in a square of side $s whose top-left corner is ($ox, $oy).
function Draw-Mark($g, $ox, $oy, $s, $color) {
  $stroke = $s * 0.07
  $pen = New-Object System.Drawing.Pen $color, $stroke
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $l = $ox + $s * 0.1; $t = $oy + $s * 0.1
  $r = $ox + $s * 0.9; $b = $oy + $s * 0.9
  $arm = $s * 0.2
  $g.DrawLines($pen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($l, $t + $arm), [System.Drawing.PointF]::new($l, $t), [System.Drawing.PointF]::new($l + $arm, $t)))
  $g.DrawLines($pen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($r - $arm, $t), [System.Drawing.PointF]::new($r, $t), [System.Drawing.PointF]::new($r, $t + $arm)))
  $g.DrawLines($pen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($r, $b - $arm), [System.Drawing.PointF]::new($r, $b), [System.Drawing.PointF]::new($r - $arm, $b)))
  $g.DrawLines($pen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($l + $arm, $b), [System.Drawing.PointF]::new($l, $b), [System.Drawing.PointF]::new($l, $b - $arm)))

  $lineLeft = $ox + $s * 0.32; $lineRight = $ox + $s * 0.68
  $g.DrawLine($pen, $lineLeft, $oy + $s * 0.4, $lineRight, $oy + $s * 0.4)
  $g.DrawLine($pen, $lineLeft, $oy + $s * 0.6, $ox + $s * 0.56, $oy + $s * 0.6)
  $pen.Dispose()
}

function Save-Canvas($canvas, $name) {
  $canvas.Bitmap.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

# App store icon: full blue square, the platforms round the corners.
$c = New-Canvas 1024
$c.Graphics.Clear($blue)
Draw-Mark $c.Graphics 212 212 600 $white
Save-Canvas $c 'icon.png'

# Android adaptive layers: the mark stays inside the central safe zone.
foreach ($layer in 'android-icon-foreground.png', 'android-icon-monochrome.png') {
  $c = New-Canvas 1024
  $c.Graphics.Clear([System.Drawing.Color]::Transparent)
  Draw-Mark $c.Graphics 302 302 420 $white
  Save-Canvas $c $layer
}

# In-app logo and splash: a rounded blue tile that works on both themes.
foreach ($item in @(@{ Name = 'logo.png'; Size = 512 }, @{ Name = 'splash-icon.png'; Size = 1024 })) {
  $size = $item.Size
  $c = New-Canvas $size
  $c.Graphics.Clear([System.Drawing.Color]::Transparent)
  $brush = New-Object System.Drawing.SolidBrush $blue
  $path = New-RoundedPath 0 0 ($size - 1) ($size - 1) ($size * 0.22)
  $c.Graphics.FillPath($brush, $path)
  $path.Dispose(); $brush.Dispose()
  $inset = $size * 0.2
  Draw-Mark $c.Graphics $inset $inset ($size * 0.6) $white
  Save-Canvas $c $item.Name
}
