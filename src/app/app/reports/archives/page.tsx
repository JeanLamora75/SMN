import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canVisitPrivate} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {listUserPdfArchives} from "@/server/reports/user-archive-library";
import {requestLocale} from "@/i18n/locale.server";
export const dynamic="force-dynamic";
export default async function MyPdfArchives(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canVisitPrivate({role:account.role,mustChangePassword:account.must_change_password}))notFound();
 if(account.role!=="user")redirect("/app/admin/reports/archives");
 const items=await withSprintIndexDb(db=>listUserPdfArchives(db,account.id)).catch(()=>null);
 if(!items)notFound();
 const fr=(await requestLocale())==="fr";
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <h1 className="h4">{fr?"Mes rapports PDF autorisés":"My authorized PDF reports"}</h1>
  <p className="text-secondary">{fr?"Seules les archives explicitement partagées avec votre compte sont affichées.":"Only archives explicitly shared with your account are listed."}</p>
  {items.length===0?<p className="alert alert-info">{fr?"Aucun rapport partagé.":"No reports shared."}</p>:
  <div className="table-responsive"><table className="table table-sm">
  <thead><tr><th scope="col">{fr?"Sprint":"Sprint"}</th><th scope="col">{fr?"Date":"Date"}</th><th scope="col">{fr?"Langue":"Language"}</th><th scope="col">{fr?"Version":"Version"}</th><th scope="col">{fr?"Téléchargement":"Download"}</th></tr></thead>
  <tbody>{items.map(a=><tr key={a.id}><td>{a.cycleName}</td><td>{a.createdAt}</td><td>{a.language}</td>
  <td>{a.snapshotVersion===null?"—":"V"+a.snapshotVersion}</td>
  <td><a className="btn btn-sm btn-outline-primary" href={"/api/admin/reports/archives/"+encodeURIComponent(a.id)+"/download"}>{fr?"Télécharger PDF":"Download PDF"}</a></td></tr>)}</tbody></table></div>}
 </main>;
}
