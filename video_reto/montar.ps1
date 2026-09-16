$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$outDir=$PSScriptRoot
$ff='C:\Users\joale\AppData\Local\CapCut\Apps\9.3.0.3970\ffmpeg.exe'
$meta=Get-Content -Raw -LiteralPath 'C:\Users\joale\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\0913\draft_meta_info.json' | ConvertFrom-Json
$photos=@($meta.draft_materials[0].value | Where-Object metetype -eq 'photo')
$video='C:\Users\joale\Downloads\WhatsApp Video 2026-09-13 at 10.22.47 PM.mp4'
$shots=@(
 @{p=2;d=3;t="SI TE REGALAN ESTAS...";sub='¿qué favor te van a pedir?'},
 @{s=46;d=3;t='LLEGÓ UNA CAJA.';sub='Parecía un regalo normal.'},
 @{s=177;d=3;t='HASTA QUE LA ABRÍ.';sub=''},
 @{p=0;d=2;t='UN DETALLE.';sub=''},
 @{p=7;d=2;t='OTRA PISTA.';sub=''},
 @{p=6;d=3;t='EL PADRINO.';sub='Ahora todo tiene sentido.'},
 @{s=240;d=4;t='¿DOY LAS GRACIAS...';sub='o apago el celular?'},
 @{p=3;d=5;t='¿QUÉ FAVOR VIENE';sub='DESPUÉS?'}
)
$utf8=New-Object System.Text.UTF8Encoding($false)
$list=New-Object System.Collections.Generic.List[string]
for($i=0;$i -lt $shots.Count;$i++) {
 $shot=$shots[$i]; $d=$shot.d; $baseY=130; if($shot.ContainsKey('s')){$baseY=900}
 $bmp=New-Object Drawing.Bitmap 720,1280
 $g=[Drawing.Graphics]::FromImage($bmp); $g.Clear([Drawing.Color]::Transparent)
 $g.SmoothingMode='AntiAlias'; $g.TextRenderingHint='AntiAliasGridFit'
 $shade=New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(210,8,8,10))
 $g.FillRectangle($shade,35,$baseY,650,170)
 $g.FillRectangle([Drawing.Brushes]::DarkRed,35,$baseY,7,170)
 $fmt=New-Object Drawing.StringFormat; $fmt.Alignment='Center'; $fmt.LineAlignment='Center'
 $font=New-Object Drawing.Font('Arial',30,[Drawing.FontStyle]::Bold)
 $small=New-Object Drawing.Font('Arial',24,[Drawing.FontStyle]::Bold)
 $g.DrawString($shot.t,$font,[Drawing.Brushes]::White,(New-Object Drawing.RectangleF(55,($baseY+15),610,75)),$fmt)
 $g.DrawString($shot.sub,$small,[Drawing.Brushes]::White,(New-Object Drawing.RectangleF(55,($baseY+89),610,64)),$fmt)
 $png=Join-Path $outDir "texto$i.png"; $bmp.Save($png,[Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$bmp.Dispose();$font.Dispose();$small.Dispose();$shade.Dispose();$fmt.Dispose()
 $dest=Join-Path $outDir "plano$i.mp4"
 if($shot.ContainsKey('p')) {
  $src=$photos[$shot.p].file_Path
  $vf="[0:v]scale=900:1600:force_original_aspect_ratio=increase,crop=900:1600,zoompan=z='1.02+0.0005*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=720x1280:fps=30,setsar=1[v];[v][1:v]overlay=0:0,format=yuv420p[out]"
  & $ff -v error -loop 1 -i $src -i $png -filter_complex $vf -map '[out]' -t $d -an -c:v h264_mf -b:v 6000000 -y $dest
 } else {
  $vf='[0:v]scale=792:1408,crop=720:1280:36:45,setsar=1,fps=30[v];[v][1:v]overlay=0:0,format=yuv420p[out]'
  & $ff -v error -ss $shot.s -i $video -i $png -filter_complex $vf -map '[out]' -t $d -an -c:v h264_mf -b:v 6000000 -y $dest
 }
 if($LASTEXITCODE -ne 0){throw "Error rendering shot $i"}
 $list.Add("file 'plano$i.mp4'")
 Write-Output "Plano $i terminado"
}
[IO.File]::WriteAllLines((Join-Path $outDir 'planos.txt'),$list,$utf8)
$music="aevalsrc=0.10*sin(2*PI*110*t)*exp(-5*mod(t\,0.6))+0.045*sin(2*PI*164.81*t)+0.025*sin(2*PI*220*t):s=44100:d=25"
& $ff -v error -f concat -safe 0 -i (Join-Path $outDir 'planos.txt') -f lavfi -i $music -map 0:v -map 1:a -af 'afade=t=in:d=0.3,afade=t=out:st=24:d=1' -c:v copy -c:a aac -b:a 192k -t 25 -movflags +faststart -y (Join-Path $outDir 'El_favor_del_Padrino.mp4')
if($LASTEXITCODE -ne 0){throw 'Error final'}
Write-Output 'VIDEO TERMINADO'
