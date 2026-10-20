#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const fr=JSON.parse(readFileSync(new URL("../src/i18n/fr.json",import.meta.url),"utf8"));
const en=JSON.parse(readFileSync(new URL("../src/i18n/en.json",import.meta.url),"utf8"));
function flatten(value,prefix=""){
  const out=new Map();
  for(const [key,item] of Object.entries(value)){
    const name=prefix?prefix+"."+key:key;
    if(typeof item==="string"){
      assert.ok(item.trim(),name+" must not be blank");
      out.set(name,item);
    }else{
      assert.ok(item&&typeof item==="object"&&!Array.isArray(item),name+" must be an object");
      for(const [k,v] of flatten(item,name))out.set(k,v);
    }
  }
  return out;
}
const frKeys=flatten(fr),enKeys=flatten(en);
assert.deepEqual([...frKeys.keys()].sort(),[...enKeys.keys()].sort(),"Catalog keys must match");
const placeholders=(s)=>[...s.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(x=>x[1]).sort();
for(const [key,value] of frKeys)
  assert.deepEqual(placeholders(value),placeholders(enKeys.get(key)),key+" parameters mismatch");
console.log("SMN-27: validated "+frKeys.size+" aligned FR/EN keys.");
