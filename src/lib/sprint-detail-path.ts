/** Navigation vers la fiche de l'unique Sprint autorisé par sa clé serveur. */
export function sprintDetailPath(id:string):string{
 return "/app/admin/sprints/"+encodeURIComponent(id);
}
