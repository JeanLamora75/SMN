import {createElement,Fragment,type ReactNode} from "react";

/** Restricted Markdown subset: headings, paragraphs, lists and safe inline marks.
 * Raw HTML is ALWAYS plain text. External and non-http(s) links are never created.
 */
function safeRoute(href:string):boolean{
 return /^\/app(?:\/[a-z0-9][a-z0-9/_-]*)?(?:#[a-z0-9_-]+)?$/i.test(href);
}
function inline(text:string):ReactNode[]{
 const nodes:ReactNode[]=[];
 const rx=/\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`/g;
 let last=0,match:RegExpExecArray|null,idx=0;
 while((match=rx.exec(text))!==null){
  if(match.index>last)nodes.push(text.slice(last,match.index));
  if(match[1]!==undefined){
   nodes.push(safeRoute(match[2])
    ?createElement("a",{key:idx++,href:match[2]},match[1])
    :match[1]);
  }else if(match[3]!==undefined)nodes.push(createElement("strong",{key:idx++},match[3]));
  else nodes.push(createElement("code",{key:idx++},match[4]));
  last=rx.lastIndex;
 }
 if(last<text.length)nodes.push(text.slice(last));
 return nodes;
}

export function SafeHelpMarkdown({markdown}:{markdown:string}){
 const lines=markdown.replace(/\r\n?/g,"\n").split("\n");
 const blocks:ReactNode[]=[];
 let list:string[]=[];
 let paragraph:string[]=[];
 let listKey=0;
 const flushParagraph=()=>{
  if(!paragraph.length)return;
  blocks.push(createElement("p",{key:"p"+blocks.length},...inline(paragraph.join(" "))));
  paragraph=[];
 };
 const flushList=()=>{
  if(!list.length)return;
  blocks.push(createElement("ul",{key:"ul"+listKey++},
   ...list.map((item,i)=>createElement("li",{key:i},...inline(item)))));
  list=[];
 };
 for(const line of lines){
  if(!line.trim()){flushParagraph();flushList();continue;}
  const heading=/^(#{1,3})\s+(.+)$/.exec(line);
  if(heading){
   flushParagraph();flushList();
   const level=heading[1].length;
   blocks.push(createElement(("h"+level) as "h1"|"h2"|"h3",
    {key:"h"+blocks.length},...inline(heading[2])));
   continue;
  }
  const bullet=/^[-*]\s+(.+)$/.exec(line);
  if(bullet){flushParagraph();list.push(bullet[1]);continue;}
  flushList();paragraph.push(line.trim());
 }
 flushParagraph();flushList();
 return createElement(Fragment,null,...blocks);
}
