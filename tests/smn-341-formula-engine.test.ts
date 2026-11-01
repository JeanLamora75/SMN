import {test} from "node:test";
import {strict as assert} from "node:assert";
import {calculateFormula,evaluateFormula,parseFormula,referencedTags,FormulaBudgetError,FormulaSyntaxError} from "../src/server/indicators/formula";

function value(input:string,src:Record<string,string|null>={}):string{
 const r=calculateFormula(input,src);assert.equal(r.kind,"available",JSON.stringify(r));
 if(r.kind!=="available")throw Error("unavailable");return r.value;
}
test("arithmétique décimale et ROUND HALF_UP",()=>{
 assert.equal(value("0.1+0.2"),"0.3");
 assert.equal(value("ROUND(1.005,2)"),"1.01");
 assert.equal(value("ROUND(-1.005,2)"),"-1.01");
 assert.equal(value("ROUND(2.5,0)"),"3");
 assert.equal(value("ROUND(-2.5,0)"),"-3");
 assert.equal(value("MIN(9,3,5)"),"3");
 assert.equal(value("MAX(9,3,5)"),"9");
});
test("priorités, multiplication implicite et pourcentage",()=>{
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
test("sources nulles non remplacées par zéro et propagation",()=>{
 assert.deepEqual(calculateFormula("A+1",{A:null}),{kind:"unavailable",reason:"missing_source",sourceTag:"A"});
 assert.deepEqual(calculateFormula("A+1",{A:"0"}),{kind:"available",value:"1"});
 assert.deepEqual(calculateFormula("A+1",{A:{kind:"unavailable",reason:"missing_source"}}),{kind:"unavailable",reason:"dependency_unavailable",sourceTag:"A"});
 assert.deepEqual(referencedTags(parseFormula("B+A+ROUND(A,2)")),["A","B"]);
});
test("erreurs métier et puissances",()=>{
 assert.equal(calculateFormula("1/0").kind,"unavailable");
 assert.deepEqual(calculateFormula("0^0"),{kind:"unavailable",reason:"invalid_domain",detail:"0^0"});
 assert.equal(calculateFormula("0^-1").kind,"unavailable");
 assert.equal(calculateFormula("(-2)^0.5").kind,"unavailable");
 assert.equal(value("0^2"),"0");
});
test("rejet syntaxique et absence d'exécution",()=>{
 for(const formula of ["eval(1)","Math.random()","process.exit()","A;B","MIN(1)","ROUND(1,2,3)","A B","2+","1,2","MIN","foo","A[0]"])
  assert.throws(()=>parseFormula(formula),FormulaSyntaxError,formula);
});
test("budgets techniques ne deviennent jamais unavailable",()=>{
 assert.throws(()=>parseFormula("1".repeat(2049)),FormulaBudgetError);
 assert.throws(()=>calculateFormula("2^1000"),FormulaBudgetError);
 assert.throws(()=>evaluateFormula(parseFormula("1+2"),{},1),FormulaBudgetError);
});

test("valeurs sources signées et HALF_UP sans perte IEEE754",()=>{
 assert.equal(value("A+0.2",{A:"-0.1"}),"0.1");
 assert.equal(value("A+0.2",{A:"+0.1"}),"0.3");
 assert.equal(value("ROUND(-1.235,2)"),"-1.24");
 assert.equal(value("ROUND(1.235,2)"),"1.24");
 assert.equal(value("0.000000000000000000000001+0.000000000000000000000001"),"0.000000000000000000000002");
});
test("budgets numériques et exposants fractionnaires bornés",()=>{
 for(const formula of ["9^0.5","16^0.25","2^-3","(-2)^3","4^0.5"]){
  const r=calculateFormula(formula);assert.equal(r.kind,"available",formula);
 }
 assert.equal(value("16^0.25"),"2");
 assert.equal(value("(-2)^3"),"-8");
 assert.equal(calculateFormula("(-8)^0.333333333333333333333333").kind,"unavailable");
 assert.throws(()=>calculateFormula("2^64"),FormulaBudgetError);
 assert.throws(()=>calculateFormula("2^0.000000000000000000000001"),FormulaBudgetError);
 assert.throws(()=>calculateFormula("999999999999999999999999999999999999999999999999^2"),FormulaBudgetError);
 assert.throws(()=>calculateFormula("1+".repeat(300)+"1"),FormulaBudgetError);
});
test("grammaire et domaines : exceptions techniques distinctes de unavailable",()=>{
 for(const s of ["MIN()","MAX(1)","ROUND(1)","ROUND(1,2,3)","A B","2+","1;process.exit()","Math.random()"])
  assert.throws(()=>parseFormula(s),FormulaSyntaxError,s);
 assert.deepEqual(calculateFormula("ROUND(1,1.5)"),{kind:"unavailable",reason:"invalid_domain",detail:"ROUND precision"});
 assert.equal(calculateFormula("0^-2").kind,"unavailable");
 assert.equal(calculateFormula("0^0").kind,"unavailable");
 assert.deepEqual(calculateFormula("X+1",{X:null}),{kind:"unavailable",reason:"missing_source",sourceTag:"X"});
});
