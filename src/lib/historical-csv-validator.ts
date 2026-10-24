import {HISTORICAL_CSV_COLUMNS,historicalCsvCodeAllowed,type HistoricalCsvMode} from "./historical-csv-contract";
export type CsvDiagnostic={line:number;column:string;code:string;message:string};
export type CsvRow={line:number;cycle_id:string;metric_code:string;value:number;quality:"known"|"estimated"};
export type CsvValidation={valid:boolean;rows:CsvRow[];errors:CsvDiagnostic[]};
const MAX_BYTES=1024*1024,MAX_ROWS=5000;
function tokenize(text:string):{records:{values:string[];line:number}[];errors:CsvDiagnostic[]}{
 const records:{values:string[];line:number}[]=[],errors:CsvDiagnostic[]=[];
 let row:string[]=[],field="",quoted=false,closed=false,line=1,rowLine=1;
 const emit=()=>{row.push(field);records.push({values:row,line:rowLine});row=[];field="";closed=false;rowLine=line;};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){
   if(c==='"'&&text[i+1]==='"'){field+='"';i++;}
   else if(c==='"') {quoted=false;closed=true;}
   else {field+=c;if(c==="\n")line++;}
   continue;
  }
  if(c==='"'&&field===""&&!closed){quoted=true;continue;}
  if(c===","){row.push(field);field="";closed=false;continue;}
  if(c==="\r"||c==="\n"){
   if(c==="\r"&&text[i+1]==="\n")i++;
   emit();line++;rowLine=line;continue;
  }
  if(c==='"'||closed){
   errors.push({line,column:"structure",code:"csv-syntax",message:"Guillemets ou caractères après guillemet incorrects."});
   closed=false;
  }
  field+=c;
 }
 if(quoted)errors.push({line:rowLine,column:"structure",code:"unclosed-quote",message:"Champ entre guillemets non terminé."});
 if(row.length||field!==""||closed)emit();
 return {records,errors};
}
export function validateHistoricalCsv(raw:string,mode:HistoricalCsvMode):CsvValidation{
 const errors:CsvDiagnostic[]=[],rows:CsvRow[]=[];
 if(typeof raw!=="string"||new TextEncoder().encode(raw).length>MAX_BYTES)
  return {valid:false,rows:[],errors:[{line:0,column:"fichier",code:"size",message:"CSV supérieur à 1 Mo ou invalide."}]};
 const {records,errors:syntax}=tokenize(raw.replace(/^\uFEFF/,""));
 errors.push(...syntax);
 const expected=[...HISTORICAL_CSV_COLUMNS],header=records[0]?.values;
 if(!header||header.length!==4||header.some((v,i)=>v!==expected[i])){
  errors.push({line:1,column:"en-tête",code:"header",message:"En-tête strict attendu : "+expected.join(",")});
 }
 if(records.length-1>MAX_ROWS)errors.push({line:0,column:"fichier",code:"rows-limit",message:"Maximum 5000 lignes."});
 for(const item of records.slice(1,MAX_ROWS+1)){
  if(item.values.length===1&&item.values[0]==="")continue;
  if(item.values.length!==4){errors.push({line:item.line,column:"structure",code:"columns",message:"Quatre valeurs attendues."});continue;}
  const [cycle_id,metric_code,rawValue,quality]=item.values;
  if(!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(cycle_id))
   errors.push({line:item.line,column:"cycle_id",code:"cycle-id",message:"Identifiant de cycle invalide."});
  if(!historicalCsvCodeAllowed(mode,metric_code))
   errors.push({line:item.line,column:"metric_code",code:"metric-code",message:"Code source non autorisé pour ce mode."});
  const value=/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(rawValue)?Number(rawValue):NaN;
  if(!Number.isFinite(value)||value>1000000000)
   errors.push({line:item.line,column:"value",code:"value",message:"Nombre positif ou nul obligatoire, point décimal et 4 décimales maximum."});
  if(quality!=="known"&&quality!=="estimated")
   errors.push({line:item.line,column:"quality",code:"quality",message:"Valeur obligatoire : known ou estimated."});
  if(errors.every(e=>e.line!==item.line))rows.push({line:item.line,cycle_id,metric_code,value,quality:quality as CsvRow["quality"]});
 }
 if(records.length<=1)errors.push({line:1,column:"fichier",code:"empty",message:"Aucune ligne de données."});
 return {valid:errors.length===0,rows:errors.length===0?rows:[],errors};
}
