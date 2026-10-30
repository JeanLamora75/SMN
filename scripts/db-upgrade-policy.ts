export type UpgradeDecision={kind:"noop"|"refuse";reason:string};
export function decideUpgrade(status:string,version:number|undefined,migrations:number|undefined):UpgradeDecision {
 if(status!=="initialized")return {kind:"refuse",reason:"Installation non saine : "+status};
 if(version===32&&(migrations===1||migrations===32))
  return {kind:"noop",reason:migrations===1?"Baseline native v32, aucune migration nécessaire":"Schéma historique v32 déjà à niveau"};
 return {kind:"refuse",reason:"Ancienne version ou historique incompatible : "+String(version)+"/"+String(migrations)+". La montée historique exige une procédure de maintenance explicite."};
}
