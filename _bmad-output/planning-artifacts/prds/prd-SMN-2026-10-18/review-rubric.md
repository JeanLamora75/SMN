# Revue qualité BMAD du PRD — Scrum Master Notebook (SMN)

> **Document historique — consolidation du 19/10/2026.** Cette revue est conservée avec ses constats d'origine. Pour l'état courant, consulter le [PRD final](prd.md), les [arbitrages D-PRD-132 à 136](arbitrages-metier-valides-2026-10-19.md) et le [suivi BMAD](../../../../docs/ETAT-PROJET-BMAD.md). Les points A7/A8/A10/A11 et la matrice à deux profils sont désormais validés ; aucune preuve technique n'est ajoutée ici.

**Date :** 2026-10-19 · **Mode :** Validate (lecture et critique uniquement) · **État examiné :** branche `docs/bmad-prd-smn-20261018`, `prd.md` (blob `8c850e143bb3db15daafe68b675a6b607763407a`) et les annexes du même dossier.  
**Référentiel :** `.agents/skills/bmad-prd/assets/prd-validation-checklist.md` (sept dimensions), Product Brief final, `docs/DECISIONS-FONCTIONNELLES.md` et `docs/CADRAGE-FONCTIONNEL.md`.  
**Portée de vérification :** documentaire seulement. Aucun test logiciel, aucune commande BMAD locale ni certification n'a été exécuté.

## Verdict global

**Fair — utilisable pour lancer la réflexion d'architecture et d'UX, mais pas encore prêt à être déclaré final ni découpé intégralement en User Stories sans clarifications ciblées.** Le métier est richement documenté, les décisions et les identifiants sont cohérents, les frontières Scrum/Kanban MVP versus SAFe v1.0 et les cinq critères de passage au pilote restent fidèles au Product Brief. Le risque majeur réside dans les interactions **reprise historique ↔ automatismes de cycle**, **clôture ↔ instantanés**, **import CSV ↔ intégrité**, ainsi que dans la hiérarchisation du périmètre.

## 1. Decision-readiness — thin

La majorité des choix ont un statut explicite et des références D-PRD ; cependant, plusieurs règles dont dépend directement le comportement utilisateur sont volontairement restées « à préciser », y compris sur des parcours indispensables au MVP. Les décisions à différer en architecture sont généralement correctement annoncées ; il faut distinguer les choix techniques des **exceptions métier** qui ne peuvent être déduites des FR actuelles.

### Constats
- **[high] A1 — Exceptions aux automatismes pour les Sprints rétrosaisis non finalisées** (`prd.md` FR-17, lignes 384–390 ; FR-42, lignes 872–873 ; `reprise-imports-historiques.md` FR-42) — FR-17 génère les événements à chaque création de Sprint tandis que HIS-01 exige de ne pas fabriquer des événements tenus dans le passé. La distinction entre événement théorique et événement réellement tenu n'est pas définie dans ce parcours. *Fix :* décider un comportement spécifique « reprise historique », états initiaux admissibles et présentation sans observation fictive.
- **[high] A2 — Gel de capacité initiale sans événement d'ouverture fiable dans le passé** (`prd.md` FR-14, lignes 304–311 ; FR-42 ; `reprise-imports-historiques.md` FR-42/FR-46) — à la création d'un Sprint déjà achevé, l'ouverture réelle est antérieure à l'entrée dans SMN. Calculer avec la composition et les absences actuelles créerait une fausse valeur initiale. *Fix :* arbitrer « valeur historique renseignée avec preuve » / « non renseignée » et interdire un recalcul présenté comme valeur réellement figée au début.
- **[high] A3 — Réouverture/reclôture et versions des instantanés non arbitrées** (`prd.md` FR-16, FR-41 ; `registres-qualitatifs.md` FR-41, lignes 92–107) — les registres centraux évoluent, tandis que l'instantané à la clôture doit représenter le passé. Après réouverture, le traitement de l'ancienne photographie et de la nouvelle clôture n'est pas déterminé. *Fix :* choisir une politique d'instantanés versionnés/consultables et de nouveaux bilans, tout en gardant les PDF antérieurs immuables.
- **[high] A4 — Contrat d'import CSV et politique de lot insuffisants pour une US testable** (`prd.md` FR-43 à FR-45 ; `reprise-imports-historiques.md`, lignes 31–65 et 99–105) — colonnes/types/identification de cycle, collisions et comportement **tout-ou-rien ou application partielle confirmée** sont explicitement ouverts. *Fix :* rédiger la v1 du schéma CSV et une matrice d'erreurs/doublons et d'engagement transactionnel avant le découpage des stories d'import.

## 2. Substance over theater — adequate

Le PRD ne se contente pas de noms d'écrans : capacités, périodes, événements, métriques, sources et provenance sont détaillés ; les annexes donnent huit séries de critères d'acceptation par domaine récent. Les principes « vide ≠ zéro », « SP ≠ JH », « aucun TXT envoyé automatiquement » et « pas de notation individuelle » sont concrets et cohérents. Les NFR ont de vrais enjeux métier, mais leur vérifiabilité technique reste faible.

### Constat
- **[medium] A5 — Exigences non fonctionnelles sans bornes de recette encore arrêtées** (`prd.md` §8 ; `securite-exploitation.md` FR-66 à FR-73 ; `recette-finalisation-mvp.md` FR-79/FR-80) — navigateurs/versions, WCAG cible, budgets de performance, restauration (RPO/RTO), conservation et seuils de disponibilité restent ouverts. *Fix :* faire prendre en charge ces paramètres par l'architecture et établir la matrice de recette avant toute affirmation de conformité.

## 3. Strategic coherence — adequate

La stratégie du Product Brief est respectée : utilisateur SM/RTE, faible saisie, mémoire contextuelle, reports HTML/PDF, Scrum/Kanban avant SAFe et cinq conditions cumulatives pour le pilote. La richesse de la couverture fonctionnelle peut néanmoins entrer en tension avec la recherche de simplicité et le temps disponible.

### Constat
- **[high] A6 — MVP étendu sans séquencement de réalisation et de test explicite** (`prd.md` §§4 à 7, 81 FR ; Product Brief « MVP — cycle complet simplifié ») — le MVP porte 81 FR, six registres, exports, briefs IA, snapshots, sécurité/backup et recette ; l'ordre et les dépendances entre lots ne sont pas définis. *Fix :* produire une **carte de livraison MVP par incréments**, préservant les capacités validées, avec un chemin critique vers la première expérimentation et un budget de saisie mesurable ; ne pas repousser silencieusement une exigence approuvée.

## 4. Done-ness clarity — thin

Les FR nouvelles sont plus directement testables grâce aux annexes, mais plusieurs décisions encore ouvertes commandent les résultats attendus des tests. Les scénarios négatifs importants sont identifiés sans comportement de résolution exact.

### Constats
- **[medium] A7 — Matrice probabilité × impact 3×3 sans correspondance des neuf cases** (`registres-qualitatifs.md` FR-36, lignes 43–51, et FR-39) — le cockpit « risques élevés » dépend de la classification, or aucune table des neuf combinaisons n'est validée. *Fix :* valider la matrice exacte et les cas « Non calculable » avant création des critères de test du calcul.
- **[medium] A8 — Déclencheurs des faits marquants automatiques et prévention des doublons encore ouverts** (`registres-qualitatifs.md` FR-40, §3) — aucun catalogue minimal avec source, déclencheur, date d'effet et politique de déduplication n'est arrêté. *Fix :* fixer un catalogue initial court, administrable et idempotent.
- **[medium] A9 — Reprise Kanban historique optionnelle dans un domaine annoncé MVP Scrum/Kanban** (`prd.md` FR-42 et §6 ; `reprise-imports-historiques.md` FR-42, ligne 29) — seule la rétrosaisie des Sprints est expressément engagée, mais le titre du domaine et les imports couvrent les deux modes. *Fix :* afficher dans une matrice MVP ce qui est livré en **création rétrospective** Kanban, en **import de KPI** Kanban et dans les bilans historiques.

## 5. Scope honesty — adequate

Les formats post-MVP, intégrations automatiques, non-collaboration des membres et usages SAFe v1.0 sont correctement identifiés. Les exceptions régionales (D-PRD-021), les absences de données et les limites des imports sont exposées plutôt que cachées. Il faut rendre certaines frontières de persistance et de sécurité plus explicites.

### Constats
- **[medium] A10 — Statut de conservation des PDF exportés et politique de suppression non explicites** (`prd.md` FR-31, FR-69 ; `reportings-html-pdf.md` FR-31 ; `securite-exploitation.md` FR-68/FR-69) — « ancien PDF inchangé » n'indique pas si SMN conserve et propose de retrouver **tous** les exports ; FR-68 ne sauvegarde que ceux « effectivement stockés ». *Fix :* choisir si le MVP archive les PDF, où l'utilisateur les retrouve, et ce qui est supprimable sans casser l'historique ; retenir à l'architecture la politique technique de rétention.
- **[medium] A11 — Suppression de données nominatives versus archives immuables à réconcilier** (`prd.md` FR-4/FR-54/FR-69 ; `securite-exploitation.md` FR-67/FR-69) — l'archivage stable protège les preuves historiques, mais la suppression des données personnelles et des fichiers associés doit être gouvernée. *Fix :* établir un régime fonctionnel des suppressions/masquages et de conservation, puis examiner les obligations légales applicables avant diffusion.

## 6. Downstream usability — thin

Les identifiants FR-1 à FR-81 sont complets, les références D-PRD-001 à D-PRD-129 sont toutes présentes dans le journal, les annexes de domaine sont reliées. En revanche, la documentation est très dense et la phrase « voir FR-X » ne suffit pas pour qu'un architecte trouve rapidement les règles et exceptions qui doivent être implémentées ensemble.

### Constats
- **[medium] A12 — Bases temporelles hétérogènes non explicitées en restitution** (`prd.md` FR-20/D-PRD-078, ligne 492 ; FR-41, ligne 864 ; `reportings-html-pdf.md` FR-30) — les tendances chiffrées historiques peuvent utiliser des corrections enregistrées **ultérieurement**, alors que les états qualitatifs reprennent l'instantané **de clôture**. Les deux choix sont documentés, mais un même rapport historique pourrait être mal interprété. *Fix :* indiquer l'origine temporelle et les corrections éventuelles dans le reporting, sans modifier la règle existante.
- **[low] A13 — Documentation de navigation et statut du PRD non actualisés** (`prd.md` introduction, §§0/4/9) — l'en-tête « brouillon initial » et l'annonce de UJ/SM « à écrire » datent du début, alors que 81 FR et les critères de succès ont déjà été documentés. *Fix :* après arbitrages, remplacer ces indications par un index des annexes, un statut de revue et la liste des livrables encore réellement manquants.
- **[medium] A14 — Scénarios transverses non regroupés dans une matrice de dépendances** (`prd.md` §§4.7–4.21 ; annexes) — des règles similaires sont dispersées (dates → événements → capacité → registres → export ; création historique → clôture → tendances). *Fix :* synthétiser 6 à 10 scénarios de bout en bout et leurs FR sources dans une vue compacte pour Architecture et Epics.

## 7. Shape fit — thin

Le choix de la **spécification par capacités** convient à cet outil interne piloté par un seul opérateur ; des User Journeys détaillées et artificielles ne sont pas nécessaires. Toutefois, le PRD principal compte environ 250 000 caractères, avec des répétitions et des règles de conception déjà très approfondies, ce qui complique l'usage comme document d'arbitrage pour les étapes BMAD suivantes.

### Constat
- **[medium] A15 — PRD trop long et proche d'un backlog narratif** (`prd.md` §4 et annexes, 81 FR) — le parcours de lecture stratégique est noyé dans les détails, même si le découpage en annexes a commencé. *Fix :* à l'étape Update/Polish, distinguer une synthèse structurante (vision, MVP, règles transversales, succès, non-objectifs), une table FR/versions et les annexes d'acceptation, **sans supprimer la traçabilité des 129 décisions**.

## Notes mécaniques

- **Contrôlé sur GitHub :** 81 FR numérotées **FR-1 à FR-81**, **uniques et continues** ; aucune référence FR hors plage dans le PRD.
- **Contrôlé :** 129 entrées distinctes `D-PRD-001` à `D-PRD-129` dans le journal. L'entrée D-PRD-021 possède une précision entre parenthèses dans son libellé : elle était initialement absente d'un comptage automatique trop strict, mais a bien été retrouvée à l'inspection.
- **Contrôlé :** annexes de domaine mentionnées par le PRD présentes dans le dossier de la branche.
- **Product Brief :** cinq conditions de passage au pilote inchangées ; elles sont des objectifs, pas des performances effectivement observées.
- **Technique :** aucun développement, suite de tests, expérience utilisateur, chronométrage ou restauration réelle n'a été vérifié.
- **Adaptation BMAD :** lecture du skill officiel `.agents/skills/bmad-prd/SKILL.md` et de la rubrique de validation ; script local `uv run`, sous-agents et ouverture d'un navigateur distant indisponibles dans cet échange. Revue documentaire manuelle séquentielle via le connecteur GitHub ; aucune commande BMAD simulée.
