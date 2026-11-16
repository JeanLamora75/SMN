/** Insert a serialized Office tag at a textarea selection without dropping adjacent text. */
export function insertPromptTag(text:string,tag:string,start:number,end:number){
 if(!/^\{\{[^{}]{1,500}\}\}$/.test(tag))throw Error("invalid-brief-tag");
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||end>text.length)
  throw Error("invalid-brief-cursor");
 return {text:text.slice(0,start)+tag+text.slice(end),cursor:start+tag.length};
}
