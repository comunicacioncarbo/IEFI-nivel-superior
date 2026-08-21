# ============================================================
# IEFI 2026 · Extraer DATA desde script.js
# ============================================================

$ErrorActionPreference = "Stop"

$scriptFile = Join-Path $PSScriptRoot "script.js"
$dataDir    = Join-Path $PSScriptRoot "data"
$dataFile   = Join-Path $dataDir "data.js"

Write-Host ""
Write-Host "IEFI 2026 - Separacion de DATA" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan

# ------------------------------------------------------------
# 1. Verificar script.js
# ------------------------------------------------------------

if (-not (Test-Path $scriptFile)) {
    Write-Host "ERROR: No se encontro script.js" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------
# 2. Leer script.js
# ------------------------------------------------------------

$content = Get-Content `
    -Path $scriptFile `
    -Raw `
    -Encoding UTF8

# ------------------------------------------------------------
# 3. Encontrar el inicio de DATA
# ------------------------------------------------------------

$dataStart = $content.IndexOf("const DATA")

if ($dataStart -lt 0) {
    Write-Host "ERROR: No se encontro 'const DATA' en script.js" -ForegroundColor Red
    exit 1
}

Write-Host "DATA encontrada." -ForegroundColor Green

# ------------------------------------------------------------
# 4. Encontrar la apertura del objeto
# ------------------------------------------------------------

$openBrace = $content.IndexOf("{", $dataStart)

if ($openBrace -lt 0) {
    Write-Host "ERROR: No se encontro la apertura de DATA." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------
# 5. Encontrar el cierre correspondiente
#    teniendo en cuenta strings y estructuras anidadas
# ------------------------------------------------------------

$depth = 0
$inString = $false
$stringChar = ""
$escaped = $false
$dataEnd = -1

for ($i = $openBrace; $i -lt $content.Length; $i++) {

    $char = $content[$i]

    # Manejo de strings
    if ($inString) {

        if ($escaped) {
            $escaped = $false
            continue
        }

        if ($char -eq '\') {
            $escaped = $true
            continue
        }

        if ($char -eq $stringChar) {
            $inString = $false
        }

        continue
    }

    # Inicio de string
    if ($char -eq '"' -or $char -eq "'") {
        $inString = $true
        $stringChar = $char
        continue
    }

    # Apertura
    if ($char -eq "{") {
        $depth++
        continue
    }

    # Cierre
    if ($char -eq "}") {

        $depth--

        if ($depth -eq 0) {
            $dataEnd = $i
            break
        }
    }
}

if ($dataEnd -lt 0) {
    Write-Host "ERROR: No se pudo encontrar el cierre de DATA." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------
# 6. Extraer solamente DATA
# ------------------------------------------------------------

$dataObject = $content.Substring(
    $openBrace,
    ($dataEnd - $openBrace + 1)
)

# ------------------------------------------------------------
# 7. Cambiar PAY -> PEI
# ------------------------------------------------------------

$dataObject = $dataObject -replace '"PAY"\s*:', '"PEI":'

# ------------------------------------------------------------
# 8. Crear carpeta data
# ------------------------------------------------------------

if (-not (Test-Path $dataDir)) {

    New-Item `
        -ItemType Directory `
        -Path $dataDir `
        | Out-Null

    Write-Host "Carpeta data creada." -ForegroundColor Green
}

# ------------------------------------------------------------
# 9. Crear data.js
# ------------------------------------------------------------

$dataJs = @"
/* =========================================================
   IEFI 2026 · ENSA CARBÓ
   Datos del cronograma
   ========================================================= */

const DATA = $dataObject;
"@

Set-Content `
    -Path $dataFile `
    -Value $dataJs `
    -Encoding UTF8

Write-Host "data/data.js creado correctamente." -ForegroundColor Green

# ------------------------------------------------------------
# 10. Crear backup de script.js
# ------------------------------------------------------------

$backupFile = Join-Path `
    $PSScriptRoot `
    "script.js.backup"

Copy-Item `
    -Path $scriptFile `
    -Destination $backupFile `
    -Force

Write-Host "Backup creado: script.js.backup" -ForegroundColor DarkGray

# ------------------------------------------------------------
# 11. Eliminar DATA de script.js
# ------------------------------------------------------------

$beforeData = $content.Substring(
    0,
    $dataStart
)

$afterData = $content.Substring(
    $dataEnd + 1
)

$newScript = $beforeData + $afterData

Set-Content `
    -Path $scriptFile `
    -Value $newScript `
    -Encoding UTF8

Write-Host "DATA eliminada de script.js." -ForegroundColor Green

# ------------------------------------------------------------
# 12. Verificación
# ------------------------------------------------------------

$pepExists =
    $dataObject -match '"PEP"\s*:'

$peiExists =
    $dataObject -match '"PEI"\s*:'

$payExists =
    $dataObject -match '"PAY"\s*:'

Write-Host ""
Write-Host "Verificacion:" -ForegroundColor Cyan

if ($pepExists) {
    Write-Host "  [OK] PEP encontrado" -ForegroundColor Green
}
else {
    Write-Host "  [ERROR] PEP no encontrado" -ForegroundColor Red
}

if ($peiExists) {
    Write-Host "  [OK] PEI encontrado" -ForegroundColor Green
}
else {
    Write-Host "  [ERROR] PEI no encontrado" -ForegroundColor Red
}

if ($payExists) {
    Write-Host "  [ERROR] PAY todavia existe" -ForegroundColor Red
}
else {
    Write-Host "  [OK] PAY eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Proceso terminado." -ForegroundColor Cyan
Write-Host ""
Write-Host "Estructura resultante:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  script.js"
Write-Host "  data\"
Write-Host "      data.js"
Write-Host "  script.js.backup"
Write-Host ""