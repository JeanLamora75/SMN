import {createHash} from 'node:crypto';
export type SchemaEntry={kind:string;name:string;definition:string};
export function compareSignatures(a:SchemaEntry[],b:SchemaEntry[]){
 const normalize=(rows:SchemaEntry[])=>rows.map(x=>JSON.stringify(x)).sort();
 const left=normalize(a),right=normalize(b);
 const only=(x:string[],y:string[])=>x.filter(item=>!y.includes(item));
 const hash=(items:string[])=>createHash('sha256').update(JSON.stringify(items)).digest('hex');
 return {identical:JSON.stringify(left)===JSON.stringify(right),freshOnly:only(left,right),migratedOnly:only(right,left),freshHash:hash(left),migratedHash:hash(right)};
}
