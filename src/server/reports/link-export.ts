import "server-only";
import type {Client} from "pg";
import type {LinkActor} from "@/server/links/catalog";
import {listLinks} from "@/server/links/catalog";
import {readReportLinks} from "./link-selection";
import type {ExportLink} from "@/lib/report-links-export";
/** Resolve selected IDs against the report team's current visibility. */
export async function selectedReportExportLinks(db:Client,actor:LinkActor,sprintId:string,teamId:string):Promise<ExportLink[]>{
 const saved=await readReportLinks(db,sprintId);
 const visible=await listLinks(db,actor,teamId);
 const byId=new Map(visible.map(link=>[link.id as string,link]));
 return saved.ids.flatMap(id=>{const link=byId.get(id);return link?[{title:link.title as string,url:link.url as string}]:[];});
}
