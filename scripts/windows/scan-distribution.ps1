# Windows CI security gate. Fail closed: missing/inactive Defender is not a clean result.
param(
  [Parameter(Mandatory = $true)][ValidateSet("directory", "zip")][string]$Stage,
  [Parameter(Mandatory = $true)][string]$Target,
  [string]$ReportPath = "_package/smn-antivirus-report.json"
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function FailScan([string]$Reason) {
  Write-Error "SMN antivirus gate failed: $Reason"
  exit 1
}
if (-not (Test-Path -LiteralPath $Target)) { FailScan "target-absent" }
if (-not (Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue)) {
  FailScan "defender-cmdlets-unavailable"
}
try {
  $before = Get-MpComputerStatus -ErrorAction Stop
} catch { FailScan "defender-status-unavailable" }
Write-Host "SMN Defender serviceEnabled=$($before.AMServiceEnabled) antivirusEnabled=$($before.AntivirusEnabled) realtimeEnabled=$($before.RealTimeProtectionEnabled)"
# Real-time protection can be disabled on hosted CI while explicit on-demand scans work.
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
Write-Host "SMN security gate: Defender scan $Stage (no exclusions)"
& $exe[0] -Scan -ScanType 3 -File $resolvedTarget
$result = $LASTEXITCODE
if ($result -ne 0) { FailScan "defender-scan-$Stage-exit-$result" }
try {
  $after = Get-MpComputerStatus -ErrorAction Stop
  if (-not $after.AMServiceEnabled -or -not $after.AntivirusEnabled) {
    FailScan "defender-disabled-after-scan"
  }
  $detections = @(Get-MpThreatDetection -ErrorAction Stop |
    Where-Object { $_.InitialDetectionTime -and $_.InitialDetectionTime.ToUniversalTime() -ge [datetime]$startUtc })
  if ($detections.Count -gt 0) { FailScan "defender-threat-detected-$Stage" }
} catch { FailScan "defender-postscan-verification-failed" }
$record = [ordered]@{
  stage = $Stage
  outcome = "clean"
  scanExitCode = $result
  startedUtc = $startUtc
  completedUtc = (Get-Date).ToUniversalTime().ToString("o")
  engineVersion = [string]$after.AMEngineVersion
  signatureVersion = [string]$after.AntivirusSignatureVersion
  productVersion = [string]$after.AMProductVersion
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
Write-Host "SMN Defender $Stage scan passed; engine=$($record.engineVersion) signatures=$($record.signatureVersion)"
