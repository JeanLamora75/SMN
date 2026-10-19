# Rapport de validation globale BMAD — PRD Scrum Master Notebook

- **Branche :** `docs/bmad-prd-smn-20261018`
- **PRD :** [prd.md](prd.md) (`status: draft`)
- **Sources :** Product Brief final, registre F-01 à F-124, cadrage fonctionnel, 81 exigences FR et annexes, journal D-PRD-001 à D-PRD-129.
- **Référentiel :** `.agents/skills/bmad-prd/assets/prd-validation-checklist.md`, sept dimensions, avec revue complémentaire adversariale.
- **Date :** 2026-10-19
- **Note globale :** **Fair — favorable sous réserves** (PRD exploitable pour démarrer l'architecture/UX, **non prêt à finalisation ni au découpage exhaustif des US**)
- **Écarts uniques du rubric :** 0 critique, **5 élevés**, **9 moyens**, 1 faible. La revue adversariale fournit 12 scénarios complémentaires, partiellement recoupés : ils ne sont pas additionnés comme 12 écarts uniques.

## Synthèse et verdict

La vision, les objectifs de diminution de la saisie, les règles de provenance, la non-confusion des données absentes et des zéros, les modes Scrum/Kanban au MVP, SAFe en v1.0, les exports et la confidentialité sont cohérents avec le Product Brief. Les **81 FR sont uniques et continues**, et les **129 décisions D-PRD sont retrouvées** dans le journal. Les cinq conditions cumulatives d'accès au pilote sont conservées **sans affirmer qu'elles ont été atteintes**.

Quatre règles transverses imposent une réponse avant de développer les stories qui en dépendent : **création rétrospective et événements**, **capacité initiale historique**, **version d'instantané après reclôture**, **contrat et application des CSV**. Une cinquième réserve est structurante pour le pilotage : **prioriser les incréments du MVP** sans retirer implicitement les fonctions approuvées. Les autres points sont principalement à préparer par l'architecture, l'UX ou la rédaction des stories.

## Verdict par dimension

| Dimension du rubric | Verdict | Justification synthétique |
|---|---|---|
| Décisions prêtes à arbitrer | **thin** | Exception reprise historique, politique de snapshot, contrat d'import. |
| Substance métier | **adequate** | Règles détaillées, données manquantes et confidentialité bien distinguées. |
| Cohérence stratégique | **adequate** | Finalité claire ; MVP chargé à séquencer. |
| Critères de fin / testabilité | **thin** | Plusieurs résultats attendus dépendent de politiques non arrêtées. |
| Honnêteté du périmètre | **adequate** | Frontière Scrum/Kanban–SAFe nette ; PDF et reprises Kanban à préciser. |
| Utilisabilité aval | **thin** | Références continues, mais dépendances métiers dispersées. |
| Format et densité | **thin** | Spécification par capacités appropriée, document très volumineux. |

## Constats par gravité

### Critiques (0)

Aucun constat à ce niveau.

### Élevés (5)

- **A1 — Exceptions aux automatismes pour les Sprints rétrosaisis non finalisées** (`prd.md` FR-17, lignes 384–390 ; FR-42, lignes 872–873 ; `reprise-imports-historiques.md` FR-42) — FR-17 génère les événements à chaque création de Sprint tandis que HIS-01 exige de ne pas fabriquer des événements tenus dans le passé. La distinction entre événement théorique et événement réellement tenu n'est pas définie dans ce parcours. Correction : décider un comportement spécifique « reprise historique », états initiaux admissibles et présentation sans observation fictive.
- **A2 — Gel de capacité initiale sans événement d'ouverture fiable dans le passé** (`prd.md` FR-14, lignes 304–311 ; FR-42 ; `reprise-imports-historiques.md` FR-42/FR-46) — à la création d'un Sprint déjà achevé, l'ouverture réelle est antérieure à l'entrée dans SMN. Calculer avec la composition et les absences actuelles créerait une fausse valeur initiale. Correction : arbitrer « valeur historique renseignée avec preuve » / « non renseignée » et interdire un recalcul présenté comme valeur réellement figée au début.
- **A3 — Réouverture/reclôture et versions des instantanés non arbitrées** (`prd.md` FR-16, FR-41 ; `registres-qualitatifs.md` FR-41, lignes 92–107) — les registres centraux évoluent, tandis que l'instantané à la clôture doit représenter le passé. Après réouverture, le traitement de l'ancienne photographie et de la nouvelle clôture n'est pas déterminé. Correction : choisir une politique d'instantanés versionnés/consultables et de nouveaux bilans, tout en gardant les PDF antérieurs immuables.
- **A4 — Contrat d'import CSV et politique de lot insuffisants pour une US testable** (`prd.md` FR-43 à FR-45 ; `reprise-imports-historiques.md`, lignes 31–65 et 99–105) — colonnes/types/identification de cycle, collisions et comportement **tout-ou-rien ou application partielle confirmée** sont explicitement ouverts. Correction : rédiger la v1 du schéma CSV et une matrice d'erreurs/doublons et d'engagement transactionnel avant le découpage des stories d'import.
- **A6 — MVP étendu sans séquencement de réalisation et de test explicite** (`prd.md` §§4 à 7, 81 FR ; Product Brief « MVP — cycle complet simplifié ») — le MVP porte 81 FR, six registres, exports, briefs IA, snapshots, sécurité/backup et recette ; l'ordre et les dépendances entre lots ne sont pas définis. Correction : produire une **carte de livraison MVP par incréments**, préservant les capacités validées, avec un chemin critique vers la première expérimentation et un budget de saisie mesurable ; ne pas repousser silencieusement une exigence approuvée.

### Moyens (9)

- **A5 — Exigences non fonctionnelles sans bornes de recette encore arrêtées** (`prd.md` §8 ; `securite-exploitation.md` FR-66 à FR-73 ; `recette-finalisation-mvp.md` FR-79/FR-80) — navigateurs/versions, WCAG cible, budgets de performance, restauration (RPO/RTO), conservation et seuils de disponibilité restent ouverts. Correction : faire prendre en charge ces paramètres par l'architecture et établir la matrice de recette avant toute affirmation de conformité.
- **A7 — Matrice probabilité × impact 3×3 sans correspondance des neuf cases** (`registres-qualitatifs.md` FR-36, lignes 43–51, et FR-39) — le cockpit « risques élevés » dépend de la classification, or aucune table des neuf combinaisons n'est validée. Correction : valider la matrice exacte et les cas « Non calculable » avant création des critères de test du calcul.
- **A8 — Déclencheurs des faits marquants automatiques et prévention des doublons encore ouverts** (`registres-qualitatifs.md` FR-40, §3) — aucun catalogue minimal avec source, déclencheur, date d'effet et politique de déduplication n'est arrêté. Correction : fixer un catalogue initial court, administrable et idempotent.
- **A9 — Reprise Kanban historique optionnelle dans un domaine annoncé MVP Scrum/Kanban** (`prd.md` FR-42 et §6 ; `reprise-imports-historiques.md` FR-42, ligne 29) — seule la rétrosaisie des Sprints est expressément engagée, mais le titre du domaine et les imports couvrent les deux modes. Correction : afficher dans une matrice MVP ce qui est livré en **création rétrospective** Kanban, en **import de KPI** Kanban et dans les bilans historiques.
- **A10 — Statut de conservation des PDF exportés et politique de suppression non explicites** (`prd.md` FR-31, FR-69 ; `reportings-html-pdf.md` FR-31 ; `securite-exploitation.md` FR-68/FR-69) — « ancien PDF inchangé » n'indique pas si SMN conserve et propose de retrouver **tous** les exports ; FR-68 ne sauvegarde que ceux « effectivement stockés ». Correction : choisir si le MVP archive les PDF, où l'utilisateur les retrouve, et ce qui est supprimable sans casser l'historique ; retenir à l'architecture la politique technique de rétention.
- **A11 — Suppression de données nominatives versus archives immuables à réconcilier** (`prd.md` FR-4/FR-54/FR-69 ; `securite-exploitation.md` FR-67/FR-69) — l'archivage stable protège les preuves historiques, mais la suppression des données personnelles et des fichiers associés doit être gouvernée. Correction : établir un régime fonctionnel des suppressions/masquages et de conservation, puis examiner les obligations légales applicables avant diffusion.
- **A12 — Bases temporelles hétérogènes non explicitées en restitution** (`prd.md` FR-20/D-PRD-078, ligne 492 ; FR-41, ligne 864 ; `reportings-html-pdf.md` FR-30) — les tendances chiffrées historiques peuvent utiliser des corrections enregistrées **ultérieurement**, alors que les états qualitatifs reprennent l'instantané **de clôture**. Les deux choix sont documentés, mais un même rapport historique pourrait être mal interprété. Correction : indiquer l'origine temporelle et les corrections éventuelles dans le reporting, sans modifier la règle existante.
- **A14 — Scénarios transverses non regroupés dans une matrice de dépendances** (`prd.md` §§4.7–4.21 ; annexes) — des règles similaires sont dispersées (dates → événements → capacité → registres → export ; création historique → clôture → tendances). Correction : synthétiser 6 à 10 scénarios de bout en bout et leurs FR sources dans une vue compacte pour Architecture et Epics.
- **A15 — PRD trop long et proche d'un backlog narratif** (`prd.md` §4 et annexes, 81 FR) — le parcours de lecture stratégique est noyé dans les détails, même si le découpage en annexes a commencé. Correction : à l'étape Update/Polish, distinguer une synthèse structurante (vision, MVP, règles transversales, succès, non-objectifs), une table FR/versions et les annexes d'acceptation, **sans supprimer la traçabilité des 129 décisions**.

### Faibles (1)

- **A13 — Documentation de navigation et statut du PRD non actualisés** (`prd.md` introduction, §§0/4/9) — l'en-tête « brouillon initial » et l'annonce de UJ/SM « à écrire » datent du début, alors que 81 FR et les critères de succès ont déjà été documentés. Correction : après arbitrages, remplacer ces indications par un index des annexes, un statut de revue et la liste des livrables encore réellement manquants.

## Priorités de correction proposées

| Vague | Écarts | Décision attendue | Responsable de l'arbitrage |
|---|---|---|---|
| **P0 — avant stories concernées** | A1, A2 | Événements et capacité initiale en saisie rétrospective | Product Manager + utilisateur |
| **P0 — avant stories concernées** | A3 | Réouverture/reclôture et versions d'instantanés | Product Manager + utilisateur |
| **P0 — avant stories d'import** | A4 | Schéma CSV minimal, règles de collision, application intégrale/partielle | Product Manager + utilisateur, puis Architecture |
| **P1 — préparer l'architecture et le plan MVP** | A6, A9, A10, A11 | Incréments MVP, historique Kanban, archivage PDF et politique de suppression | Product Manager + utilisateur, Architecte pour faisabilité |
| **P1 — avant stories analytiques** | A7, A8, A12 | Matrice des risques, faits marquants et référence temporelle du reporting | Product Manager + utilisateur |
| **P1 — avant recette technique/pilote** | A5 | Navigateurs, accessibilité, performance, sauvegarde et reprise ; preuves réelles | Architecte + QA + utilisateur |
| **P2 — polish/handoff** | A13, A14, A15 | Nettoyer les libellés obsolètes, fournir index et scénarios transverses | Product Manager |

## Ce que le rapport ne dit pas

- Il **ne** remet **pas** en cause les 129 décisions validées ni ne remplace les détails de leurs annexes.
- Il **ne** signifie **pas** que des tests logiciels, des simulations d'incident, un audit de sécurité ou une recette d'accessibilité ont eu lieu.
- Il **n'autorise pas** la création de tickets Jira, la modification du code, la fusion dans `main` ou le lancement du pilote.
- Il ne transforme pas les inconnues d'architecture (base de données, mode d'hébergement, chiffrement, RPO/RTO, choix technique d'authentification) en décisions fonctionnelles arbitraires.

## Suites BMAD recommandées

1. **Revue ciblée des quatre écarts P0**, avec propositions groupées et validation métier explicite. Corriger ensuite le PRD et les annexes concernées, en journalisant les décisions.
2. **Découpage de livraison MVP** en incréments utilisables et démontrables, en conservant le périmètre approuvé, puis arbitrage des vraies ambiguïtés Kanban/reporting/risques.
3. **Polish document** et contrôle croisé finale `prd.md` / Brief / registre F / D-PRD / annexes, puis application du processus BMAD Finalize pour passer de `draft` à `final` **seulement après accord**.
4. Lancer **Winston — Architecte BMAD** avec le PRD final, les annexes et les décisions techniques clairement ouvertes ; préparer ensuite les Epics/Stories dans Jira après validation.

## Références des revues

- [Revue rubrique BMAD (sept dimensions)](review-rubric.md)
- [Revue adversariale (douze scénarios)](review-adversarial-general.md)
- [Questions historiques conservées](questions-ouvertes-detaillees.md)
- [Exigences Recette](recette-finalisation-mvp.md)
- [Exigences Sécurité](securite-exploitation.md)
