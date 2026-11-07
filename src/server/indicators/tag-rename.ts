import {parseFormula,referencedTags} from "./formula";
import {buildDependencyGraph,isCalendarSourceTag,type DependencyRow,type IndicatorDefinition} from "./dependencies";

/** Renaming is a change of identifier spelling, not of the underlying indicator identity.
 * Preserve whitespace, role arguments and all pre-existing values and snapshots.
 */
export function renameFormulaTag(formula:string,from:string,to:string):string{
 if(from===to)return formula;
 // Quoted Agile role names must never be altered.
 return formula.replace(/"(?:[^"\\]|\\.)*"|[A-Z][A-Z0-9_]*/g,
  token=>token===from?to:token);
}
export function planIndicatorTagRename(
 definitions:readonly IndicatorDefinition[],dependencies:readonly DependencyRow[],
 indicatorId:string,nextTag:string
):ReadonlyArray<{id:string;formula:string}>{
 const selected=definitions.find(d=>d.id===indicatorId);
 if(!selected)throw Error("indicator-not-found");
 if(!/^[A-Z][A-Z0-9_]{0,79}$/.test(nextTag)||isCalendarSourceTag(nextTag)||definitions.some(d=>d.id!==indicatorId&&d.tag===nextTag))
  throw Error("indicator-tag-conflict");
 const rewritten=definitions.map(d=>({
  ...d,tag:d.id===indicatorId?nextTag:d.tag,
  formula:d.formula===null?null:renameFormulaTag(d.formula,selected.tag,nextTag)
 }));
 // Validate all formulas and existing FK-backed dependency edges before persisting.
 buildDependencyGraph(rewritten,dependencies);
 const changed=rewritten.filter((d,i)=>d.formula!==definitions[i].formula&&d.formula!==null);
 for(const d of changed){
  const old=definitions.find(x=>x.id===d.id)!;
  const oldRefs=referencedTags(parseFormula(old.formula!));
  const newRefs=referencedTags(parseFormula(d.formula!));
  if(JSON.stringify(oldRefs.map(tag=>tag===selected.tag?nextTag:tag).sort())!==JSON.stringify(newRefs))
   throw Error("indicator-tag-rewrite-invalid");
 }
 return changed.map(d=>({id:d.id,formula:d.formula!}));
}
