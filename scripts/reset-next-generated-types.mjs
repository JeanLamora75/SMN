import {rm} from "node:fs/promises";
import {join} from "node:path";

// Next.js may retain route validators for pages deleted or moved between
// revisions (e.g. src/app/welcome/page.tsx). Never delete application files,
// user data, or the full .next build cache during a routine typecheck.
const root=process.cwd();
for(const generated of [".next/types",".next/dev/types"]){
 await rm(join(root,...generated.split("/")),{recursive:true,force:true});
}
