# Security gate for the Windows initial distribution. Never accept a skipped scan.
param(
  [Parameter(Mandatory = $true)][ValidateSet("directory", "zip")][string]$Stage,
  [Parameter(Mandatory = $true)][string]$Target,
  [string]$ReportPath = "_package/smn-antivirus-report.json"
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function FailScan([string]$Reason) {
  throw "SMN antivirus gate failed: $Reason"
}

function ScanFiles([string]$Path, [string]$Label, [string]$Scanner) {
  Write-Host "SMN Defender scan: $Label"
  $lines = @(& $Scanner -Scan -ScanType 3 -File $Path 2>&1 | ForEach-Object { [string]$_ })
  $exitCode = $LASTEXITCODE
  $lines | ForEach-Object { Write-Host $_ }
  if ($exitCode -ne 0) { FailScan "defender-$Label-exit-$exitCode" }
  # MpCmdRun can return exit code zero on very large ZIPs it deliberately skips.
  if (@($lines | Where-Object { $_ -match '(?i)\bwas skipped\b|\bscan skipped\b' }).Count -gt 0) {
    FailScan "defender-$Label-scan-skipped"
  }
  if (@($lines | Where-Object { $_ -match '(?i)\bfound no threats\b' }).Count -lt 1) {
    FailScan "defender-$Label-no-clean-verdict"
  }
}

if (-not (Test-Path -LiteralPath $Target)) { FailScan "target-absent" }
if (-not (Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue)) {
  FailScan "defender-cmdlets-unavailable"
}
$before = Get-MpComputerStatus -ErrorAction Stop
Write-Host "SMN Defender serviceEnabled=$($before.AMServiceEnabled) antivirusEnabled=$($before.AntivirusEnabled) realtimeEnabled=$($before.RealTimeProtectionEnabled)"
# On-demand Defender works on hosted Windows runners even without real-time protection.
if (-not $before.AMServiceEnabled -or -not $before.AntivirusEnabled) {
  FailScan "defender-engine-disabled"
}
if ([string]::IsNullOrWhiteSpace([string]$before.AntivirusSignatureVersion) -or
    [string]::IsNullOrWhiteSpace([string]$before.AMEngineVersion)) {
  FailScan "defender-engine-or-signatures-unknown"
}
$platformRoot = Join-Path $env:ProgramData "Microsoft/Windows Defender/Platform"
$candidates = @()
if (Test-Path -LiteralPath $platformRoot) {
  $candidates += @(Get-ChildItem -LiteralPath $platformRoot -Directory -ErrorAction Stop |
    Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName "MpCmdRun.exe" })
}
$candidates += (Join-Path $env:ProgramFiles "Windows Defender/MpCmdRun.exe")
$exe = @($candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
if ($exe.Count -ne 1) { FailScan "defender-cli-unavailable" }
$resolvedTarget = (Resolve-Path -LiteralPath $Target).ProviderPath
$startUtc = (Get-Date).ToUniversalTime().ToString("o")
$temporary = $null
$technique = "directory-on-demand"
try {
  if ($Stage -eq "zip") {
    # Defender may return success while skipping a 400+ MB compressed ZIP.
    # Scan actual delivered contents instead, including nested PostgreSQL binaries.
    $temporary = Join-Path $env:RUNNER_TEMP ("smnav-" + [guid]::NewGuid().ToString("N").Substring(0, 10))
    New-Item -ItemType Directory -Path $temporary -Force | Out-Null
    & tar.exe -xf $resolvedTarget -C $temporary
    if ($LASTEXITCODE -ne 0) { FailScan "zip-unpack-failed" }
    $tree = Join-Path $temporary "SMN-Windows"
    $node = Join-Path $tree "runtime/node/node.exe"
    $pgZip = Join-Path $tree "runtime/postgres/postgres.zip"
    if (-not (Test-Path -LiteralPath $node -PathType Leaf) -or
        -not (Test-Path -LiteralPath $pgZip -PathType Leaf)) {
      FailScan "zip-unpacked-layout-invalid"
    }
    $pgFiles = Join-Path $temporary "postgres-unpacked"
    New-Item -ItemType Directory -Path $pgFiles -Force | Out-Null
    & tar.exe -xf $pgZip -C $pgFiles
    if ($LASTEXITCODE -ne 0) { FailScan "nested-postgres-unpack-failed" }
    if (-not (Test-Path -LiteralPath (Join-Path $pgFiles "pgsql/bin/initdb.exe") -PathType Leaf)) {
      FailScan "postgres-binaries-missing"
    }
    ScanFiles $tree "delivered-files" $exe[0]
    ScanFiles $pgFiles "postgres-binaries" $exe[0]
    $technique = "unpacked-zip-and-nested-postgres"
  } else {
    ScanFiles $resolvedTarget "distribution-tree" $exe[0]
  }
  $after = Get-MpComputerStatus -ErrorAction Stop
  if (-not $after.AMServiceEnabled -or -not $after.AntivirusEnabled) {
    FailScan "defender-disabled-after-scan"
  }
  $detections = @(Get-MpThreatDetection -ErrorAction Stop |
    Where-Object { $_.InitialDetectionTime -and $_.InitialDetectionTime.ToUniversalTime() -ge [datetime]$startUtc })
  if ($detections.Count -gt 0) { FailScan "defender-threat-detected-$Stage" }
  $record = [ordered]@{
    stage = $Stage
    outcome = "clean"
    technique = $technique
    startedUtc = $startUtc
    completedUtc = (Get-Date).ToUniversalTime().ToString("o")
    engineVersion = [string]$after.AMEngineVersion
    signatureVersion = [string]$after.AntivirusSignatureVersion
    githubRunId = [string]$env:GITHUB_RUN_ID
    gitCommit = [string]$env:GITHUB_SHA
  }
  $report = @()
  if (Test-Path -LiteralPath $ReportPath) {
    $report = @(Get-Content -LiteralPath $ReportPath -Raw | ConvertFrom-Json)
  }
  $report += [pscustomobject]$record
  $parent = Split-Path -Parent $ReportPath
  if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
  ConvertTo-Json -InputObject @($report) -Depth 6 | Set-Content -LiteralPath $ReportPath -Encoding utf8
  Write-Host "SMN Defender $Stage scan passed: $technique; engine=$($record.engineVersion); signatures=$($record.signatureVersion)"
} finally {
  if ($temporary -and (Test-Path -LiteralPath $temporary)) {
    Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
  }
}
