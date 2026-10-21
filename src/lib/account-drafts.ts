/** Réconcilie les lignes serveur sans écraser les autres brouillons du tableau. */
export type AccountEdit=Readonly<{role:"admin"|"user";isActive:boolean}>;
export type AccountSnapshot=Readonly<{id:string;role:"admin"|"user";is_active:boolean}>;
export function accountEdit(account:AccountSnapshot):AccountEdit{
  return {role:account.role,isActive:account.is_active};
}
export function editedAccount(baseline:AccountSnapshot,edit:AccountEdit|undefined):boolean{
  return !!edit&&(edit.role!==baseline.role||edit.isActive!==baseline.is_active);
}
export function reconcileAccountEdits(
  previous:readonly AccountSnapshot[],
  drafts:Readonly<Record<string,AccountEdit>>,
  incoming:readonly AccountSnapshot[],
  savedId?:string,
):Record<string,AccountEdit>{
  const previousById=new Map(previous.map(a=>[a.id,a]));
  return Object.fromEntries(incoming.map(account=>{
    const baseline=previousById.get(account.id);
    const draft=drafts[account.id];
    const preserve=account.id!==savedId&&!!baseline&&editedAccount(baseline,draft);
    return [account.id,preserve?draft:accountEdit(account)];
  }));
}
