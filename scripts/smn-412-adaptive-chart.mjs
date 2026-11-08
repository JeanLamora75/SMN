// Pure, target-aware SVG layout with an isolated PNG rasterizer.
// The PPTX packaging adapter remains owned by the next integration.
import {emuToPixels} from "./smn-411-chart-targets.mjs";
import {inspectPng,rasterizeWithResvg} from "./poc/smn-410-rasterizer-poc.mjs";

export const CHART_STYLES=Object.freeze(["bar","line","area","pie","donut","gauge"]);
export const COLORS=Object.freeze(["#1b508d","#b45638","#159895","#7955a7","#bc8c21","#426da4"]);
export class OfficeChartLayoutError extends Error{
 constructor(code,details={}){super(code);this.name="OfficeChartLayoutError";this.code=code;this.details=details;}
}
const esc=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const num=n=>Math.round(n*100)/100;
const xmlText=(text,x,y,size,{anchor="middle",color="#33465c",rotate=0,weight=400}={})=>
 '<text x="'+num(x)+'" y="'+num(y)+'" font-family="Arial, sans-serif" font-size="'+num(size)+'" font-weight="'+weight+'" text-anchor="'+anchor+'" fill="'+color+'"'+
 (rotate?' transform="rotate('+rotate+' '+num(x)+' '+num(y)+')"':'')+'>'+esc(text)+'</text>';
const line=(x1,y1,x2,y2,color="#e5ebf2",width=1)=>
 '<line x1="'+num(x1)+'" y1="'+num(y1)+'" x2="'+num(x2)+'" y2="'+num(y2)+'" stroke="'+color+'" stroke-width="'+width+'"/>';
const rect=(x,y,w,h,fill,extra="")=>
 '<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(w)+'" height="'+num(h)+'" fill="'+fill+'" '+extra+'/>';
function shortName(name,max){
 const value=String(name??"").trim();
 if(value.length<=max)return value;
 const sprint=/(?:sprint|iteration|itération)[^\d]{0,60}(\d+(?:[.-]\d+)?)/i.exec(value);
 if(sprint)return "S"+sprint[1];
 return max>4?value.slice(0,max-1)+"…":value.slice(0,max);
}
function normalizedNumber(n,locale){
 return new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:2}).format(n);
}
export function validateChartSeries(cycles,series,type){
 if(!CHART_STYLES.includes(type))throw new OfficeChartLayoutError("office-chart-invalid-style");
 if(!Array.isArray(cycles)||cycles.length<1||cycles.length>24||
  !Array.isArray(series)||series.length<1||series.length>6)
  throw new OfficeChartLayoutError("office-chart-invalid-series");
 if(type==="gauge"&&series.length!==1)
  throw new OfficeChartLayoutError("office-chart-gauge-one-series");
 for(const s of series){
  if(!Array.isArray(s.values)||s.values.length!==cycles.length||
   s.values.some(v=>v!==null&&(!Number.isFinite(v)||Math.abs(v)>1e10)))
   throw new OfficeChartLayoutError("office-chart-invalid-values");
 }
 const units=new Set(series.map(s=>s.unit).filter(Boolean));
 if(units.size>1)throw new OfficeChartLayoutError("office-chart-incompatible-unit");
 if(["pie","donut","gauge"].includes(type)){
  const shares=series.map(s=>s.values.at(-1));
  if(shares.some(n=>n!==null&&n<0))
   throw new OfficeChartLayoutError("office-chart-negative-share");
  if(type==="gauge"&&shares[0]!==null&&shares[0]>100)
   throw new OfficeChartLayoutError("office-chart-gauge-range");
 }
 return series.some(s=>s.values.some(v=>v!==null));
}
function geometry(target){
 if(!target||!Number.isSafeInteger(target.widthEmu)||!Number.isSafeInteger(target.heightEmu))
  throw new OfficeChartLayoutError("office-chart-invalid-geometry");
 let pixels;
 try{pixels=emuToPixels(target.widthEmu,target.heightEmu,300);}
 catch(e){throw new OfficeChartLayoutError(e.message||"office-chart-invalid-geometry");}
 const {width:w,height:h}=pixels;
 // 9 pt at 300 ppi: 37.5 px; body text is at least 38 px.
 if(w<500||h<370)throw new OfficeChartLayoutError("office-chart-frame-too-small",{width:w,height:h});
 return pixels;
}
export function composeAdaptiveChart({target,cycles,series,type="line",locale="fr"}){
 if(!["fr","en"].includes(locale))throw new OfficeChartLayoutError("office-chart-invalid-locale");
 const valid=validateChartSeries(cycles,series,type);
 if(!valid)return null;
 const {width:w,height:h}=geometry(target);
 const font=Math.max(38,Math.min(50,Math.round(Math.min(w/29,h/15))));
 const pad=Math.round(Math.min(w,h)*.055);
 const compact=w<800||h<620;
 const legendNeeded=series.length>1;
 const legendRows=legendNeeded?Math.ceil(series.length/Math.min(3,series.length)):0;
 const legendHeight=legendNeeded?Math.max(60,legendRows*font*1.35):0;
 const xLeft=pad+font*2.35,xRight=w-pad;
 const yTop=pad+font*.3,yBottom=h-pad-font*(compact?2.2:1.65)-legendHeight;
 const plotWidth=xRight-xLeft,plotHeight=yBottom-yTop;
 if(plotWidth<220||plotHeight<190)throw new OfficeChartLayoutError("office-chart-frame-too-small",{width:w,height:h});
 const axisLabelMax=Math.max(4,Math.floor(plotWidth/Math.max(1,cycles.length)/(.58*font)));
 const heavy=axisLabelMax<5;
 const svgParts=[rect(0,0,w,h,"#ffffff")];
 let drawn;
 const labels=series.map((s,i)=>({label:shortName(s.name??s.tag??"Série "+(i+1),Math.max(7,Math.floor(plotWidth/Math.max(1,series.length)/(.59*font)))),color:COLORS[i]}));
 if(["pie","donut","gauge"].includes(type)){
  const values=series.map(s=>s.values.at(-1));
  const active=series.map((s,i)=>({name:s.name??s.tag??"Série "+(i+1),value:values[i],color:COLORS[i]})).filter(s=>s.value!==null);
  const total=active.reduce((sum,s)=>sum+s.value,0);
  if(total===0&&(type!=="gauge"||active.length===0))return null;
  const centerX=xLeft+plotWidth*(legendNeeded?.42:.5),centerY=yTop+plotHeight*.53;
  const radius=Math.min(plotHeight*.46,plotWidth*(legendNeeded?.31:.43));
  if(radius<85)throw new OfficeChartLayoutError("office-chart-frame-too-small");
  if(type==="gauge"){
   const val=active[0].value,r=radius,ratio=val/100,arc=(start,end,color)=>{
    if(end<=start)return "";
    const a0=Math.PI*(1+start),a1=Math.PI*(1+end),point=a=>[num(centerX+r*Math.cos(a)),num(centerY+r*Math.sin(a))];
    const p0=point(a0),p1=point(a1);
    return '<path d="M '+p0.join(" ")+' A '+num(r)+' '+num(r)+' 0 '+(end-start>.5?1:0)+' 1 '+p1.join(" ")+'" fill="none" stroke="'+color+'" stroke-width="'+num(radius*.25)+'" stroke-linecap="butt"/>';
   };
   svgParts.push(arc(0,1,"#e5ebf2"),arc(0,ratio,COLORS[0]));
   svgParts.push(xmlText(normalizedNumber(val,locale)+" %",centerX,centerY+font*.15,font*1.35,{weight:600}));
   svgParts.push(xmlText("0",centerX-radius,centerY+font*1.6,font),xmlText("100",centerX+radius,centerY+font*1.6,font));
   drawn={style:type,points:active.length,range:[0,100],labels:[]};
  }else{
   let sum=0;
   const segment=(start,end,color)=>{
    const sweep=end-start;if(sweep<=0)return "";
    const startAngle=-Math.PI/2+start*Math.PI*2,endAngle=-Math.PI/2+end*Math.PI*2;
    const p=a=>[num(centerX+radius*Math.cos(a)),num(centerY+radius*Math.sin(a))];
    if(sweep>=1)return '<circle cx="'+num(centerX)+'" cy="'+num(centerY)+'" r="'+num(radius)+'" fill="'+color+'"/>';
    const a=p(startAngle),b=p(endAngle);
    return '<path d="M '+num(centerX)+' '+num(centerY)+' L '+a.join(" ")+' A '+num(radius)+' '+num(radius)+' 0 '+(sweep>.5?1:0)+' 1 '+b.join(" ")+' Z" fill="'+color+'"/>';
   };
   active.forEach(s=>{const end=sum+s.value/total;svgParts.push(segment(sum,end,s.color));sum=end;});
   if(type==="donut")svgParts.push('<circle cx="'+num(centerX)+'" cy="'+num(centerY)+'" r="'+num(radius*.58)+'" fill="#fff"/>');
   if(legendNeeded){
    active.forEach((s,i)=>{
     const lx=xLeft+plotWidth*.77,ly=yTop+font*(1.2+i*1.55);
     svgParts.push(rect(lx,ly-font*.68,font*.7,font*.7,s.color));
     svgParts.push(xmlText(shortName(s.name,Math.floor((xRight-lx)/(.58*font))-2),lx+font,ly,font,{anchor:"start"}));
    });
   }
   drawn={style:type,points:active.length,range:[0,total],labels:[]};
  }
 }else{
  const vals=series.flatMap(s=>s.values).filter(v=>v!==null);
  const min=Math.min(0,...vals),max=Math.max(0,...vals);
  const lower=min===max?min-1:min,upper=max===lower?lower+1:max;
  const scale=v=>yBottom-(v-lower)/(upper-lower)*plotHeight;
  const colX=i=>xLeft+(i+.5)*plotWidth/cycles.length;
  for(let k=0;k<=4;k++){
   const value=lower+(upper-lower)*k/4,y=scale(value);
   svgParts.push(line(xLeft,y,xRight,y));
   svgParts.push(xmlText(normalizedNumber(value,locale),xLeft-font*.35,y+font*.33,font*.93,{anchor:"end"}));
  }
  const useRotation=heavy&&cycles.length>6;
  const labelItems=[];
  cycles.forEach((c,i)=>{
   const original=String(c.name??""),label=shortName(original,useRotation?15:axisLabelMax);
   const x=colX(i),y=yBottom+font*1.1;
   svgParts.push(xmlText(label,x,y,font*.9,{rotate:useRotation?-45:0}));
   labelItems.push(label);
  });
  const baseline=scale(0);
  series.forEach((s,si)=>{
   const color=COLORS[si];
   if(type==="bar"){
    const cw=plotWidth/cycles.length;
    const bw=Math.min(cw/(series.length+1),Math.max(4,cw*.68/series.length));
    s.values.forEach((v,i)=>{
     if(v===null)return;
     const x=colX(i)-bw*series.length/2+si*bw;
     svgParts.push(rect(x,Math.min(scale(v),baseline),Math.max(1,bw-2),Math.max(1,Math.abs(scale(v)-baseline)),color));
     if(v===0)svgParts.push(rect(x,baseline-2,Math.max(1,bw-2),4,color));
    });
   }else{
    const segments=[];let segment=[];
    s.values.forEach((v,i)=>{
     if(v===null){if(segment.length)segments.push(segment);segment=[];return;}
     segment.push([colX(i),scale(v)]);
    });
    if(segment.length)segments.push(segment);
    for(const points of segments){
     if(type==="area"&&points.length>1)
      svgParts.push('<polygon points="'+[[points[0][0],baseline],...points,[points.at(-1)[0],baseline]].map(p=>p.map(num).join(",")).join(" ")+'" fill="'+color+'" fill-opacity=".18"/>');
     if(points.length>1)svgParts.push('<polyline fill="none" stroke="'+color+'" stroke-width="'+Math.max(3,font*.085)+'" stroke-linejoin="round" points="'+points.map(p=>p.map(num).join(",")).join(" ")+'"/>');
     points.forEach(p=>svgParts.push('<circle cx="'+num(p[0])+'" cy="'+num(p[1])+'" r="'+num(Math.max(4,font*.12))+'" fill="'+color+'"/>'));
    }
   }
  });
  drawn={style:type,points:vals.length,range:[lower,upper],labels:labelItems,rotated:useRotation};
 }
 if(legendNeeded&&["bar","line","area","gauge"].includes(type)){
  const perRow=Math.min(3,series.length),rows=Math.ceil(series.length/perRow);
  if(rows*font*1.25>legendHeight)
   throw new OfficeChartLayoutError("office-chart-frame-too-small",{width:w,height:h});
  const each=plotWidth/perRow;
  labels.forEach((item,i)=>{
   const x=xLeft+(i%perRow)*each,y=h-pad-((rows-1)-Math.floor(i/perRow))*font*1.25;
   svgParts.push(rect(x,y-font*.75,font*.65,font*.65,item.color));
   svgParts.push(xmlText(item.label,x+font*.9,y-font*.16,font*.82,{anchor:"start"}));
  });
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+svgParts.join("")+'</svg>';
 return Object.freeze({svg,width:w,height:h,meta:Object.freeze(drawn)});
}
export function renderAdaptiveChartPng(args,root=process.cwd()){
 const scene=composeAdaptiveChart(args);
 if(scene===null)return null;
 let png;
 try{png=rasterizeWithResvg(scene.svg,root);}catch(e){
  throw new OfficeChartLayoutError("office-chart-rasterizer-unavailable",{reason:e.message});
 }
 const meta=inspectPng(png);
 if(meta.width!==scene.width||meta.height!==scene.height)
  throw new OfficeChartLayoutError("office-chart-size-mismatch");
 return png;
}
