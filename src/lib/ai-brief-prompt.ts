/** SMN-472: lossless, repeatable conversion of legacy sections into editable plain text. */
export type LegacyPromptTemplate={
 sections:readonly string[];questions:readonly string[];instructions:readonly string[];
 data:readonly string[];depth:number;
};
/** All legacy fields remain visible, including requested data not yet mapped to Office tags. */
export function convertLegacyPrompt(t:LegacyPromptTemplate):string{
 const lines:string[]=[];
 for(const heading of t.sections)lines.push("## "+heading);
 if(t.questions.length)lines.push("## Questions à traiter",...t.questions.map(x=>"- "+x));
 if(t.instructions.length)lines.push("## Consignes",...t.instructions.map(x=>"- "+x));
 lines.push("## Données demandées (configuration historique)");
 for(const field of t.data)lines.push("- "+field);
 lines.push("## Profondeur historique demandée",String(t.depth)+" cycle(s)");
 lines.push("N'invente aucune donnée et distingue les faits des interprétations.");
 return lines.join("\n").trim()+"\n";
}
export function isValidPromptText(value:unknown):value is string{
 return typeof value==="string"&&value.trim().length>0&&value.length<=100000;
}
