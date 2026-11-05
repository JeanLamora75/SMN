/** Pure SVG geometry for one historical indicator series. Null denotes a gap, not zero. */
export function horizontalBarGeometry(values:readonly (number|null)[],width:number){
 const xLeft=96,xRight=Math.max(xLeft+24,width-12);
 const finite=values.filter((v):v is number=>v!==null&&Number.isFinite(v));
 const lo=Math.min(0,...finite),hi=Math.max(0,...finite);
 const min=lo===hi?0:lo,max=hi===lo?1:hi;
 const span=max-min;
 const x=(n:number)=>xLeft+(n-min)*(xRight-xLeft)/span;
 const xZero=x(0);
 return {xLeft,xRight,xZero,min,max,bars:values.map(value=>{
  if(value===null||!Number.isFinite(value))return null;
  const end=x(value);
  return {x:Math.min(xZero,end),width:Math.abs(end-xZero)};
 })};
}
export function shortCycleLabel(label:string,max=14):string{
 return label.length<=max?label:label.slice(0,Math.max(1,max-1))+"…";
}
