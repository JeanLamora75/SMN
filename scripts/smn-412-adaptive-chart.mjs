// Pure, target-aware SVG layout with an isolated PNG rasterizer.
// The PPTX packaging adapter remains owned by the next integration.
import {emuToPixels} from "./smn-411-chart-targets.mjs";
import {Resvg} from "@resvg/resvg-js";
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
function inspectPng(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<45||bytes.length>8*1024*1024||
    !bytes.subarray(0,8).equals(PNG_SIGNATURE))throw new OfficeChartLayoutError("office-chart-invalid-png");
 return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
}

export const CHART_STYLES=Object.freeze(["bar","line","area","pie","donut","gauge"]);
export const COLORS=Object.freeze(["#1b508d","#b45638","#159895","#7955a7","#bc8c21","#426da4"]);
export class OfficeChartLayoutError extends Error{
 constructor(code,details={}){super(code);this.name="OfficeChartLayoutError";this.code=code;this.details=details;}
}
const esc=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const num=n=>Math.round(n*100)/100;
const xmlText=(text,x,y,size,{anchor="middle",color="#33465c",rotate=0,weight=400,fontFamily="Arial"}={})=>
 '<text x="'+num(x)+'" y="'+num(y)+'" font-family="'+esc(fontFamily)+', sans-serif" font-size="'+num(size)+'" font-weight="'+weight+'" text-anchor="'+anchor+'" fill="'+color+'"'+
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
/** Optional validated declarative style; undefined preserves the original scene byte-for-byte. */
export function composeAdaptiveChart({target,cycles,series,type="line",locale="fr",style=null}){
 const common=style?.common??null,options=style?.types?.[type]??null;
 const palette=common?.palette??COLORS;
 const txt=(value,x,y,size,props={})=>xmlText(value,x,y,size,{
  ...props,color:props.color??common?.textColor??"#33465c",
  fontFamily:common?.fontFamily??"Arial"
 });
 const showLegend=common?common.legend.visible&&common.legend.position!=="none":true;
 const showLabels=common?.labels.visible??false;
 const includeTitle=Boolean(common?.title||common?.subtitle);
 const number=(n)=>new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{
  maximumFractionDigits:common?.labels.decimals??2
 }).format(n);
 if(!["fr","en"].includes(locale))throw new OfficeChartLayoutError("office-chart-invalid-locale");
 const valid=validateChartSeries(cycles,series,type);
 if(!valid)return null;
 const {width:w,height:h}=geometry(target);
 const defaultFont=Math.max(38,Math.min(50,Math.round(Math.min(w/29,h/15))));
 const font=common?Math.max(30,Math.min(65,Math.round(common.fontSize*3.2))):defaultFont;
 const pad=Math.round(Math.min(w,h)*.055)+(common?.spacing??0);
 const compact=w<800||h<620;
 const legendNeeded=showLegend&&series.length>1;
 const rightLegend=legendNeeded&&common?.legend.position==="right"&&["bar","line","area"].includes(type);
 const legendRows=legendNeeded?Math.ceil(series.length/Math.min(3,series.length)):0;
 const legendHeight=legendNeeded&&!rightLegend?Math.max(60,legendRows*font*1.35):0;
 const xLeft=pad+font*2.35,xRight=w-pad-(rightLegend?Math.min(w*.26,font*4.8):0);
 const yTop=pad+font*.3+(includeTitle?font*2:0),yBottom=h-pad-font*(compact?2.2:1.65)-legendHeight;
 const plotWidth=xRight-xLeft,plotHeight=yBottom-yTop;
 if(plotWidth<220||plotHeight<190)throw new OfficeChartLayoutError("office-chart-frame-too-small",{width:w,height:h});
 const axisLabelMax=Math.max(4,Math.floor(plotWidth/Math.max(1,cycles.length)/(.58*font)));
 const heavy=axisLabelMax<5;
 const svgParts=[rect(0,0,w,h,common?.background??"#ffffff")];
 if(common?.title)svgParts.push(txt(common.title,w/2,pad+font*.7,font*1.15,{weight:600}));
 if(common?.subtitle)svgParts.push(txt(common.subtitle,w/2,pad+font*1.6,font*.85));
 // Advanced bar layouts are isolated from the unchanged legacy grouped chart.
 if(type==="bar"&&options&&(options.orientation==="horizontal"||options.mode==="stacked")){
  const horizontal=options.orientation==="horizontal",stacked=options.mode==="stacked";
  const values=series.flatMap(item=>item.values).filter(value=>value!==null);
  const cell=(horizontal?plotHeight:plotWidth)/cycles.length;
  const axisName=horizontal?Math.min(plotWidth*.27,font*3):font;
  const left=horizontal?xLeft+axisName:xLeft;
  const top=yTop;
  const chartW=horizontal?xRight-left:plotWidth;
  const chartH=plotHeight;
  if(chartW<220||chartH<190)throw new OfficeChartLayoutError("office-chart-frame-too-small");
  const positives=cycles.map((_,i)=>series.reduce((sum,item)=>sum+Math.max(0,item.values[i]??0),0));
  const negatives=cycles.map((_,i)=>series.reduce((sum,item)=>sum+Math.min(0,item.values[i]??0),0));
  const min=stacked?Math.min(0,...negatives):Math.min(0,...values);
  const max=stacked?Math.max(0,...positives):Math.max(0,...values);
  const lower=min===max?min-1:min,upper=max===lower?lower+1:max;
  const scaleX=value=>left+(value-lower)/(upper-lower)*chartW;
  const scaleY=value=>yBottom-(value-lower)/(upper-lower)*chartH;
  const available=series.reduce((total,item)=>total+item.values.filter(v=>v!==null).length,0);
  const colorIndex=i=>palette[i%palette.length];
  for(let i=0;i<=4;i++){
   const value=lower+(upper-lower)*i/4;
   if(horizontal){
    const x=scaleX(value);
    svgParts.push(line(x,top,x,yBottom));
    svgParts.push(txt(number(value),x,yBottom+font*.8,font*.75));
   }else{
    const y=scaleY(value);
    svgParts.push(line(xLeft,y,xRight,y));
    svgParts.push(txt(number(value),xLeft-font*.35,y+font*.3,font*.8,{anchor:"end"}));
   }
  }
  for(let index=0;index<cycles.length;index++){
   const cycle=cycles[index],n=series.length,used=stacked?1:n;
   const band=cell*(1-options.gap/100),thickness=Math.max(1,band/used);
   const axisPos=horizontal?top+(index+.5)*cell:xLeft+(index+.5)*cell;
   if(horizontal)svgParts.push(txt(shortName(cycle.name,14),left-font*.35,axisPos+font*.25,font*.68,{anchor:"end"}));
   else svgParts.push(txt(shortName(cycle.name,11),axisPos,yBottom+font*.95,font*.68));
   let plus=0,minus=0;
   series.forEach((item,j)=>{
    const value=item.values[index];
    if(value===null)return;
    let from=0,to=value;
    if(stacked){
     from=value>=0?plus:minus;
     to=from+value;
     if(value>=0)plus=to;else minus=to;
    }
    const middle=axisPos-band/2+(stacked?band/2:(j+.5)*thickness);
    const size=Math.max(1,thickness-2);
    if(horizontal){
     const x0=scaleX(from),x1=scaleX(to);
     const minx=Math.min(x0,x1),w=Math.max(1,Math.abs(x1-x0));
     svgParts.push(rect(minx,middle-size/2,w,size,colorIndex(j),options.radius?'rx="'+Math.min(options.radius,size/2)+'"':""));
     if(showLabels)svgParts.push(txt(number(value),x1+font*.2,middle+font*.22,font*.65,{anchor:"start"}));
    }else{
     const y0=scaleY(from),y1=scaleY(to);
     const miny=Math.min(y0,y1),h=Math.max(1,Math.abs(y1-y0));
     svgParts.push(rect(middle-size/2,miny,size,h,colorIndex(j),options.radius?'rx="'+Math.min(options.radius,size/2)+'"':""));
     if(showLabels)svgParts.push(txt(number(value),middle,y1-font*.2,font*.65));
    }
   });
  }
  if(legendNeeded){
   const perRow=Math.min(3,series.length),rows=Math.ceil(series.length/perRow),each=plotWidth/perRow;
   series.forEach((item,i)=>{
    const x=xLeft+(i%perRow)*each,y=h-pad-((rows-1)-Math.floor(i/perRow))*font*1.25;
    svgParts.push(rect(x,y-font*.75,font*.65,font*.65,colorIndex(i)));
    svgParts.push(txt(shortName(item.name??item.tag??"Série",12),x+font*.9,y-font*.16,font*.75,{anchor:"start"}));
   });
  }
  return Object.freeze({svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+svgParts.join("")+'</svg>',
   width:w,height:h,meta:Object.freeze({style:type,points:available,range:[lower,upper],labels:cycles.map(c=>String(c.name)),horizontal,stacked})});
 }
 let drawn;
 const labels=series.map((s,i)=>({label:shortName(s.name??s.tag??"Série "+(i+1),Math.max(7,Math.floor(plotWidth/Math.max(1,series.length)/(.59*font)))),color:palette[i%palette.length]}));
 if(["pie","donut","gauge"].includes(type)){
  const values=series.map(s=>s.values.at(-1));
  const active=series.map((s,i)=>({name:s.name??s.tag??"Série "+(i+1),value:values[i],color:palette[i%palette.length]})).filter(s=>s.value!==null);
  const total=active.reduce((sum,s)=>sum+s.value,0);
  if(total===0&&(type!=="gauge"||active.length===0))return null;
  const centerX=xLeft+plotWidth*(legendNeeded?.42:.5),centerY=yTop+plotHeight*.53;
  const radius=Math.min(plotHeight*.46,plotWidth*(legendNeeded?.31:.43));
  if(radius<85)throw new OfficeChartLayoutError("office-chart-frame-too-small");
  if(type==="gauge"){
   const val=active[0].value,r=radius;
   const gaugeMin=options?.min??0,gaugeMax=options?.max??100;
   if(val<gaugeMin||val>gaugeMax)throw new OfficeChartLayoutError("office-chart-gauge-range");
   const ratio=(val-gaugeMin)/(gaugeMax-gaugeMin),arc=(start,end,color)=>{
    if(end<=start)return "";
    const a0=Math.PI*(1+start),a1=Math.PI*(1+end),point=a=>[num(centerX+r*Math.cos(a)),num(centerY+r*Math.sin(a))];
    const p0=point(a0),p1=point(a1);
    return '<path d="M '+p0.join(" ")+' A '+num(r)+' '+num(r)+' 0 '+(end-start>.5?1:0)+' 1 '+p1.join(" ")+'" fill="none" stroke="'+color+'" stroke-width="'+num(radius*((options?.strokePercent??25)/100))+'" stroke-linecap="butt"/>';
   };
   svgParts.push(arc(0,1,"#e5ebf2"),arc(0,ratio,palette[0]));
   svgParts.push(txt(number(val)+" %",centerX,centerY+font*.15,font*1.35,{weight:600}));
   svgParts.push(txt(number(gaugeMin),centerX-radius,centerY+font*1.6,font),txt(number(gaugeMax),centerX+radius,centerY+font*1.6,font));
   if(options?.thresholds?.length)for(const threshold of options.thresholds){
    const a=Math.PI*(1+(threshold-gaugeMin)/(gaugeMax-gaugeMin));
    svgParts.push(line(centerX+(radius*.82)*Math.cos(a),centerY+(radius*.82)*Math.sin(a),
     centerX+(radius*1.08)*Math.cos(a),centerY+(radius*1.08)*Math.sin(a),common?.textColor??"#33465c",3));
   }
   drawn={style:type,points:active.length,range:[gaugeMin,gaugeMax],labels:[]};
  }else{
   let sum=0;
   const segment=(start,end,color)=>{
    const sweep=end-start;if(sweep<=0)return "";
    const startAngle=-Math.PI/2+start*Math.PI*2,endAngle=-Math.PI/2+end*Math.PI*2;
    const p=a=>[num(centerX+radius*Math.cos(a)),num(centerY+radius*Math.sin(a))];
    const separation=type==="pie"?(options?.separation??0):0;
    const outline=separation?' stroke="'+(common?.background??"#ffffff")+'" stroke-width="'+separation+'"':"";
    if(sweep>=1)return '<circle cx="'+num(centerX)+'" cy="'+num(centerY)+'" r="'+num(radius)+'" fill="'+color+'"'+outline+'/>';
    const a=p(startAngle),b=p(endAngle);
    return '<path d="M '+num(centerX)+' '+num(centerY)+' L '+a.join(" ")+' A '+num(radius)+' '+num(radius)+' 0 '+(sweep>.5?1:0)+' 1 '+b.join(" ")+' Z" fill="'+color+'"'+outline+'/>';
   };
   active.forEach(s=>{const end=sum+s.value/total;svgParts.push(segment(sum,end,s.color));sum=end;});
   if(type==="donut"){
    svgParts.push('<circle cx="'+num(centerX)+'" cy="'+num(centerY)+'" r="'+num((options?radius*options.innerRadiusPercent/100:radius*.58))+'" fill="'+(common?.background??"#ffffff")+'"/>');
    if(options?.showCenterValue)svgParts.push(txt(number(total),centerX,centerY+font*.3,font*1.2,{weight:600}));
   }
   if(common?.labels.visible&&type==="pie")active.forEach((item,i)=>{
    const formatted=options?.showPercent?number(item.value/total*100)+"%":number(item.value);
    const angle=-Math.PI/2+2*Math.PI*(active.slice(0,i).reduce((sum,v)=>sum+v.value,0)+item.value/2)/total;
    svgParts.push(txt(formatted,centerX+radius*.57*Math.cos(angle),centerY+radius*.57*Math.sin(angle),font*.65));
   });
   if(legendNeeded){
    active.forEach((s,i)=>{
     const lx=xLeft+plotWidth*.77,ly=yTop+font*(1.2+i*1.55);
     svgParts.push(rect(lx,ly-font*.68,font*.7,font*.7,s.color));
     svgParts.push(txt(shortName(s.name,Math.floor((xRight-lx)/(.58*font))-2),lx+font,ly,font,{anchor:"start"}));
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
   svgParts.push(txt(number(value),xLeft-font*.35,y+font*.33,font*.93,{anchor:"end"}));
  }
  const useRotation=heavy&&cycles.length>6;
  const labelItems=[];
  cycles.forEach((c,i)=>{
   const original=String(c.name??""),label=shortName(original,useRotation?15:axisLabelMax);
   const x=colX(i),y=yBottom+font*1.1;
   svgParts.push(txt(label,x,y,font*.9,{rotate:useRotation?-45:0}));
   labelItems.push(label);
  });
  const baseline=scale(0);
  series.forEach((s,si)=>{
   const color=palette[si%palette.length];
   if(type==="bar"){
    const cw=plotWidth/cycles.length;
    const bw=Math.min(cw/(series.length+1),Math.max(4,cw*.68/series.length))*
     (options?Math.max(.1,1-options.gap/100):1);
    const radius=Math.min(options?.radius??0,bw/2);
    s.values.forEach((v,i)=>{
     if(v===null)return;
     const x=colX(i)-bw*series.length/2+si*bw;
     svgParts.push(rect(x,Math.min(scale(v),baseline),Math.max(1,bw-2),Math.max(1,Math.abs(scale(v)-baseline)),color,radius?'rx="'+radius+'"':""));
     if(v===0)svgParts.push(rect(x,baseline-2,Math.max(1,bw-2),4,color));
     if(showLabels)svgParts.push(txt(number(v),x+bw/2,scale(v)-font*.16,font*.7));
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
      svgParts.push('<polygon points="'+[[points[0][0],baseline],...points,[points.at(-1)[0],baseline]].map(p=>p.map(num).join(",")).join(" ")+'" fill="'+color+'" fill-opacity="'+(options?options.opacity:".18")+'"/>');
     if(points.length>1){
      const stroke=options?.strokeWidth??Math.max(3,font*.085);
      if(type==="line"&&options?.smooth){
       let path="M "+points[0].map(num).join(" ");
       for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i],middle=(a[0]+b[0])/2;
        path+=" C "+[middle,a[1],middle,b[1],b[0],b[1]].map(num).join(" ");
       }
       svgParts.push('<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+stroke+'"/>');
      }else svgParts.push('<polyline fill="none" stroke="'+color+'" stroke-width="'+stroke+'" stroke-linejoin="round" points="'+points.map(p=>p.map(num).join(",")).join(" ")+'"/>');
     }
     if(showLabels)points.forEach((p,pi)=>{
      const value=series[si].values.filter(v=>v!==null)[pi];
      svgParts.push(txt(number(value),p[0],p[1]-font*.3,font*.68));
     });
     if(options?.marker!=="none")points.forEach(p=>svgParts.push(
      options?.marker==="square"?
       rect(p[0]-Math.max(4,font*.12),p[1]-Math.max(4,font*.12),2*Math.max(4,font*.12),2*Math.max(4,font*.12),color):
       '<circle cx="'+num(p[0])+'" cy="'+num(p[1])+'" r="'+num(Math.max(4,font*.12))+'" fill="'+color+'"/>'
     ));
    }
   }
  });
  drawn={style:type,points:vals.length,range:[lower,upper],labels:labelItems,rotated:useRotation};
 }
 if(legendNeeded&&["bar","line","area","gauge"].includes(type)){
  if(rightLegend){
   labels.forEach((item,i)=>{
    const x=xRight+font*.4,y=yTop+font*(1+i*1.25);
    svgParts.push(rect(x,y-font*.75,font*.65,font*.65,item.color));
    svgParts.push(txt(shortName(item.label,13),x+font*.9,y-font*.16,font*.75,{anchor:"start"}));
   });
  }else{
  const perRow=Math.min(3,series.length),rows=Math.ceil(series.length/perRow);
  if(rows*font*1.25>legendHeight)
   throw new OfficeChartLayoutError("office-chart-frame-too-small",{width:w,height:h});
  const each=plotWidth/perRow;
  labels.forEach((item,i)=>{
   const x=xLeft+(i%perRow)*each,y=h-pad-((rows-1)-Math.floor(i/perRow))*font*1.25;
   svgParts.push(rect(x,y-font*.75,font*.65,font*.65,item.color));
   svgParts.push(txt(item.label,x+font*.9,y-font*.16,font*.82,{anchor:"start"}));
  });
  }
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+svgParts.join("")+'</svg>';
 return Object.freeze({svg,width:w,height:h,meta:Object.freeze(drawn)});
}
export function renderAdaptiveChartPng(args,root=process.cwd()){
 const scene=composeAdaptiveChart(args);
 if(scene===null)return null;
 let png;
 try{png=Buffer.from(new Resvg(scene.svg,{fitTo:{mode:"original"}}).render().asPng());}catch(e){
  throw new OfficeChartLayoutError("office-chart-rasterizer-unavailable",{reason:e.message});
 }
 const meta=inspectPng(png);
 if(meta.width!==scene.width||meta.height!==scene.height)
  throw new OfficeChartLayoutError("office-chart-size-mismatch");
 return png;
}
