/** Short display labels only; article bodies remain in content/help/<locale>. */
const labels={
 fr:{
  overview:"Première configuration", "general-settings":"Paramètres généraux",
  teams:"Équipes",members:"Membres",sprints:"Sprints", dashboard:"Tableau de bord",links:"Liens", "kanban-periods":"Périodes Kanban",
  tickets:"Tickets / CSV",calendar:"Calendrier",registries:"Registres",reports:"Rapports",
  "companies":"Entreprises",
  "cadence-settings":"Cadence de l'équipe",
  "ceremonies-settings":"Modèles de cérémonies",
  "capacity-settings":"Capacité (prévu)",
  "indicator-settings":"Catalogue des indicateurs",
  "registry-settings":"Paramètres des registres",
  "link-settings":"Paramètres des liens",
  "working-days-settings":"Jours et horaires travaillés",
  "holidays-settings":"Pays et jours fériés",
  "closures-settings":"Fermetures d'entreprise",
  "absence-settings":"Catégories d'absence",
  "chart-styles-settings":"Styles graphiques des rapports",
  "users-settings":"Comptes utilisateurs",
  "security-settings":"Sécurité et accès",
  "maintenance-settings":"Maintenance, mises à jour et sauvegardes",
  "jira-settings":"Lien Jira",backup:"Sauvegardes et restauration",
  indicators:"Indicateurs dynamiques",faq:"FAQ et dépannage"
 },
 en:{
  overview:"First-time setup","general-settings":"General settings",
  teams:"Teams",members:"Members",sprints:"Sprints", dashboard:"Dashboard",links:"Links","kanban-periods":"Kanban periods",
  tickets:"Tickets / CSV",calendar:"Calendar",registries:"Registers",reports:"Reports",
  "companies":"Companies",
  "cadence-settings":"Team cadence",
  "ceremonies-settings":"Ceremony templates",
  "capacity-settings":"Capacity (planned)",
  "indicator-settings":"Indicator catalog",
  "registry-settings":"Register settings",
  "link-settings":"Link settings",
  "working-days-settings":"Working days and hours",
  "holidays-settings":"Countries and holidays",
  "closures-settings":"Company closures",
  "absence-settings":"Absence categories",
  "chart-styles-settings":"Report chart styles",
  "users-settings":"User accounts",
  "security-settings":"Security and access",
  "maintenance-settings":"Maintenance, updates and backups",
  "jira-settings":"Jira link",backup:"Backup and restore",
  indicators:"Dynamic indicators",faq:"FAQ and troubleshooting"
 }
} as const;
export function helpArticleLabel(id:string,locale:string):string{
 const language=locale==="en"?"en":"fr";
 return labels[language][id as keyof typeof labels.fr]??id;
}
