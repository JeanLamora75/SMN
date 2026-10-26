#requires -Version 5.1
<#
 Recette SMN-281 : exécution volontaire par l'utilisateur sur Windows 11.
 Aucun GitHub Actions, aucune installation, aucune modification directe PostgreSQL.
 Relire et expurger les journaux locaux avant tout partage.
#>
param([switch]$SkipBuild)

$ErrorActionPreference = "Continue"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dir = Join-Path $projectRoot ("_bmad-output\qa-evidence\SMN-281\" + $stamp)
New-Item -ItemType Directory -Path $dir -Force | Out-Null

$node = Get-Command node -ErrorAction SilentlyContinue
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $node -or -not $pnpm) {
    Write-Host "ERREUR : Node.js et pnpm doivent être disponibles dans ce terminal." -ForegroundColor Red
    Write-Host "Aucune commande de test exécutée."
    exit 2
}
$nodeVersion = (& node --version | Out-String).Trim()
$pnpmVersion = (& pnpm --version | Out-String).Trim()
$info = @(
    "Story=SMN-281"
    "Date locale=$(Get-Date -Format o)"
    "Node=$nodeVersion"
    "pnpm=$pnpmVersion"
    "Branche attendue=feat/smn-281-country-regression-recipe"
    "Tests locaux Windows, jamais GitHub Actions"
)
$info | Out-File -LiteralPath (Join-Path $dir "versions.txt") -Encoding UTF8

$steps = @(
    @{ Name="i18n"; Args=@("i18n:check") }
    @{ Name="lint"; Args=@("lint") }
    @{ Name="typecheck"; Args=@("typecheck") }
    @{ Name="tests"; Args=@("test") }
)
if (-not $SkipBuild) {
    $steps += @{ Name="build"; Args=@("build") }
}

$results = @()
foreach ($step in $steps) {
    $name = $step.Name
    $log = Join-Path $dir ($name + ".log")
    Write-Host ("Execution : pnpm " + ($step.Args -join " ")) -ForegroundColor Cyan
    $started = Get-Date
    $exitCode = 900
    try {
        & $pnpm.Source @($step.Args) 2>&1 | Out-File -LiteralPath $log -Encoding UTF8
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 901 }
    }
    catch {
        ("Erreur de lancement : " + $_.Exception.Message) | Out-File -LiteralPath $log -Append -Encoding UTF8
        $exitCode = 902
    }
    $duration = [math]::Round(((Get-Date) - $started).TotalSeconds, 1)
    $state = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
    $results += [pscustomobject]@{
        Commande = "pnpm " + ($step.Args -join " ")
        Resultat = $state
        CodeSortie = [int]$exitCode
        DureeSecondes = $duration
        Journal = $name + ".log"
    }
    $color = if ($exitCode -eq 0) { "Green" } else { "Red" }
    Write-Host "$name : $state (code $exitCode)" -ForegroundColor $color
}
if ($SkipBuild) {
    $results += [pscustomobject]@{
        Commande="pnpm build"; Resultat="NON_EXECUTE"; CodeSortie=$null
        DureeSecondes=$null; Journal=$null
    }
}
$results | Export-Csv -LiteralPath (Join-Path $dir "resultats.csv") -Delimiter ";" -NoTypeInformation -Encoding UTF8
$results | ConvertTo-Json -Depth 3 | Out-File -LiteralPath (Join-Path $dir "resultats.json") -Encoding UTF8
$results | Format-Table -AutoSize | Out-String | Write-Host
Write-Host ("Journaux : " + $dir)
Write-Host "Compléter ensuite le procès-verbal SMN-281 avec les scénarios manuels et preuves."
Write-Host "Relire les fichiers journaux avant partage (chemins, informations sensibles)."
if (@($results | Where-Object { $_.Resultat -eq "FAIL" }).Count -gt 0) { exit 1 }
exit 0
