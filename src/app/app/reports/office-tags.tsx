import type {ReactNode} from "react";
import CopyOfficeTag from "./copy-office-tag";
type Locale="fr"|"en";
type RowDefinition={
 source:string;fr:string;en:string;fields:readonly string[];
};
type ScalarDefinition={key:string;fr:string;en:string;noteFr?:string;noteEn?:string};
type ChartDefinition={type:string;fr:string;en:string;example:string;noteFr:string;noteEn:string};

export const officeRowDefinitions:readonly RowDefinition[]=[
 {source:"MEMBERS_ACTIVE",fr:"Membres actifs",en:"Active team members",
  fields:["MEMBER_NAME","MEMBER_ROLE","MEMBER_FUNCTION","MEMBER_START","MEMBER_END","MEMBER_CITY","MEMBER_COUNTRY","MEMBER_FLAG"]},
 {source:"MEMBERS_INACTIVE",fr:"Membres inactifs",en:"Inactive team members",
  fields:["MEMBER_NAME","MEMBER_ROLE","MEMBER_FUNCTION","MEMBER_START","MEMBER_END","MEMBER_CITY","MEMBER_COUNTRY","MEMBER_FLAG"]},
 {source:"INDICATORS",fr:"Indicateurs dynamiques",en:"Dynamic indicators",
  fields:["INDICATOR_NAME","INDICATOR_TAG","INDICATOR_VALUE","INDICATOR_UNIT"]},
 {source:"RISKS",fr:"Risques",en:"Risks",
  fields:["RISK_TITLE","RISK_STATUS","RISK_PRIORITY","RISK_DATE"]},
 {source:"OBSTACLES",fr:"Obstacles",en:"Obstacles",
  fields:["OBSTACLE_TITLE","OBSTACLE_STATUS","OBSTACLE_PRIORITY","OBSTACLE_DATE"]},
 {source:"DEPENDENCIES",fr:"Dépendances",en:"Dependencies",
  fields:["DEPENDENCY_TITLE","DEPENDENCY_STATUS","DEPENDENCY_DATE","DEPENDENCY_REQUESTER","DEPENDENCY_CONTRIBUTOR","DEPENDENCY_DUE_DATE","DEPENDENCY_AT_RISK","DEPENDENCY_OWNER"]},
 {source:"NOTES",fr:"Notes du tableau de bord",en:"Dashboard notes",
  fields:["NOTE_TEXT","NOTE_STATUS","NOTE_DATE"]},
 {source:"CEREMONIES",fr:"Cérémonies et réunions",en:"Ceremonies and meetings",
  fields:["CEREMONY_TITLE","CEREMONY_STATUS","CEREMONY_START","CEREMONY_END","CEREMONY_DURATION"]},
 {source:"GOALS",fr:"Objectifs du sprint",en:"Sprint goals",
  fields:["GOAL_TITLE","GOAL_EVALUATION","GOAL_DESCRIPTION","GOAL_COMMENT"]},
 {source:"ACTIONS",fr:"Actions",en:"Actions",
  fields:["ACTION_TITLE","ACTION_STATUS","ACTION_PRIORITY","ACTION_DATE"]},
 {source:"DECISIONS",fr:"Décisions",en:"Decisions",
  fields:["DECISION_TITLE","DECISION_STATUS","DECISION_PRIORITY","DECISION_DATE"]},
 {source:"LINKS_TRANSVERSE",fr:"Liens transverses accessibles",en:"Accessible cross-team links",
  fields:["LINK_TITLE","LINK_URL","LINK_LABEL","LINK_DESCRIPTION","LINK_CATEGORY","LINK_SCOPE"]},
 {source:"LINKS_TEAM",fr:"Liens de l'équipe du rapport",en:"Report team links",
  fields:["LINK_TITLE","LINK_URL","LINK_LABEL","LINK_DESCRIPTION","LINK_CATEGORY","LINK_SCOPE"]}
];
export const officeScalarDefinitions:readonly ScalarDefinition[]=[
 {key:"TEAM_NAME",fr:"Nom de l'équipe",en:"Team name"},
 {key:"SPRINT_NAME",fr:"Nom du sprint sélectionné",en:"Selected sprint name"},
 {key:"SPRINT_START",fr:"Date de début du sprint",en:"Sprint start date"},
 {key:"SPRINT_END",fr:"Date de fin du sprint",en:"Sprint end date"},
 {key:"TODAY",fr:"Date de génération du document",en:"Document generation date",
  noteFr:"Selon le fuseau horaire du sprint",noteEn:"In the sprint timezone"},
 {key:"SPRINT_STATUS",fr:"Statut du sprint",en:"Sprint status"},
 {key:"SPRINT_GOAL",fr:"Tous les intitulés d'objectifs du sprint",en:"All sprint goal titles",
  noteFr:"Séparés par « ; » ; issus du snapshot si le sprint est clôturé",
  noteEn:"Separated with « ; »; sourced from the closure snapshot for closed sprints"},
 {key:"PRODUCT_NAME",fr:"Nom du produit associé à l'équipe",en:"Product associated with the team"},
 {key:"PRODUCT_GOAL",fr:"Objectif du produit (contexte de l'équipe)",en:"Product goal (team context)"},
 {key:"PRODUCT_VISION",fr:"Vision du produit (contexte de l'équipe)",en:"Product vision (team context)"},
 {key:"LINK_COUNT_TRANSVERSE",fr:"Nombre de liens transverses accessibles",en:"Count of accessible cross-team links"},
 {key:"LINK_COUNT_TEAM",fr:"Nombre de liens de l'équipe du rapport",en:"Count of report team links"},
 {key:"INDICATOR_<TAG>",fr:"Valeur d'un indicateur actif de l'équipe",en:"Value of an active team indicator",
  noteFr:"Remplacer <TAG> par le tag réel du catalogue, par exemple INDICATOR_VELOCITY",
  noteEn:"Replace <TAG> with the actual catalog tag, e.g. INDICATOR_VELOCITY"}
];
export const officeChartDefinitions:readonly ChartDefinition[]=[
 {type:"bar",fr:"Barres",en:"Bars",
  example:"{{CHART:TREND|TYPE=bar|TAGS=SP_DONE|LAST=6}}",
  noteFr:"Valeurs par sprint",noteEn:"Values by sprint"},
 {type:"line",fr:"Courbes",en:"Lines",
  example:"{{CHART:TREND|TYPE=line|TAGS=SP_DONE,SP_INIT|LAST=6}}",
  noteFr:"Une ou plusieurs séries de même unité",noteEn:"One or more series with the same unit"},
 {type:"area",fr:"Aires remplies",en:"Filled areas",
  example:"{{CHART:TREND|TYPE=area|TAGS=SP_DONE|LAST=6}}",
  noteFr:"Évolution sur les sprints",noteEn:"Evolution across sprints"},
 {type:"pie",fr:"Secteurs",en:"Pie",
  example:"{{CHART:TREND|TYPE=pie|TAGS=SP_DONE,SP_INIT}}",
  noteFr:"Répartition des valeurs du sprint sélectionné ; valeurs négatives refusées",
  noteEn:"Selected sprint values; negative values rejected"},
 {type:"donut",fr:"Anneau",en:"Donut",
  example:"{{CHART:TREND|TYPE=donut|TAGS=SP_DONE,SP_INIT}}",
  noteFr:"Répartition des valeurs du sprint sélectionné",
  noteEn:"Breakdown of selected sprint values"},
 {type:"gauge",fr:"Jauge",en:"Gauge",
  example:"{{CHART:TREND|TYPE=gauge|TAGS=RATE_PERCENT}}",
  noteFr:"Une seule valeur, comprise entre 0 et 100",
  noteEn:"Exactly one value between 0 and 100"}
];
const mark=(key:string)=>"{{"+key+"}}";
function TagSection({title,children,initiallyOpen=false}:{title:string;children:ReactNode;initiallyOpen?:boolean}){
 return <details className="border rounded-3 mb-3 smn-office-tag-section" open={initiallyOpen}>
  <summary className="fw-semibold p-3" style={{cursor:"pointer"}}>{title}</summary>
  <div className="px-3 pb-3">{children}</div>
 </details>;
}
export default function OfficeTags({locale="fr",expanded=false}:{locale?:Locale;expanded?:boolean}){
 const fr=locale==="fr";
 const simple=officeScalarDefinitions.filter(item=>!item.key.startsWith("INDICATOR_"));
 const indicators=officeScalarDefinitions.filter(item=>item.key.startsWith("INDICATOR_"));
 const scalarTable=(definitions:readonly ScalarDefinition[])=><div className="table-responsive">
  <table className="table table-sm table-striped align-middle">
   <thead><tr><th scope="col">Tag</th><th scope="col">{fr?"Information":"Meaning"}</th></tr></thead>
   <tbody>{definitions.map(item=><tr key={item.key}>
    <td><div className="d-flex flex-wrap align-items-center gap-2"><code>{mark(item.key)}</code><CopyOfficeTag value={mark(item.key)} fr={fr}/></div></td>
    <td>{fr?item.fr:item.en}{(fr?item.noteFr:item.noteEn)&&
     <div className="small text-secondary">{fr?item.noteFr:item.noteEn}</div>}</td>
   </tr>)}</tbody>
  </table>
 </div>;
 return <div id="smn-office-tags">
  <p className="text-secondary small mt-3">
   {fr?"Ces tags sont utilisables dans les modèles DOCX et PPTX pour l'équipe et le sprint sélectionnés. La génération conserve les éléments fixes du modèle pour les structures Office prises en charge.":
    "Use these tags in DOCX and PPTX templates for the selected team and sprint. Generation preserves fixed template content for supported Office structures."}
  </p>

  <TagSection title={fr?"1. Informations simples":"1. Scalar values"} initiallyOpen={expanded}>
   <p className="small">{fr?"Insérer directement un tag dans un paragraphe Word ou une zone de texte PowerPoint. Plusieurs tags peuvent partager un paragraphe.":"Insert tags directly into Word paragraphs or PowerPoint text boxes. Multiple tags may share a paragraph."}</p>
   {scalarTable(simple)}
  </TagSection>
  <TagSection title={fr?"2. Indicateurs":"2. Indicators"}>
   <p className="small">{fr?"Remplacez <TAG> par le tag réel de l'indicateur dans le catalogue SMN.":"Replace <TAG> with the actual indicator tag from the SMN catalog."}</p>
   {scalarTable(indicators)}
  </TagSection>
  <TagSection title={fr?"3. Tableaux de données métier":"3. Business data tables"}>
  <p className="small">{fr?
   "Deux collections indépendantes : {{ROW:LINKS_TRANSVERSE}} pour tous les liens transverses accessibles, et {{ROW:LINKS_TEAM}} pour ceux de l'équipe du rapport. Aucun choix manuel. Tri par catégorie puis titre ; LINK_LABEL produit un hyperlien cliquable. Les compteurs sont utilisables hors tableaux. Une collection vide n'ajoute aucune ligne. Sur PowerPoint, le ROW doit être dans la ligne de tableau ou le paragraphe à répéter.":
   "Two independent collections: {{ROW:LINKS_TRANSVERSE}} for all accessible cross-team links, and {{ROW:LINKS_TEAM}} for links belonging to the report team. No manual selection. Sorted by category then title; LINK_LABEL produces a clickable hyperlink. Counters can appear outside tables. Empty collections add no rows. In PowerPoint, ROW must be in the table row or paragraph to be repeated."}</p>
  <p className="small">
   {fr?"Dans le modèle, créer un tableau puis placer un marqueur {{ROW:SOURCE}} dans sa ligne d'exemple. Ajouter les champs voulus dans les cellules de cette même ligne. SMN reproduit la ligne pour chaque élément du sprint, en conservant sa mise en forme compatible.":
    "Create a table in the template and place a {{ROW:SOURCE}} marker in its sample row. Add the desired fields in the cells of that row. SMN repeats the row for each item in the sprint, retaining supported formatting."}
  </p>
  <div className="table-responsive">
   <table className="table table-sm table-striped align-middle">
    <thead><tr><th scope="col">{fr?"Famille":"Family"}</th>
     <th scope="col">{fr?"Marqueur de ligne":"Row marker"}</th>
     <th scope="col">{fr?"Tags de colonnes":"Column tags"}</th></tr></thead>
    <tbody>{officeRowDefinitions.map(item=><tr key={item.source}>
     <th scope="row">{fr?item.fr:item.en}</th>
     <td><div className="d-flex align-items-center flex-wrap gap-2"><code>{mark("ROW:"+item.source)}</code><CopyOfficeTag value={mark("ROW:"+item.source)} fr={fr}/></div></td>
     <td>{item.fields.map((field,index)=><span key={field}>
      {index>0?", ":""}<span className="d-inline-flex align-items-center gap-1 me-2"><code>{mark(field)}</code><CopyOfficeTag value={mark(field)} fr={fr}/></span>
     </span>)}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="small">
   {fr?"Exemple de ligne de tableau pour les risques :":"Example of a risk table row:"}
   {" "}<code>{mark("ROW:RISKS")+mark("RISK_TITLE")}</code><CopyOfficeTag value={mark("ROW:RISKS")+mark("RISK_TITLE")} fr={fr}/>
   {" · "}<code>{mark("RISK_STATUS")}</code><CopyOfficeTag value={mark("RISK_STATUS")} fr={fr}/>
   {" · "}<code>{mark("RISK_PRIORITY")}</code><CopyOfficeTag value={mark("RISK_PRIORITY")} fr={fr}/>
  </p>

  <p className="small mb-2">
   {fr?"Dans PowerPoint, les marqueurs ROW peuvent également être placés dans un paragraphe d'une zone de texte : SMN répète ce paragraphe pour chaque entrée en conservant les styles. Les tags de champs doivent appartenir au même paragraphe.":"In PowerPoint, ROW markers can also be placed in a text-box paragraph: SMN repeats that paragraph for each entry while keeping the formatting. Field tags must be in the same paragraph."}
  </p>
  <p className="small text-secondary">
   {fr?"Exemple : {{ROW:RISKS}}{{RISK_TITLE}} — {{RISK_STATUS}}. Si aucune donnée n'est présente, le bloc affiche notamment « Aucun risque identifié », « Aucun obstacle identifié » ou « Aucune dépendance identifiée ». Les modèles peuvent déborder visuellement et ne sont pas redimensionnés automatiquement.":"Example: {{ROW:RISKS}}{{RISK_TITLE}} — {{RISK_STATUS}}. Empty lists display “No risks identified”, “No obstacles identified” or “No dependencies identified”. Text-box overflow remains possible; layouts are not automatically resized."}
  </p>
  <p className="small text-secondary">
   {fr?"Pour les membres, MEMBER_FUNCTION représente la fonction professionnelle. Les listes actifs/inactifs sont établies au dernier jour du sprint sélectionné. MEMBER_CITY et MEMBER_COUNTRY utilisent la dernière localisation effective au sprint ; s'il n'existe pas encore de localisation à cette date, la localisation la plus récente est utilisée. Dans PowerPoint, placez MEMBER_FLAG en début de paragraphe ou de cellule : SMN insère alors le drapeau PNG de public/flags. Dans Word, MEMBER_FLAG reste un drapeau Unicode.":"For members, MEMBER_FUNCTION is the professional function and active/inactive lists use the selected sprint’s last day. MEMBER_CITY and MEMBER_COUNTRY use the latest location effective during the sprint; if no location was effective then, the most recent location is used. In PowerPoint, put MEMBER_FLAG at the beginning of a paragraph or cell: SMN embeds the country PNG from public/flags. In Word, MEMBER_FLAG remains a Unicode flag."}
  </p>
  </TagSection>
  <TagSection title={fr?"4. Graphiques de tendances en image PNG":"4. Trend charts as PNG images"}>
  <p className="small">
   {fr?"Le tag graphique doit être seul dans son paragraphe Word ou sa zone de texte PowerPoint. Aucun graphique préconfiguré n'est nécessaire. La légende utilise les indicateurs du catalogue SMN.":
    "The chart tag must be alone in its Word paragraph or PowerPoint text box. No preconfigured chart is required. The legend uses SMN catalog indicators."}
  </p>
  <p className="small">{fr?"Sans paramètres :":"Without parameters:"} <code>{mark("CHART:TREND")}</code> <CopyOfficeTag value={mark("CHART:TREND")} fr={fr}/>.
   {" "}{fr?"Par défaut : barres, six derniers sprints et premier indicateur disponible.":"Default: bars, six recent sprints and the first available indicator."}</p>
  <div className="table-responsive">
   <table className="table table-sm align-middle">
    <thead><tr><th scope="col">{fr?"Type":"Type"}</th><th scope="col">{fr?"Exemple à adapter":"Example to customize"}</th><th scope="col">{fr?"Règle":"Rule"}</th></tr></thead>
    <tbody>{officeChartDefinitions.map(item=><tr key={item.type}>
     <th scope="row">{fr?item.fr:item.en}</th>
     <td><div className="d-flex flex-wrap align-items-center gap-2"><code className="text-break">{item.example}</code><CopyOfficeTag value={item.example} fr={fr}/></div></td>
     <td>{fr?item.noteFr:item.noteEn}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="small">
   {fr?"PowerPoint : le graphique est généré au format et aux dimensions de sa zone de texte, avec une image PNG haute définition. Utilisez une zone non groupée, non pivotée, assez grande pour les textes et laissez le tag seul dans la zone. Les objets voisins ne sont pas modifiés. Word et PowerPoint utilisent le même moteur SVG/PNG lorsqu’un style est disponible ; STYLE=legacy demande explicitement le moteur historique.":
    "PowerPoint: the chart is generated at the target text box's dimensions and aspect ratio as a high-resolution PNG. Use an ungrouped, unrotated box large enough for legible labels and keep the tag alone in the box. Nearby objects are preserved. Word and PowerPoint use the same SVG/PNG renderer when a style is available; STYLE=legacy explicitly requests the historical renderer."}
  </p>
  <div className="border rounded-3 p-3 my-3">
   <h4 className="h6 mb-2">{fr?"Styles graphiques Office":"Office chart styles"}</h4>
   <p className="small mb-2">{fr?
    "Trois styles prédéfinis : Cockpit Agile, Corporate et Minimal. Dans Paramètres → Rapports → Styles graphiques Office, la galerie M1 permet de consulter, filtrer, dupliquer et gérer les styles personnalisés ; la fiche M2 propose des réglages pliables et un aperçu sur demande. Les styles prédéfinis sont protégés.":
    "Three built-in styles: Cockpit Agile, Corporate and Minimal. In Settings → Reports → Office chart styles, the M1 gallery lets you browse, filter, duplicate and manage custom styles; the M2 editor has collapsible settings and an on-demand preview. Built-in styles are protected."}</p>
   <p className="small mb-2">{fr?
    "Dans Rapports → Modèles (M3), le sélecteur facultatif « Style graphique du rapport » vaut initialement « Styles par défaut ». Il n'ajoute pas d'étape, ne modifie pas les styles globaux et ne change pas le modèle Office. Il s'applique uniquement à l'export en cours.":
    "In Reports → Templates (M3), the optional “Report chart style” selector starts at “Default styles”. It adds no mandatory step, changes no global defaults or Office templates, and applies only to the current export."}</p>
   <p className="small fw-semibold mb-1">{fr?"Priorité de résolution :":"Resolution precedence:"}</p>
   <ol className="small mb-2">
    <li>{fr?"STYLE explicite dans le tag du graphique":"Explicit STYLE in the chart tag"}</li>
    <li>{fr?"Style choisi facultativement pour ce rapport (M3)":"Optional style chosen for this export (M3)"}</li>
    <li>{fr?"Style global par défaut du type de graphique":"Global default for this chart type"}</li>
    <li>{fr?"Moteur historique uniquement si le catalogue n'est pas installé ou si STYLE=legacy est indiqué":"Legacy renderer only when the catalog is not installed or STYLE=legacy is specified"}</li>
   </ol>
   <p className="small mb-1">{fr?"Exemples de tags à copier :":"Copyable tag examples:"}</p>
   <div className="d-grid gap-2 mb-2">
    {[
     "{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=6|STYLE=corporate}}",
     "{{CHART:TREND|TYPE=bar|TAGS=SP_DONE|LAST=6|STYLE=minimal}}",
     "{{CHART:TREND|TYPE=bar|STYLE=legacy}}"
    ].map(example=><div className="d-flex flex-wrap gap-2 align-items-center" key={example}>
     <code className="text-break">{example}</code><CopyOfficeTag value={example} fr={fr}/>
    </div>)}
   </div>
   <p className="small mb-1">{fr?
    "STYLE accepte l'identifiant technique exact (minuscules, chiffres et traits d'union) d'un style du catalogue. « corporate » et « minimal » sont des exemples intégrés ; un nom affiché n'est pas nécessairement un identifiant. Un style explicitement introuvable ou invalide provoque une erreur : aucun document incorrect n'est généré.":
    "STYLE accepts the exact technical ID (lowercase letters, digits and hyphens) of a catalog style. “corporate” and “minimal” are built-in examples; a displayed name is not necessarily its ID. An unknown or invalid explicit style fails generation rather than producing an incorrect document."}</p>
   <p className="small text-secondary mb-0">{fr?
    "Options communes de M2 : palette, fond, couleur du texte, police, taille, titre/sous-titre, légende, étiquettes, décimales et espacement. Options par famille : orientation/empilement/espacement/arrondis des barres ; épaisseur/marqueurs/lissage des courbes ; opacité/empilement des aires ; séparation/pourcentages des secteurs ; rayon intérieur/valeur centrale des anneaux ; épaisseur/bornes/seuils des jauges. Les graphiques exportés sont des PNG, non des graphiques natifs éditables dans Office.":
    "M2 common options: palette, background, text color, font, size, title/subtitle, legend, labels, decimals and spacing. Per-type options: bars orientation/stacking/gap/radius; lines width/markers/smoothing; areas opacity/stacking; pie separation/percentages; donut inner radius/center value; gauges thickness/bounds/thresholds. Exports are PNG images, not native editable Office charts."}</p>
  </div>
  <p className="small fw-semibold">
   {fr?"Attention : SP_DONE, SP_INIT et RATE_PERCENT ne sont que des exemples. Le tag doit exister, être actif pour l'équipe et visible dans ses Tendances ; sinon la génération échoue avec le tag concerné.":
    "Important: SP_DONE, SP_INIT and RATE_PERCENT are examples only. The indicator tag must exist, be active for the team and visible in Trends; otherwise generation reports the missing tag."}
  </p>
  <p className="small text-secondary">
   {fr?"Paramètres facultatifs : TYPE (bar, line, area, pie, donut, gauge), LAST (1 à 24 sprints), TAGS (1 à 6 indicateurs disponibles, de même unité), STYLE (identifiant de style graphique, prioritaire sur le choix du rapport). Remplacez les exemples SP_DONE, SP_INIT et RATE_PERCENT par les tags de votre catalogue. La jauge exige une seule série en pourcentage.":
    "Optional parameters: TYPE (bar, line, area, pie, donut, gauge), LAST (1 to 24 sprints), TAGS (1 to 6 available indicators sharing the same unit), STYLE (chart style ID; overrides the report choice). Replace sample tags SP_DONE, SP_INIT and RATE_PERCENT with tags from your own catalog. Gauges require exactly one percentage series."}
  </p>

  </TagSection>
  <TagSection title={fr?"5. Règles de génération et limites":"5. Generation rules and limits"}>
  <ul className="small mb-0">
   <li>{fr?"Donnée reconnue absente : N/D ; zéro reste 0. Les tags inconnus restent inchangés.":"A missing recognized value becomes N/D; zero remains 0. Unknown tags stay unchanged."}</li>
   <li>{fr?"SPRINT_GOAL rassemble les intitulés de tous les objectifs ; ROW:GOALS restitue une ligne par objectif, avec son évaluation.":"SPRINT_GOAL joins all goal titles; ROW:GOALS creates one row per goal, including its evaluation."}</li>
   <li>{fr?"TODAY utilise la date de génération dans le fuseau horaire du sprint ; les dates suivent la langue FR/EN choisie.":"TODAY uses the generation date in the sprint timezone; dates use the selected FR/EN language."}</li>
   <li>{fr?"PRODUCT_GOAL et PRODUCT_VISION proviennent du contexte de l'équipe. NOTES correspond aux notes du tableau de bord du sprint, pas aux notes libres du brouillon de rapport.":"PRODUCT_GOAL and PRODUCT_VISION come from team context. NOTES refers to sprint dashboard notes, not free-form report draft notes."}</li>
   <li>{fr?"Les données de tableaux portent sur un sprint sélectionné ; il n'existe pas encore de consolidation automatique de plusieurs sprints pour ces listes.":"Table rows cover one selected sprint; automatic multi-sprint consolidation for these lists is not yet supported."}</li>
   <li>{fr?"Les fusions verticales, tableaux imbriqués et certains modèles Open XML complexes ne sont pas pris en charge. Les recettes visuelles Microsoft Office restent nécessaires.":"Vertical merges, nested tables and some complex Open XML templates are unsupported. Microsoft Office visual validation is still required."}</li>
  </ul>

  </TagSection>
 </div>;
}
