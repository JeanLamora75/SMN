---
project: SMN
date: 2026-10-23
language: fr
story: SMN-236
epic: SMN-1
parent_ux: SMN-21
deployment_branch: main
status: implementation-published-awaiting-product-rule-and-windows-recette
---

# SMN-236 — Tickets agrégés et jours ouvrés restants

## Constat initial vérifié

Aucune source Scrum du nombre de tickets initialement engagés et terminés n'a été retrouvée sur `main`. Les Story Points `smn_sprint_story_points` représentent une mesure distincte et **ne peuvent pas être convertis en tickets**. Il faut donc deux agrégats facultatifs par Sprint, sans objet « ticket » individuel et sans connexion Jira.

Le compteur de jours ouvrés doit se fonder sur le calendrier **lundi–vendredi**, les bornes `[start_at,end_at)` et le fuseau IANA du Sprint. **La convention d'inclusion du jour courant reste un arbitrage métier ouvert dans Jira**. Pour pouvoir tester visuellement le compteur, une convention explicite **provisoire** est implémentée : inclure la date du jour si elle est ouvrée et que le Sprint n'est pas fini. Cette règle est visible dans le dashboard, isolée par `TodayPolicy` et remplaçable sans migration de données.

## Sources et données

| Objet | Rôle | Mutation |
| --- | --- | --- |
| `public.smn_sprint_ticket_counts` | `sprint_id` unique, `initial_tickets` et `done_tickets` BIGINT nullables (0 valide), `revision`, acteur et date | Création transactionnelle **au premier enregistrement administratif autorisé**, sinon aucune création |
| `public.smn_sprint_ticket_counts_audit` | Historique `before_values` / `after_values`, acteur, date | Enregistrement à chaque sauvegarde réussie |
| `smn_sprint_closure_snapshot.snapshot.ticketCounts` | Agrégats tels qu'enregistrés lors de la clôture Vn | Nouvelle clé ajoutée uniquement aux **futures** clôtures. Vn existantes jamais réécrites |
| `src/lib/sprint-working-days.ts` | Décompte pur des jours civils locaux du lundi au vendredi | Aucun SQL, aucune valeur de capacité humaine |
| `CollectiveCycleProjection.tickets` et `.workingDaysRemaining` | Projection commune du Sprint autorisé | Lecture PostgreSQL `REPEATABLE READ READ ONLY` |

**Installation :** les deux nouvelles tables figurent dans `INSTALLATION_RELATIONS` afin qu'elles ne provoquent pas de faux diagnostic de schéma incompatible. Pas de migration Prisma ni d'évolution du marqueur `schema_version`. La base actuelle du PC **n'est pas mise à jour automatiquement par le simple `pnpm dev`** : l'initialisation intervient lors de la première sauvegarde des nombres dans le bilan, après confirmation de l'administrateur.

## Implémentation publiée directement dans `main`

- `src/server/sprints/ticket-counts.ts` : validation stricte des deux comptes `null` ou entier non négatif, contrôle de périmètre équipe et installation, interdiction des écritures sur Sprint `closed`, contrôle optimiste de révision, transaction et audit, GET sans DDL.
- `src/app/api/admin/sprints/tickets/route.ts` : GET lecture autorisée, PUT administrateur protégé par session, origine valide et contrôle de la ressource serveur.
- `src/app/app/admin/sprints/ticket-counts-form.tsx` : deux champs numériques facultatifs, édition uniquement par admin, prévention des pertes de modifications, zéro distinct de vide.
- `src/app/app/admin/sprints/review/page.tsx` : intégration du formulaire **dans le bilan du Sprint**, pas dans les Paramètres généraux.
- `src/server/sprints/closure.ts` : sérialisation conditionnelle de `ticketCounts` dans les futures clôtures.
- `src/server/dashboard/cycle-reader.ts` : lecture des deux comptes pour le Sprint sélectionné, savepoint isolée, utilisation des valeurs `ticketCounts` de la Vn la plus récente si clôture. Vn sans ce champ : état `history-missing`, jamais chiffres actuels.
- `src/app/app/cycle-overview.tsx` : carte Tickets (engagés initiaux, terminés), compteur des jours ouvrés avec texte de convention provisoire.
- `src/i18n/fr.json`, `en.json` : terminologie et avertissements traduits.
- `tests/smn-236-sprint-tickets-working-days.test.ts` : logique des dates et fuseaux, DST, 0/null, portée, contrôle de révision, audit, provenance Vn, source absente, sécurité des routes. `tests/smn-235-dashboard-projection.test.ts` adapté à la lecture de l'horloge transactionnelle.

## Sémantique précise du compteur pour le MVP

1. `[début,fin)` : le jour calendaire de la borne exclusive est exclu s'il débute **après** le dernier instant du Sprint. Une fin le lundi 00:00 n'ajoute donc pas le lundi.
2. `Europe/Paris` ou autre IANA : calcul sur les jours civils locaux, pas par multiples de 24 heures ; changement d'heure DST sans double compte.
3. Sprint futur : nombre total de jours lundi–vendredi situés dans la période ; **valeur planifiée**, non un réalisé futur.
4. Sprint en cours : compter les jours de semaine entre aujourd'hui et la fin ; convention **provisoire** « aujourd'hui inclus ».
5. Sprint terminé : `0` restant, jamais négatif.
6. Sprint suspendu : valeur non présentée comme fiable tant que la suspension ne définit pas une nouvelle période.
7. Le calendrier national des jours fériés et les fermetures d'équipe ne sont **pas encore** déduits de cette carte : le contrat Jira SMN-236 est expressément borné à lundi–vendredi. Une éventuelle exclusion devra être arbitrée en cohérence avec le calendrier/les autres modules ; ne pas la supposer.

## Risques et portes d'arbitrage

- **PM-236-A — Jours restants :** John doit confirmer « aujourd'hui inclus » ou « seuls jours complets futurs ». Changement uniquement de la politique de calcul et du libellé, pas de migration.
- **PM-236-B — Fériés/fermetures :** à confirmer si le calendrier de référence doit évoluer au-delà des jours lundi–vendredi pour ce compteur.
- **PM-236-C — Engagement initial :** les corrections sont actuellement possibles jusqu'à la clôture et tracées en audit (comme les SP). Pour un éventuel verrouillage à l'ouverture, prévoir une décision métier distincte avant release.
- Le producteur n'existait pas avant ce développement : les Sprints de test déjà créés afficheront des valeurs non renseignées jusqu'à saisie explicite. Aucun nombre n'est importé de Jira ni dérivé des SP.

## Recette Windows 11 — à exécuter

Récupérer `main` dans GitHub Desktop puis, dans PowerShell :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-236-sprint-tickets-working-days.test.ts tests/smn-235-dashboard-projection.test.ts tests/dashboard-data-contract.test.ts tests/dashboard-cycle-overview.test.ts
pnpm dev
```

Dans **Cycles et bilans → Sprints → Bilan du Sprint** : sélectionner un Sprint ouvert, entrer un engagement initial par exemple 12 et des tickets terminés 5 puis enregistrer ; vérifier le dashboard de ce Sprint. Vérifier `0`, champs vides, changement de Sprint, refus d'édition user/closed, journée de vendredi/weekend, Sprint futur et passé. Après première sauvegarde, `pnpm db:diagnose` doit toujours reconnaître le schéma, sans réinstallation.

**Limites de livraison :** code et documentation poussés directement sur `main` ; aucun accès à la base de l'utilisateur, aucune commande Node.js/typecheck/PostgreSQL réelle exécutée depuis ChatGPT ; tests rédigés mais non attestés. **Ne pas déclarer SMN-236 terminée dans Jira tant que l'arbitrage du PM et la recette locale ne sont pas validés.**
