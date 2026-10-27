# SMN-298 — Revue technique avant fusion

Date : 27 octobre 2026
Portée : PR #205, harmonisation des modales Cockpit Agile.
Méthode : lecture statique sur GitHub des principaux composants, de la liste des 18 fichiers modifiés, du CSS et du catalogue i18n. Aucun environnement d'exécution local disponible ; aucune commande de build, lint, TypeScript, tests, GitHub Actions ni navigation réelle n'a été exécutée.

## Contrôles et observations
- Modales Registres : structure native dialog conservée, composants header/body/footer partagés ; sauvegardes et protection des brouillons conservées.
- Équipe / Sprint : fenêtres natives conservées ; classes Cockpit ajoutées à leur habillage.
- Membre : six éditeurs raccordés à un signal séparant modifications et enregistrement en cours ; fermeture parent interdite pendant un enregistrement.
- Calendrier : fenêtre non native, clavier Tab/Échap et défilement du corps revus statiquement ; une recette clavier/browser est requise.
- Thèmes : nouveaux styles basés sur variables Bootstrap/SMN ; le contraste réel de chaque palette reste à vérifier.
- i18n : textes de l'identité et de la correction d'affectation traduits ; l'inventaire de tous les libellés des sous-modules reste partiel.
- Correction de revue : import React en double de l'éditeur d'identité regroupé.

## Réserves à la fusion
- Aucun contrôle automatique ni validation visuelle : la fusion ne signifie pas que la Story est validée.
- L'inventaire complet des modales et toutes les exceptions de style ne sont pas vérifiés exhaustivement.
- Tester prioritairement : formulaires longs sur mobile, contraste, focus, protection des brouillons, fermeture après échec et erreurs serveur.
- Les anomalies éventuellement constatées seront à corriger après tests sur le PC de l'utilisateur.
- Conserver SMN-298 comme non validée fonctionnellement tant que la recette n'est pas signée.

## Recette
Voir `_bmad-output/implementation-artifacts/smn-298-recette-modales-pc.md`.
