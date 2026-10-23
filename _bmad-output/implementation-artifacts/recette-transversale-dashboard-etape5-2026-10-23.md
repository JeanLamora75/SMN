---
project: Scrum Master Notebook
language: fr
date: 2026-10-23
scope: SMN-21; SMN-235; SMN-236; SMN-237
status: "revue-code-publiee-tests-rediges-recette-windows-a-faire"
delivery: main
deferred: SMN-238; epic-5
related: SMN-86
---

# Étape 5 — Revue et recette transversale du dashboard (hors Epic 5)

## Décision de périmètre

Sur instruction explicite de l'utilisateur, l'**étape 4 / SMN-238 est différée** jusqu'au développement des producteurs des registres de l'**Epic 5**. Les colonnes Risques, Obstacles, Notes et Alertes **ne sont pas simulées** pour réaliser l'étape 5. La Story SMN-21 reste **en cours**, car sa clôture exige également les producteurs de l'Epic 5, la recette réelle et la vérification des comparaisons sous SMN-86.

**Livraison demandée :** code et documentation directement sur `main` sans demander à l'utilisateur de gérer des PR. Ce document ne constitue ni une validation PostgreSQL ni une clôture de Jira.

## Travaux et résultats de la revue du 23 octobre

| Contrôle | Constat vérifiable sur `main` | Action / état |
| --- | --- | --- |
| Sprint du header / cycleId | `private-shell.tsx` propose les Sprints et navigue avec `teamId/cycleId` ; `page.tsx` sélectionne une occurrence de l'équipe autorisée. | Contrat existant conservé, scénario A/B couvert par le test transversal. |
| RBAC | `canAccess` autorise `admin` et `user` en lecture collective, mais seul `admin` peut écrire les agrégats ; périmètre révalidé côté SQL dans `readCycleDashboard`. | Scénarios positifs/négatifs ajoutés ; recette des comptes réels encore nécessaire. |
| Projection en lecture seule | `withDashboardRead` démarre `REPEATABLE READ READ ONLY`, puis `readCycleDashboard` charge objectifs/SP/JH/tickets/événements de ce cycle. | Les opérations de lecture n'effectuent pas de DDL ; test d'absence d'écritures dans les mocks ; vérification SQL réelle encore nécessaire. |
| Valeurs et historique | Contrat `available` / `not-recorded` / `unavailable` ; clôture `status=closed` consulte `smn_sprint_closure_snapshot` Vn, jamais les métriques courantes. | Tests A/B, 0/null, V2 et absence de donnée historique ajoutés. |
| Anciennes cérémonies | Le lecteur des cérémonies historiques remplaçait le statut par `unknown` malgré le champ `occurrence_status` en base. | **Corrigé :** `COALESCE(occurrence_status,'unknown')`, sans mutation des cérémonies. |
| Accessibilité des compteurs | En cas d'événements indisponibles, le composant affichait visuellement « — » mais annonçait `0 événements` en `aria-label`. | **Corrigé :** libellé traduit « Nombre d'éléments indisponible ». |
| Sprint terminé / clôturé | Le calcul temporel pouvait afficher des jours restants pour une fiche clôturée avec dates ultérieures ; pas de distinction du texte pour les Sprints futurs. | **Corrigé :** valeur 0 pour `closed/finished`, texte « Sprint à venir : total des jours ouvrés prévus » lorsqu'il est futur. |
| Erreur PostgreSQL | En échec de lecture des Sprints, le cockpit continuait à afficher « Aucun cycle créé ». | **Corrigé :** afficher l'alerte de lecture, masquer bandeau et colonnes qui feraient croire à une base vide. |
| Événements historiques manquants | Une clôture dépourvue de snapshot laissait `events=producer-not-ready`. | **Corrigé :** `history-missing`; aucune source actuelle n'est substituée. |
| Internationalisation | `fr.json` et `en.json` disposent d'une parité de clés vérifiée par comparaison des sources JSON, avec nouveaux messages sur les jours futurs. | Tests de parité et de présence des textes ajoutés. |
| Responsive / clavier | Mise en page 4/2/1 colonnes et sélecteurs natifs/ARIA déjà présents dans les sources. | Tests source existants + garde-fous ajoutés ; inspection navigateur 320/375/768/1280 px encore nécessaire. |
| Comparaisons historiques | SMN-86 fournit son écran dédié de tendances mais **aucune comparaison entre Sprints n'est raccordée au cockpit**. | Conserver l'état « Comparaison indisponible ». Raccorder seulement sur la base des données et règles effectivement livrées ; décision séparée avant clôture SMN-21. |
| Registres | Pas de producteur Epic 5 suffisamment livré pour SMN-238. | **Différé volontairement**, sans faux compte/faux historique. |

## Tests créés / contrôles ciblés

Le nouveau `tests/dashboard-transversal-step5.test.ts` contient des assertions couvrant :

1. Authentification et RBAC : admin/user lecture collective, refus user en écriture, comptes inactifs et hors équipe.
2. Deux Sprints A et B : objectifs, SP et tickets distincts, requêtes filtrées par `sprintId`, non-mélange des données.
3. Sprint forgé hors équipe : refus avant toute requête sur un producteur de données.
4. Sprint clôturé : V2 figée, valeurs null/0, aucune lecture métier courante et 0 jour restant.
5. Décompte lundi-vendredi avec convention provisoire paramétrable, fuseau Europe/Paris, weekend et fin de Sprint.
6. Absence de valeur et panne : distinction entre indisponible et vrai zéro ; libellés accessibles.
7. Parité de toutes les clés FR/EN et disponibilité des libellés de provenances, réunions et tickets.
8. Responsive source 4/2/1 ; présence des étiquettes et des blocs de navigation.
9. Erreur de lecture PostgreSQL : interdiction d'afficher trompeusement « Aucun cycle créé ».
10. Epic 5 : registres explicitement indisponibles jusqu'à livraison ; pas de calcul inventé.

Le test n'exécute **pas** un véritable PostgreSQL, un vrai navigateur ou une transaction concurrente. Les tests nouveaux et existants ont été **rédigés**, pas exécutés via pnpm dans l'environnement ChatGPT ; le dépôt distant n'est pas clonable depuis l'environnement de validation utilisé, et pnpm n'y est pas disponible.

## Suite de vérification sur Windows 11 (PowerShell)

Après synchronisation de `main` dans GitHub Desktop :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/dashboard-transversal-step5.test.ts tests/dashboard-cycle-overview.test.ts tests/dashboard-cycle-overview-source.test.ts tests/dashboard-operational-overview.test.ts tests/dashboard-ux-lot4-accessibility.test.ts
pnpm exec tsx --test tests/smn-header-sprint-context.test.ts tests/smn-235-dashboard-projection.test.ts tests/smn-236-sprint-tickets-working-days.test.ts tests/smn-237-dashboard-events.test.ts tests/dashboard-data-contract.test.ts
pnpm test
pnpm build
pnpm dev
```

**Si un test échoue :** ne pas conclure que la Story a passé la recette ; conserver intégralement le message d'erreur et corriger sur `main` avant d'avancer.

### Parcours manuel à réaliser

- **Utilisateur `admin` et `user` :** vérifier que les chiffres collectifs sont identiques, que `user` ne peut enregistrer de ticket, qu'aucune donnée nominative/absence individuelle n'est transmise à la page.
- **Sprints A/B :** un en cours et deux futurs ; constater la liste du header, la présélection en cours, puis des cartes Objectives/JH/SP/Tickets/Événements différentes après changement ; aucune donnée de A sur B.
- **Zéro/null :** sur un Sprint test enregistrer `0 SP`, `0 ticket` puis laisser d'autres champs vides ; vérifier les différences affichées.
- **Cérémonies :** modèle actif, réunion exceptionnelle, ancien modèle, aucun événement, statut annulé/tenu/reconstitué, date locale et lien vers la fiche.
- **Sprint clôturé / rouvert :** lire les V1/V2 sans changement rétroactif et sans recours silencieux aux sources courantes ; vérifier les données absentes des anciennes clôtures.
- **Dates :** Sprint futur (nombre total de jours planifiés), vendredi/samedi/dimanche, fin de Sprint, changement DST ; Sprint suspendu et clôturé sans J- négatif.
- **Navigation/UX :** clavier, lecteurs d'écran si possible, 320/375/768/1280 px, thèmes clair/sombre, FR et EN ; messages d'erreur SQL vs base sans Sprint.

## Portes encore ouvertes

1. **G5-T : tests réels** `pnpm typecheck`, tests ciblés, `pnpm test`, `pnpm build` et vérification PostgreSQL/UX non attestés.
2. **G5-D : règle produit** SMN-236 : inclusion d'aujourd'hui provisoire (pas de décision John) ; jours fériés/fermetures éventuels et verrouillage de l'engagement initial à clarifier.
3. **G5-E : dépendance Epic 5** SMN-238 non commencée ; reprise après disponibilité des producteurs et des instantanés nécessaires.
4. **G5-C : comparaisons** SMN-86 en cours et non raccordée au cockpit.
5. **G5-H : historique réel** les anciennes clôtures peuvent ne pas conserver les nouveaux champs Tickets et provenance des réunions, sans reconstruction de valeurs.

**Conclusion de l'étape 5 :** revue de code et renforcement des garde-fous publiés sur `main` ; recette réelle en attente. Ne pas clôturer Jira SMN-21, SMN-235/236/237 ou SMN-238 sur cette seule base.


## Correctif de compilation après recette PowerShell (23 octobre 2026)

L'utilisateur a exécuté `pnpm typecheck` sur Windows : **11 erreurs TS** dans trois fichiers, liées à deux causes.

- **TS2554** — `src/app/app/operational-overview.tsx` : `EventsColumn` utilisait un `t(key)` local limité à un argument alors que `eventCount` fournit aussi `{count}`. Le wrapper reçoit désormais facultativement `Readonly<Record<string,string|number>>` et transmet ce paramètre à `translate(locale,key,params)`. Le compteur reste traduit et accessible.
- **TS2322** — `tests/dashboard-data-contract.test.ts` et `tests/dashboard-transversal-step5.test.ts` : `collectionUnavailable("...")` inférait `DashboardCollection<unknown>`, incompatible avec les collections typées d'objectifs, événements et alertes. La signature est maintenant `collectionUnavailable<T=never>` : sans élément enregistré, la valeur `unavailable` est utilisable dans toutes les projections typées sans `any`, cast ni changement du contrat runtime. Un type explicite peut toujours être fourni.

**Vérification effectuée :** présence des deux corrections vérifiée sur la branche `main` ; une reproduction minimale de ces deux règles de types a été compilée localement avec `tsc --noEmit --strict` (résultat : succès). Le projet SMN complet et ses dépendances ne sont pas installés dans cet environnement : **aucun nouveau `pnpm typecheck` complet ne peut être revendiqué**.

**À exécuter sur Windows après synchronisation de `main` :**
```powershell
pnpm typecheck
pnpm exec tsx --test tests/dashboard-data-contract.test.ts tests/dashboard-transversal-step5.test.ts
```

Aucun schéma ni donnée PostgreSQL modifié ; les autres étapes du plan ne changent pas.
