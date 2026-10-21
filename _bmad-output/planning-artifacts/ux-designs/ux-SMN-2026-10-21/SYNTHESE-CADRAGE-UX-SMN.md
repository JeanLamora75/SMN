# Scrum Master Notebook — Synthèse finale du cadrage UX (proposition)

**Date :** 21 octobre 2026  
**Agent :** Sally — UX Designer BMAD v6.12.4  
**Statut :** document de **validation fonctionnelle et visuelle**, non publié  
**Périmètre :** tableau de bord Scrum/Kanban du MVP et structure anticipant SAFe/ART  
**Maquette de référence :** [MAQUETTE-REFERENCE.md](MAQUETTE-REFERENCE.md)

## 1. Décision de cadrage

Le tableau de bord existant doit céder la place à un **cockpit de pilotage Agile pleine largeur**. La priorité visuelle est donnée au Sprint ou à la période consulté(e), avec ses objectifs, dates et métriques. Les informations opérationnelles sont regroupées dans quatre colonnes sous le bloc principal. Le dispositif respecte l'utilisation non collaborative, la saisie minimale, les données collectives, la traçabilité et les KPI facultatifs.

La maquette approuvée sert de **référence de composition**, pas de source de données. Ses noms, personnes, chiffres, dates, taux et événements sont illustratifs. La disponibilité réelle des modules métier doit être vérifiée indépendamment de l'apparence.

## 2. Décisions validées pendant la concertation

| # | Sujet | Décision validée |
|---|---|---|
| UXD-01 | Approche générale | Vue d'ensemble intermédiaire et équilibrée |
| UXD-02 | Écran | Contenu sur **100 % de la largeur utile**, pas de largeur maximale arbitraire |
| UXD-03 | Menu | Sidebar rétractable, pleine hauteur sous le header |
| UXD-04 | Header | Sélecteur **Équipe** puis **Sprint/Période**, à gauche de Recherche |
| UXD-05 | Cycle | Courant par défaut s'il est unique ; anciens cycles dans la sélection ; changement sans quitter la page |
| UXD-06 | Cohérence du contexte | Toutes les informations métier du tableau de bord suivent le cycle sélectionné |
| UXD-07 | Données historiques | Dernières valeurs historiques corrigées, traçabilité des corrections ; pas de confusion avec l'état actuel |
| UXD-08 | Comparaisons | Évolution par rapport au cycle immédiatement précédent quand pertinente et fiable |
| UXD-09 | En-tête de bloc cycle | Nom, dates début/fin, statut, objectif(s) et lien de détail |
| UXD-10 | Cartes KPI | **4 à 6** cartes selon largeur ; trois premières scindées en « prévu/engagé » et « réel/réalisé » |
| UXD-11 | Capacité | Capacité prévue en **J/H** versus capacité réelle de l'équipe en **J/H**, incluant absences imprévues constatées |
| UXD-12 | Engagement | SP et tickets **initialement engagés** / réalisés, seulement à partir de sources valides |
| UXD-13 | Échéance | **Jours ouvrés restants** selon une semaine **lundi-vendredi**, mis en évidence ; bornes/fuseau à confirmer |
| UXD-14 | Suivi | 4 colonnes : Obstacles, Risques, Événements, Notes/Alertes |
| UXD-15 | Nombre d'items | **5 maximum** par colonne ; « Voir tout » donne accès à l'ensemble, états clos inclus |
| UXD-16 | Tri | Automatique : criticité/ancienneté pour obstacles ; criticité/échéance pour risques ; chronologie pour événements ; alertes prioritaires puis notes récentes |
| UXD-17 | Notes et alertes | Icônes et couleurs distinctes, états terminés masqués ; configuration dans Notes/Alertes avec indication de portée |
| UXD-18 | Ajout | Action « Ajouter » placée sous la dernière fiche de chaque colonne lorsqu'autorisée |
| UXD-19 | Carte détaillée | Expansion sur place **et** accès à la page complète |
| UXD-20 | Actions rapides | Menu `…` permettant consultations, éditions/statuts selon type, droits et état du cycle |
| UXD-21 | Historique clôturé | Corrections contrôlées depuis la fiche avec règles métier de réouverture et traçabilité |
| UXD-22 | Personnalisation | Réorganisation des cartes métriques **et** des quatre colonnes ; pas de tri manuel des fiches internes ; préférence mémorisée |
| UXD-23 | Responsive | **4 / 2 / 1 colonnes** suivant la largeur utile ; commandes conservées |

## 3. Architecture de l'écran

```text
HEADER GLOBAL
  SMN / identité | [Équipe] [Sprint / Période] [Recherche] | Compte

SIDEBAR DÉPLOYABLE (toute la hauteur disponible sous le header)

CONTENU PLEINE LARGEUR
  ┌ En-tête de Sprint / Période ──────────────────────────────────────────┐
  │ Nom, dates, statut, objectif(s), fiche                               │
  │ [Capacité prévue/réelle] [SP] [Tickets] [Jours ouvrés restants] [...] │
  └──────────────────────────────────────────────────────────────────────┘
  ┌ Obstacles ────┬ Risques ─────┬ Événements ───┬ Notes/Alertes ──────┐
  │ max. 5 cartes │ max. 5       │ max. 5        │ max. 5              │
  │ + Ajouter     │ + Ajouter    │ + Ajouter     │ + Ajouter           │
  └───────────────┴──────────────┴───────────────┴─────────────────────┘
```

L'ensemble doit rester exploitable sur écran large, fenêtre réduite, tablette et smartphone. Ni l'en-tête ni les quatre colonnes ne doivent subir une contrainte de largeur maximale empêchant d'exploiter l'écran. Les contrôles administratifs ou futurs ne doivent pas être présentés comme déjà opérationnels.

## 4. Règles métier et sécurité à ne pas déformer

- Un Sprint peut avoir **plusieurs objectifs** : le visuel doit permettre leur lecture ou un accès explicite à tous.
- Capacité prévue/constatée en **J/H de développement**, calculée à partir des disponibilités applicables à la période : **pas** un nombre de jours de travail effectivement dépensés, ni une mesure de performance individuelle.
- « SP engagés » doit respecter les conventions du PRD (initiaux, ajoutés, retirés, terminés) ; aucune conversion SP/JH et pas d'agrégation de SP entre équipes.
- Les indicateurs sont **facultatifs** : pas de zéro inventé, de taux arbitraire ou de note de performance implicite.
- Risques/dépendances sont des **fiches centrales** pouvant être liées à plusieurs cycles. Pour un cycle clôturé, utiliser l'**instantané de la dernière clôture validée** (V1/V2…) conformément à D-PRD-122 et D-PRD-130 ; les versions et anciens PDF restent préservés.
- Les opérations sur un cycle clôturé empruntent le circuit de correction contrôlé et ne changent pas implicitement l'état courant d'un risque partagé.
- Les alertes de configuration sont facultatives et **globales** ; ne pas les faire passer pour des faits historiques de l'ancien cycle.
- Le MVP connaît **une équipe par installation** : le sélecteur Équipe est prévu pour cohérence d'interface et extension future, sans inventer une multiéquipe déjà développée.
- Le tableau collectif respecte les profils `admin` et `user`, ainsi que l'autorisation serveur, la confidentialité et l'i18n FR/EN centralisée.

## 5. Ce qui reste explicitement à arbitrer / vérifier

| Priorité | Point | Conséquence |
|---|---|---|
| **Technique** | Jours ouvrés : **lundi au vendredi validés** ; inclusion du jour courant et fuseau encore à préciser | À figer avant codage du compteur |
| **Données** | Engagement **initial validé** : vérifier le stockage initial des SP et tickets et leur caractère exploitable | Afficher l'absence si ces données ne sont pas fiables |
| **Métier** | Carte « Avancement global » : **ne pas afficher** sans règle validée ; boutons de raccourcis éventuels à arbitrer | Quatre cartes initiales possibles |
| **Historique** | Vérifier les événements, obstacles, notes, alertes réellement disponibles en base | À défaut, afficher « Aucun éléments à ce jour », sans reconstitution fictive |
| **Présentation** | Où montrer une alerte de configuration actuelle lorsqu'un ancien cycle est affiché ? | Recommandation : sous-section « Configuration actuelle », hors total historique, à confirmer |
| **Stockage** | Ordre du dashboard mémorisé par compte ou par installation ? | Guide la conception de la persistance |
| **Parcours** | Présélection du cycle s'il existe plusieurs états ouverts/terminés éligibles | Nécessite une règle déterministe et compréhensible |
| **Technique** | Mesure réelle du contraste et breakpoints fonction du conteneur | Recette responsive et thèmes avant implémentation définitive |
| **Livraison** | Pages de création, calendriers, KPI et historique non encore disponibles dans le MVP pilote | Découpage ultérieur en Stories et états vides honnêtes |

Aucun de ces points ne remet en cause la **composition générale approuvée**. Les trois premiers et la restitution historique doivent être réglés avant l'affichage de données réelles.

## 6. Livrables BMAD joints

1. [DESIGN.md](DESIGN.md) — apparence, tokens YAML proposés, composition, palettes existantes, typographie et composants.
2. [EXPERIENCE.md](EXPERIENCE.md) — navigation, architecture de l'information, états, comportements, interactions, accessibilité, parcours et **17 scénarios de recette proposés**.
3. [maquette-reference-validee.png](maquette-reference-validee.png) — visuel fourni/validé en discussion ; tous les contenus affichés sont fictifs.

**Emplacement de publication GitHub validé :**

`_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/`

Les contrats ont été approuvés en conversation le 21/10/2026 puis préparés pour publication documentaire GitHub et synchronisation Jira. Aucune migration, commande applicative ni test n'est impliqué. Le processus officiel `bmad-ux` a été **adapté à ChatGPT** : lecture du skill et des références, collecte conversationnelle des décisions et création de brouillons ; le `memlog.py`, les sous-agents, le Reviewer Gate automatisé et la publication ne sont pas prétendus exécutés. Les contrats sont publiés avec `status: final` à la suite de l'accord explicite de l'utilisateur ; une revue indépendante et la recette restent non exécutées.

## 7. Validation enregistrée

**Cadrage et contrats DESIGN.md / EXPERIENCE.md validés explicitement par l'utilisateur le 21/10/2026.** L'utilisateur a autorisé leur publication sur GitHub et leur référencement dans Jira. Ce mandat n'autorise pas de développement applicatif, migration, changement de statut Jira ou prétention de tests réussis.

### Références vérifiables

- [Skill BMAD UX de SMN](https://github.com/JeanLamora75/SMN/blob/main/.agents/skills/bmad-ux/SKILL.md)
- [Contrat DESIGN.md du skill](https://github.com/JeanLamora75/SMN/blob/main/.agents/skills/bmad-ux/references/design-md-spec.md)
- [PRD — parcours utilisateur et ergonomie](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/parcours-utilisateur-ergonomie.md)
- [PRD — risques et snapshots historiques](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/risques-dependances.md)
- [Tableau de bord actuel](https://github.com/JeanLamora75/SMN/blob/main/docs/TABLEAU-DE-BORD-SMN-21.md)
- [Apparence SMN-24](https://github.com/JeanLamora75/SMN/blob/main/docs/APPARENCE-SMN-24.md)
- [Accessibilité et responsive](https://github.com/JeanLamora75/SMN/blob/main/docs/RESPONSIVE-ACCESSIBILITE-SMN-25.md)

### Derniers arbitrages — UXD-24 à UXD-27

| ID | Décision définitive |
|---|---|
| UXD-24 | Compteur en jours ouvrés **du lundi au vendredi** (inclusion du jour courant et fuseau à préciser) |
| UXD-25 | **SP et tickets initialement engagés** comme référence, sans écraser les valeurs initiales après changement du périmètre |
| UXD-26 | **Supprimer « Avancement global »** tant qu'aucune règle n'existe ; éventuels accès rapides à concevoir séparément |
| UXD-27 | Si aucune donnée historique fiable n'est disponible, afficher **« Aucun éléments à ce jour »**, sans valeurs inventées |
