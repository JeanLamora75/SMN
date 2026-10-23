/** Pure shared Sprint indicator contract: null means NOT recorded, never zero. */
export type SprintPoints=Readonly<{initial:number|null;added:number|null;removed:number|null;done:number|null}>;
export type SprintTickets=Readonly<{initial:number|null;done:number|null}>;
export type SprintScores=Readonly<{confidence:number|null;clarity:number|null}>;
export const emptyPoints:SprintPoints={initial:null,added:null,removed:null,done:null};
export const emptyTickets:SprintTickets={initial:null,done:null};
export const emptyScores:SprintScores={confidence:null,clarity:null};
export function deriveStoryPoints(values:SprintPoints){
 const final=values.initial!==null&&values.added!==null&&values.removed!==null?
  values.initial+values.added-values.removed:null;
 const remaining=final!==null&&values.done!==null?final-values.done:null;
 const rate=final!==null&&final>0&&values.done!==null?
  values.done/final*100:null;
 return {final,remaining,rate,
  overrun:final!==null&&final>0&&values.done!==null&&values.done>final};
}
export function deriveSprintIndicators(points:SprintPoints,tickets:SprintTickets){
 const derived=deriveStoryPoints(points);
 const ticketRate=tickets.initial!==null&&tickets.initial>0&&tickets.done!==null?
  tickets.done/tickets.initial*100:null;
 return {...derived,ticketRate};
}
export type IndicatorDraftResult={ok:true;value:number|null}|{ok:false;error:"invalid"};
export function parseIndicatorDraft(input:string,kind:"count"|"score"):IndicatorDraftResult{
 if(input==="")return {ok:true,value:null};
 // Reject scientific notation, decimals, negatives, whitespace and invalid numbers.
 if(!/^\d+$/.test(input))return {ok:false,error:"invalid"};
 const value=Number(input);
 if(!Number.isSafeInteger(value))return {ok:false,error:"invalid"};
 if(kind==="score"&&value>=1&&value<=5)return {ok:true,value};
 if(kind==="count"&&value>=0&&value<=1000000000)return {ok:true,value};
 return {ok:false,error:"invalid"};
}
