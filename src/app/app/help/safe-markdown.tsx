import {createElement,type ReactNode} from "react";

/** Restricted Markdown subset. HTML is text, and links are limited to approved local routes. */
function safeRoute(href:string):boolean{
 return href==="/app/help?article=overview"||
  /^\/app(?:\/[a-z0-9][a-z0-9/_-]*)?(?:#[a-z0-9_-]+)?$/i.test(href);
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
 let listType:"ol"|"ul"|null=null;
 let listStart=1;
 let paragraph:string[]=[];
 let quote:string[]=[];
 const flushParagraph=()=>{
  if(!paragraph.length)return;
  blocks.push(createElement("p",{key:"p"+blocks.length},...inline(paragraph.join(" "))));
  paragraph=[];
 };
 const flushQuote=()=>{
  if(!quote.length)return;
  blocks.push(createElement("blockquote",{key:"quote"+blocks.length},...inline(quote.join(" "))));
  quote=[];
 };
 const flushList=()=>{
  if(!listType||!list.length)return;
  blocks.push(createElement(listType,{key:"list"+blocks.length,...(listType==="ol"?{start:listStart}:{})},
   ...list.map((item,i)=>createElement("li",{key:i},...inline(item)))));
  list=[];listType=null;listStart=1;
 };
 for(const line of lines){
  if(!line.trim()){flushParagraph();flushList();flushQuote();continue;}
  const heading=/^(#{1,3})\s+(.+)$/.exec(line);
  if(heading){
   flushParagraph();flushList();flushQuote();
   const level=heading[1].length;
   blocks.push(createElement(("h"+level) as "h1"|"h2"|"h3",
    {key:"h"+blocks.length},...inline(heading[2])));
   continue;
  }
  const bullet=/^[-*]\s+(.+)$/.exec(line);
  const numbered=/^(\d{1,3})[.)]\s+(.+)$/.exec(line);
  if(bullet||numbered){
   flushParagraph();flushQuote();
   const type=numbered?"ol":"ul";
   if(listType!==type)flushList();
   if(!listType){listType=type;listStart=numbered?Number(numbered[1]):1;}
   list.push(numbered?numbered[2]:bullet![1]);
   continue;
  }
  const quoted=/^>\s?(.*)$/.exec(line);
  if(quoted){flushParagraph();flushList();quote.push(quoted[1]);continue;}
  flushList();flushQuote();paragraph.push(line.trim());
 }
 flushParagraph();flushList();flushQuote();
 return createElement("div",{className:"smn-help-prose"},...blocks);
}
