import type {Client} from "pg";
import {listLinks,type LinkActor} from "@/server/links/catalog";
import {buildOfficeLinkRows,type VisibleLink} from "@/lib/office-link-projection";
export {officeLinkSources,buildOfficeLinkRows} from "@/lib/office-link-projection";
export type {OfficeLinkSource,OfficeLinkLabel} from "@/lib/office-link-projection";

/** Read only the current actor/team-visible catalog. No report selection and no cross-team leak. */
export async function readOfficeLinkRows(db:Client,actor:LinkActor,teamId:string,locale:"fr"|"en"){
 const visible=await listLinks(db,actor,teamId) as VisibleLink[];
 return buildOfficeLinkRows(visible,teamId,locale);
}
