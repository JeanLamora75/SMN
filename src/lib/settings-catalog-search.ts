import type {SettingsGroup} from "./settings-catalog";

/** Accent/case insensitive, AND across words, scoped to already-authorized entries. */
export const normalizeSettingsQuery=(value:string)=>value.normalize("NFD")
 .replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim().replace(/\s+/g," ");
export function filterSettingsGroups(groups:readonly SettingsGroup[],query:string,
 text:(key:SettingsGroup["label"])=>string):SettingsGroup[]{
 const words=normalizeSettingsQuery(query).split(" ").filter(Boolean);
 if(!words.length)return [...groups];
 return groups.map(group=>({
  ...group,
  entries:group.entries.filter(entry=>{
   const indexed=normalizeSettingsQuery([
    text(entry.label),text(entry.description),text(entry.keywords)
   ].join(" "));
   return words.every(word=>indexed.includes(word));
  })
 })).filter(group=>group.entries.length>0);
}
