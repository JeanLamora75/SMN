type Item={source:string;labelFr:string;labelEn:string;fields:string;example:string};
const families:Item[]=[
 {source:"MEMBERS",labelFr:"Membres",labelEn:"Members",
  fields:"MEMBER_NAME · MEMBER_ROLE · MEMBER_START · MEMBER_END",example:"{{ROW:MEMBERS}}"},
 {source:"INDICATORS",labelFr:"Indicateurs",labelEn:"Indicators",
  fields:"INDICATOR_NAME · INDICATOR_TAG · INDICATOR_VALUE · INDICATOR_UNIT",example:"{{ROW:INDICATORS}}"},
 {source:"RISKS",labelFr:"Risques",labelEn:"Risks",
  fields:"RISK_TITLE · RISK_STATUS · RISK_PRIORITY · RISK_DATE",example:"{{ROW:RISKS}}"},
 {source:"OBSTACLES",labelFr:"Obstacles",labelEn:"Obstacles",
  fields:"OBSTACLE_TITLE · OBSTACLE_STATUS · OBSTACLE_PRIORITY · OBSTACLE_DATE",example:"{{ROW:OBSTACLES}}"},
 {source:"NOTES",labelFr:"Notes du tableau de bord",labelEn:"Dashboard notes",
  fields:"NOTE_TEXT · NOTE_STATUS · NOTE_DATE",example:"{{ROW:NOTES}}"},
 {source:"CEREMONIES",labelFr:"Cérémonies",labelEn:"Ceremonies",
  fields:"CEREMONY_TITLE · CEREMONY_STATUS · CEREMONY_START · CEREMONY_END · CEREMONY_DURATION",example:"{{ROW:CEREMONIES}}"},
 {source:"GOALS",labelFr:"Objectifs",labelEn:"Goals",
  fields:"GOAL_TITLE · GOAL_EVALUATION · GOAL_DESCRIPTION · GOAL_COMMENT",example:"{{ROW:GOALS}}"},
 {source:"ACTIONS",labelFr:"Actions",labelEn:"Actions",
  fields:"ACTION_TITLE · ACTION_STATUS · ACTION_PRIORITY · ACTION_DATE",example:"{{ROW:ACTIONS}}"},
 {source:"DECISIONS",labelFr:"Décisions",labelEn:"Decisions",
  fields:"DECISION_TITLE · DECISION_STATUS · DECISION_PRIORITY · DECISION_DATE",example:"{{ROW:DECISIONS}}"}
];
export default function OfficeTags({locale="fr"}:{locale?:"fr"|"en"}){
 const fr=locale==="fr";
 return <details className="border rounded-3 p-3 mt-3">
  <summary className="fw-semibold" role="button">
   {fr?"Catalogue des tags Office (Word / PowerPoint)":"Office tag catalog (Word / PowerPoint)"}
  </summary>
  <p className="text-secondary small mt-3">
   {fr?"Placez le marqueur dans une ligne de tableau du modèle. Les colonnes acceptent les tags indiqués ; la ligne se répète pour chaque élément du sprint autorisé.":
    "Place a marker within a template table row. Its cells use the listed tags; the row repeats for each item in the authorized sprint."}
  </p>
  <div className="table-responsive">
   <table className="table table-sm table-striped align-middle">
    <thead><tr><th scope="col">{fr?"Famille":"Family"}</th>
     <th scope="col">{fr?"Marqueur de ligne":"Row marker"}</th>
     <th scope="col">{fr?"Champs disponibles":"Available fields"}</th></tr></thead>
    <tbody>{families.map(f=><tr key={f.source}>
     <th scope="row">{fr?f.labelFr:f.labelEn}</th>
     <td><code>{f.example}</code></td>
     <td className="small text-break">{f.fields}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <h4 className="h6 mt-3">{fr?"Informations générales et contexte produit":"General information and product context"}</h4>
  <div className="table-responsive">
   <table className="table table-sm table-striped align-middle">
    <thead><tr><th scope="col">Tag</th><th scope="col">{fr?"Valeur SMN":"SMN value"}</th></tr></thead>
    <tbody>{[
     ["TEAM_NAME",fr?"Nom de l'équipe":"Team name"],
     ["SPRINT_NAME",fr?"Nom du sprint":"Sprint name"],
     ["SPRINT_START",fr?"Début du sprint":"Sprint start"],
     ["SPRINT_END",fr?"Fin du sprint":"Sprint end"],
     ["TODAY",fr?"Date de génération du rapport":"Report generation date"],
     ["SPRINT_GOAL",fr?"Tous les objectifs du sprint":"All sprint goals"],
     ["PRODUCT_NAME",fr?"Nom du produit":"Product name"],
     ["PRODUCT_GOAL",fr?"Objectif du produit":"Product goal"],
     ["PRODUCT_VISION",fr?"Vision du produit":"Product vision"],
     ["SPRINT_STATUS",fr?"Statut du sprint":"Sprint status"],
     ["INDICATOR_<TAG>",fr?"Valeur d'un indicateur dynamique":"Dynamic indicator value"]
    ].map(([tag,description])=><tr key={tag}>
     <td><code>{"{{"+tag+"}}"}</code></td><td>{description}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="small text-secondary">
   {fr?"Données absentes : N/D. Plusieurs objectifs de sprint sont restitués sans perte. Les dates suivent la langue du rapport.":
    "Missing values: N/D. Multiple sprint goals are included. Dates follow the report language."}
  </p>
  <p className="small">
   {fr?"Graphiques PNG insérés depuis un tag texte libre (paragraphe/zone texte dédié) :":"PNG charts inserted from a free-standing tag (dedicated paragraph/text box):"}
  </p>
  <div className="small text-break">
   <code>{"{{CHART:TREND|TYPE=pie|TAGS=TAG_A,TAG_B}}"}</code>
   <span className="d-block my-1"><code>{"{{CHART:TREND|TYPE=donut|TAGS=TAG_A,TAG_B}}"}</code></span>
   <code>{"{{CHART:TREND|TYPE=gauge|TAGS=PERCENTAGE_TAG}}"}</code>
  </div>
  <p className="small text-secondary mt-2 mb-0">
   {fr?"Secteurs/anneau : valeurs positives, même unité, maximum six séries. Jauge : une seule série de 0 à 100. Valeur absente : N/D. Les données non disponibles ou les structures non compatibles sont signalées explicitement.":
    "Pie/donut: nonnegative values, one unit, up to six series. Gauge: one series between 0 and 100. Missing value: N/D. Unavailable sources or unsupported structures produce an explicit error."}
  </p>
 </details>;
}
