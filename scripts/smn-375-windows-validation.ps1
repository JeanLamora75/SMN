param(
 [switch]$IncludeDatabase,
 [switch]$IncludeFullSuite
)
$ErrorActionPreference = 'Stop'
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$folder=Join-Path (Get-Location) "_bmad-output/implementation-artifacts/smn-375-evidence/$stamp"
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$results=@()
function Run-Check([string]$name,[string]$command) {
 $log=Join-Path $folder "$name.log"
 Write-Host "SMN-375: $name"
 $started=Get-Date
 cmd /c $command 2>&1 | Out-File -FilePath $log -Encoding utf8
 $exit=$LASTEXITCODE
 $results+=@{name=$name;command=$command;exitCode=$exit;started=$started.ToString('o');ended=(Get-Date).ToString('o');log="$name.log"}
 if($exit -ne 0){Write-Warning "$name failed ($exit). Check $log"}
}
Run-Check 'typecheck' 'pnpm typecheck'
Run-Check 'lint' 'pnpm lint'
Run-Check 'i18n' 'pnpm i18n:check'
Run-Check 'smn375' 'pnpm test:smn-375'
Run-Check 'builder-contracts' 'pnpm test:dashboard-builder'
if($IncludeDatabase) {
 Run-Check 'schema-diagnostic' 'pnpm db:diagnose:full'
 Run-Check 'indicator-v33' 'pnpm test:smn-351'
}
if($IncludeFullSuite){Run-Check 'full-suite' 'pnpm test'}
$report=@{story='SMN-375';platform=[System.Environment]::OSVersion.VersionString;node=(node --version);
 pnpm=(pnpm --version);gitCommit=(git rev-parse HEAD);date=(Get-Date).ToString('o');
 checks=$results;manualRX='NOT_EXECUTED';userAcceptance='PENDING'}
$report | ConvertTo-Json -Depth 10 | Out-File (Join-Path $folder 'manifest.json') -Encoding utf8
Write-Host "Logs and manifest: $folder"
if(@($results | Where-Object {$_.exitCode -ne 0}).Count -gt 0){exit 1}
