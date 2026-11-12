/** Pure filters shared by the settings catalogues; never mutate records or permissions. */
const includes=(value:string,query:string)=>value.toLocaleLowerCase().includes(query);
const search=(query:string)=>query.trim().toLocaleLowerCase();

export function filterSettingsTeams<T extends {name:string;productName:string|null;isArchived:boolean}>(
 items:readonly T[],query:string,status:"all"|"active"|"archived"
):T[]{
 const q=search(query);
 return items.filter(item=>
  (status==="all"||(status==="active"?!item.isArchived:item.isArchived))&&
  (!q||[item.name,item.productName??""].some(value=>includes(value,q)))
 );
}
export function filterSettingsAbsences<T extends {name:string;isActive:boolean}>(
 items:readonly T[],query:string,status:"all"|"active"|"inactive"
):T[]{
 const q=search(query);
 return items.filter(item=>
  (status==="all"||(status==="active"?item.isActive:!item.isActive))&&
  (!q||includes(item.name,q))
 );
}
export function filterSettingsUsers<T extends {username:string;email:string;role:"admin"|"user";is_active:boolean}>(
 items:readonly T[],query:string,status:"all"|"active"|"inactive",role:"all"|"admin"|"user"
):T[]{
 const q=search(query);
 return items.filter(item=>
  (status==="all"||(status==="active"?item.is_active:!item.is_active))&&
  (role==="all"||item.role===role)&&
  (!q||[item.username,item.email].some(value=>includes(value,q)))
 );
}
export function filterSettingsCeremonies<T extends {id:string;name:string;active:boolean}>(
 items:readonly T[],query:string,status:"all"|"active"|"inactive",selectedId:string
):T[]{
 const q=search(query);
 return items.filter(item=>
  item.id===selectedId||
  ((status==="all"||(status==="active"?item.active:!item.active))&&(!q||includes(item.name,q)))
 );
}
