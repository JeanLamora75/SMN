/** Navigation après changement explicite de l'équipe active.
 *
 * Les URLs sont des destinations internes allowlistées. Les identifiants de
 * l'ancienne fiche, cycle, filtre ou snapshot ne sont jamais réemployés.
 * La destination ne dispense jamais de l'autorisation des API/pages métier.
 */
export type TeamNavigationMode="scrum"|"kanban"|null;
const validId=(v:string):boolean=>/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/u.test(v);

const sections:ReadonlyArray<{prefix:string;destination:string}>= [
 {prefix:"/app/admin/members",destination:"/app/admin/members"},
 {prefix:"/app/team-calendar",destination:"/app/team-calendar"},
 {prefix:"/app/admin/registries",destination:"/app/admin/registries"},
 {prefix:"/app/reports",destination:"/app/reports"},
 {prefix:"/app/admin/sprints",destination:"/app/admin/sprints"},
 {prefix:"/app/admin/settings/teams",destination:"/app/admin/settings/teams"},
 {prefix:"/app/admin/settings",destination:"/app/admin/settings"}
];

export function teamSwitchDestination(pathname:string,teamId:string,
 mode:TeamNavigationMode):string{
 if(!validId(teamId))return "/app";
 // Reject a stale URL carrying filters or a team selection from the previous context.
 if(pathname.includes("?")||pathname.includes("#"))return "/app?"+new URLSearchParams({teamId}).toString();
 let destination="/app";
 if(pathname==="/app")destination="/app";
 else{
  const matched=sections.find(s=>pathname===s.prefix||
   pathname.startsWith(s.prefix+"/"));
  if(matched){
   destination=matched.destination;
   if(destination==="/app/admin/sprints"&&mode!=="scrum")
    destination="/app";
  }
 }
 return destination+"?"+new URLSearchParams({teamId}).toString();
}
