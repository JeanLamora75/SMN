/** Contrat pur des formulaires de création/édition des équipes.
 * Le client ne décide ni de l'installation ni des droits d'accès.
 */
export type TeamFormValues=Readonly<{
 name:string;
 productName:string|null;
 vision:string|null;
 productGoal:string|null;
}>;
export type TeamCreateInput=TeamFormValues;
export type TeamUpdateInput=TeamFormValues&Readonly<{teamId:string;revision:number}>;

const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u;
const NAME_MAX=120;
const CONTENT_MAX=5000;
const invalidName=/[\u0000-\u001f\u007f]/u;
const invalidText=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

function asRecord(raw:unknown):Record<string,unknown>|null{
 return raw!==null&&typeof raw==="object"&&!Array.isArray(raw)?
   raw as Record<string,unknown>:null;
}
function exactKeys(data:Record<string,unknown>,required:readonly string[],optional:readonly string[]):boolean{
 const keys=Object.keys(data);
 return required.every(key=>Object.prototype.hasOwnProperty.call(data,key))&&
   keys.every(key=>required.includes(key)||optional.includes(key));
}
function nameValue(raw:unknown,required:boolean):string|null|undefined{
 if(raw===null||raw===undefined||raw==="")return required?undefined:null;
 if(typeof raw!=="string"||invalidName.test(raw))return undefined;
 const value=raw.trim().replace(/\s+/gu," ");
 if(!value)return required?undefined:null;
 return value.length<=NAME_MAX?value:undefined;
}
function textValue(raw:unknown):string|null|undefined{
 if(raw===null||raw===undefined)return null;
 if(typeof raw!=="string"||invalidText.test(raw))return undefined;
 const value=raw.replace(/\r\n?/gu,"\n").trim();
 return value.length<=CONTENT_MAX?value||null:undefined;
}
function parseFields(data:Record<string,unknown>):TeamFormValues|null{
 const name=nameValue(data.name,true),productName=nameValue(data.productName,false);
 const vision=textValue(data.vision),productGoal=textValue(data.productGoal);
 if(!name||productName===undefined||vision===undefined||productGoal===undefined)return null;
 return {name,productName,vision,productGoal};
}

/** Création : le seul champ obligatoire est le nom de l'équipe. */
export function parseTeamCreate(raw:unknown):TeamCreateInput|null{
 const data=asRecord(raw);
 if(!data||!exactKeys(data,["name"],["productName","vision","productGoal"]))return null;
 return parseFields(data);
}

/** Mise à jour : un ID et une révision servent au contrôle de concurrence. */
export function parseTeamUpdate(raw:unknown):TeamUpdateInput|null{
 const data=asRecord(raw);
 if(!data||!exactKeys(data,["teamId","revision","name","productName","vision","productGoal"],[])||
    typeof data.teamId!=="string"||!ID.test(data.teamId)||
    typeof data.revision!=="number"||!Number.isSafeInteger(data.revision)||
    data.revision<0)return null;
 const fields=parseFields(data);
 return fields?{...fields,teamId:data.teamId,revision:data.revision}:null;
}

/** Même comparaison pour création et renommage ; toujours limitée à une installation. */
export function normalizedTeamName(name:string):string{
 return name.trim().replace(/\s+/gu," ").toLocaleLowerCase("fr");
}
