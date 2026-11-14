import {NextResponse} from "next/server";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSessionReadDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import {requestLocale} from "@/i18n/locale.server";
import {loadHelpContent} from "@/server/help-content";
import type {HelpMode} from "@/lib/help-catalog";

export const dynamic="force-dynamic";

/** Read-only endpoint: reuse the canonical permission and locale checks. */
export async function GET(_request:Request,{params}:{params:Promise<{articleId:string}>}){
 const actor=await currentAccount();
 if(!actor||!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))
  return NextResponse.json({error:"unavailable"},{status:404,headers:{"Cache-Control":"private, no-store"}});
 const {articleId}=await params;
 const locale=await requestLocale();
 const context=await withSessionReadDb(db=>readAccountDashboard(db,{
  accountId:actor.id,role:actor.role
 })).catch(()=>null);
 const raw=context?.context?.mode;
 const mode:HelpMode|null=raw==="scrum"||raw==="kanban"?raw:null;
 const article=await loadHelpContent(articleId,locale,actor,mode);
 if(article.status!=="ready")return NextResponse.json({error:"unavailable"},{
  status:404,headers:{"Cache-Control":"private, no-store"}
 });
 return NextResponse.json({
  articleId:article.articleId,contentLocale:article.contentLocale,
  isFallback:article.isFallback,markdown:article.markdown
 },{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
