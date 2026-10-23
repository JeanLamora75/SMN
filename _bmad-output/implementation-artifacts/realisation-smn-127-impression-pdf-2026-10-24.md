# SMN-127 — Préparation de l'impression PDF depuis l'aperçu HTML

Jira : https://lmn24.atlassian.net/browse/SMN-127 — Story 6.17.

## Livraison partielle sur main

- Action explicite « Imprimer / Enregistrer en PDF » depuis la prévisualisation HTML réservée à l'Administrateur ; validation d'un message d'avertissement préalable.
- Mise en page d'impression A4 séparée : titres, tableaux et lignes protégés autant que le navigateur le permet ; les commandes et liens de retour sont masqués à l'impression.
- Impression du DOM correspondant à l'aperçu affiché, dans la langue choisie, sans recomposition ni transfert vers un service externe.
- Aucune sauvegarde serveur et aucune création d'archive lors de cette action.
- Tests statiques de garde et d'impression ajoutés.

## Critères non satisfaits à ce stade

**Il ne s'agit pas encore d'un export PDF serveur conforme à SMN-127.** La fonction `window.print()` déclenche la boîte de dialogue du navigateur ; l'utilisateur doit sélectionner manuellement « Enregistrer au format PDF ». Aucun fichier PDF stable n'est généré ni vérifié par SMN.
- AC1 / AC2 / AC4 : à recetter visuellement, graphiques manquants depuis SMN-124.
- AC3 : pas d'empreinte ni de gel transactionnel des données de l'aperçu ; les modifications concomitantes ne sont pas détectées à l'export.
- AC5 : accès HTML réservé aux Administrateurs, mais la commande d'impression du navigateur ne remplace pas une autorisation d'export côté serveur.
- Production et stockage immuable d'un PDF, versionnement, lien avec clichés historiques et contrôle de conformité HTML/PDF à développer.

## Vérifications non exécutées

`git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-127-print-report.test.ts` ; `pnpm i18n:check` ; `pnpm build`. Recette de l'impression Windows/Chrome et PostgreSQL requise.

Statut Jira à laisser ouvert.
