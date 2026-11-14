/** Short display labels only; article bodies remain in content/help/<locale>. */
const labels={
 fr:{
  overview:"Première configuration", "general-settings":"Paramètres généraux",
  teams:"Équipes",members:"Membres",sprints:"Sprints", "kanban-periods":"Périodes Kanban",
  tickets:"Tickets / CSV",calendar:"Calendrier",registries:"Registres",reports:"Rapports",
  "jira-settings":"Paramètres Jira",backup:"Sauvegardes et restauration",
  indicators:"Indicateurs dynamiques",faq:"FAQ et dépannage"
 },
 en:{
  overview:"First-time setup","general-settings":"General settings",
  teams:"Teams",members:"Members",sprints:"Sprints","kanban-periods":"Kanban periods",
  tickets:"Tickets / CSV",calendar:"Calendar",registries:"Registers",reports:"Reports",
  "jira-settings":"Jira settings",backup:"Backup and restore",
  indicators:"Dynamic indicators",faq:"FAQ and troubleshooting"
 }
} as const;
export function helpArticleLabel(id:string,locale:string):string{
 const language=locale==="en"?"en":"fr";
 return labels[language][id as keyof typeof labels.fr]??id;
}
