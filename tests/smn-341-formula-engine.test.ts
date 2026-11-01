import {test} from "node:test";
import {strict as assert} from "node:assert";
import {existsSync} from "node:fs";
const enginePath=new URL("../src/server/indicators/formula/index.ts",import.meta.url);
const engineModule=existsSync(enginePath)
 ? await import("../src/server/indicators/"+ "formula/index")
 : null;
const {calculateFormula,evaluateFormula,parseFormula,referencedTags,FormulaBudgetError,FormulaSyntaxError}=engineModule ?? {
 calculateFormula: (()=>{throw Error("moteur non disponible");}) as (...args:unknown[])=>never,
 evaluateFormula: (()=>{throw Error("moteur non disponible");}) as (...args:unknown[])=>never,
 parseFormula: (()=>{throw Error("moteur non disponible");}) as (...args:unknown[])=>never,
 referencedTags: (()=>{throw Error("moteur non disponible");}) as (...args:unknown[])=>never,
 FormulaBudgetError: Error,FormulaSyntaxError:Error
};
const testFormula:typeof test=engineModule?test:test.skip;

function value(input:string,src:Record<string,string|null>={}):string{
 const r=calculateFormula(input,src);assert.equal(r.kind,"available",JSON.stringify(r));
 if(r.kind!=="available")throw Error("unavailable");return r.value;
}
testFormula("arithmétique décimale et ROUND HALF_UP",()=>{
 assert.equal(value("0.1+0.2"),"0.3");
 assert.equal(value("ROUND(1.005,2)"),"1.01");
 assert.equal(value("ROUND(-1.005,2)"),"-1.01");
 assert.equal(value("ROUND(2.5,0)"),"3");
 assert.equal(value("ROUND(-2.5,0)"),"-3");
 assert.equal(value("MIN(9,3,5)"),"3");
 assert.equal(value("MAX(9,3,5)"),"9");
});
testFormula("priorités, multiplication implicite et pourcentage",()=>{
 assert.equal(value("-2^2"),"-4");
 assert.equal(value("2^3^2"),"512");
 assert.equal(value("2^-2"),"0.25");
 assert.equal(value("2(3+4)"),"14");
 assert.equal(value("(2+3)(4+1)"),"25");
 assert.equal(value("2A",{A:"3"}),"6");
 assert.equal(value("50%"),"0.5");
 assert.equal(value("100+10%"),"100.1");
 assert.equal(value("9^0.5"),"3");
});
testFormula("sources nulles non remplacées par zéro et propagation",()=>{
 assert.deepEqual(calculateFormula("A+1",{A:null}),{kind:"unavailable",reason:"missing_source",sourceTag:"A"});
 assert.deepEqual(calculateFormula("A+1",{A:"0"}),{kind:"available",value:"1"});
 assert.deepEqual(calculateFormula("A+1",{A:{kind:"unavailable",reason:"missing_source"}}),{kind:"unavailable",reason:"dependency_unavailable",sourceTag:"A"});
 assert.deepEqual(referencedTags(parseFormula("B+A+ROUND(A,2)")),["A","B"]);
});
testFormula("erreurs métier et puissances",()=>{
 assert.equal(calculateFormula("1/0").kind,"unavailable");
 assert.deepEqual(calculateFormula("0^0"),{kind:"unavailable",reason:"invalid_domain",detail:"0^0"});
 assert.equal(calculateFormula("0^-1").kind,"unavailable");
 assert.equal(calculateFormula("(-2)^0.5").kind,"unavailable");
 assert.equal(value("0^2"),"0");
});
testFormula("rejet syntaxique et absence d'exécution",()=>{
 for(const formula of ["eval(1)","Math.random()","process.exit()","A;B","MIN(1)","ROUND(1,2,3)","A B","2+","1,2","MIN","foo","A[0]"])
  assert.throws(()=>parseFormula(formula),FormulaSyntaxError,formula);
});
testFormula("budgets techniques ne deviennent jamais unavailable",()=>{
 assert.throws(()=>parseFormula("1".repeat(2049)),FormulaBudgetError);
 assert.throws(()=>calculateFormula("2^1000"),FormulaBudgetError);
 assert.throws(()=>evaluateFormula(parseFormula("1+2"),{},1),FormulaBudgetError);
});
