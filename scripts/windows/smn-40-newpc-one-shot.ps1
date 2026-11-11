# SMN-40 - one-shot Windows PG18 isolated reconstruction; never touches live/REC-04.
param([string]$Archive='39b6262d-5f27-4bf8-a005-701dfd9cd9a2')
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$port=57189
$root=Join-Path $env:LOCALAPPDATA 'SMN40-NewPC-Isolated-03'
$cluster=Join-Path $root 'cluster'
$passFile=Join-Path $root 'initdb-password.tmp'
$owner='smn40_newpc_owner'
$random=[System.Security.Cryptography.RandomNumberGenerator]::Create()
function New-Hex([int]$n) {
 $bytes=New-Object byte[] $n
 $random.GetBytes($bytes)
 try{return ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()}
 finally{[Array]::Clear($bytes,0,$bytes.Length)}
}
function Invoke-Pg([string]$exe,[string[]]$pgArgs){
 & $exe @pgArgs
 if($LASTEXITCODE -ne 0){throw ('Commande PostgreSQL echouee : '+[IO.Path]::GetFileName($exe))}
}
function Find-PgBin {
 $bases=@(
  (Join-Path (Get-Location).Path 'data\postgres'),
  (Join-Path (Get-Location).Path 'runtime\postgres'),
  (Join-Path (Get-Location).Path 'postgres'),
  (Join-Path $env:LOCALAPPDATA 'ScrumMasterNotebook'),
  'C:\smn_restore_test_pg18_rec04'
 )|Select-Object -Unique
 foreach($base in $bases){
  if(-not (Test-Path -LiteralPath $base -PathType Container)){continue}
  foreach($sub in @('pgsql\bin','bin','data\postgres\pgsql\bin','runtime\postgres\pgsql\bin','pgsql\pgsql\bin')){
   $dir=Join-Path $base $sub
   if((Test-Path (Join-Path $dir 'initdb.exe')) -and
    (Test-Path (Join-Path $dir 'pg_ctl.exe')) -and
    (Test-Path (Join-Path $dir 'createdb.exe')) -and
    (Test-Path (Join-Path $dir 'pg_restore.exe')) -and
    (Test-Path (Join-Path $dir 'postgres.exe'))){return $dir}
  }
 }
 throw 'PostgreSQL 18 portable non localise. Aucune modification effectuee.'
}
try {
 if($Archive -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'){throw 'Archive invalide'}
 if(Test-Path -LiteralPath $root){throw 'Cible deja existante : refus de reutilisation'}
 if(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue){throw 'Port 57189 deja utilise'}
 $bin=Find-PgBin
 $version=(& (Join-Path $bin 'postgres.exe') --version)
 if($LASTEXITCODE -ne 0 -or $version -notmatch 'PostgreSQL\)\s+18\.'){throw 'Version PostgreSQL 18 non confirmee'}
 New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null
 $password=New-Hex 32
 $database='smn_restore_test_newpc_'+(New-Hex 4)
 # The restore engine uses Node.js os.tmpdir(), NOT .NET GetTempPath().
 # Compute the exact absolute staging path in Node and verify the same strict
 # invariants BEFORE creating the PostgreSQL cluster (never relax the guard).
 $stageName='smn_restore_test_files_'+(New-Hex 6)
 $stageJs='const o=require("node:os"),p=require("node:path");const n=process.argv[1];const t=p.resolve(o.tmpdir());const s=p.resolve(t,n);const rel=p.relative(t,s);if(!/^smn_restore_test_files_[a-z0-9]{6,40}$/.test(p.basename(s))||rel!==n||!p.isAbsolute(s)){process.exit(2)}process.stdout.write(s)'
 $stage=(& node -e $stageJs $stageName)
 if($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($stage)){throw 'Repertoire temporaire Node non confirme'}
 if(Test-Path -LiteralPath $stage){throw 'Repertoire de staging deja present'}
 [IO.File]::WriteAllText($passFile,$password+[Environment]::NewLine,[Text.Encoding]::ASCII)
 Invoke-Pg (Join-Path $bin 'initdb.exe') @('-D',$cluster,'-U',$owner,'-A','scram-sha-256','--pwfile',$passFile,'--encoding','UTF8','--no-instructions')
 Remove-Item -LiteralPath $passFile -Force
 Invoke-Pg (Join-Path $bin 'pg_ctl.exe') @('-D',$cluster,'-o',('-h 127.0.0.1 -p '+$port),'-l',(Join-Path $root 'postgres.log'),'-w','start')
 $env:PGPASSWORD=$password
 Invoke-Pg (Join-Path $bin 'createdb.exe') @('-h','127.0.0.1','-p',"$port",'-U',$owner,$database)
 $env:SMN40_NEWPC_SANDBOX_URL='postgresql://'+$owner+':'+$password+'@127.0.0.1:'+$port+'/'+$database
 $env:SMN40_NEWPC_STAGING_DIR=$stage
 $env:SMN_PG_RESTORE_PATH=Join-Path $bin 'pg_restore.exe'
 Write-Host 'Instance PG18 isolee creee. Verification de la cible...'
 & pnpm exec tsx scripts/smn-40-newpc-reconstruct.ts --archive $Archive --check
 if($LASTEXITCODE -ne 0){throw 'Precontrole refuse : reconstruction non lancee'}
 Write-Host 'Reconstruction dans la base isolee uniquement...'
 & pnpm exec tsx scripts/smn-40-newpc-reconstruct.ts --archive $Archive --reconstruct --confirm=RECONSTRUCT_EMPTY_NEWPC_SANDBOX_ONLY
 if($LASTEXITCODE -ne 0){throw 'Reconstruction isolee non qualifiee'}
 Write-Host 'SMN-40 : candidat reconstruit. Restauration active toujours interdite.'
}
catch {
 Write-Error ('SMN-40 interrompu : '+$_.Exception.Message)
 exit 2
}
finally {
 if(Test-Path -LiteralPath $passFile){Remove-Item -LiteralPath $passFile -Force -ErrorAction SilentlyContinue}
 foreach($name in @('PGPASSWORD','SMN40_NEWPC_SANDBOX_URL','SMN40_NEWPC_STAGING_DIR','SMN_PG_RESTORE_PATH')){
  [Environment]::SetEnvironmentVariable($name,$null,'Process')
 }
 $password=$null
 $random.Dispose()
}
