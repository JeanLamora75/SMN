# SMN-234 — D3 : indicateurs du Sprint (F01–F12 / I01–I02)

**Date :** 23 octobre 2026. **Branche :** `main`. **Epic :** SMN-228. **État :** code publié, revue statique effectuée, module de calcul vérifié isolément ; **compilation / recette complète SMN non exécutées**.

## Périmètre réalisé

La route réelle `/app/admin/sprints/[sprintId]?tab=indicators` affiche les valeurs du Sprint sélectionné, sans sélecteur d'un autre Sprint ni duplication des formulaires globaux :

- **Huit indicateurs éditables :** F01 SP initialement engagés, F02 SP ajoutés, F03 SP retirés, F04 SP terminés, F10 tickets initialement engagés, F11 tickets terminés, I01 confiance de l'équipe (1–5), I02 clarté des objectifs (1–5).
- **Quatre indicateurs calculés :** F05 = F01+F02−F03 ; F06 = F05−F04 ; F07 = F04/F05×100 pour F05>0 ; F12 = F11/F10×100 pour F10>0. Une source manquante ou un dénominateur nul implique « non calculable » ; aucune division par zéro ni plafonnement des dépassements.
- **Édition :** crayon Bootstrap pour chaque valeur effectivement éditable dans un Sprint non clôturé et pour un compte admin uniquement. Chaque crayon ouvre un dialogue prérempli pour son groupe cohérent (quatre SP, deux tickets ou deux évaluations). **Les dérivés se recalculent immédiatement dans le dialogue sur les brouillons** ; rien n'est enregistré avant le clic « Enregistrer ». Les valeurs affichées hors dialogue restent persistées jusqu'au succès et au rafraîchissement.
- **Numérique :** SP et tickets sont des entiers facultatifs `0..1 000 000 000` ; Confiance et Clarté sont des entiers facultatifs `1..5`. Zéro réel différent de `null`, champs vides autorisés ; saisie non entière, exponentielle ou hors bornes rejetée. Les deux scores sont **une dernière valeur par Sprint**, historisée à chaque correction (date/auteur/avant-après dans l'audit) ; aucune interpolation n'est inventée.
- **Audits/permissions :** les écritures F01–F04 réutilisent `writeStoryPoints`, F10/F11 réutilisent `writeSprintTickets`. Nouvelle API `PUT /api/admin/sprints/scores` avec `authorizeApi(...,"write",settings)` et `writeSprintScores` : transaction, contrôle du Sprint, refus `closed`, contrôle de `revision` optimiste, audit des scores. Chaque groupe est enregistré de manière atomique et indépendamment ; **la sauvegarde des 8 valeurs en une seule transaction n'est pas offerte**.
- **Lecture collective :** nouveau `readSprintDetailIndicators` en SELECT-only, avec contrôle du Sprint et de `team_id`, absence de DDL dans les lectures `REPEATABLE READ READ ONLY`. Les tables absentes avant première saisie donnent des **valeurs non renseignées (`null`)**, jamais 0 ; leur création se fait sur l'enregistrement admin explicite.
- **Clôtures Vn :** `changeSprintClosure` prépare la table des scores avant la transaction de clôture, et `snapshot` enregistre les deux notes dans `confidenceClarity` avec les SP et tickets existants. Le lecteur d'un Sprint clôturé lit exclusivement le dernier snapshot disponible et indique `history-missing` pour les deux notes absentes d'anciennes versions ; données malformées = `read-failed`. Réouverture/reclôture suit toujours le workflow historique.
- **État des autres onglets :** D1/D2 inchangés ; Cérémonies/Capacité/Registres/Tendances/Bilan restent à développer selon D4–D8.

## Matrice de fichiers

| Fichier | Travail |
|---|---|
| `src/lib/sprint-indicator-values.ts` | Nouveau moteur pur commun + validations ; `deriveSprintIndicators`, `parseIndicatorDraft` |
| `src/server/sprints/story-points.ts` | Réexport de la fonction `deriveStoryPoints` partagée, suppression du calcul dupliqué |
| `src/server/sprints/sprint-scores.ts` | Nouvelle persistance scores et audit avec contrôle révision, refus clôture |
| `src/app/api/admin/sprints/scores/route.ts` | Nouvelle mutation admin protégée |
| `src/server/sprints/indicators-read.ts` | Nouveau lecteur collectif read-only des données courantes et snapshots |
| `src/server/sprints/closure.ts` | Inclusion des scores dans les snapshots des nouvelles clôtures |
| `src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx` | Huit crayons, formulaires, calculs provisoires en direct, quatre valeurs dérivées |
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Intégration de l'onglet et lecture uniquement lorsque demandé |
| `src/i18n/fr.json`, `src/i18n/en.json` | Libellés et erreurs dans les catalogues FR/EN |
| `tests/smn-234-sprint-indicators-d3.test.ts` | Scénarios calculs, lecteur, snapshots, droits et score audit/versions |

Les anciens formulaires de synthèse SP/tickets restent en place pour la transition, jusqu'à D9.

## Vérifications réellement exécutées

- **Relecture GitHub :** 18 contrôles statiques de présence et de cohérence d'intégration validés (18/18) au moment de la revue : séparation lecture/écriture, droits, snapshot, traductions FR/EN, huit champs, quatre dérivés, audit, API.
- **Module pur authentifié :** copie du fichier exact `src/lib/sprint-indicator-values.ts` dans l'environnement de contrôle ; `git hash-object` égale le blob GitHub **`22e0f92f1a5b67f5cfa5366f9721eec18dbbc67c`**.
- **TypeScript isolé :** `tsc --target es2022 --module commonjs --noEmit --skipLibCheck` sur ce **seul module** : réussi (TypeScript disponible sur l'environnement de contrôle).
- **14 assertions isolées réellement exécutées** sous Node.js v22 : F05/F06/F07/F12, dépassement >100%, source absente, dénominateur 0, zéro réel, score entre 1 et 5, rejet décimal/négatif/hors bornes/exponentiel. **14/14 réussies**.
- **Non exécutés :** `pnpm typecheck` du projet, `pnpm exec tsx --test tests/smn-234-sprint-indicators-d3.test.ts`, `pnpm i18n:check`, `pnpm build`, migrations PostgreSQL sur une installation réelle, tests serveur Next.js et recette navigateur. Le dépôt complet et les dépendances SMN ne sont pas présents sur l'environnement ; GitHub Actions désactivées. **Ne pas confondre les 14 contrôles purs avec le test complet du lot.**

## Scénarios locaux à vérifier

1. Depuis GitHub Desktop, synchroniser `main`, puis exécuter dans PowerShell :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-indicators-d3.test.ts tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-detail-d1.test.ts tests/smn-236-sprint-tickets-working-days.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

2. Ouvrir un Sprint **de test**, onglet Indicateurs, en admin. Vérifier les huit crayons et les quatre dérivés, les transitions `null`/0, F05=13 F06=-2 F07>100% et F12=125% avec valeurs fictives F01=10 F02=5 F03=2 F04=15 F10=4 F11=5 ; annuler et s'assurer qu'aucune écriture n'a été enregistrée.
3. Enregistrer un groupe SP puis tickets puis notes 1–5 et vérifier l'affichage au rafraîchissement. Vérifier une erreur de version concurrente, un refus 409 après clôture, un compte user sans icônes, FR/EN, 320px/desktop, clavier/fermeture de dialogue.
4. Clôturer un Sprint de test via workflow existant, constater le snapshot Vn des huit valeurs et une absence historique non simulée ; vérifier l'absence de régression du dashboard et du bilan.

**Conclusion :** D3 développé sur `main`, **pas recetté au sens Definition of Done** ; la Story SMN-234 demeure ouverte. **Prochaine étape fonctionnelle : D4 — Cérémonies** : toutes les réunions du Sprint, provenance et statut (dont règles de report encore à arbitrer), durée et lien de fiche, sans limite artificielle de cinq.

## Références

- Jira : https://lmn24.atlassian.net/browse/SMN-234
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
- [Audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
