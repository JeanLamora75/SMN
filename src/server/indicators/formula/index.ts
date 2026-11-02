export type Reason="missing_source"|"division_by_zero"|"dependency_unavailable"|"invalid_domain";
export type Result={kind:"available";value:string}|{kind:"unavailable";reason:Reason;sourceTag?:string;detail?:string};
export class FormulaSyntaxError extends Error {constructor(message:string){super(message);this.name="FormulaSyntaxError";}}
export class FormulaBudgetError extends Error {constructor(message:string){super(message);this.name="FormulaBudgetError";}}
export type Expression=
 |Readonly<{kind:"number";value:string}>
 |Readonly<{kind:"tag";name:string}>
 |Readonly<{kind:"unary";op:"+"|"-";child:Expression}>
 |Readonly<{kind:"percent";child:Expression}>
 |Readonly<{kind:"binary";op:"+"|"-"|"*"|"/"|"^";left:Expression;right:Expression}>
 |Readonly<{kind:"call";name:"MIN"|"MAX"|"ROUND";args:readonly Expression[]}>
 |Readonly<{kind:"historical";name:HistoricalFunction;tag:string;count:number}>;
export type HistoricalFunction="SUM_LAST"|"LAST_VALUES"|"AVG_LAST"|"MIN_LAST"|"MAX_LAST"|"PREVIOUS"|"DELTA"|"DELTA_PCT";
export const HISTORICAL_FUNCTIONS=new Set<HistoricalFunction>(["SUM_LAST","LAST_VALUES","AVG_LAST","MIN_LAST","MAX_LAST","PREVIOUS","DELTA","DELTA_PCT"]);
export type HistoricalResolver=(name:HistoricalFunction,tag:string,count:number,current?:SourceValue)=>Result;
type Token={type:"num"|"id"|"op"|"end";value:string};
const SCALE=10n**24n;
const MAX_MAGNITUDE_DIGITS=72;
const MAX_POWER_DIGITS=8192;
function boundedMagnitude(value:bigint):bigint{
 if(abs(value).toString().length>MAX_MAGNITUDE_DIGITS)throw new FormulaBudgetError("numeric magnitude");
 return value;
}
const abs=(n:bigint)=>n<0n?-n:n;
const gcd=(a:bigint,b:bigint):bigint=>b===0n?abs(a):gcd(b,a%b);
function roundedDiv(a:bigint,b:bigint):bigint {
 if(b===0n)throw new Error("zero");
 const n=abs(a),d=abs(b),q=n/d,r=n%d;
 return ((a<0n)!==(b<0n)?-1n:1n)*(q+(r*2n>=d?1n:0n));
}
function rootFloor(value:bigint,degree:number):bigint{
 if(value<0n||degree<1||value.toString().length>MAX_POWER_DIGITS)throw new FormulaBudgetError("root");
 if(value<2n)return value;
 let low=0n,high=1n;
 while(high**BigInt(degree)<=value)high*=2n;
 while(low+1n<high){const mid=(low+high)/2n;if(mid**BigInt(degree)<=value)low=mid;else high=mid;}
 return low;
}
function powInteger(base:bigint,exponent:number):bigint{
 if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>64)throw new FormulaBudgetError("power");
 if(abs(base).toString().length>MAX_MAGNITUDE_DIGITS)throw new FormulaBudgetError("power magnitude");
 let result=SCALE,x=base,n=Math.abs(exponent);
 while(n>0){if(n%2===1)result=boundedMagnitude(roundedDiv(result*x,SCALE));n=Math.floor(n/2);if(n)x=boundedMagnitude(roundedDiv(x*x,SCALE));}
 if(exponent<0){if(result===0n)throw new Error("zero");return roundedDiv(SCALE*SCALE,result);}
 return result;
}
function power(base:bigint,exponent:bigint):bigint{
 if(base===0n&&exponent===0n)throw new RangeError("0^0");
 if(base===0n&&exponent<0n)throw new Error("zero");
 if(exponent%SCALE===0n)return powInteger(base,Number(exponent/SCALE));
 if(base<=0n)throw new RangeError("fractional exponent requires positive base");
 let numerator=exponent,denominator=SCALE;
 const divisor=gcd(numerator,denominator);numerator/=divisor;denominator/=divisor;
 if(denominator>32n||abs(numerator)>64n)throw new FormulaBudgetError("fractional power budget");
 const magnitude=powInteger(base,Number(abs(numerator)));
 if(magnitude.toString().length+24*(Number(denominator)-1)>MAX_POWER_DIGITS)throw new FormulaBudgetError("fractional power magnitude");
 const degree=Number(denominator);
 const radicand=magnitude*SCALE**BigInt(degree-1);
 const floor=rootFloor(radicand,degree);
 const next=floor+1n;
 const root=(next**BigInt(degree)-radicand<=radicand-floor**BigInt(degree))?next:floor;
 return numerator<0n?roundedDiv(SCALE*SCALE,root):root;
}
export class DecimalEngine {
 static parse(input:string):bigint{
  if(!/^[+-]?(?:0|[0-9]+)(?:\.[0-9]+)?$/.test(input))throw new FormulaSyntaxError("Invalid decimal");
  const negative=input.startsWith("-");
  const unsigned=input.replace(/^[+-]/,"");
  const [whole,part=""]=unsigned.split(".");
  if(whole.length>48||part.length>24)throw new FormulaBudgetError("decimal digits");
  return boundedMagnitude((negative?-1n:1n)*(BigInt(whole)*SCALE+BigInt(part.padEnd(24,"0"))));
 }
 static format(value:bigint):string{
  const sign=value<0n?"-":"",digits=abs(value).toString().padStart(25,"0");
  const whole=digits.slice(0,-24),fraction=digits.slice(-24).replace(/0+$/,"");
  return (value===0n?"":sign)+whole+(fraction?"."+fraction:"");
 }
 static add(a:bigint,b:bigint){return boundedMagnitude(a+b);}
 static subtract(a:bigint,b:bigint){return boundedMagnitude(a-b);}
 static multiply(a:bigint,b:bigint){return boundedMagnitude(roundedDiv(a*b,SCALE));}
 static divide(a:bigint,b:bigint){return boundedMagnitude(roundedDiv(a*SCALE,b));}
 static power(a:bigint,b:bigint){return boundedMagnitude(power(a,b));}
 static round(a:bigint,places:number){
  if(!Number.isInteger(places)||places<0||places>24)throw new RangeError("round precision");
  const factor=10n**BigInt(24-places);return roundedDiv(a,factor)*factor;
 }
}
function tokenize(input:string):Token[]{
 if(input.length>2048)throw new FormulaBudgetError("formula length");
 const result:Token[]=[];let offset=0;
 while(offset<input.length){
  const remaining=input.slice(offset),ws=/^\s+/.exec(remaining);if(ws){offset+=ws[0].length;continue;}
  const num=/^(?:\d+\.\d+|\d+)/.exec(remaining);
  if(num){result.push({type:"num",value:num[0]});offset+=num[0].length;continue;}
  const id=/^[A-Z][A-Z0-9_]*/.exec(remaining);
  if(id){result.push({type:"id",value:id[0]});offset+=id[0].length;continue;}
  const ch=remaining[0];
  if("+-*/^%(),".includes(ch)){result.push({type:"op",value:ch});offset++;continue;}
  throw new FormulaSyntaxError("Unsupported character at "+offset);
 }
 if(result.length>512)throw new FormulaBudgetError("token count");
 result.push({type:"end",value:""});return result;
}
const functions=new Set(["MIN","MAX","ROUND",...HISTORICAL_FUNCTIONS]);
export function parseFormula(input:string):Expression{
 const tokens=tokenize(input);let pos=0,nodes=0;
 const peek=()=>tokens[pos];
 const take=(value:string)=>{if(peek().value!==value)throw new FormulaSyntaxError("Expected "+value);pos++;};
 const make=<T extends Expression>(node:T):T=>{if(++nodes>512)throw new FormulaBudgetError("AST nodes");return Object.freeze(node);};
 const expression=(min:number,depth:number):Expression=>{
  if(depth>96)throw new FormulaBudgetError("AST depth");
  let left:Expression;const first=tokens[pos++];
  if(first.type==="num")left=make({kind:"number",value:first.value});
  else if(first.type==="id"){
   if(functions.has(first.value)&&peek().value==="("){
    take("(");const args:Expression[]=[];
    if(peek().value!==")"){do{args.push(expression(0,depth+1));if(peek().value!==",")break;take(",");}while(true);}
    take(")");
    if(HISTORICAL_FUNCTIONS.has(first.value as HistoricalFunction)){
     if(args.length!==2||args[0]?.kind!=="tag"||args[1]?.kind!=="number"||!/^[0-9]+$/.test(args[1].value))
      throw new FormulaSyntaxError("Historical arguments must be (TAG, positive integer)");
     const count=Number(args[1].value);
     if(!Number.isSafeInteger(count)||count<1||count>1000)throw new FormulaSyntaxError("Historical window out of range");
     left=make({kind:"historical",name:first.value as HistoricalFunction,tag:args[0].name,count});
    }else{
    if(first.value==="ROUND"&&args.length!==2||first.value!=="ROUND"&&args.length<2)throw new FormulaSyntaxError("Invalid function arity");
    left=make({kind:"call",name:first.value as "MIN"|"MAX"|"ROUND",args:Object.freeze(args)});
    }
   }else {
    if(functions.has(first.value))throw new FormulaSyntaxError("Reserved function name");
    left=make({kind:"tag",name:first.value});
   }
  }else if(first.value==="("){left=expression(0,depth+1);take(")");}
  else if(first.value==="+"||first.value==="-")left=make({kind:"unary",op:first.value,child:expression(35,depth+1)});
  else throw new FormulaSyntaxError("Expected expression");
  while(true){
   const next=peek();
   if(next.value==="%"&&60>=min){pos++;left=make({kind:"percent",child:left});continue;}
   let op=next.value,implicit=false;
   if(next.type==="num"||next.value==="("){op="*";implicit=true;}
   else if(next.type==="id"){
    if(left.kind==="tag")break;
    op="*";implicit=true;
   }
   const prec=op==="^"?40:op==="*"||op==="/"?20:op==="+"||op==="-"?10:-1;
   if(prec<min||prec<0)break;
   if(!implicit)pos++;
   const right=expression(prec+(op==="^"?0:1),depth+1);
   left=make({kind:"binary",op:op as "+"|"-"|"*"|"/"|"^",left,right});
  }
  return left;
 };
 const ast=expression(0,0);
 if(peek().type!=="end")throw new FormulaSyntaxError("Trailing tokens");
 return ast;
}
export function referencedTags(ast:Expression):string[]{
 const found=new Set<string>(),stack:Expression[]=[ast];
 while(stack.length){
  const n=stack.pop()!;
  if(n.kind==="tag"||n.kind==="historical")found.add(n.kind==="tag"?n.name:n.tag);
  else if(n.kind==="unary"||n.kind==="percent")stack.push(n.child);
  else if(n.kind==="binary")stack.push(n.right,n.left);
  else if(n.kind==="call")stack.push(...n.args);
 }
 return [...found].sort();
}
export type SourceValue=string|null|{kind:"unavailable";reason:Reason;sourceTag?:string};
export function evaluateFormula(ast:Expression,sources:Readonly<Record<string,SourceValue>>,maxOperations=1000,historical?:HistoricalResolver):Result{
 let operations=0;
 type Evaluated={kind:"available";value:bigint}|{kind:"unavailable";reason:Reason;sourceTag?:string;detail?:string};
 const unavailable=(reason:Reason,sourceTag?:string,detail?:string):Evaluated=>({kind:"unavailable",reason,...(sourceTag===undefined?{}:{sourceTag}),...(detail===undefined?{}:{detail})});
 function walk(n:Expression,depth:number):Evaluated{
  if(depth>96||++operations>maxOperations)throw new FormulaBudgetError("evaluation budget");
  if(n.kind==="historical"){
   if(!historical)return unavailable("missing_source",n.tag);
   const value=historical(n.name,n.tag,n.count,sources[n.tag]);
   return value.kind==="available"?{kind:"available",value:DecimalEngine.parse(value.value)}:unavailable(value.reason,value.sourceTag,value.detail);
  }
  if(n.kind==="number")return {kind:"available",value:DecimalEngine.parse(n.value)};
  if(n.kind==="tag"){
   const source=sources[n.name];
   if(source===undefined||source===null)return unavailable("missing_source",n.name);
   if(typeof source==="object")return unavailable("dependency_unavailable",n.name);
   return {kind:"available",value:DecimalEngine.parse(source)};
  }
  if(n.kind==="percent"||n.kind==="unary"){
   const a=walk(n.child,depth+1);if(a.kind==="unavailable")return a;
   return {kind:"available",value:n.kind==="percent"?DecimalEngine.divide(a.value,100n*SCALE):n.op==="-"?-a.value:a.value};
  }
  if(n.kind==="binary"){
   const a=walk(n.left,depth+1),b=walk(n.right,depth+1);
   if(a.kind==="unavailable")return a;
   if(b.kind==="unavailable")return b;
   try{
    return {kind:"available",value:n.op==="+"?DecimalEngine.add(a.value,b.value):n.op==="-"?DecimalEngine.subtract(a.value,b.value):n.op==="*"?DecimalEngine.multiply(a.value,b.value):n.op==="/"?DecimalEngine.divide(a.value,b.value):DecimalEngine.power(a.value,b.value)};
   }catch(error){if(error instanceof RangeError)return unavailable("invalid_domain",undefined,error.message);if(error instanceof Error&&error.message==="zero")return unavailable("division_by_zero");throw error;}
  }
  const args=n.args.map(a=>walk(a,depth+1));
  const invalid=args.find(a=>a.kind==="unavailable");if(invalid)return invalid;
  const nums=args.map(a=>(a as {kind:"available";value:bigint}).value);
  if(n.name==="MIN")return {kind:"available",value:nums.reduce((a,b)=>a<b?a:b)};
  if(n.name==="MAX")return {kind:"available",value:nums.reduce((a,b)=>a>b?a:b)};
  if(nums[1]%SCALE!==0n||nums[1]<0n||nums[1]>24n*SCALE)return unavailable("invalid_domain",undefined,"ROUND precision");
  return {kind:"available",value:DecimalEngine.round(nums[0],Number(nums[1]/SCALE))};
 }
 const result=walk(ast,0);
 return result.kind==="available"?{kind:"available",value:DecimalEngine.format(result.value)}:result;
}
export function calculateFormula(input:string,sources:Readonly<Record<string,SourceValue>>={}):Result{
 return evaluateFormula(parseFormula(input),sources);
}
