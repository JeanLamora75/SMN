import {spawnSync} from "node:child_process";
import {mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";

export const SCHEMA_TARGET = 33;
export const PROFILES = Object.freeze({
  "smn-348": ["test:smn-348","db:test:smn-348","i18n:check","typecheck","lint"],
  "smn-349": ["test:smn-349","db:test:smn-349","i18n:check","typecheck","lint"],
  "smn-350": ["test:smn-350","db:test:smn-350","i18n:check","typecheck","lint"],
  "smn-351": ["test:smn-351","typecheck","lint"],
  "quality": ["i18n:check","typecheck","lint"],
  "migration-v33": ["test:db:smn-338:v33:contracts","db:test:smn-338:upgrade","db:test:smn-338:v33","db:test:smn-338:native"],
});
export const PG_PROFILES = new Set(["smn-348","smn-349","smn-350","migration-v33"]);
export function plan(profile, env = process.env) {
  if (!Object.hasOwn(PROFILES,profile)) throw Error("Profil inconnu : "+profile);
  if (PG_PROFILES.has(profile) && !(env.SMN_TEST_DATABASE_URL || env.SMN_DATABASE_URL)) {
    throw Error("Profil PostgreSQL : SMN_TEST_DATABASE_URL ou SMN_DATABASE_URL requis");
  }
  return PROFILES[profile];
}
export function run(profile, options={}) {
  const env=options.env??process.env;
  const steps=plan(profile,env);
  const result={profile,schemaTarget:SCHEMA_TARGET,platform:process.platform,commit:env.GITHUB_SHA??null,steps:[],success:false};
  const command=process.platform==="win32"?"pnpm.cmd":"pnpm";
  try {
    for (const script of steps) {
      const started=Date.now();
      const execution=spawnSync(command,[script],{stdio:"inherit",env,shell:process.platform==="win32"});
      const entry={script,exitCode:execution.status??1,durationMs:Date.now()-started};
      result.steps.push(entry);
      if (execution.error) throw execution.error;
      if (entry.exitCode!==0) throw Error(script+" : échec (code "+entry.exitCode+")");
    }
    result.success=true;
  } finally {
    const output=env.SMN_VALIDATION_REPORT_DIR??"audit-output";
    mkdirSync(output,{recursive:true});
    const report=join(output,"version-validation-"+profile+".json");
    writeFileSync(report,JSON.stringify(result,null,2)+"\n");
    console.log("Rapport : "+report);
  }
  return result;
}
if (process.argv[1] && import.meta.url === new URL("file://"+process.argv[1].replaceAll("\\","/")).href) {
  try {
    const args=process.argv.slice(2);
    if(args.length!==2||args[0]!=="--profile") throw Error("Usage : node scripts/validate-version.mjs --profile <profil>");
    run(args[1]);
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
