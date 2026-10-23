# SMN-234 — D9 : revue transverse, corrections et plan de recette

**Date :** 23 octobre 2026 · **Branche :** `main` · **Epic fiche :** SMN-228 · **Version de méthode :** BMAD 6.12.4.

**Décision qualité :** D9 **revue technique et préparation de recette effectuées**, mais **recette complète / Definition of Done NON atteintes**. L'onglet Registres reste bloqué par l'Epic 5 (SMN-89 à SMN-112), et la compilation Next.js/PostgreSQL sur le PC de test n'a pas encore été réalisée.

## 1. Périmètre revu

La fiche `/app/admin/sprints/[sprintId]` conserve son bandeau compact et **exactement sept onglets**, tous sur le Sprint du contexte d'équipe autorisé :

1. Objectifs : création, modification, commentaire et évaluation, audits et clôture.
2. Cérémonies : liste paginée des occurrences standards/personnalisées/exceptionnelles, statuts et provenance.
3. Capacité : présence estimée J/H par membre autorisé, distincte des J/H de développement, `null` si inconnu.
4. Indicateurs : huit champs modifiables, quatre dérivés recalculés ; vrais zéros et dénominateurs non calculables.
5. Registres : six catégories visibles et socle de liste préparé ; **aucun producteur Epic 5 actuellement installé**, aucune fausse liste vide.
6. Tendances : trois graphiques et tableau accessible des cinq dernières clôtures éligibles de la même équipe.
7. Bilan : Analyse SM et Analyse IA indépendantes, versionnées, saisie humaine explicite, aucune génération automatique.

**Conservation nécessaire :** les formulaires historiques `/app/admin/sprints/review` et les workflows métier de Calendrier/Paramètres ne sont **pas supprimés**. Leur retrait ne pourra intervenir qu'après test fonctionnel local de chaque parcours de remplacement et confirmation de leurs fonctionnalités restantes. Aucune purge, migration rétroactive ou réécriture d'un snapshot n'a été exécutée.

## 2. Correction concrète effectuée en D9

**Défaut découvert :** une liste de Sprint clôturé est construite à partir de l'**instantané historique Vn**, mais les actions « Voir la réunion » (D4) et « Ouvrir la fiche » (D8) renvoyaient potentiellement à une **fiche opérationnelle courante** qui pouvait avoir changé de statut depuis la clôture.

**Correction :**
- `sprint-ceremonies-panel.tsx` : le lien Réunion n'apparaît que pour `source="recorded-events"` (Sprint non clôturé). Pour un snapshot, message explicite **« Fiche historique individuelle indisponible »**. La liste, son statut historique et sa pagination restent consultables.
- `sprint-registers-panel.tsx` : un enregistrement issu de `source="closure-snapshot"` n'est jamais lié à sa version courante ; le lien est remplacé par la même indication d'indisponibilité historique. Les éventuels futurs liens live restent contrôlés par `safeRegisterHref`.
- `src/i18n/fr.json` et `en.json` : messages explicites ajoutés dans les deux langues.

**Limite assumée :** les fiches individuelles historisées ne sont pas encore implémentées ; la réparation empêche une lecture historiquement trompeuse, mais ne prétend pas fournir une navigation historique qui n'existe pas.

## 3. Preuves de vérification réellement obtenues

### A. Modules métier réellement exécutés isolément

Les **copies locales exactes**, contrôlées par `git hash-object` et comparées aux blobs GitHub `main`, sont :

| Source | SHA Git vérifié |
|---|---|
| `src/lib/sprint-indicator-values.ts` | `22e0f92f1a5b67f5cfa5366f9721eec18dbbc67c` |
| `src/lib/sprint-ceremony-detail.ts` | `c2d4c2cde37f39bdfca002c263f64afd1dc53c20` |
| `src/lib/sprint-presence.ts` | `a8fbdd8be09f556d81befc8167b566f7868e37a3` |
| `src/lib/sprint-trend-geometry.ts` | `25039d0bdd0b271b0b5aa7d6713bb76b9048d636` |
| `src/server/sprints/trends.ts` | `30ccbcfeaa29639d54b19268d78f0f14a5256076` |
| `src/lib/sprint-review-analysis.ts` | `b93522747f0f1f776d96e5c431ceb9dd0629e91c` |

Une suite de régression exécutée **sous Node.js 22**, sur les versions JavaScript préalablement compilées des modules purs, a donné :

**22 tests réellement exécutés — 22 réussis — 0 échec.** Contrôles :
- D3 : `null` ≠ zéro, dépassements 100 %, bornes confiance/clarté ;
- D4 : « tenue » inférée/confirmée, statut non prévu inconnu, pagination de 205 réunions ;
- D5 : PO à J/H développement nul mais présent, demi-journées, absence de donnée, snapshot et changement d'heure Europe/Paris ;
- D6 : ligne interrompue par `null`, zéro authentique, échelle >100 % ;
- D7 : analyses et origines distinctes, aucune fausse génération, révisions valides, bornes de texte.

Il s'agit de **tests de logique réellement exécutés**, mais non de tests E2E Next.js ni de l'exécution de `tests/smn-234-sprint-transverse-d9.test.ts` à l'intérieur du dépôt.

### B. Vérifications de cohérence sur les sources GitHub

**31 contrôles statiques réussis sur 31**, répartis en trois lots 16/16, 10/10, 5/5 :
- sept identités d'onglets sans Synthèse, chargement par ID dans le contexte d'équipe, retour 404 hors contexte, lecture collective autorisée ;
- transaction `REPEATABLE READ READ ONLY`, lecture nominative conditionnée aux droits `members` ;
- six lecteurs d'onglet strictement filtrés par équipe, récupération du dernier snapshot Vn, absence de DDL de consultation ; cinq dernières clôtures au maximum pour Tendances ;
- nouvelle clôture capturant présence et Bilan, **ne capturant pas de faux registres** ;
- liens opérationnels désactivés pour D4/D8 en historique, six registres non simulés ;
- cohérence des clés de traduction `sprintDetail` FR/EN et nouveaux messages D9 ;
- présence dans GitHub des tests **D1 à D9**.

Le test intégré `tests/smn-234-sprint-transverse-d9.test.ts` a été **écrit et publié** avec des scénarios dynamiques sur les contrats purs ainsi que des garde-fous de sources. **Il n'a pas été exécuté avec `tsx` dans l'application entière.**

### C. Contrôles non réalisés

- **Aucun `pnpm typecheck` global** (l'environnement de contrôle dispose de Node.js 22, non de Node.js 24 + `pnpm` + dépendances SMN).
- Aucun `pnpm i18n:check`, `pnpm build`, `pnpm lint` ni `pnpm test` exécuté sur le dépôt complet.
- Aucune base PostgreSQL SMN réelle interrogée en intégration ; aucune migration, authentification navigateur, session utilisateur ou route Next.js testée de bout en bout.
- Aucun test visuel responsive 320/375/768/1440, contraste, navigation clavier, zoom 200 %, lecteur d'écran, dark/light ou comparaison des deux langues en navigateur réel.
- GitHub Actions étant indisponible pour ce projet, aucun résultat CI n'est revendiqué.

## 4. Matrice des AC de SMN-234

| Critère | État vérifiable D9 | Reste à réaliser |
|---|---|---|
| AC1 bandeau et sept onglets | Code existant, navigation et identité vérifiées statiquement | Vérification dans le navigateur |
| AC2 modifications ciblées / RBAC | Routes et gardes serveur détectés ; pas de crayon artificiel pour données calculées | Tests véritables admin/user, conflits et historiques |
| AC3 Objectifs | Code et tests D2 présents | Écritures, évaluation et audit PostgreSQL |
| AC4 Cérémonies | Trois sources ; historique sans liens vers versions courantes | Statuts/horaires/occurrences réels ; « ajournée » à arbitrer |
| AC5 Capacité | J/H de présence distincts de développement ; test isolé réussi | Temps partiel réel, absences, jour férié, droits et snapshot réels |
| AC6–7 Indicateurs | Huit champs, quatre dérivés, cas nuls et 100 % testés isolément | Persistance, éditions et audits en DB |
| AC8 Registres | Socle UI et port d'intégration publié ; indisponibilité honnête | **Epic 5 : producteurs, relations, liens réels, Vn** |
| AC9 Tendances | Trois graphiques, dernière Vn et 5 clôtures ; géométrie testée | Affichage SVG et valeurs historiques PostgreSQL |
| AC10 Bilan | Deux blocs, provenance, révisions et contrôle optimistic lock dans le code | Tests API, édition double session, snapshots PostgreSQL |
| AC11 historique/immutabilité | SIX lecteurs historiques + Tendances ; correction des liens D4/D8 | Recette réouverture/reclôture et cas snapshots anciens |
| AC12 accessibilité et régressions | Panneaux responsive Bootstrap présents ; vieux formulaires préservés | Recette navigateur complète et validation UX |
| AC13 tests | Tests D1–D9 publiés, 22 exécutions isolées, 31 checks statiques | Exécution de la suite intégrée et corrections |

## 5. Protocole local complet Windows 11

**Préconditions :** synchroniser `main` dans GitHub Desktop ; utiliser Node.js 24.x et pnpm 12.10.0 déjà disponibles ; disposer d'une installation SMN de test et d'un compte admin et d'un compte user.

Ouvrir **PowerShell à la racine du dépôt** :

```powershell
node --version
pnpm --version
pnpm typecheck
pnpm i18n:check
pnpm lint
pnpm exec tsx --test tests/smn-234-sprint-detail-d1.test.ts tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-indicators-d3.test.ts tests/smn-234-sprint-ceremonies-d4.test.ts tests/smn-234-sprint-presence-d5.test.ts tests/smn-234-sprint-trends-d6.test.ts tests/smn-234-sprint-review-d7.test.ts tests/smn-234-sprint-registers-d8.test.ts tests/smn-234-sprint-transverse-d9.test.ts
pnpm build
pnpm dev
```

**Si une commande échoue**, conserver le texte intégral de l'erreur dans le suivi ; ne pas masquer la défaillance par l'absence de GitHub Actions. Ne pas exécuter de purge ni de migration invasive pour « réparer » les tests. Ne pas interpréter la présence de tests écrits comme leur réussite.

**Recette navigateur :**
1. Créer/utiliser un Sprint de **test** avec un objectif, différentes cérémonies, différents profils de membres, indicateurs enregistrés et analyses.
2. Vérifier 7 onglets, nom/dates/fuseau, changement d'onglet conservant le Sprint ; accès depuis liste puis retour dashboard. Tester une autre équipe, un ID inconnu et un compte `user`.
3. Tester Objectifs : 0/1/plusieurs, création, correction et évaluation ; puis les huit indicateurs et quatre dérivés pendant la saisie et après sauvegarde.
4. Cérémonies : 0/1/30/205 réunions, statuts automatiques vs confirmés, durée réelle null, liens actifs autorisés et **liens désactivés sur Sprint clôturé**.
5. Capacité : SM/PO avec 0 % Dev, cinq matinées, demi-journées absentes, férié, congé, affectation partielle et couverture inconnue ; `user` n'accède à aucune identité de membre.
6. Tendances : 0/1/5 clôtures, >100 %, valeur nulle, capacité réelle ≠ présence et tableau accessible.
7. Bilan : saisies Analyse/IA indépendantes, auteur/date, révision, conflit entre deux sessions ; aucun générateur IA ; contrôle que `user` n'a pas de crayons.
8. Registres : **aujourd'hui** six catégories + « Indisponible Epic 5 » ; n'exiger aucune fausse fiche. **Après Epic 5**, tester multi-cycles, statuts, fiches réelles et snapshots V1/V2.
9. Fermer un Sprint de test, vérifier les champs figés ; le rouvrir puis le modifier/reclôturer pour produire V2 **uniquement dans l'environnement de test**. Contrôler que les anciens liens historiques ne pointent pas des états actuels divergents.
10. Contrôler FR/EN, téléphone 320/375, tablette 768, desktop 1440, 200 % de zoom, navigation clavier, thème sombre/clair ; garder les anciens formulaires jusqu'à validation explicite de non-régression.

## 6. Décision de sortie

**D9 technique : livré partiellement ; D9 recette globale : NON VALIDÉE**. La fiche Sprint comporte sept onglets structurels sur `main`, mais **SMN-234 doit rester ouverte** en Jira tant que les tests locaux ci-dessus ne sont pas réalisés et que l'Epic 5 n'a pas livré les six registres, leurs associations et snapshots.

**Bloqueurs / arbitrages restants :**
- **Epic 5 :** SMN-89–112, notamment SMN-89, SMN-90, SMN-97, SMN-106–110, SMN-111/112, pour finaliser D8.
- **Statut « Ajournée/Reportée »** des cérémonies : non prévu dans le modèle existant, aucun faux statut créé.
- **Temps partiel :** cohérence entre `contractPercent` et calendrier individuel de demi-journées.
- **Historique des fiches individuelles :** routes et vues de snapshot historique à spécifier si l'accès détaillé aux réunions/registres d'un Sprint clos est exigé.
- **Bilan IA :** génération automatique reportée à Epic 9 ; aucune génération artificielle.
- **Anciens formulaires :** maintien tant que la recette n'a pas démontré leur remplacement fonctionnel.

## Références

- [SMN-234 Jira](https://lmn24.atlassian.net/browse/SMN-234)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
- [Rapport D8](realisation-d8-registres-fiche-sprint-smn-234-2026-10-23.md)
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
