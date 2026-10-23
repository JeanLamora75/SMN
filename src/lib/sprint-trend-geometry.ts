/** Accessible chart coordinates: missing values interrupt lines, never become zero. */
export type TrendDot=Readonly<{index:number;x:number;y:number;value:number}>;
export type TrendSegment=Readonly<{from:TrendDot;to:TrendDot}>;
export type TrendGeometry=Readonly<{
 dots:readonly TrendDot[];segments:readonly TrendSegment[];
 maxY:number;baseline:number;top:number;left:number;right:number;
}>;
export function trendGeometry(values:readonly (number|null)[],width=640,height=220):TrendGeometry{
 if(!Number.isFinite(width)||width<160||!Number.isFinite(height)||height<100)
  throw Error("trend-geometry-invalid-size");
 const valid=values.filter((v):v is number=>v!==null&&Number.isFinite(v)&&v>=0);
 const peak=Math.max(0,...valid);
 const rough=peak>0?peak:1;
 const magnitude=Math.pow(10,Math.floor(Math.log10(rough)));
 const unit=magnitude*(rough/magnitude>5?2:rough/magnitude>2?1:0.5);
 const maxY=Math.max(1,Math.ceil(rough/unit)*unit);
 const left=48,right=width-18,top=18,baseline=height-42;
 const place=(index:number,value:number):TrendDot=>({
  index,value,
  x:left+(right-left)*(values.length>1?index/(values.length-1):0.5),
  y:baseline-(baseline-top)*value/maxY
 });
 const dots:TrendDot[]=[];
 const segments:TrendSegment[]=[];
 let previous:TrendDot|null=null;
 for(let i=0;i<values.length;i++){
  const v=values[i];
  if(v===null||!Number.isFinite(v)||v<0){previous=null;continue;}
  const point=place(i,v);
  if(previous)segments.push({from:previous,to:point});
  dots.push(point);
  previous=point;
 }
 return {dots,segments,maxY,baseline,top,left,right};
}
