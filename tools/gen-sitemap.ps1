<#
  Genere sitemap.xml a partir des fichiers HTML reellement presents.

  Regles :
    - toute page portant <meta name="robots" content="noindex..."> est exclue
    - l'URL declaree est le canonical de la page (source unique de verite)
    - lastmod = date du dernier commit git touchant le fichier, sinon date du jour
    - priorite : accueil 1.0 | index d'articles 0.9 | article 0.8 | outil 0.7 | reste 0.6

  Usage : powershell -File tools/gen-sitemap.ps1
#>
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Site = 'https://route-vers-le-million.blog'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

$today = (git -C $Root log -1 --format=%cs)
if (-not $today) { $today = '2026-07-11' }

$entries = @()
foreach ($f in (Get-ChildItem $Root -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\\.git\\' } | Sort-Object FullName)) {
  $h = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)

  if ($h -match '<meta\s+name="robots"\s+content="[^"]*noindex') { continue }
  if ($h -notmatch '<link rel="canonical" href="([^"]+)"') { continue }
  $url = $Matches[1]

  $rel = $f.FullName.Substring($Root.Length + 1)
  $lastmod = (git -C $Root log -1 --format=%cs -- $rel)
  if (-not $lastmod) { $lastmod = $today }

  $path = $url.Substring($Site.Length)
  if ($path -eq '/') { $prio = '1.0' }
  elseif ($path -match '^/(en/|es/)?articles/$') { $prio = '0.9' }
  elseif ($path -match '^/(en/|es/)?articles/.+\.html$') { $prio = '0.8' }
  elseif ($path -match '^/(outils|calculatrice|calculatrice-retraite|etf-explorer)/') { $prio = '0.7' }
  else { $prio = '0.6' }

  $entries += [pscustomobject]@{ url = $url; lastmod = $lastmod; prio = $prio }
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
$sorted = $entries | Sort-Object @{ Expression = { [double]$_.prio }; Descending = $true }, @{ Expression = 'url'; Descending = $false }
foreach ($e in $sorted) {
  [void]$sb.AppendLine('  <url>')
  [void]$sb.AppendLine('    <loc>' + $e.url + '</loc>')
  [void]$sb.AppendLine('    <lastmod>' + $e.lastmod + '</lastmod>')
  [void]$sb.AppendLine('    <priority>' + $e.prio + '</priority>')
  [void]$sb.AppendLine('  </url>')
}
[void]$sb.AppendLine('</urlset>')

[System.IO.File]::WriteAllText((Join-Path $Root 'sitemap.xml'), $sb.ToString(), $Utf8)
Write-Host ("sitemap.xml : {0} URL" -f $entries.Count) -ForegroundColor Green
