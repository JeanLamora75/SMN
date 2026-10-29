export type UpgradeDecision = {kind:"noop"|"migrate"|"refuse"; reason:string};
export function decideUpgrade(status:string, version:number|undefined, migrations:number|undefined):UpgradeDecision {
 if(status!=="initialized") return {kind:"refuse",reason:"Installation non saine : "+status};
 if(version===32 && migrations===32) return {kind:"noop",reason:"Schéma v32 déjà appliqué"};
 if(version===31 && migrations===31) return {kind:"migrate",reason:"Migration v31 → v32 autorisée"};
 return {kind:"refuse",reason:"Version ou historique incompatible : "+String(version)+"/"+String(migrations)};
}
