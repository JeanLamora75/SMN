import {existsSync} from "node:fs";
import path from "node:path";

/** Standalone Windows runs from the installation root; source builds use project root. */
export function helpResourcesRoot(cwd:string=process.cwd()):string{
 const packaged=path.join(cwd,"app","content","help");
 return existsSync(path.join(packaged,".index"))?packaged:path.join(cwd,"content","help");
}
