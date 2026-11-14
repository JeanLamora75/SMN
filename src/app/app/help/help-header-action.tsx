"use client";

import {usePathname} from "next/navigation";
import {HelpContextButton} from "./help-context-button";

// The route is matched exactly: unrelated screens never inherit another guide.
const articles:Readonly<Record<string,string>>={
 "/app/admin/settings":"general-settings",
 "/app/admin/settings/general":"general-settings",
 "/app/admin/settings/teams":"teams",
 "/app/admin/settings/jira":"jira-settings",
 "/app/admin/settings/maintenance":"backup",
 "/app/admin/members":"members",
 "/app/team-calendar":"calendar",
 "/app/admin/kanban-periods":"kanban-periods",
 "/app/admin/sprints":"sprints",
 "/app/tickets":"tickets",
 "/app/reports":"reports",
 "/app/admin/indicators":"indicators",
 "/app/admin/registries":"registries",
};

export default function HelpHeaderAction({screenTitle,className}:{
 screenTitle:string;className?:string;
}){
 const pathname=usePathname();
 const articleId=articles[pathname];
 if(!articleId)return null;
 return <HelpContextButton articleId={articleId} screenTitle={screenTitle}
  className={className}/>;
}
