/**
 * SMN-374 release gate. Disabled until v33 source adapters, database tests and
 * the Windows user acceptance campaign have all been signed off.
 * Do not silently enable from a database schema migration.
 */
export function dashboardBuilderCutoverEnabled(value=process.env.SMN_DASHBOARD_BUILDER_CUTOVER):boolean{
 return value==="enabled";
}
export function dashboardBuilderDestination(teamId?:string|null,cycleId?:string|null):string{
 const params=new URLSearchParams();
 if(teamId)params.set("teamId",teamId);
 if(cycleId)params.set("cycleId",cycleId);
 return "/app/dashboard-builder"+(params.size?"?"+params.toString():"");
}
