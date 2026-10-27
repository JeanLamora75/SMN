# SMN-282 — Recette manuelle du lot 6C (brouillon)

**Branche de validation :** `feat/smn-282-multi-teams-foundation-20261026` (PR #189).
**Statut :** scénarios définis, **aucun test exécuté**. Migration v28 et feature flag non activés par Amelia.
**Précondition indispensable :** environnement Windows de test isolé, sauvegarde préalable de la base, et activation de v28 uniquement dans une procédure distincte validée par le Product Owner. Ne jamais appliquer cette recette sur les données métier réelles avant validation de la migration.

## Jeu de données

Préparer deux équipes A et B sous une même installation, deux Sprints A1 et B1, un Admin actif, un compte `user`, un document de Studio pour chaque Sprint, des archives et des références figées propres à chaque équipe. Consigner les identifiants effectivement créés ; ne jamais les recopier comme exemples fixes dans les scripts.

## Scénarios obligatoires

| ID | Action manuelle | Résultat attendu |
|---|---|---|
| 6C-01 | Admin sélectionne A, ouvre Centre Rapports | Seulement documents, Sprints et archives A |
| 6C-02 | Admin sélectionne B avec URL de document A | 404 ou refus ; aucun contenu A |
| 6C-03 | Créer et modifier un rapport A, puis consulter B | Aucune création ni modification du côté B |
| 6C-04 | Deux sessions modifient le même document | Conflit ou séquences gérées ; pas de perte silencieuse |
| 6C-05 | Modifier sections, notes, blocs, contenu, langue, historique | Écritures et audits limités au Sprint autorisé |
| 6C-06 | Paramètre `teamId` manquant dans une installation v28 | Anciennes routes v27 bloquées |
| 6C-07 | `teamId` inconnu, altéré ou équipe supprimée | Accès refusé, aucune donnée retournée |
| 6C-08 | Compte `user` appelle API avec `teamId` A/B | 403 ; habilitations `user` non créées avant V1 |
| 6C-09 | Référence figée Sprint A présentée pour Sprint B | Refus avant rendu ou archive |
| 6C-10 | PDF Studio A exporté puis archivé | Contenu, `teamId` et cycle A uniquement ; qualité et révision contrôlées |
| 6C-11 | Télécharger archive A avec `teamId=B` | 404 ou refus ; jamais d'octets PDF A |
| 6C-12 | Masquer archive A avec `teamId=B` | Refus, archive A non modifiée |
| 6C-13 | Réutiliser `operationId` PDF d'une autre équipe | Conflit, aucune archive remplacée |
| 6C-14 | Altérer/supprimer les octets PDF en stockage privé | Archive rejetée par le contrôle d'intégrité |
| 6C-15 | Rendu PDF Sprint standard v28 | **503 `team-pdf-preview-pending` attendu jusqu'à qualification de la page interne** |
| 6C-16 | En v27, parcourir Rapports/Studio/PDF/archives | Non-régression par rapport au MVP précédent |
| 6C-17 | Vérifier une préférence d'équipe devenue invalide | Refus et absence de sélection implicite |
| 6C-18 | Tester des homonymes et IDs croisés | Autorisation strictement par ID d'équipe, jamais par nom |

## Barrière de clôture 6B — état du code au 27/10/2026

Le point d'entrée `src/app/app/admin/sprints/[id]/report/preview/page.tsx` a été créé et la route PDF v28 raccordée. La prévisualisation vérifie l'authentification, l'appartenance au Sprint/équipe et l'intégrité de la référence figée. **Ces protections n'ont pas été exécutées localement.** Ne pas considérer le lot 6B validé avant de vérifier le rendu réel, les refus d'accès interéquipes, l'intégrité et le comportement historique v27.

Tests PDF manuels complémentaires : export A avec référence A (succès) ; URL directe A avec référence B (404) ; export A avec `teamId` B (refus) ; URL directe sans équipe en v28 (refus) ; rôle user (refus) ; référence corrompue (refus) ; opération PDF relancée avec le même identifiant (même archive) ; format A4 et contenu du PDF lisibles. Vérifier qu'un `teamId` malformé renvoie HTTP 400.

## Résultats et décision

Consigner pour chaque ID : OK / KO / non exécuté, date, environnement, capture ou log, anomalie Jira éventuelle. Réexécuter les cas après toute correction. La PR #189 ne doit pas être fusionnée sur la seule base de cette checklist non exécutée.
