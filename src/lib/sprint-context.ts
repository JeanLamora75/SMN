/** Référentiel partagé (client/serveur) pour la sélection contextuelle des Sprints. */
export type SprintContextItem=Readonly<{
 id:string;
 name:string;
 status:string;
 startAt:string;
 endAt:string;
 timeZone:string;
 suspended:boolean;
}>;

const instant=(v:string)=>new Date(v).getTime();

/** État temporel effectif, calculé sans modifier les statuts stockés. */
export function effectiveSprintStatus(item:SprintContextItem,now=Date.now()):string{
 if(item.suspended)return "suspended";
 if(item.status==="closed")return "closed";
 const start=instant(item.startAt),end=instant(item.endAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end)return item.status;
 if(now<start)return "planned";
 if(now>=end)return "finished";
 return "active";
}

/**
 * Priorité à un Sprint réellement en cours (dates), même si sa transition en
 * base est en attente de réconciliation après l'arrêt de l'application.
 * Sans Sprint actif : prochain à venir puis dernier passé.
 * Les Sprints suspendus ou clôturés ne deviennent jamais actifs par défaut.
 */
export function defaultSprintId(items:readonly SprintContextItem[],now=Date.now()):string|null{
 const available=items.filter(s=>!s.suspended && s.status!=="closed" &&
  Number.isFinite(instant(s.startAt))&&Number.isFinite(instant(s.endAt))&&
  instant(s.startAt)<instant(s.endAt));
 const current=available.filter(s=>instant(s.startAt)<=now&&now<instant(s.endAt))
  .sort((a,b)=>instant(b.startAt)-instant(a.startAt)||a.id.localeCompare(b.id));
 if(current.length)return current[0].id;
 const upcoming=available.filter(s=>instant(s.startAt)>now)
  .sort((a,b)=>instant(a.startAt)-instant(b.startAt)||a.id.localeCompare(b.id));
 if(upcoming.length)return upcoming[0].id;
 const past=available.filter(s=>instant(s.endAt)<=now)
  .sort((a,b)=>instant(b.endAt)-instant(a.endAt)||a.id.localeCompare(b.id));
 // Si seuls des Sprints clôturés/suspendus subsistent, le sélecteur conserve
 // une valeur valide plutôt que d'afficher à tort « aucun cycle créé ».
 return past[0]?.id??items[0]?.id??null;
}

/** Un identifiant explicitement demandé n'est retenu que s'il appartient à l'équipe. */
export function selectedSprint(
 items:readonly SprintContextItem[],requested:string|undefined|null,now=Date.now()
):SprintContextItem|null{
 if(requested){
  const found=items.find(item=>item.id===requested);
  if(found)return found;
 }
 const id=defaultSprintId(items,now);
 return items.find(item=>item.id===id)??null;
}
