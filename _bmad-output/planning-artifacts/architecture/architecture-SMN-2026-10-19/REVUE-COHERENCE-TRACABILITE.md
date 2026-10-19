# SMN — Revue de cohérence, traçabilité et transmission BMAD

> **Lecture historique — consolidation du 19/10/2026.** Les constats ci-dessous décrivent leur revue d'origine. A7/A8/A10/A11 ont depuis été validés ; D-PRD-136 fixe **deux rôles MVP : Administrateur et Utilisateur**. Les hypothèses à trois rôles et blocages métier correspondants sont supplantés par [les arbitrages validés](../../prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les réserves techniques et l'absence de lint/Reviewer Gate officiel attesté restent applicables.

> **Addendum métier ultérieur :** A7/A8/A10/A11 et la simplification AD-31 à **deux rôles** sont validés (D-PRD-132 à 136). Cette revue conserve les réserves identifiées **à l'époque** ; [annexe normative actualisée](../../prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les tests décrits ci-dessous restent non exécutés.

**Date :** 19 octobre 2026. **Portée :** cohérence documentaire des décisions architecturales discutées avec Winston ; pas de tests d'implémentation. **Sources :** PRD final, décisions F/D-PRD, annexes spécialisées, validation-report PRD, handoff architecture et séquencement I0–I6, plus journal architectural existant. **La note historique Fair du PRD n'est pas recalculée ni présentée comme une validation technique.**

## 1. Verdict documenté

**Architecture contractuelle finalisée sous réserves explicites.** Aucune contradiction critique imposant de remettre en cause le modèle Scrum/Kanban/PostgreSQL. Les frontières, la temporalité, la traçabilité et la protection des anciens artefacts sont compatibles avec le PRD. En revanche, l'exécution réelle sur Windows, l'authentification, les transactions/sauvegardes, les rôles et le rendu PDF doivent être confirmés avant de considérer la conception prête à implémentation sans réserve.

Cette revue est **réalisée par rapprochement documentaire**, pas via des sous-agents indépendants. Le `lint_spine.py` officiel, la revue adversariale externe, les tests applicatifs, la comparaison de versions de bibliothèques sur le web et l'accès au poste Windows n'ont pas été exécutés. Le statut `final` de la spine signifie **contrat documentaire stabilisé avec portes de sortie**, et non passage du Reviewer Gate indépendant ou attestation de compatibilité technique.

## 2. Cinq constats prioritaires et remédiations

| ID | Constat | Gravité | Mesure architecturale et preuve |
| --- | --- | --- | --- |
| G1 | Gel prévu à l'ouverture après arrêt, données entrées ultérieurement | Élevée | AD-11/12/16, contracter l'état connu à l'ouverture ; test reprise après interruption et absence rétroactive |
| G2 | Plusieurs modules pourraient écrire le cycle, les snapshots ou KPI sans unité de transaction | Élevée | AD-2/3/19/20/25, propriétaires et cas d'usage uniques ; tests concurrence + échec transactionnel |
| G3 | PostgreSQL local et initialisation sans droits admin non démontrés ensemble | Élevée | AD-7/9/25/28, POC I0 : connexion, migrations, premier admin, retour après arrêt |
| G4 | Base et fichiers n'ont pas automatiquement la même atomicité | Élevée | AD-24/27/29, TXT final de préférence en PostgreSQL, manifeste/backups ; tests d'archive/restauration |
| G5 | Stack Next.js/React/PDF et packaging non vérifiés sur poste cible | Élevée | AD-28/30, POC I0, versions et bibliothèques épinglées après vérification, tests navigateur/PDF |

**D-ROLES rapproché par AD-31 :** le journal initial conserve l'approbation de **deux rôles** et du téléchargement pour l'Utilisateur. La proposition ultérieure à **trois profils** a été globalement approuvée (sauf SGBD, remplacé par PostgreSQL) ; AD-31 retient Administrateur/Opérateur/Lecteur, l'ancien Utilisateur étant assimilé au Lecteur **sans perte du droit de téléchargement**. Le détail de l'accès Opérateur aux données individuelles sensibles reste une porte d'arbitrage avant Stories concernées.

## 3. Matrice FR / décisions / lots

| Exigences PRD | Couverture conceptuelle | AD normatives | Incrément(s) concerné(s) | Validation restante |
| --- | --- | --- | --- | --- |
| FR-1 à FR-3 | Installation, mode et produit fixes, paramètres | 1/2/7/8/9/25/28/31 | I0 | POC provisioning PostgreSQL, droits |
| FR-4 à FR-7 | Équipe, membre, configuration, rôles | 2/8/9/12/16 | I0–I1 | droits, historique membres |
| FR-8 à FR-13 | Calendrier, absences, pays, disponibilités | 12/14/15/16 | I1–I2 | imports CSV/ICS, calendriers manquants |
| FR-14 | Capacité initiale/réelle, gel et provenance | 11/12/16/19 | I1–I2 | cas d'arrêt, temps partiel, JH |
| FR-15 à FR-19 | Sprint, événements, statuts, impact ponctuel | 14/15/17/18 | I1–I2 | pause, durées réelles, replanification |
| FR-20 à FR-22 | Bilan, quatre SP Scrum, cinq KPI Kanban | 4/5/13/16/19 | I1–I3 | zéro, négatif/SP en surplus, tendances |
| FR-23 à FR-24 | Périodes Kanban, génération en lot | 3/5/14/15/17/18 | I3, socle I1 | doublons/transactions/aperçu |
| FR-25, FR-34 à FR-41 | Six registres, liens et instantanés Vn | 2/19/20 | I2–I3 | A7/A8, V1/V2, liens multi-cycles |
| FR-26 à FR-33 | HTML, PDF, modèles et sélections | 6/22/23/26/27 | I1–I3 | packaging PDF, A10, A12 |
| FR-42 à FR-49 | Reprise historique et CSV quatre colonnes | 11/19/20/21 | I4 | A9, all-or-nothing, statuts |
| FR-50 à FR-57 | Brief TXT, analyses humaines et IA | 6/23/24/26/27 | I5 | confidentialité texte libre, analyse unique |
| FR-58 à FR-65 | Dashboard, navigation, FR/EN, responsive | 4/5/7/28 | I0–I5 | accessibilité/compatibilité A5 |
| FR-66 à FR-73 | Sécurité, opérations et sauvegardes | 7–10/25–29 | dès I0 et au fil des lots | matrice droits, récupération, backup/restaure |
| FR-74 à FR-81 | Recette, succès réel et feu vert pilote | 30 | I6 ; preuves dès I0 | mesures et autorisation humaine |

Une telle matrice établit que les domaines sont **attribués**, pas que chaque critère détaillé est déjà développé. En particulier, le séquencement principal ne reporte pas la sécurité à I6.

## 4. Revue des dix parcours transverses du handoff

| Scénario | Contrat d'architecture | Résultat documentaire | Preuve technique requise |
| --- | --- | --- | --- |
| S1 Initialisation | AD-7/9/25/28 | Couvert sous réserve | installation vierge, migration, verrouillage premier admin |
| S2 Calendrier-capacité | AD-11/12/14/16 | Couvert sous réserve | union indisponibilités, ouverture hors ligne |
| S3 Sprint ordinaire | AD-15/17/18 | Couvert | événements générés, séquences des statuts |
| S4 Replanification | AD-3/18/19 | Couvert sous réserve | transaction dates/événements/capacités/audit |
| S5 V1/V2 | AD-19/20 | Couvert sous réserve | double clôture, versions indépendantes |
| S6 Rétrosaisie Sprint | AD-11/19/21 | Couvert | Terminé, zéro cérémonie, historique qualifié |
| S7 CSV | AD-3/19/21 | Couvert sous réserve | doublon/ligne invalide => zéro écriture |
| S8 Kanban | AD-5/16/17 | Couvert | calendrier mensuel, métriques flux, no Scrum |
| S9 Rapport multitemporel | AD-6/20/22/27 | Couvert sous réserve | mêmes chiffres HTML/PDF, Vn, provenance |
| S10 TXT → pilote | AD-23/24/26/29/30 | Couvert sous réserve | filtrage PII, absence d'API, restauration et mesure |

**Aucun scénario ci-dessus n'est déclaré « exécuté »** : les résultats qualifient exclusivement la cohérence des décisions.

## 5. Rapprochement des domaines validés

| Famille de décisions discutées | Traduction dans la spine | Statut |
| --- | --- | --- |
| Domaine 1 : monolithe, modules, responsabilité unique, moteur commun | AD-1 à 6 | Adopté |
| Accès initial : installation exceptionnelle, rôles, comptes, protections | AD-7 à 10 et AD-31 | Profilage à trois rôles consolidé ; droits sensibles Opérateur en attente |
| Données et calculs : précision, provenance, Scrum > engagement | AD-11 à 13, AD-16 et 19 | Adopté |
| Temps et calendriers : 8 AD-TIME | AD-11/12/14–18 | Adopté ; algorithme de récupération à éprouver |
| Historisation : 10 AD-HIST | AD-3/19–22/25/27 | Adopté ; mécanismes PostgreSQL à éprouver |
| Restitution : 10 AD-RPT | AD-6/22–24/26/27 | Adopté ; moteur PDF à éprouver |
| Sécurité/exploitation : 12 AD-SEC | AD-7–10/25–30 | Adopté globalement, PostgreSQL obligatoire |
| PRD : D-PRD-130/131 et FR-1..81 | Matrice ci-dessus | Invariants fonctionnels non réouverts |

Les identifiants thématiques `AD-TIME-xx`, `AD-HIST-xx`, `AD-RPT-xx` et `AD-SEC-xx` ont servi aux validations conversationnelles ; **AD-1 à AD-30** sont la numérotation définitive de la spine. La correspondance ci-dessus est une synthèse par famille, non une bijection entre chaque identifiant thématique et une décision finale.

## 6. Réserves et portes de décision

| Réserve | Situation / propriétaire de l'arbitrage | Ne pas engager avant |
| --- | --- | --- |
| A5 | NFR, volumes matériels, RPO/RTO, niveau accessibilité ; Winston + recette | objectifs de performance définitifs |
| A7 | matrice de criticité 3×3 ; John + utilisateur | calcul de criticité |
| A8 | faits marquants automatiques, déclencheurs et déduplication ; John + utilisateur | automatisme FR-40 |
| A9 | rétrosaisie complète de Kanban hors acquisition ferme MVP | Story d'extension éventuelle |
| A10 | stockage automatique et rétention PDF ; John + utilisateur | archivage PDF permanent |
| A11 | suppression/anonymisation et historique des données personnelles, sauvegardes ; John + utilisateur, validation sécurité | implémentation purge nominative et pilote |
| A12 | visualisation des chiffres corrigés, snapshots qualitatifs, PDF immuables ; Winston + UX/recette | recette de reporting historique |
| D-ROLES | rapproché : AD-31, trois rôles ; droits sensibles Opérateur encore à préciser ; utilisateur + Winston | Stories d'habilitation de l'Opérateur |
| TECH-VERSIONS | versions bibliothèques, versions PostgreSQL/Node, ORM, moteur PDF et compatibilité Windows | gel du stack, pipeline CI |
| TECH-CRYPTO | algorithmes/rotation/récupération clés et modèle de menace | chiffrement des données personnelles en production |

## 7. Tests prioritaires et mesures non démontrées

### Pré-POC I0

- Node.js, pnpm, PostgreSQL disponibles sans droits administrateur ; capacité réelle de migration et `pg_dump/pg_restore`.
- Next.js/React ou solution équivalente validée sur PC Windows avec démarrage, connexion/auth et lecture/écriture.
- Générateur PDF **local** validé sur 1 exemple incluant tableaux/graphiques et texte FR/EN.
- Rôles définis et contrôles serveur pour pages, API, documents, initialisation et fichiers privés.

### Avant acceptation technique et pilote

- Contrôle SQL doublons/chevauchements et concurrence ; 0 écriture sur import CSV invalide ; clôture atomique V1 puis V2.
- Gestion fériés/absences/réunions sur membres multiéquipes, changement d'heure, arrêt et reprise.
- Comparaison rapports aperçu/PDF après modification concurrente des sources ; archives TXT inchangées après duplication et réponse IA.
- Sauvegarde complète **restaurée** en environnement de test, métadonnées et TXT conservés.
- Matrice FR → tests → statut → preuves ; navigateur/plateforme/langue/thème, clavier et accessibilité.
- Cinq conditions cumulatives : 3 Sprints complets + 1 Kanban en conditions réelles ; rapport complet <30 min ; saisie courante ≤30 min/semaine ; tendances fiables avec rétrosaisie ; HTML/PDF exploitables sans anomalies bloquantes. Passage au pilote = validation humaine explicite.

## 8. Adaptations au workflow BMAD

L'environnement de cette session permet de lire et modifier des fichiers du dépôt via le connecteur GitHub. Il **ne permet pas de prétendre à l'exécution sur la machine Windows**, des scripts `uv run`, du `memlog.py`, du `lint_spine.py` local ou des sous-agents de Reviewer Gate. Les étapes officiellement prévues sont transposées par : lecture du skill, lecture PRD, journal append-only via connecteur, production spine + annexes, puis vérification GitHub des chemins/références et examen de cohérence documentaire.

Le skill recommande la vérification des versions en ligne ; aucune recherche web avancée n'a été lancée conformément à la contrainte utilisateur. **La spine reste `draft`**, même si ses décisions adoptées peuvent servir de base à un découpage conditionnel. Il faudra un gate complet, des corrections et un accord explicite avant de revendiquer la validation finale.

## 9. Limites d'autorisation

Autorisé dans cette demande : **modifications documentaires sur `docs/bmad-architecture-smn-20261019` uniquement**. Ne pas créer/modifier de User Stories Jira, ne pas toucher `main`, ne pas modifier le code ou la configuration personnelle, ne pas faire de merge ni publier de secrets. Toute action supplémentaire requiert une autorisation explicite.
