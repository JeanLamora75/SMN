export type LinkEntry={id:string;title:string;url:string;description:string|null;scope:"TRANSVERSE"|"EQUIPE";teamId:string|null;categoryId:string;categoryName:string;revision:number;createdAt?:string;updatedAt?:string};
export type LinkFilters={search:string;scope:string;category:string;sort:string};
export function filterLinks(items:readonly LinkEntry[],filters:LinkFilters):LinkEntry[]{
 const q=filters.search.trim().toLocaleLowerCase();
 return items.filter(item=>(!q||[item.title,item.description,item.url,item.categoryName].some(v=>v?.toLocaleLowerCase().includes(q)))&&
  (filters.scope==="all"||item.scope===filters.scope)&&
  (filters.category==="all"||item.categoryId===filters.category))
  .sort((a,b)=>filters.sort==="category"?
   a.categoryName.localeCompare(b.categoryName)||a.title.localeCompare(b.title):
   filters.sort==="recent"?
    (Date.parse(b.updatedAt??"")||0)-(Date.parse(a.updatedAt??"")||0)||a.title.localeCompare(b.title):
    a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
}
