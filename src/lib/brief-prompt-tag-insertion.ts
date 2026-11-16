import {PROMPT_TEXT_LIMIT} from "./ai-brief-prompt-model";

export type TextSelection={start:number;end:number};
export type InsertedText={text:string;caret:number};
export function insertBriefTagAtSelection(
 source:string,tag:string,selection:TextSelection,maxLength=PROMPT_TEXT_LIMIT
):InsertedText|null{
 if(!/^\{\{[A-Z][A-Z0-9_]*(?::[A-Z][A-Z0-9_]*(?:\|SORT=[A-Z0-9_:,]+)?)?\}\}$/.test(tag))return null;
 const start=Math.min(source.length,Math.max(0,Math.trunc(selection.start)));
 const end=Math.min(source.length,Math.max(start,Math.trunc(selection.end)));
 const next=source.slice(0,start)+tag+source.slice(end);
 if(next.length>maxLength)return null;
 return {text:next,caret:start+tag.length};
}
