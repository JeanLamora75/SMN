# SMN — Sélecteur Sprint du header et contexte du tableau de bord

**Date :** 23 octobre 2026  
**Statut :** correction sur branche dédiée, recette Windows/PostgreSQL non encore exécutée.  
**Références :** SMN-21 (dashboard UX), SMN-23 (navigation contextuelle), SMN-230 (index Sprint), AD-2/5/19/26/31.

## Anomalie constatée

Le header de SMN affichait toujours la seule option désactivée « Aucun cycle créé », alors que l'utilisateur possédait un Sprint en cours et deux Sprints à venir. Le rendu `private-shell.tsx` était volontairement codé en dur, tandis que le cockpit `cycle-overview.tsx` affichait également un état vide constant. La liste des Sprints existe déjà sur la page dédiée SMN-230, mais ne pilotait ni le header ni la page `/app`.

## Contrat fonctionnel retenu

1. Le header affiche la **liste complète de tous les Sprints non supprimés de l'équipe courante**, indépendamment du statut, sans limite arbitraire à 100 et sans charger un autre périmètre d'équipe.
2. À l'ouverture de la page, le **Sprint effectivement en cours selon la période [début,fin)** est présélectionné, même si le statut persisté `planned` ou `active` est temporairement obsolète. Un Sprint suspendu ou clôturé ne devient pas actif automatiquement.
3. S'il n'existe aucun Sprint en cours, sélectionner le plus proche à venir, puis le plus récent terminé, et enfin un Sprint historique restant pour ne pas afficher un sélecteur sans valeur.
4. Le choix explicite d'un autre Sprint est autorisé (y compris futur/passé) et conservé par `cycleId` dans l'URL du dashboard ; une sélection absente ou extérieure à l'équipe ne donne accès à aucun autre périmètre, elle revient à la sélection par défaut.
5. La sélection dans le header navigue vers `/app?teamId=...&cycleId=...` ; les paramètres de vue historiques obsolètes `version` et `asOf` sont nettoyés quand le Sprint change.
6. Le tableau de bord affiche **nom, dates et statut réel du Sprint sélectionné**. Les métriques et registres qui ne disposent pas encore de lecture métier branchée restent explicitement « source non raccordée » ; **aucune valeur n'est fabriquée**.
7. Aucun Sprint n'est réconcilié, migré ou modifié par cette lecture : requêtes PostgreSQL **en lecture seule**, même lorsque les statuts historiques sont en retard.
8. Lors de la navigation après création d'un Sprint, la liste est rechargée ; l'équipe et les droits serveur restent vérifiés.

## Couverture du correctif

- `src/lib/sprint-context.ts` : règles de sélection et statut effectif déterministes, testables.
- `src/server/sprints/context.ts` : lecture sans DDL de tous les Sprints de l'équipe, excluant `deleted_at`, avec support des anciens schémas sans colonne `auto_suspended`.
- `src/app/api/sprints/context/route.ts` : API de collection autorisée côté serveur, aucun identifiant d'équipe libre fourni par l'appelant.
- `src/app/app/private-shell.tsx` : select activé et alimenté, changement de contexte par URL, gestion de chargement/erreurs.
- `src/app/app/page.tsx` et `cycle-overview.tsx` : tableau de bord aligné sur `cycleId`, ou sur la sélection par défaut calculée, sans KPI simulés.
- `src/i18n/fr.json` et `en.json` : libellés supplémentaires.
- Tests nouveaux et tests UX existants adaptés.

## Scénarios d'acceptation proposés

- **AC1 :** trois Sprints enregistrés (un en cours, deux futurs) → trois options visibles, Sprint en cours sélectionné par défaut.
- **AC2 :** choix d'un Sprint futur → sélection de l'option et titre/dates/statut du cockpit changent.
- **AC3 :** choix d'un Sprint passé → l'affichage de ce Sprint est possible, sans réécriture du statut.
- **AC4 :** aucune table Sprint / aucun Sprint → l'état vide reste correct et l'option est désactivée.
- **AC5 :** plus de 100 Sprints → tous apparaissent dans le sélecteur ; aucune pagination implicite.
- **AC6 :** identifiant `cycleId` forgé/inconnu → impossible de lire des Sprints d'une autre équipe, retour au Sprint autorisé par défaut.
- **AC7 :** authentification absente → API 403, aucune donnée envoyée.
- **AC8 :** erreur PostgreSQL → message de chargement indisponible ; ne jamais dire « Aucun cycle créé » par défaut en cas d'erreur.
- **AC9 :** le sélecteur est cohérent avec le cockpit, mais les métriques non reliées restent clairement indisponibles.
- **AC10 :** contrôles clavier et libellés FR/EN conservés.

## Vérifications non effectuées

Aucun accès à la base Windows de l'utilisateur, aucune commande `pnpm typecheck`, `pnpm test` ni `pnpm build` n'a été exécutée sur le code complet. Les modifications sont limitées à une branche et seront proposées dans une PR distincte ; **ne pas annoncer une recette terminée ou une fusion** avant réalisation effective.
