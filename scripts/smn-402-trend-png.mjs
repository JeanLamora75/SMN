import {deflateSync} from "node:zlib";

// SMN-402: dependency-free PNG renderer for Office exports. No chart calculations:
// callers provide values from the v33 reporting projection.
const W=960,H=560;
const COLORS=[[27,80,141],[180,86,56],[21,152,149],[121,85,167],[188,140,33],[66,109,164]];
const GLYPHS={
 A:["01110","10001","10001","11111","10001","10001","10001"],
 B:["11110","10001","10001","11110","10001","10001","11110"],
 C:["01111","10000","10000","10000","10000","10000","01111"],
 D:["11110","10001","10001","10001","10001","10001","11110"],
 E:["11111","10000","10000","11110","10000","10000","11111"],
 F:["11111","10000","10000","11110","10000","10000","10000"],
 G:["01111","10000","10000","10111","10001","10001","01111"],
 H:["10001","10001","10001","11111","10001","10001","10001"],
 I:["11111","00100","00100","00100","00100","00100","11111"],
 J:["00111","00010","00010","00010","10010","10010","01100"],
 K:["10001","10010","10100","11000","10100","10010","10001"],
 L:["10000","10000","10000","10000","10000","10000","11111"],
 M:["10001","11011","10101","10101","10001","10001","10001"],
 N:["10001","11001","10101","10011","10001","10001","10001"],
 O:["01110","10001","10001","10001","10001","10001","01110"],
 P:["11110","10001","10001","11110","10000","10000","10000"],
 Q:["01110","10001","10001","10001","10101","10010","01101"],
 R:["11110","10001","10001","11110","10100","10010","10001"],
 S:["01111","10000","10000","01110","00001","00001","11110"],
 T:["11111","00100","00100","00100","00100","00100","00100"],
 U:["10001","10001","10001","10001","10001","10001","01110"],
 V:["10001","10001","10001","10001","10001","01010","00100"],
 W:["10001","10001","10001","10101","10101","10101","01010"],
 X:["10001","10001","01010","00100","01010","10001","10001"],
 Y:["10001","10001","01010","00100","00100","00100","00100"],
 Z:["11111","00001","00010","00100","01000","10000","11111"],
 "0":["01110","10011","10101","10101","11001","10001","01110"],
 "1":["00100","01100","00100","00100","00100","00100","01110"],
 "2":["01110","10001","00001","00010","00100","01000","11111"],
 "3":["11110","00001","00001","01110","00001","00001","11110"],
 "4":["00010","00110","01010","10010","11111","00010","00010"],
 "5":["11111","10000","10000","11110","00001","00001","11110"],
 "6":["01110","10000","10000","11110","10001","10001","01110"],
 "7":["11111","00001","00010","00100","01000","01000","01000"],
 "8":["01110","10001","10001","01110","10001","10001","01110"],
 "9":["01110","10001","10001","01111","00001","00001","01110"],
 "-":["00000","00000","00000","11111","00000","00000","00000"],
 ".":["00000","00000","00000","00000","00000","00110","00110"],
 ",":["00000","00000","00000","00000","00110","00100","01000"],
 ":":["00000","00110","00110","00000","00110","00110","00000"],
 "/":["00001","00001","00010","00100","01000","10000","10000"],
 "%":["11001","11001","00010","00100","01000","10011","10011"],
 "_":["00000","00000","00000","00000","00000","00000","11111"],
 " ":["00000","00000","00000","00000","00000","00000","00000"],
 "(" :["00010","00100","01000","01000","01000","00100","00010"],
 ")" :["01000","00100","00010","00010","00010","00100","01000"],
 "=":["00000","11111","00000","11111","00000","00000","00000"]
};
const crcTable=Array.from({length:256},(_,n)=>{
 let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(name,data){
 const n=Buffer.from(name),len=Buffer.alloc(4),sum=Buffer.alloc(4);
 len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([n,data])));
 return Buffer.concat([len,n,data,sum]);
}
function rasterPng(rgb,width,height) {
 const raw=Buffer.alloc(height*(1+width*3));
 for(let y=0;y<height;y++){raw[y*(1+width*3)]=0;rgb.copy(raw,y*(1+width*3)+1,y*width*3,(y+1)*width*3);}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw)),chunk("IEND",Buffer.alloc(0))]);
}
function normalized(value){return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^\w \-.,:%/()=]/g," ").slice(0,110);}
export function renderOfficeTrendPng({cycles,series,type="line",language="fr"}){
 if(!["line","bar","area"].includes(type))throw Error("office-chart-invalid-style");
 if(!Array.isArray(cycles)||cycles.length===0||cycles.length>24||!Array.isArray(series)||series.length<1||series.length>6)
  throw Error("office-chart-invalid-series");
 if(series.some(s=>!Array.isArray(s.values)||s.values.length!==cycles.length||
  s.values.some(v=>v!==null&&(!Number.isFinite(v)||Math.abs(v)>1e10))))
  throw Error("office-chart-invalid-values");
 if(!series.some(s=>s.values.some(v=>v!==null)))return null;
 const rgb=Buffer.alloc(W*H*3,255);
 function pixel(x,y,c){
  x=Math.round(x);y=Math.round(y);
  if(x<0||y<0||x>=W||y>=H)return;
  const off=(y*W+x)*3;rgb[off]=c[0];rgb[off+1]=c[1];rgb[off+2]=c[2];
 }
 function rect(x,y,w,h,c){for(let j=Math.max(0,Math.floor(y));j<Math.min(H,Math.ceil(y+h));j++)for(let i=Math.max(0,Math.floor(x));i<Math.min(W,Math.ceil(x+w));i++)pixel(i,j,c);}
 function line(x0,y0,x1,y1,c,thickness=2){
  const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*1.4);
  for(let i=0;i<=n;i++){const p=n?i/n:0,x=x0+(x1-x0)*p,y=y0+(y1-y0)*p;rect(x-thickness/2,y-thickness/2,thickness,thickness,c);}
 }
 function text(value,x,y,c=[38,53,73],scale=2,max=48){
  const s=normalized(value).slice(0,max);let pos=x;
  for(const char of s){const rows=GLYPHS[char]||GLYPHS[" "];
   rows.forEach((row,ry)=>{for(let rx=0;rx<5;rx++)if(row[rx]==="1")rect(pos+rx*scale,y+ry*scale,scale,scale,c);});
   pos+=6*scale;
  }
 }
 const vals=series.flatMap(s=>s.values).filter(v=>v!==null),min=Math.min(0,...vals),max=Math.max(1,...vals),span=max-min||1;
 const left=100,right=900,top=90,bottom=405;
 const y=v=>bottom-(v-min)/span*(bottom-top);
 const x=i=>left+(i+.5)*(right-left)/cycles.length;
 text(language==="fr"?"TENDANCES DES INDICATEURS":"INDICATOR TRENDS",100,28,[27,80,141],3,38);
 for(let i=0;i<=4;i++){
  const yy=bottom-i*(bottom-top)/4;
  line(left,yy,right,yy,[221,229,239],1);
  const v=min+span*i/4;
  text(Math.abs(v)<10000?v.toFixed(1):v.toExponential(1),8,yy-7,[85,102,119],2,10);
 }
 line(left,top,left,bottom,[80,95,109],2);
 const n=cycles.length;
 for(let i=0;i<n;i++){
  const label=String(cycles[i].name??"");
  text(label.length>15?label.slice(0,14):label,x(i)-Math.min(label.length,14)*5,428,[70,85,103],1,15);
 }
 series.forEach((s,si)=>{
  const color=COLORS[si],points=s.values.map((v,i)=>v===null?null:{x:x(i),y:y(v)});
  if(type==="bar"){
   const cell=(right-left)/n,bar=Math.min(35,cell/(series.length+1));
   points.forEach(p=>{if(!p)return;const index=points.indexOf(p);
    const bx=x(index)-series.length*bar/2+si*bar,base=y(0);
    rect(bx,Math.min(base,p.y),Math.max(2,bar-2),Math.max(2,Math.abs(base-p.y)),color);
   });
  }else{
   for(let i=1;i<points.length;i++)if(points[i]&&points[i-1])line(points[i-1].x,points[i-1].y,points[i].x,points[i].y,color,3);
   points.forEach(p=>{if(p)rect(p.x-3,p.y-3,7,7,color);});
  }
  const col=si%3,row=Math.floor(si/3),lx=70+col*300,ly=488+row*30;
  rect(lx,ly,18,8,color);
  text(s.name||s.tag||("SERIES "+(si+1)),lx+29,ly-3,[45,60,78],2,19);
 });
 return rasterPng(rgb,W,H);
}
