<#
  CubeLab - Diagnostico del proyecto (Fase 0)
  Revisa herramientas, git, dependencias, el navegador de Playwright
  y corre las comprobaciones del proyecto. Genera
  el log, dist/ y los resultados de Playwright.

  Uso (desde la carpeta del proyecto):
    powershell -ExecutionPolicy Bypass -File .\tools\diagnostico.ps1
    powershell -ExecutionPolicy Bypass -File .\tools\diagnostico.ps1 -Rapido      (sin tests largos, build ni e2e)
    powershell -ExecutionPolicy Bypass -File .\tools\diagnostico.ps1 -ConE2E      (incluye la prueba e2e)
#>
param(
  [switch]$Rapido,
  [switch]$ConE2E
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$root = Split-Path -Parent $PSScriptRoot
if ($Rapido -and $ConE2E) { throw 'Usa -ConE2E para el diagnóstico completo o -Rapido para el abreviado.' }
Set-Location $root

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $root "diagnostico-$stamp.log"
$results = New-Object System.Collections.Generic.List[object]

function Write-Log([string]$text) {
  Add-Content -Path $log -Value $text -Encoding UTF8
}

function Add-Result([string]$area, [string]$estado, [string]$detalle) {
  $results.Add([pscustomobject]@{ Area = $area; Estado = $estado; Detalle = $detalle })
  $color = 'Red'
  if ($estado -eq 'OK') { $color = 'Green' }
  elseif ($estado -eq 'AVISO' -or $estado -eq 'OMITIDO') { $color = 'Yellow' }
  Write-Host ('[{0,-7}] {1}: {2}' -f $estado, $area, $detalle) -ForegroundColor $color
  Write-Log ('[{0}] {1}: {2}' -f $estado, $area, $detalle)
}

function Write-Section([string]$title) {
  Write-Host ''
  Write-Host "=== $title ===" -ForegroundColor Cyan
  Write-Log ''
  Write-Log "=== $title ==="
}

function Invoke-Step([string]$name, [string]$cmdline) {
  Write-Host "  -> $name ($cmdline)... " -ForegroundColor DarkCyan
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $out = cmd /c "chcp 65001 >nul & $cmdline 2>&1"
  $code = $LASTEXITCODE
  $sw.Stop()
  $secs = [int]$sw.Elapsed.TotalSeconds
  Write-Log ''
  Write-Log "----- $name | $cmdline | codigo de salida $code | $secs s -----"
  if ($out) { Write-Log (($out | ForEach-Object { "$_" }) -join "`r`n") }
  return [pscustomobject]@{ Code = $code; Out = @($out); Secs = $secs }
}

function Show-Tail($r, [int]$n = 25) {
  $r.Out | Select-Object -Last $n | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
}

function Test-Cmd([string]$c) {
  return [bool](Get-Command $c -ErrorAction SilentlyContinue)
}

function Get-JsonVersion([string]$path) {
  if (Test-Path $path) {
    try { return (Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch { return $null }
  }
  return $null
}

Write-Log "Diagnostico CubeLab - $(Get-Date)"
Write-Log "Carpeta: $root"
Write-Log "Windows: $([Environment]::OSVersion.VersionString) | PowerShell $($PSVersionTable.PSVersion)"

# ------------------------------------------------------------------
Write-Section '1. Carpeta del proyecto'
if (-not (Test-Path (Join-Path $root 'package.json'))) {
  Add-Result 'Carpeta' 'FALLA' "No hay package.json en $root. Ejecuta tools\diagnostico.ps1 desde una copia completa del proyecto."
  Write-Host "`nLog guardado en: $log"
  exit 1
}
Add-Result 'Carpeta' 'OK' $root
$pkg = Get-Content (Join-Path $root 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($f in @('AGENTS.md', 'README.md', 'docs\ARQUITECTURA.md', 'docs\DECISIONES.md')) {
  if (Test-Path (Join-Path $root $f)) { Add-Result 'Documento' 'OK' $f }
  else { Add-Result 'Documento' 'AVISO' "Falta $f" }
}
$nSrc = @(Get-ChildItem (Join-Path $root 'src') -Recurse -File -ErrorAction SilentlyContinue).Count
$nUnit = @(Get-ChildItem (Join-Path $root 'tests\unit') -Recurse -File -Filter '*.test.ts' -ErrorAction SilentlyContinue).Count
$nE2E = @(Get-ChildItem (Join-Path $root 'tests\e2e') -Recurse -File -ErrorAction SilentlyContinue).Count
Add-Result 'Codigo' 'OK' "src: $nSrc archivos | tests unitarios: $nUnit | tests e2e: $nE2E"
if ($nUnit -eq 0) { Add-Result 'Codigo' 'AVISO' 'No hay tests unitarios (*.test.ts) en tests\unit' }

# ------------------------------------------------------------------
Write-Section '2. Herramientas'
$nodeOk = $false
if (Test-Cmd 'node') {
  $nv = (cmd /c 'node -v').Trim()
  try {
    $parsed = [version]($nv.TrimStart('v'))
    if ($parsed -ge [version]'22.16.0') { Add-Result 'Node.js' 'OK' $nv; $nodeOk = $true }
    else { Add-Result 'Node.js' 'FALLA' "$nv (se necesita 22.16 o mayor)" }
  } catch { Add-Result 'Node.js' 'AVISO' "No pude leer la version: $nv"; $nodeOk = $true }
} else {
  Add-Result 'Node.js' 'FALLA' 'No esta instalado o no esta en el PATH (reinstala Node LTS y abre una ventana nueva).'
}
if (Test-Cmd 'npm') { Add-Result 'npm' 'OK' ((cmd /c 'npm -v') | Select-Object -Last 1) }
else { Add-Result 'npm' 'FALLA' 'No se encuentra npm.' }
$gitOk = Test-Cmd 'git'
if ($gitOk) { Add-Result 'Git' 'OK' ((cmd /c 'git --version') | Select-Object -Last 1) }
else { Add-Result 'Git' 'FALLA' 'Git no esta instalado (winget install Git.Git).' }

if (-not $nodeOk) {
  Write-Host "`nSin Node.js no se puede seguir. Log guardado en: $log" -ForegroundColor Red
  exit 1
}

# ------------------------------------------------------------------
Write-Section '3. Git'
if ($gitOk -and (Test-Path (Join-Path $root '.git'))) {
  Add-Result 'Repositorio' 'OK' 'Existe .git'
  $count = cmd /c 'git rev-list --count HEAD 2>nul'
  if ($LASTEXITCODE -eq 0) { Add-Result 'Commits' 'OK' "$count commit(s)" }
  else { Add-Result 'Commits' 'AVISO' 'El repositorio no tiene ningun commit todavia.' }
  $pending = @(cmd /c 'git status --porcelain 2>nul').Count
  if ($pending -gt 0) { Add-Result 'Cambios' 'AVISO' "$pending archivo(s) sin commit" }
  else { Add-Result 'Cambios' 'OK' 'Sin cambios pendientes' }
  $gname = cmd /c 'git config user.name 2>nul'
  $gmail = cmd /c 'git config user.email 2>nul'
  if ($gname -and $gmail) { Add-Result 'Identidad git' 'OK' "$gname <$gmail>" }
  else { Add-Result 'Identidad git' 'AVISO' 'Falta git config user.name / user.email (sin esto no se pueden hacer commits).' }
} elseif ($gitOk) {
  Add-Result 'Repositorio' 'AVISO' 'No hay repositorio git (falta git init).'
}

# ------------------------------------------------------------------
Write-Section '4. Dependencias'
if (Test-Path (Join-Path $root 'node_modules')) {
  Add-Result 'node_modules' 'OK' 'Instaladas'
  $ls = Invoke-Step 'npm ls' 'npm ls --depth=0'
  if ($ls.Code -eq 0) { Add-Result 'Arbol npm' 'OK' 'Sin dependencias faltantes ni invalidas' }
  else { Add-Result 'Arbol npm' 'FALLA' 'npm ls reporta problemas (ver log)'; Show-Tail $ls 15 }
} else {
  Add-Result 'node_modules' 'FALLA' 'No existe: falta correr npm install'
}

$cubingWanted = $pkg.dependencies.cubing
$cubingInstalled = Get-JsonVersion (Join-Path $root 'node_modules\cubing\package.json')
if ($cubingInstalled -and $cubingInstalled -eq $cubingWanted) { Add-Result 'cubing' 'OK' "instalada $cubingInstalled (fijada $cubingWanted)" }
elseif ($cubingInstalled) { Add-Result 'cubing' 'AVISO' "instalada $cubingInstalled, pero package.json pide $cubingWanted" }
else { Add-Result 'cubing' 'FALLA' 'cubing no esta instalada' }

$latest = Invoke-Step 'npm view cubing' 'npm view cubing version --fetch-retries=0 --fetch-timeout=5000'
if ($latest.Code -eq 0) {
  $lv = ($latest.Out | Select-Object -Last 1).ToString().Trim()
  if ($lv -eq $cubingWanted) { Add-Result 'cubing (npm)' 'OK' "La fijada es la ultima publicada ($lv)" }
  else { Add-Result 'cubing (npm)' 'AVISO' "Ultima publicada en npm: $lv | fijada: $cubingWanted" }
} else {
  Add-Result 'cubing (npm)' 'AVISO' 'No pude consultar npm (sin internet?)'
}

$pwVersion = Get-JsonVersion (Join-Path $root 'node_modules\@playwright\test\package.json')
if ($pwVersion) { Add-Result 'Playwright' 'OK' "@playwright/test $pwVersion" }
else { Add-Result 'Playwright' 'FALLA' '@playwright/test no esta instalado' }

# ------------------------------------------------------------------
Write-Section '5. Navegadores de Playwright'
$browser = $env:CUBELAB_E2E_BROWSER
if (-not $browser) { $browser = 'msedge' }
if ($browser -eq 'msedge') {
  $edgePaths = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe')
  )
  $edge = $edgePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if ($edge) { Add-Result 'Microsoft Edge' 'OK' $edge }
  else { Add-Result 'Microsoft Edge' 'FALLA' 'Falta el canal estable de Edge.' }
} elseif ($browser -eq 'chromium') {
  Add-Result 'Navegador' 'OK' 'Chromium seleccionado. La prueba e2e verifica su arranque.'
} else {
  Add-Result 'Navegador' 'FALLA' "CUBELAB_E2E_BROWSER desconocido: $browser"
}

Write-Section '6. Comprobaciones del proyecto'

$tsc = Invoke-Step 'TypeScript' 'node_modules\.bin\tsc --noEmit'
if ($tsc.Code -eq 0) { Add-Result 'TypeScript' 'OK' "sin errores ($($tsc.Secs) s)" }
else { Add-Result 'TypeScript' 'FALLA' 'errores de tipos'; Show-Tail $tsc }

$lint = Invoke-Step 'Lint' 'npm run lint'
if ($lint.Code -eq 0) { Add-Result 'Lint' 'OK' "sin errores ($($lint.Secs) s)" }
else { Add-Result 'Lint' 'FALLA' 'ESLint reporta errores'; Show-Tail $lint }

$flt = Invoke-Step 'Test del filtro' 'npm run test:filter'
if ($flt.Code -eq 0) { Add-Result 'Test filtro' 'OK' "paso ($($flt.Secs) s)" }
else { Add-Result 'Test filtro' 'FALLA' 'fallo'; Show-Tail $flt }

if ($Rapido) {
  Add-Result 'Tests unitarios' 'OMITIDO' 'modo -Rapido'
  Add-Result 'Build' 'OMITIDO' 'modo -Rapido'
} else {
  Write-Host '     (los tests unitarios generan miles de mezclas: pueden tardar varios minutos)' -ForegroundColor DarkGray
  $unit = Invoke-Step 'Tests unitarios' 'npm test'
  if ($unit.Code -eq 0) { Add-Result 'Tests unitarios' 'OK' "pasaron ($($unit.Secs) s)" }
  else { Add-Result 'Tests unitarios' 'FALLA' 'hay tests fallando'; Show-Tail $unit 30 }

  $build = Invoke-Step 'Build' 'npm run build'
  if ($build.Code -eq 0) {
    Add-Result 'Build' 'OK' "compilo ($($build.Secs) s)"
    foreach ($f in @('dist\index.html', 'dist\sw.js', 'dist\manifest.webmanifest')) {
      if (Test-Path (Join-Path $root $f)) { Add-Result 'PWA' 'OK' "existe $f" }
      else { Add-Result 'PWA' 'FALLA' "falta $f despues del build" }
    }
  } else { Add-Result 'Build' 'FALLA' 'el build fallo'; Show-Tail $build 30 }
}

if (-not $ConE2E) {
  Add-Result 'Tests e2e' 'OMITIDO' 'usa -ConE2E para incluirlos'
} elseif ($build.Code -ne 0) {
  Add-Result 'Tests e2e' 'FALLA' 'El build de producción falló.'
} else {
  $e2e = Invoke-Step 'Tests e2e' 'npm run test:e2e'
  if ($e2e.Code -eq 0) { Add-Result 'Tests e2e' 'OK' "pasaron ($($e2e.Secs) s)" }
  else { Add-Result 'Tests e2e' 'FALLA' 'fallaron'; Show-Tail $e2e 30 }
}

# ------------------------------------------------------------------
Write-Section 'Resumen'
$results | Format-Table -AutoSize -Wrap | Out-String -Width 200 | Write-Host
Write-Log ($results | Format-Table -AutoSize -Wrap | Out-String -Width 200)

$fallas = @($results | Where-Object { $_.Estado -eq 'FALLA' }).Count
$avisos = @($results | Where-Object { $_.Estado -eq 'AVISO' }).Count
$msg = "FALLAS: $fallas | AVISOS: $avisos"
if ($fallas -gt 0) { Write-Host $msg -ForegroundColor Red }
elseif ($avisos -gt 0) { Write-Host $msg -ForegroundColor Yellow }
else { Write-Host $msg -ForegroundColor Green }
Write-Log $msg
Write-Host ''
Write-Host "Log completo guardado en: $log" -ForegroundColor Cyan

if ($fallas -gt 0) { exit 1 }
exit 0
