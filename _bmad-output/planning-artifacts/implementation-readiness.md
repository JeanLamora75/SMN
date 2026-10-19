---
project: SMN
date: 2026-10-19
amendment: D-PRD-137
business_findings: resolved-C1-C2
remaining_findings: C3-C4
workflow: bmad-sprint-planning
intent: sprint-planning
gate: CONCERNS
status: tracking-generated-under-concerns
source_commit: 8c2dead6598bb2c7a128ca2e26591c2bc5680399
tracking_generated: true
---

# SMN — Contrôle de préparation au développement

**Verdict : CONCERNS.** Le cadrage permet de préparer le socle I0 ; l'ensemble des 212 Stories ne peut pas être considéré uniformément prêt à construire. Après clarification et publication D-PRD-137, les producteurs des données et la cardinalité d'équipe sont explicités (C1/C2 traités). Certains prérequis techniques ne sont pas encore décidés et l'ordre de livraison demande une sélection par incrément (C3/C4 maintenus). Aucun blocage global du projet n'est établi. Aucun PASS, développement, test applicatif ou engagement de Sprint n'est déduit des validations fonctionnelles.

Le [readiness gate officiel](../../.agents/skills/bmad-sprint-planning/references/readiness-gate.md) impose sur CONCERNS de demander si l'utilisateur souhaite poursuivre malgré les réserves ou corriger d'abord. Le mandat autorise la publication de ce contrôle ; il ne constitue pas une acceptation anticipée des constats encore inconnus. **Historique : le suivi n'avait pas été généré au contrôle initial. Le 19/10 à 22:41, Eric a explicitement autorisé la poursuite malgré CONCERNS ; le suivi a ensuite été généré et validé.**

## Actualisation après la clarification utilisateur — D-PRD-137

Le contrôle initial ci-dessous est conservé comme trace. L'utilisateur a précisé : **une équipe par installation Scrum/Kanban au MVP**, plusieurs équipes dans le train SAFe v1.0 ; **Vision, Product Goal, DoD et DoR rattachés à l'équipe ou au train selon le mode**. Mise à jour de Jira/documentation ensuite expressément autorisée.

**C1/C2 traités documentairement** : 7 Stories et 2 Epics corrigées ; producteurs ajoutés sous Epic 3, [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) et [SMN-222](https://lmn24.atlassian.net/browse/SMN-222) ; 6.9 dépend désormais de 3.24/3.25. Les usages multiéquipes contradictoires de 3.3/3.5/3.13 et la dépendance 5.7 sont rectifiés, sans retirer les équipes externes. [Décision complète](prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md).

Relecture complète de Jira après mutations : **222 tickets, 212 Stories, 1 064 AC**. Les clauses des Stories sont rapprochées à nouveau dans les preuves structurées. Les anciennes valeurs 220/210/1 052 ci-dessous décrivent le contrôle initial. **CONCERNS maintenu pour C3/C4**, sans génération du suivi ni PASS acquis. Cette correction documentaire n'est pas une preuve technique et ne vaut pas décision de poursuite malgré les réserves restantes.

## Poursuite autorisée et suivi généré — 19/10/2026 à 22:41

L'utilisateur a confirmé la poursuite sous réserves selon le gate. **CONCERNS reste le verdict**, et les 212 Stories restent backlog. Le [compte rendu Sprint Planning](sprint-planning-2026-10-19.md) décrit la génération officielle, la validation et les réserves restantes. Les mentions de suivi non généré dans la revue d'origine décrivent l'étape antérieure, pas l'état présent. Aucun mandat de développement ou de fusion n'en découle.

## 1. Référentiel effectivement contrôlé

- `main` au commit [8c2dead](https://github.com/JeanLamora75/SMN/commit/8c2dead6598bb2c7a128ca2e26591c2bc5680399), issu de la [PR 8 fusionnée](https://github.com/JeanLamora75/SMN/pull/8).
- [Contexte](../../docs/PROJECT-CONTEXT.md), [état BMAD](../../docs/ETAT-PROJET-BMAD.md), [index](README.md), [Product Brief final](briefs/brief-SMN-2026-10-18/brief.md).
- [PRD final](prds/prd-SMN-2026-10-18/prd.md), [décisions 132–136](prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md), [D-PRD-130](prds/prd-SMN-2026-10-18/clarifications-d-prd-130.md), [séquencement I0–I6](prds/prd-SMN-2026-10-18/sequencement-mvp-d-prd-131.md) ; annexes de sécurité, reporting, UX, registres, historique, IA et recette récupérées et consultées selon les domaines contrôlés.
- [Spine](architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md), [conception technique](architecture/architecture-SMN-2026-10-19/DESIGN-TECHNIQUE.md), [sécurité/exploitation](architecture/architecture-SMN-2026-10-19/SECURITE-EXPLOITATION.md) et annexes de revue, lues avec leur notice historique.
- [Epics/Stories](epics.md) et lecture complète des descriptions des 220 tickets Jira via trois pages de 100, 100 et 20 résultats : `project = SMN ORDER BY key ASC`. Jira n'avait pas été modifié durant le contrôle initial ; l'amendement ci-dessus décrit les mutations ultérieures autorisées.
- Inventaire récursif GitHub non tronqué : aucun `sprint-status.yaml` ni code applicatif identifié dans l'arbre contrôlé. Cette observation ne préjuge pas d'autres branches ou travaux non publiés.

Les cinq décisions finales restent appliquées. Deux profils seulement ; téléchargement collectif autorisé à l'Utilisateur, génération et mutations réservées à l'Administrateur. PostgreSQL, TypeScript, Bootstrap 5, monolithe modulaire, Scrum/Kanban MVP, SAFe v1.0, I0–I6 et cinq conditions de succès inchangés.

## 2. Résultats vérifiés et portée

| Vérification exécutée | Résultat |
| --- | --- |
| Identifiants et correspondance documentaire/Jira | 10 Epics et 210 Stories ; 210 rattachements au bon Epic ; 220 tickets À faire |
| Clauses d'acceptation | 1 052 AC ; 3 163 clauses Given/When/Then/And identiques après normalisation des espaces et de la ponctuation terminale |
| Références FR dans chaque Story | Identiques entre description Jira et bloc GitHub ; FR-1 à FR-81 toutes citées dans les Stories |
| Autres références dans les blocs de Stories | NFR-1 à NFR-3 et UX-DR01 à UX-DR18 présentes |
| Configuration officielle | `resolve_customization.py` et `resolve_config.py` exécutés avec `uv run`, code de sortie 0 |
| Personnalisation SP | prepend/append/persistent_facts vides ; on_complete vide |

Les [preuves structurées](implementation-readiness-evidence.json) donnent les résultats par Story et l'empreinte SHA-256 des descriptions Jira lues. **Couverture par citation ≠ couverture sémantique intégrale des exigences.** Les constats C1/C2 ci-dessous illustrent cette différence. Les preuves structurées portent désormais sur la relecture après amendement ; le tableau ci-dessus garde les résultats initiaux. La comparaison ne certifie pas mot pour mot les notes de traçabilité ou les descriptions d'Epics ; aucun test d'acceptation n'a été joué.

## 3. Constats à résoudre ou accepter explicitement

Les références de Stories renvoient au même contenu dans [epics.md](epics.md) et Jira. Les actions ci-dessous sont proposées ; aucun ticket ni critère approuvé n'a été réécrit.

| ID / priorité | Source et constat | Impact précis / échéance | Action de résolution et workflow adapté |
| --- | --- | --- | --- |
| **C1 — traitée par D-PRD-137 ; constat initial** | [F-116 à F-118 et F-123](../../docs/DECISIONS-FONCTIONNELLES.md) exigent contexte produit, vision/Product Goal enregistrables et historisés, DoD/DoR texte ou lien. [6.9 / SMN-120](https://lmn24.atlassian.net/browse/SMN-120) AC1–3 les supposent déjà présents ; ses dépendances sont 6.3/6.5 et « données produit/équipe préexistantes ». 1.2 crée le produit/équipe et 1.8 décrit des paramètres généraux, sans critères explicites pour ces contenus et leur historique. Aucun producteur explicite retrouvé dans les 210 Stories. | Bloque l'acceptation complète de 6.9 et la démonstration de F-117/F-123 ; **ne bloque pas 1.1**. Un développeur devrait inventer le parcours de saisie/versionnement ou ne tester que des fixtures. | John / `bmad-create-epics-and-stories` : rattacher explicitement saisie, modification, versions, droits et texte/lien à des Stories petites, en réutilisant les décisions existantes. Une écriture Jira demande un nouveau mandat. |
| **C2 — traitée par D-PRD-137 ; constat initial** | 6.9 indique « un seul produit/équipe par installation ». [3.3 / SMN-44](https://lmn24.atlassian.net/browse/SMN-44) prévoit des affectations à plusieurs équipes ; la conception possède Installation → plusieurs Team. L'initialisation crée la première équipe, mais aucun parcours explicite de création d'une équipe supplémentaire n'est retrouvé. | Ambiguïté pour les fixtures, la navigation et le schéma Organisation. À lever avant l'engagement de 3.3 et 6.9 ; le produit unique et fixe ne doit pas être confondu avec une restriction d'équipe nouvelle. | John/Winston : réconcilier la phrase et expliciter les producteurs des équipes requises, sans décider silencieusement une restriction fonctionnelle. `bmad-correct-course` si une modification transversale de périmètre est réellement nécessaire. |
| **C3 — élevée pour I0, choix techniques encore ouverts** | Spine « Stack » et « Deferred », annexe sécurité §2/3/5/10 ; [1.1 / SMN-11](https://lmn24.atlassian.net/browse/SMN-11) et [1.7 / SMN-17](https://lmn24.atlassian.net/browse/SMN-17) AC5. Versions Node/TS/pnpm/PostgreSQL, framework/ORM, migrations, sessions, dérivation du secret, amorçage et récupération non spécifiés jusqu'au bout. | **Prérequis local à la construction des capacités concernées**, pas motif de FAIL global. 1.1 est le premier support fonctionnel ; 1.2/1.4/1.7 ne doivent pas être déclarées techniquement prêtes par leur seule validation. | Winston puis `bmad-build` sous mandat distinct : décision technique documentée et épinglage après vérification, POC Windows/PostgreSQL/migrations, politique session/secret/récupération. Toute recherche web attend son autorisation. Le mécanisme de récupération ne doit pas être inventé pendant l'implémentation de 1.7. |
| **C4 — moyenne, ordre et taille à affiner** | I0–I6 ne sont pas des Epics. 4.22/SMN-86 utilise des cycles clôturés alors que 4.23/SMN-87 produit les clôtures ; 5.23/SMN-111 complète leur capture qualitative. 6.1 propose le standard, formalisé en 6.10/SMN-122. 6.13 dépend de 6.3–6.12 : une livraison par Epics entiers pourrait retarder l'HTML attendu en I1. | La numérotation et l'ordre des clés Jira ne constituent pas l'ordre d'exécution. 4.23 couvre clôture/réouverture/reclôture, 2.6 une restauration complète, 3.16 un calcul multi-sources : taille réelle non estimée. Pas de preuve qu'elles tiennent dans un Sprint. | Préparer une sélection par incrément et un ordre topologique des capacités, contrats/fixtures explicites puis intégration. Ne pas imposer une clôture complète à I1 ni tout Epic 5 avant le premier HTML. Raffiner/estimer les Stories complexes avant engagement, sans changer leurs résultats fonctionnels. |

**Qualification :** C1/C2 étaient des lacunes de préparation localisées, désormais traitées par D-PRD-137, pas une réouverture des arbitrages A7/A8/A10/A11 ou des deux profils. C3 est une réserve technique immédiate d'I0. C4 est une réserve de planification ; une dépendance à des données de test n'est pas automatiquement une dépendance bloquante à un écran futur. Aucun cycle global de dépendances n'a été démontré ; aucune analyse exhaustive de graphe n'est revendiquée, les dépendances étant en texte libre.

## 4. Preuves techniques : portes de sortie, sans blocage anticipé de tout SMN

| Domaine | Stories principalement concernées | Moment nécessaire / preuve attendue |
| --- | --- | --- |
| Windows sans admin et serveur loopback | 1.1 / SMN-11 ; 1.9 / SMN-19 | Pendant I0, avant acceptation de 1.1 : relever versions, démarrer/arrêter/redémarrer sous compte standard, URL locale, panne PostgreSQL sans secret exposé. Une exécution Linux ne prouve pas Windows. |
| PostgreSQL et migrations | 1.1–1.2 / SMN-11–12 ; 2.7 / SMN-35 | Choisir l'outillage avant le premier schéma ; tester base vierge, migrations versionnées, panne/interruption et reprise avant acceptation des capacités touchées. Ne pas attendre I6. |
| Sessions, amorçage, récupération, RBAC | 1.2/1.4–1.7 / SMN-12/14–17 | Définir contrats avant construction ; prouver double amorçage, expiration/révocation, anti-CSRF et refus direct des accès lors des Stories correspondantes. Matrice des deux rôles déjà décidée. |
| PDF local | 6.17–6.18 / SMN-127–128 ; I0 AD-30 | POC technique local en I0 pour lever le risque du moteur et du packaging, sans exiger le moteur métier complet. Fidélité HTML/PDF, ressources bornées, finalisation/archives et retries avant acceptation des exports I2. Le POC I0 reste à rattacher explicitement au travail technique ; aucun ticket autonome trouvé. |
| Sauvegarde/restauration et clés | 2.2–2.6 / SMN-30–34 ; 2.11–2.12 / SMN-39–40 | Sauvegardabilité dès I0 ; preuve réelle de restauration dans une base/répertoire distincts à la livraison de 2.6 ; cohérence DB/fichiers à compléter quand les PDF existent. Anti-réintroduction à prouver avant mise en service de l'effacement. Définir la récupération des clés avant chiffrement des données concernées. |
| Concurrence | 1.2, 2.7, 4.4, 4.18, 4.23, 5.23, 7.20, 8.14 | Tests d'intégration PostgreSQL à chaque opération : version attendue, double requête, échec injecté, tout-ou-rien. Ne pas considérer un essai initial comme preuve des opérations futures. |
| Temps et restitution A12 | 3.18–3.21 ; 4.7/4.18/4.22–23 ; 5.23–24 ; 6.8 ; 7.7/7.20 ; 8.17–20 | Types date/instant/IANA et disponibilité de connaissance anticipés dans la conception ; DST/arrêt/redémarrage, données tardives et V1/V2 éprouvés lors des capacités concernées I1–I4. Recette globale avant pilote. |
| NFR A5 | 1.16 / SMN-25 ; 10.7 / SMN-206 ; 10.18–19 / SMN-217–218 ; sécurité annexe §9 | Avant mesures d'acceptation : fixer équipement, volumes, navigateurs/tailles, p95, périmètre d'accessibilité et RPO/RTO. Les 2 s, 30 s PDF, WCAG 2.2 AA, 24 h/60 min sont **indicatifs non validés**. Ils ne bloquent pas le diagnostic 1.1. |
| Conditions métier du pilote | 10.7–10.12 et 10.20–21 | Protocole avant observation, puis trois Sprints réels + un cycle Kanban, rapport <30 min, saisie ≤30 min/semaine, tendances fiables, HTML/PDF sans anomalie bloquante ; décision humaine. Aucun raccourci par validation documentaire. |

Les numéros de tickets sont à utiliser via la [correspondance complète](implementation-readiness-evidence.json) ; les regroupements de cette table sont des portes de preuve, pas de nouveaux critères métier. Les versions et la sécurité actuelle des bibliothèques n'ont pas été vérifiées sur Internet. Aucun numéro de version candidat n'est recommandé ici.

## 5. Préparation du premier travail I0

**Premier travail à engager après mandat de construction : préparer techniquement puis réaliser la Story 1.1 / SMN-11, « Démarrer SMN localement et vérifier les prérequis ».** Aucune Story métier future n'est requise. Ne pas commencer par les 210 Stories ni par un Epic complet.

Prérequis : reprendre les invariants et AC1–6, disposer d'une base PostgreSQL dédiée et de paramètres privés, relever le runtime/poste réel, choisir et documenter le minimum de stack et de migrations, préparer les cas succès/panne/redémarrage et installation existante. Si des vérifications de bibliothèques nécessitent le web, obtenir d'abord l'autorisation correspondante. Toute exécution sur le PC demande une preuve issue de ce PC ; son état n'est pas attesté par cette session.

Ordre indicatif des premières capacités : 1.1 → 1.2 → 1.4 → 1.5/1.6 → 1.7, avec protections des secrets de 1.9, audit et atomicité introduits dès la première écriture, sans attendre leur interface complète. 1.3, navigation et paramètres complètent I0 ; le tableau de bord peut présenter des états vides documentés. Les dépendances actuelles des tickets ne sont pas réécrites par cette recommandation. Le POC PDF prévu par AD-30 et la vérification de restauration doivent rester visibles dans le travail technique I0.

Ce document ne fixe ni dates de Sprint, ni capacité, ni estimation, ni statut ready-for-dev. Ces données ne sont pas connues et le suivi BMAD n'est pas un engagement de calendrier.

## 6. Exécution et adaptations ChatGPT

Le clone Git HTTPS du dépôt privé a échoué faute d'identification en ligne de commande. Les lectures et publications passent donc par le connecteur GitHub ; les fichiers nécessaires ont été reconstruits dans un espace de travail temporaire pour les scripts et analyses documentaires.

Commandes réellement exécutées :

```text
uv run _bmad/scripts/resolve_customization.py --skill .agents/skills/bmad-sprint-planning --project-root . --key workflow
uv run _bmad/scripts/resolve_config.py --project-root .
```

Les deux commandes réussissent. Le résolveur courant utilise TOML et retourne `BMad`/`English` ; les instructions du projet imposent le français et le contexte nomme Eric : ces instructions prévalent, sans modification des fichiers gérés par l'installateur. La configuration YAML BMM est également lue, mais n'est pas présentée comme la sortie du résolveur TOML.

Analyses Python réellement exécutées : décompte et unicité des Stories ; rattachements Jira ; comparaison des clauses et citations FR ; inventaire des références NFR/UX. Lecture humaine des dépendances et de cas critiques. Cette revue est effectuée par le même assistant : **elle n'est pas le Reviewer Gate indépendant d'architecture**.

Non exécutés : `sprint_plan.py generate` (gate non franchi), lint officiel d'architecture, tests Windows/PostgreSQL/migrations/sessions/PDF/backup, tests applicatifs, mesure NFR, audit sécurité/RGPD et recette. Aucune recherche web, mutation Jira, modification fonctionnelle, fusion ou construction applicative durant le contrôle initial. Après clarification, 7 Stories et 2 Epics ont été amendées et 2 Stories créées sur mandat explicite ; aucune fusion ni construction.

## 7. Suite officielle

1. Faire choisir à Eric : **corriger les constats d'abord** (recommandé) ou **poursuivre malgré CONCERNS**. Cette demande vient du readiness gate, pas d'une règle de confirmation inventée.
2. Si correction : traiter les lacunes via les workflows appropriés, avec autorisation préalable de mutation Jira, puis rejouer le gate.
3. Si PASS, ou dérogation explicite de poursuite sur CONCERNS : charger `generate-tracking.md`, exécuter le générateur officiel et contrôler son JSON ; conserver la réserve si elle n'est pas corrigée, sans la renommer PASS. Les Stories restent backlog tant que les conditions de préparation ne sont pas établies.
4. Toute construction via `bmad-build` demande un mandat distinct : la session présente l'exclut.

**Confiance : élevée (environ 90 %) sur le verdict documentaire et la correspondance GitHub/Jira ; faisabilité technique non évaluée par essais.** L'absence de producteur explicite est un constat de lecture et de recherche dans les Stories contrôlées, pas la preuve d'une impossibilité technique. Les références et preuves ci-dessus permettent la vérification.
