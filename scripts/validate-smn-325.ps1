param(
 [string]$OutputDirectory = "artifacts/smn-325",
 [switch]$IncludeBuild
)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$results = @()
function Invoke-Check([string]$Name,[string[]]$Arguments) {
  $started = Get-Date
  $outputFile = Join-Path $OutputDirectory ($Name + ".log")
  Write-Host ("SMN-325 : " + $Name)
  try { & pnpm @Arguments *> $outputFile; $code = $LASTEXITCODE }
  catch { $_ | Out-String | Add-Content $outputFile; $code = 1 }
  return [pscustomobject]@{
    check=$Name; status=$(if($code -eq 0){"PASS"}else{"FAIL"})
    exitCode=$code; startedAt=$started.ToString("o")
    finishedAt=(Get-Date).ToString("o"); log=$outputFile
  }
}
$checks = @(
  @{name="company-schema-migration"; args=@("exec","tsx","--test","tests/company-schema-migration.test.ts")},
  @{name="company-catalog"; args=@("exec","tsx","--test","tests/company-catalog.test.ts")},
  @{name="member-company"; args=@("exec","tsx","--test","tests/member-company.test.ts")},
  @{name="member-company-ui"; args=@("exec","tsx","--test","tests/member-company-ui-contract.test.ts")},
  @{name="smn-315-v31-audit"; args=@("exec","tsx","--test","tests/smn-315-v31-audit.test.ts")},
  @{name="company-closures"; args=@("exec","tsx","--test","tests/company-closures-v31.test.ts")},
  @{name="company-capacity"; args=@("exec","tsx","--test","tests/company-capacity.test.ts")},
  @{name="company-recalculation"; args=@("exec","tsx","--test","tests/company-capacity-outbox.test.ts")},
  @{name="capacity-synchronization"; args=@("exec","tsx","--test","tests/capacity-synchronization.test.ts")},
  @{name="calendar-company-closures"; args=@("exec","tsx","--test","tests/calendar-company-closures.test.ts")},
  @{name="capacity-regression"; args=@("exec","tsx","--test","tests/development-capacity.test.ts")},
  @{name="lint"; args=@("lint")},
  @{name="typecheck"; args=@("exec","tsc","--noEmit")},
  @{name="db-diagnostic"; args=@("db:diagnose")}
)
if ($IncludeBuild) { $checks += @{name="build"; args=@("build")} }
foreach($check in $checks){
  $results += Invoke-Check $check.name $check.args
}
$stamp=Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
$summary=[ordered]@{
  story="SMN-325"; executedAt=$stamp; computer=$env:COMPUTERNAME
  status=$(if(@($results|Where-Object status -eq "FAIL").Count -eq 0){"PASS"}else{"FAIL"})
  checks=$results
  visualRecipe="NOT_RUN"; migrationV31="NOT_APPLIED_BY_SCRIPT"
}
$summary | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $OutputDirectory "results.json") -Encoding utf8
$results | Format-Table check,status,exitCode,log -AutoSize
if($summary.status -eq "FAIL"){exit 1}
