import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
export const SMN338_V33_NAME="20261101_smn338_indicator_v33";
export const SMN338_V33_FILE=()=>{
 const packaged=resolve(process.cwd(),"app","prisma","migrations","20261101_smn338_indicator_v33","migration.sql");
 const canonical=resolve(process.cwd(),"prisma","migrations","20261101_smn338_indicator_v33","migration.sql");
 const legacy=resolve(process.cwd(),"_bmad-output","planning-artifacts","SMN-338-DDL-ADDITIF-DRAFT.sql");
 return existsSync(packaged)?packaged:existsSync(canonical)?canonical:legacy;
};
export const INDICATOR_TABLES=["definition","team_selection","display_preference","manual_value","computed_result","dependency","cycle_revision","system_revision"].map(x=>"smn_indicator_"+x);
export const indicatorV33Sql=()=>readFileSync(SMN338_V33_FILE(),"utf8");
