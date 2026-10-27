/** Après changement d'équipe, revenir au Cockpit racine.
 * Ne jamais conserver des URL métier, ID de cycle, filtres, archives ou brouillons
 * appartenant potentiellement à l'équipe précédente.
 */
export type TeamNavigationMode="scrum"|"kanban"|null;
const validId=(v:string):boolean=>/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/u.test(v);

export function teamSwitchDestination(_pathname:string,teamId:string,
 _mode:TeamNavigationMode):string{
 if(!validId(teamId))return "/app";
 return "/app?"+new URLSearchParams({teamId}).toString();
}
