<#
  Generateur de pages statiques EN / ES pour Route vers le Million.

  Sources de verite (aucun gabarit n'est invente) :
    - articles/*.html            le gabarit FR reel, tel quel
    - translations.js            le contenu traduit, par cle data-i18n
    - le bloc "METADONNEES SEO PAR LANGUE" du <head> de chaque article

  Sorties :
    - en/articles/<slug-en>.html
    - es/articles/<slug-es>.html
    - le fichier FR est mis a jour sur place (hreflang + selecteur de langue
      pointant vers de vraies URL). Son corps n'est pas touche.

  Usage :
    powershell -File tools/gen-i18n-pages.ps1
    powershell -File tools/gen-i18n-pages.ps1 -Only comprendre-les-frais-de-placement,levier-sans-dette
#>
param(
  [string[]]$Only = @()
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Site = 'https://route-vers-le-million.blog'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

# Windows PowerShell 5.1 lit les .ps1 sans BOM en ANSI : aucun litteral non-ASCII
# ne doit apparaitre dans ce fichier, sinon il ressort en mojibake dans le HTML.
$DASH  = [string][char]0x2014   # tiret cadratin
$SUFF  = ' ' + $DASH + ' Route vers le Million'

$HREFLANG = @{ fr = 'fr-CA'; en = 'en-CA'; es = 'es' }
$OGLOCALE = @{ fr = 'fr_CA'; en = 'en_CA'; es = 'es_ES' }
$JSONLANG = @{ fr = 'fr-CA'; en = 'en-CA'; es = 'es-ES' }

function Read-Text([string]$p) {
  return [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
}

function Write-Text([string]$p, [string]$c) {
  $d = Split-Path -Parent $p
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
  [System.IO.File]::WriteAllText($p, $c, $Utf8)
}

# Remplacement regex sans interpretation des $ presents dans le texte de remplacement.
function Rx([string]$s, [string]$pat, [string]$rep) {
  return [regex]::Replace($s, $pat, ($rep -replace '\$', '$$$$'))
}

# ---------------------------------------------------------------- 1. dictionnaire
$DICT = @{ fr = @{}; en = @{}; es = @{} }
$cur = $null
foreach ($ln in [System.IO.File]::ReadAllLines((Join-Path $Root 'translations.js'), [System.Text.Encoding]::UTF8)) {
  if ($ln -match '^\s{2}(fr|en|es):\s*\{\s*$') { $cur = $Matches[1]; continue }
  if (-not $cur) { continue }
  if ($ln -match "^\s*'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)',?\s*$") {
    $DICT[$cur][$Matches[1]] = ($Matches[2] -replace "\\'", "'")
  }
}
Write-Host ("Dictionnaire : fr={0} en={1} es={2} cles" -f $DICT.fr.Count, $DICT.en.Count, $DICT.es.Count)

# ---------------------------------------------------------------- 2. sources et metadonnees SEO
#
# Trois familles de pages, avec des schemas d'URL differents :
#   kind=article  articles/<nom>.html    -> /articles/<nom>.html      | /<L>/articles/<slug>.html
#   kind=artindex articles/index.html    -> /articles/               | /<L>/articles/
#   kind=home     index.html             -> /                        | /<L>/
#   kind=section  <dir>/index.html       -> /<dir>/                  | /<L>/<slug>/
#
# Une page sans bloc "METADONNEES SEO PAR LANGUE" complet est ignoree : sans
# titre ni description par langue, la page generee serait inexploitable.
$SKIP = @('en', 'es', 'articles', 'merci-infolettre')

$SOURCES = @()
foreach ($f in (Get-ChildItem (Join-Path $Root 'articles') -Filter *.html | Sort-Object Name)) {
  $kind = if ($f.BaseName -eq 'index') { 'artindex' } else { 'article' }
  $SOURCES += [pscustomobject]@{ id = $f.BaseName; kind = $kind; path = $f.FullName }
}
$SOURCES += [pscustomobject]@{ id = 'home'; kind = 'home'; path = (Join-Path $Root 'index.html') }
foreach ($d in (Get-ChildItem $Root -Directory | Sort-Object Name)) {
  if ($SKIP -contains $d.Name) { continue }
  $p = Join-Path $d.FullName 'index.html'
  if (Test-Path $p) { $SOURCES += [pscustomobject]@{ id = $d.Name; kind = 'section'; path = $p } }
}
# Les quiz vivent un niveau plus bas : quiz/<nom>/index.html -> /quiz/<slug>/ | /<L>/quiz/<slug>/
$qroot = Join-Path $Root 'quiz'
if (Test-Path $qroot) {
  foreach ($d in (Get-ChildItem $qroot -Directory | Sort-Object Name)) {
    $p = Join-Path $d.FullName 'index.html'
    if (Test-Path $p) { $SOURCES += [pscustomobject]@{ id = 'quiz/' + $d.Name; kind = 'quiz'; path = $p } }
  }
}

$SEO  = @{}
$KIND = @{}
$SRC  = @{}
foreach ($s in $SOURCES) {
  $h = Read-Text $s.path
  $e = @{}
  foreach ($L in 'FR', 'EN', 'ES') {
    # Tolere le separateur "|" entre les champs, l'absence de "keywords" et un slug vide.
    $rx = "(?s)$L\s*:\s*title\s+`"(.*?)`"\s*\|?\s*slug\s+`"(.*?)`"\s*\|?\s*description\s+`"(.*?)`"(?:\s*\|?\s*keywords\s+([^\r\n]*))?"
    if ($h -match $rx) {
      $kw = ''
      if ($Matches[4]) { $kw = $Matches[4].Trim() }
      $e[$L.ToLower()] = @{
        title = $Matches[1].Trim(); slug = $Matches[2].Trim()
        desc  = $Matches[3].Trim(); kw   = $kw
      }
    }
  }
  if ($e.Count -eq 3) { $SEO[$s.id] = $e; $KIND[$s.id] = $s.kind; $SRC[$s.id] = $s.path }
  else { Write-Host ("  IGNORE (bloc SEO par langue absent ou incomplet) : {0}" -f $s.id) -ForegroundColor Yellow }
}
Write-Host ("Pages avec metadonnees completes : {0}" -f $SEO.Count)

# ---------------------------------------------------------------- 3. URL
function Get-Path([string]$base, [string]$lang) {
  if (-not $SEO.ContainsKey($base)) { throw ("base inconnue [{0}] (lang={1})" -f $base, $lang) }
  $k = $KIND[$base]
  $slug = $SEO[$base][$lang].slug
  switch ($k) {
    'home'     { if ($lang -eq 'fr') { return '/' }          else { return "/$lang/" } }
    'artindex' { if ($lang -eq 'fr') { return '/articles/' } else { return "/$lang/articles/" } }
    'article'  { if ($lang -eq 'fr') { return "/articles/$base.html" } else { return "/$lang/articles/$slug.html" } }
    'section'  { if ($lang -eq 'fr') { return "/$base/" }    else { return "/$lang/$slug/" } }
    'quiz'     {
      # Le prefixe /quiz/ est lui-meme traduit : il suit le slug de la section quiz.
      $racine = if ($SEO.ContainsKey('quiz')) { $SEO['quiz'][$lang].slug } else { 'quiz' }
      if ($lang -eq 'fr') { return "/quiz/$slug/" } else { return "/$lang/$racine/$slug/" }
    }
  }
  throw ("kind inconnu [{0}] pour {1}" -f $k, $base)
}

function Get-Url([string]$base, [string]$lang) { return $Site + (Get-Path $base $lang) }

function Get-OutPath([string]$base, [string]$lang) {
  if ($lang -eq 'fr') { return $SRC[$base] }
  $p = (Get-Path $base $lang).Trim('/')          # ex. "en/tfsa-rrsp" ou "en/articles/x.html"
  if ($p -like '*.html') { return (Join-Path $Root ($p -replace '/', '\')) }
  return (Join-Path $Root (($p -replace '/', '\') + '\index.html'))
}

# ---------------------------------------------------------------- 4. transformations
# Remplace le contenu interne de chaque element porteur d'un data-i18n.
function Apply-I18n([string]$html, [string]$lang) {
  $d = $DICT[$lang]
  $keys = [regex]::Matches($html, 'data-i18n="([^"]+)"') |
          ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
  foreach ($k in $keys) {
    if (-not $d.ContainsKey($k)) {
      Write-Host ("    cle absente [{0}] : {1}" -f $lang, $k) -ForegroundColor Red
      continue
    }
    $pat = '<(?<tag>[a-zA-Z0-9]+)(?<attrs>[^>]*\sdata-i18n="' + [regex]::Escape($k) + '"[^>]*)>(?<inner>.*?)</\k<tag>>'
    $rx  = New-Object System.Text.RegularExpressions.Regex($pat, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $rep = '<${tag}${attrs}>' + ($d[$k] -replace '\$', '$$$$') + '</${tag}>'
    $html = $rx.Replace($html, $rep)
  }
  return $html
}

# Reecrit les liens internes vers les URL de la langue cible.
# Toute page absente de $SEO (pas encore traduite) garde son lien francais :
# mieux vaut un lien vers une page qui existe qu'un lien mort.
function Fix-Links([string]$s, [string]$lang) {
  if ($lang -eq 'fr') { return $s }

  # Du plus specifique au plus general : les articles et sections avant "/".
  $map = @{}
  foreach ($b in $SEO.Keys) {
    $from = Get-Path $b 'fr'
    $to   = Get-Path $b $lang
    if ($from -ne '/') { $map[$from] = $to }   # l'accueil est traite en dernier
  }
  foreach ($from in ($map.Keys | Sort-Object { $_.Length } -Descending)) {
    $s = $s.Replace('href="' + $from + '"', 'href="' + $map[$from] + '"')
  }

  # Pages hors generateur, deja traduites a la main.
  if ($lang -eq 'en') {
    $s = $s.Replace('href="/a-propos/"', 'href="/en/about/"')
    $s = $s.Replace('href="/divulgation.html"', 'href="/en/disclosure.html"')
  } else {
    $s = $s.Replace('href="/a-propos/"', 'href="/es/sobre-mi/"')
    $s = $s.Replace('href="/divulgation.html"', 'href="/es/divulgacion.html"')
  }

  # L'accueil en dernier : href="/" est un suffixe de tous les autres liens.
  if ($SEO.ContainsKey('home')) {
    $s = $s.Replace('href="/"', 'href="/' + $lang + '/"')
  }
  return $s
}

# Remplace les boutons setLang() par de vrais liens vers les URL des trois langues.
function Fix-Switcher([string]$s, [string]$base) {
  foreach ($L in 'fr', 'en', 'es') {
    $href = (Get-Url $base $L).Substring($Site.Length)
    $pat = '<button class="lang-btn" data-lang="' + $L + '" onclick="setLang\(''' + $L + '''\)(;toggleMenu\(\))?" style="([^"]*)">([^<]*)</button>'
    $rep = '<a class="lang-btn" data-lang="' + $L + '" href="' + $href + '" style="$2text-decoration:none;">$3</a>'
    $s = [regex]::Replace($s, $pat, $rep)
    # Idempotence : reajuste aussi les liens deja convertis (slug modifie, page copiee).
    $pat2 = '<a class="lang-btn" data-lang="' + $L + '" href="[^"]*"'
    $rep2 = '<a class="lang-btn" data-lang="' + $L + '" href="' + $href + '"'
    $s = [regex]::Replace($s, $pat2, $rep2)
  }
  return $s
}

# Force la langue de la page avant le chargement de translations.js.
function Set-LangLock([string]$s, [string]$lang) {
  $s = [regex]::Replace($s, '\s*<script>try\{localStorage\.setItem\(.*?\}catch\(e\)\{\}</script>', '')
  $tag = "`n <script>try{localStorage.setItem('lang','$lang');}catch(e){}</script>"
  return ([regex]::Replace($s, '<head>', '<head>' + $tag, 1))
}

# canonical + hreflang reciproques, x-default vers le FR.
function Set-Alternates([string]$s, [string]$base, [string]$lang) {
  $s = [regex]::Replace($s, '\s*<link rel="alternate" hreflang="[^"]*"[^>]*/>', '')
  $block = ' <link rel="canonical" href="' + (Get-Url $base $lang) + '"/>'
  foreach ($L in 'fr', 'en', 'es') {
    $block += "`n" + ' <link rel="alternate" hreflang="' + $HREFLANG[$L] + '" href="' + (Get-Url $base $L) + '"/>'
  }
  $block += "`n" + ' <link rel="alternate" hreflang="x-default" href="' + (Get-Url $base 'fr') + '"/>'
  return (Rx $s '\s*<link rel="canonical"[^>]*/>' ("`n" + $block))
}

function Build-Page([string]$base, [string]$lang) {
  # NB : ne jamais nommer cette variable $seo. Les noms de variables PowerShell
  # sont insensibles a la casse : $seo masquerait le dictionnaire global $SEO.
  $src  = Read-Text $SRC[$base]
  $meta = $SEO[$base][$lang]
  $url  = Get-Url $base $lang
  $ttl  = $meta.title + $SUFF

  if ($lang -eq 'fr') {
    # Fichier FR : on ne touche ni au corps ni aux metadonnees, seulement
    # au verrou de langue, aux alternates et au selecteur.
    $o = Set-LangLock $src $lang
    $o = Set-Alternates $o $base $lang
    $o = Fix-Switcher $o $base
    return $o
  }

  $o = Apply-I18n $src $lang
  $o = Rx $o '<html lang="[^"]*">' ('<html lang="' + $lang + '">')
  $o = Rx $o '(?s)<title>.*?</title>' ('<title>' + $ttl + '</title>')
  $o = Rx $o '<meta name="description" content="[^"]*"' ('<meta name="description" content="' + $meta.desc + '"')
  $o = Rx $o '<meta name="keywords" content="[^"]*"' ('<meta name="keywords" content="' + $meta.kw + '"')
  $o = Rx $o '<meta property="og:title" content="[^"]*"' ('<meta property="og:title" content="' + $ttl + '"')
  $o = Rx $o '<meta property="og:description" content="[^"]*"' ('<meta property="og:description" content="' + $meta.desc + '"')
  $o = Rx $o '<meta property="og:url" content="[^"]*"' ('<meta property="og:url" content="' + $url + '"')
  $o = Rx $o '<meta name="twitter:title" content="[^"]*"' ('<meta name="twitter:title" content="' + $meta.title + '"')
  $o = Rx $o '<meta name="twitter:description" content="[^"]*"' ('<meta name="twitter:description" content="' + $meta.desc + '"')

  # og:locale : la langue de la page, puis les deux autres en alternate.
  $o = [regex]::Replace($o, '\s*<meta property="og:locale:alternate"[^>]*/>', '')
  $loc = '<meta property="og:locale" content="' + $OGLOCALE[$lang] + '"/>'
  foreach ($L in 'fr', 'en', 'es') {
    if ($L -ne $lang) { $loc += "`n" + ' <meta property="og:locale:alternate" content="' + $OGLOCALE[$L] + '"/>' }
  }
  $o = Rx $o '<meta property="og:locale" content="[^"]*"/>' $loc

  # JSON-LD
  $o = Rx $o '"headline":\s*"[^"]*"'    ('"headline": "' + $meta.title + '"')
  $o = Rx $o '"description":\s*"[^"]*"' ('"description": "' + $meta.desc + '"')
  # Exige un chemin apres le domaine : l'URL de l'editeur (domaine nu) n'est pas touchee.
  $o = Rx $o '"url":\s*"https://route-vers-le-million\.blog/[^"]*"' ('"url": "' + $url + '"')
  $o = Rx $o '"inLanguage":\s*"[^"]*"'  ('"inLanguage": "' + $JSONLANG[$lang] + '"')

  $o = Set-Alternates $o $base $lang
  $o = Fix-Links $o $lang
  $o = Fix-Switcher $o $base
  $o = Set-LangLock $o $lang
  return $o
}

# ---------------------------------------------------------------- 5. execution
$targets = if ($Only.Count) { $Only } else { $SEO.Keys | Sort-Object }
$n = 0
foreach ($base in $targets) {
  if (-not $SEO.ContainsKey($base)) {
    Write-Host ("  INCONNU : {0}" -f $base) -ForegroundColor Red
    continue
  }
  foreach ($lang in 'fr', 'en', 'es') {
    $out = Build-Page $base $lang
    $p = Get-OutPath $base $lang
    Write-Text $p $out
    $n++
    Write-Host ("  [{0}] {1}" -f $lang, $p.Substring($Root.Length + 1))
  }
}
Write-Host ("`n{0} fichiers ecrits." -f $n) -ForegroundColor Green
