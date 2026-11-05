/** Catalogue partagé Bootstrap Icons (SVG intégrés dans bootstrap-icon.tsx).
 * La liste blanche est commune à l'UI et à la validation des dispositions JSONB.
 * Une extension du catalogue doit ajouter le tracé SVG correspondant au rendu. */
export const DASHBOARD_ICONS = [
 {name:"house-fill",label:"Accueil",category:"Navigation"},
 {name:"bullseye",label:"Objectif",category:"Pilotage"},
 {name:"calendar3",label:"Calendrier",category:"Calendrier"},
 {name:"calendar-event",label:"Événement",category:"Calendrier"},
 {name:"calendar-check",label:"Cérémonie",category:"Calendrier"},
 {name:"people-fill",label:"Équipe",category:"Équipe"},
 {name:"stack",label:"Ensemble",category:"Pilotage"},
 {name:"ticket-perforated-fill",label:"Tickets",category:"Pilotage"},
 {name:"bar-chart-line",label:"Statistiques",category:"Indicateurs"},
 {name:"hourglass-split",label:"Temps",category:"Calendrier"},
 {name:"exclamation-octagon-fill",label:"Obstacle",category:"Risques"},
 {name:"exclamation-triangle-fill",label:"Risque",category:"Risques"},
 {name:"sticky-fill",label:"Note",category:"Contenu"},
 {name:"bell-fill",label:"Alerte",category:"Risques"},
 {name:"chat-dots",label:"Discussion",category:"Équipe"},
 {name:"sliders",label:"Paramètres",category:"Pilotage"},
 {name:"floppy",label:"Enregistrer",category:"Actions"},
 {name:"list-ul",label:"Liste",category:"Contenu"},
 {name:"grid-3x3-gap",label:"Grille",category:"Contenu"},
 {name:"link-45deg",label:"Lien",category:"Contenu"},
 {name:"plus-lg",label:"Ajouter",category:"Actions"},
 {name:"funnel",label:"Filtrer",category:"Actions"},
 {name:"search",label:"Rechercher",category:"Actions"},
 {name:"tag",label:"Étiquette",category:"Contenu"},
 {name:"pencil-square",label:"Modifier",category:"Actions"},
 {name:"trash-fill",label:"Supprimer",category:"Actions"},
 {name:"arrow-left",label:"Précédent",category:"Navigation"},
 {name:"arrow-right",label:"Suivant",category:"Navigation"},
] as const;
export type DashboardIconName = (typeof DASHBOARD_ICONS)[number]["name"];
const iconNames:ReadonlySet<string> = new Set(DASHBOARD_ICONS.map(icon=>icon.name));
export function isDashboardIcon(value:unknown):value is DashboardIconName {
 return typeof value==="string"&&iconNames.has(value);
}
