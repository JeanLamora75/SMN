import {redirect} from "next/navigation";
import type {ReactNode} from "react";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import SessionActivity from "./session-activity";
import PrivateShell from "./private-shell";
import type {PrivateRole} from "@/lib/private-navigation";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const dynamic="force-dynamic";

/** Les pages privées partagent une navigation accessible et les mêmes contrôles serveur. */
export default async function PrivateLayout({children}:{children:ReactNode}) {
  const account=await currentAccount();
  if(!account)redirect("/login");
  if(account.must_change_password)redirect("/change-password");
  if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/login");
  // Ne jamais inventer de produit/équipe lorsque la base n'est pas disponible.
  const dashboard=await withAuthDb(db=>readAccountDashboard(db,
    {accountId:account.id,role:account.role})).catch(()=>null);
  const context=dashboard?.context??null;
  return <>
    <PrivateShell username={account.username} role={account.role as PrivateRole}
      mode={context?.mode??null} product={context?.product??null}
      team={context?.team??null} teamId={context?.teamId??null}
      teamSwitcherEnabled={MULTI_TEAM_CONTEXT_READY&&account.role==="admin"}>
      {children}
    </PrivateShell>
    <SessionActivity/>
  </>;
}
