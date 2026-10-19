# SMN — Dossier de finalisation du PRD et transmission à Winston (Architecte BMAD)

> **Addendum métier postérieur :** cette passation est un document historique. A7/A8/A10/A11 sont validés par D-PRD-132 à 135 ; AD-31 est corrigé par D-PRD-136 à **deux profils MVP**. Voir le [registre normatif](arbitrages-metier-valides-2026-10-19.md). Les réserves métier ci-dessous décrivent la situation antérieure.

**Date :** 2026-10-19  
**Statut :** PRD finalisé sur le plan documentaire et prêt pour **le démarrage de l'architecture**, avec arbitrages métier résiduels **explicitement réservés** avant les développements concernés.  
**Références :** [PRD](prd.md), [journal BMAD](.memlog.md), [revue initiale](validation-report.md), [rubric](review-rubric.md), [revue adversariale](review-adversarial-general.md), [D-PRD-130](clarifications-d-prd-130.md), [D-PRD-131](sequencement-mvp-d-prd-131.md), [questions ouvertes historiques](questions-ouvertes-detaillees.md).

## 1. Constat de clôture documentaire — sans invention de décisions

Le PRD constitue la **base fonctionnelle de référence**, pas une preuve de fonctionnalité développée, de conformité réglementaire ni de pilote autorisé. Sont conservés sans renumérotation : **FR-1 à FR-81**, **D-PRD-001 à D-PRD-131**, et les **cinq conditions cumulatives** de réussite avant pilote. Les décisions F-01 à F-124, le Product Brief approuvé, les annexes thématiques et leurs critères restent normatifs selon leur domaine. Le MVP porte sur **Scrum et Kanban** ; SAFe et les ART restent en **v1.0** ; une seule installation suit un produit unique et un mode Agile fixe. Le calendrier d'incréments **I0 à I6** est validé, sans réduction de périmètre.

La revue BMAD du 19/10/2026 a conclu **« Fair — favorable sous réserves »**, avec **0 critique, 5 élevés, 9 moyens et 1 faible**, et 12 scénarios adversariaux. Il s'agit de la **mesure initiale**, non recalculée après les changements. Les cinq écarts structurants élevés **A1, A2, A3, A4 et A6** ont été arbitrés fonctionnellement en D-PRD-130/131. Les autres constats sont **triés ci-dessous**, sans les déclarer artificiellement résolus. **Aucun nouveau D-PRD** n'est créé par le présent document.

### 1.1 Rapprochement des sources

| Source | Ce que conserve le PRD final | Limite explicite |
|---|---|---|
| Product Brief et registre F-01 à F-124 | Vision, opérateur Scrum Master/RTE, périmètre MVP/v1.0 et succès cumulatif | Aucun seuil métier validé ne peut être modifié à l'architecture |
| FR-1 à FR-81 | Capacités et règles détaillées sous identifiants stables | Les détails techniques ne sont pas implicitement approuvés |
| D-PRD-001 à D-PRD-129 | Historique du cadrage et validations thématiques | Les archives du journal conservent les décisions plus détaillées |
| D-PRD-130 | Exception Sprint historique, capacité qualifiée, instantanés V1/V2, CSV atomique | Codes CSV, formats, stockage et preuves à concevoir |
| D-PRD-131 | I0 socle, I1 Scrum/HTML, I2 Scrum/PDF, I3 Kanban, I4 reprise, I5 IA/UX, I6 recette | Pas d'estimation de durée ni d'Epics Jira décidées |
| Annexes Reporting, Qualitatif, Historique, IA, UX, Sécurité et Recette | Critères d'acceptation, protections et cas limites | Pas de tests, conformité ou architecture déclarés réalisés |

**Règle de lecture :** les rubriques et questions ouvertes archivées représentent le **contexte historique de décisions antérieures** ; si une question a été tranchée depuis (par exemple le contrat CSV A4), sa réponse plus récente dans le PRD/D-PRD-130 prime. À l'inverse, la présence d'un sujet dans une liste ouverte ne vaut pas autorisation d'inventer une solution.

## 2. Réserves secondaires et responsables des prochains arbitrages

| ID revue | Traitement de finalisation | Responsable proposé | Point de contrôle obligatoire |
|---|---|---|---|
| **A5 — Seuils NFR** | **Report contrôlé à Architecture + Recette.** Définir navigateur/version, accessibilité mesurable, budgets performance, RPO/RTO, sauvegarde/restauration, rétention et disponibilité, sans affirmer une conformité | Winston + recette/sécurité, validation du responsable produit sur les niveaux de service | Avant figer architecture et critères de recette FR-79/80 |
| **A7 — Matrice risques 3×3** | **Arbitrage métier encore ouvert.** Aucune combinaison de neuf cases n'est implicitement décidée ; probabilité/impact manquants restent non calculables | John + utilisateur, Winston pour implications | **Avant** réaliser/tester criticité et cockpit FR-36/39 |
| **A8 — Faits marquants automatiques** | **Arbitrage métier encore ouvert.** Catalogue initial, sources, déclencheurs, déduplication et désactivation à valider. Conservation de la saisie manuelle et du principe de configuration | John + utilisateur, Winston pour idempotence | **Avant** réaliser les automatismes FR-40 |
| **A9 — Historique Kanban** | **Frontière clarifiée sans extension tacite.** La création rétrospective manuelle est décidée pour les **Sprints Scrum** ; l'extension équivalente aux périodes Kanban n'est pas garantie au MVP. Les **imports de métriques consolidées Kanban sur cycles existants**, la qualité et les bilans de cycles Kanban clôturés relèvent du MVP | John + utilisateur si extension de la création rétrospective souhaitée | Avant Stories de reprise Kanban ; ne jamais la promettre par défaut |
| **A10 — Conservation PDF** | **Arbitrage produit encore ouvert.** PDF exporté immuable ≠ copie obligatoirement archivée dans SMN. FR-68 sauvegarde les documents effectivement stockés ; conservation systématique, accès, rétention et destruction ne sont pas décidés | John + utilisateur pour usage ; Winston + sécurité pour stockage | **Avant** implémenter archivage, suppression et restauration documentaire |
| **A11 — Données personnelles / immuabilité** | **Arbitrage produit/sécurité encore ouvert.** Masquage, suppression, anonymisation, traces résiduelles et sauvegardes doivent être compatibles avec obligations applicables ; pas d'effacement automatique inféré | John + utilisateur, sécurité/juridique si diffusion, Winston pour impacts | **Avant** implémenter suppression nominative et avant pilote/diffusion |
| **A12 — Temporalité des rapports** | **À intégrer en conception UX/reporting.** Distinguer chiffres corrigés après clôture, instantanés qualitatifs Vn au moment de clôture et PDF originaux inchangés ; provenance visible sans reconstruire un passé fictif | Winston + UX + recette | Avant figer écrans/bilans/export FR-20/30/41 |
| **A13 — Navigation périmée** | **Correction éditoriale** dans l'introduction et le statut final ; liens vers les annexes et le présent handoff | John | À la publication finale |
| **A14 — Scénarios transverses** | **Vue regroupée** au §3 ci-dessous | John ; Winston réutilise les scénarios | Dès le démarrage architecture |
| **A15 — Volume documentaire** | **Mesure de navigation** : PRD détaillé conservé, table des domaines et liens d'annexes ; présent dossier = vue d'orientation pour Winston. Le PRD reste volumineux, sans suppression de critères/FR pour maquiller ce constat | John ; Winston privilégie les références ciblées | Avant architecture et découpage des US |

**Lecture du statut :** A7/A8/A10/A11 sont **ouverts au niveau métier**. Ils ne bloquent pas la **lecture et l'analyse architecturale**, mais **interdisent** de prétendre que les comportements correspondants sont entièrement spécifiés ou directement prêts à coder. Les choix d'architecture A5/A12 sont à rendre vérifiables avant implémentation/recette. A9 n'est pas une autorisation implicite de livrer une reprise manuelle rétroactive Kanban.

## 3. Dix scénarios transverses à étudier de bout en bout

| Scénario | Exigences sources | Invariant / anomalie à couvrir |
|---|---|---|
| **S1 — Première installation** | FR-1/2/3/5/7/58/66–73 | Mode et produit fixes, parcours Express/Guidé, première équipe et accès protégé |
| **S2 — Calendrier → capacité** | FR-8–14/19 | Pays, absences, affectations, réunion exceptionnelle, capacité JH et provenance, zéro différent de vide |
| **S3 — Sprint ordinaire** | FR-14–18/20/24 | Création unitaire/lot, cérémonies normales, dates, contrôles, statut et corrections sans déplacer les historiques |
| **S4 — Replanification complète** | FR-14–18/23–25/70/71 | Aperçu unique, choix événements, capacités, métriques/objectifs/risques préservés, écriture et audit atomiques |
| **S5 — Cycle Scrum clôturé → V1/V2** | FR-16/25/34–41/26–33 | Six registres et liens figés, réouverture sur courant, reclôture V2, V1/PDF antérieurs inchangés |
| **S6 — Sprint rétrosaisi** | FR-14/16/17/42/46/47 | « Terminé » sans cérémonies générées, capacité connue/estimée/absente, provenance, pas de faux historique |
| **S7 — Import CSV** | FR-14/20/22/43–49/71 | Quatre colonnes, métriques sources Scrum/Kanban, aperçu, remplacements explicites, lot tout ou rien |
| **S8 — Kanban complet** | FR-21–25/26–33/34–41 | Période générée à la demande, cinq KPI facultatifs, clôture, tendances fiables et rapport sans faux Scrum |
| **S9 — Rapport historique multitemporel** | FR-20/26–33/41/48/54 | Sources qualitatives Vn, chiffres corrigés traçables, HTML/PDF cohérent, confidentialité et origine des données |
| **S10 — Brief IA → pilote** | FR-50–57/66–81 | Données collectives expurgées, TXT archivé, réponse IA collée comme interprétation, restauration, preuves des cinq succès |

La matrice est **une carte de vérification, pas une suite de tests exécutés** ; Winston peut la décomposer en décisions d'architecture et, ultérieurement, en tests et User Stories indépendantes.

## 4. Contraintes impératives pour Winston

- **Utilisateur initial :** Scrum Master unique ; les équipiers ne saisissent pas les données métier et les parties prenantes consomment les rapports. Préparer l'extension multiutilisateur sans l'imposer au MVP.
- **Poste disponible :** Windows 11 en entreprise, **sans droits administrateur ni IDE installable** ; outils disponibles indiqués : Node.js, npm, pnpm, PowerShell et GitHub Desktop. L'application retenue doit être **accessible dans un navigateur**. Vérifier le scénario de mise en service concret, sans supposer Docker, installation système, Codex CLI ni VS Code.
- **UI :** **Bootstrap 5** approuvé, responsive ordinateur/tablette/smartphone, FR/EN ; l'accessibilité et la compatibilité cibles restent à fixer.
- **Données :** horodatages et fuseaux des équipes/membres, histoires de corrections, multi-affectations, instantanés immuables, rapports non réécrits et transaction atomique pour les opérations décidées.
- **Périmètre :** conserver le modèle potentiellement réutilisable pour SAFe/ART sans développer SAFe au MVP. Aucun appel IA externe automatisé, aucune intégration Jira automatique et aucune saisie obligatoire inventée.
- **Sécurité :** confidentialité des données individuelles, absence d'identifiants/secrets dans GitHub et export TXT collectif contrôlé ; sauvegarde/restauration à concevoir avec tests d'intégrité.
- **Livraison :** ordre I0 à I6 obligatoire en tant que séquencement fonctionnel validé ; architecture/découpage technique et risques de dépendances à préciser sans réduire les 81 FR.
- **Méthode :** consulter [le skill Architecte BMAD](../../../../.agents/skills/bmad-agent-architect/SKILL.md), les fichiers de configuration de l'agent et [l'architecture BMAD](../../../../.agents/skills/bmad-architecture/SKILL.md) à son activation ; ne pas prétendre avoir exécuté les scripts locaux depuis le connecteur.

## 5. Portes de sortie entre phases

- **Autorisé après finalisation documentaire :** lancement du travail de Winston sur décisions architecturales, modèles de données et stratégie de livraison.
- **Non automatiquement autorisé :** création de tickets Jira, développement, fusion de la branche sur `main`, validation de conformité, mesures de performance, ni passage au pilote.
- **Avant rédaction/implémentation des Stories concernées :** obtenir les choix métier de **A7, A8, A10, A11**, et, uniquement en cas d'extension, **A9** ; définir les seuils A5 et le rendu A12 avec tests.
- **Avant le pilote :** vérification empirique cumulative des cinq conditions, recette FR-74 à FR-81 et validation humaine explicite.

## 6. Méthode et limites de la finalisation

Revue documentaire et rapprochement des sources effectués **via le connecteur GitHub**, sans web externe. Le verdict initial du rapport BMAD est conservé, sans deuxième score prétendument indépendant. La personnalisation BMAD est lue dans les sources accessibles ; les commandes locales `uv run`, les sous-agents officiels, les tests applicatifs et l'ouverture distante du HTML **ne sont pas exécutés**, faute d'environnement de travail local BMAD associé à la session. Les mises à jour des documents et du journal passent par les opérations vérifiables de GitHub.

**Condition de cohérence finale :** le statut `final` signifie « base fonctionnelle approuvée pour l'architecture avec réserves explicitement cataloguées ». Il **ne signifie ni exigences techniques totalement fixées, ni validation des points A7/A8/A10/A11, ni accord de construire ou déployer**.
