import path from "node:path";
import {helpResourcesRoot} from "./help-path";
import {readdir} from "node:fs/promises";

/**
 * Lists filenames only; article bodies are read on demand by help-content.
 * Unknown directories or missing translated files are not assumed to exist.
 */
export async function availableHelpArticleIds(
 locale:string,
 root:string=helpResourcesRoot()
):Promise<ReadonlySet<string>>{
 if(!/^[a-z]{2,3}(?:-[a-z]{2})?$/.test(locale))return new Set();
 const list=async(lang:string):Promise<string[]>=>readdir(path.join(root,lang)).catch(()=>[]);
 const [localized,french]=await Promise.all([list(locale),locale==="fr"?Promise.resolve([]):list("fr")]);
 return new Set([...localized,...french].filter(file=>/^[a-z][a-z0-9-]*\.md$/.test(file)).map(file=>file.slice(0,-3)));
}
