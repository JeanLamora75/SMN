# SMN-28 — Brouillons et confirmations réelles

**Jira :** https://lmn24.atlassian.net/browse/SMN-28 — Story 1.17, Epic 1.

**Livraison :** [PR #22 fusionnée sur `main`](https://github.com/JeanLamora75/SMN/pull/22), commit `aa40ab5b5128f9ccdce351593b470d93d514211d`. **Recette et exécution des tests non attestées**.

## Implémentation

- **Écrans du socle :** Paramètres généraux, administration des comptes et formulaire de sécurité sont protégés contre la perte accidentelle des modifications non enregistrées.
- **Navigation :** le hook `src/app/app/use-unsaved-changes.ts` installe un avertissement natif `beforeunload` pour les sorties de navigateur et intercepte au clavier ou à la souris les clics sur les liens qui quitteraient la page. Annuler laisse le brouillon en place ; confirmer permet de partir **sans sauvegarder**. Les raccourcis standard d'un navigateur peuvent avoir des comportements propres ; la recette devra contrôler explicitement Précédent/Suivant et la navigation historique. Aucun stockage local de brouillons ni de mots de passe.
- **Paramètres :** bouton Recharger soumis à confirmation en présence d'une saisie modifiée ; réussite affichée uniquement après `PATCH 200` et confirmation par le serveur ; révision optimiste et audit SQL préexistants conservés ; les réponses refusées conservent les champs modifiés.
- **Comptes :** les modifications de rôle/statut sont indépendantes **par ligne**. `src/lib/account-drafts.ts` réconcilie les données relues du serveur sans effacer les autres modifications locales. L'enregistrement d'une ligne ne sauvegarde pas les autres. L'ajout de compte vide les champs de création après acquittement seulement. Un échec de rafraîchissement affiche un message d'erreur, sans affirmer une mise à jour complètement vérifiée.
- **Sécurité :** un formulaire de phrase de secours entamé est identifié comme non enregistré. Le succès n'est affiché qu'après réponse HTTP favorable, sans stockage supplémentaire de données secrètes.
- **Aperçus :** un texte provisoire accompagne les champs de création. Aucun module de calcul, bilan ou opération par lot n'est encore livré au MVP I0 : le socle est réutilisable par les prochaines Epics, sans les simuler.

## Critères d'acceptation

| AC | Réponse de la Story |
|---|---|
| AC1 | avertissement sur navigation par lien et sortie de navigateur, possibilité de rester |
| AC2 | succès après confirmation API ; dernier instantané serveur seul considéré comme enregistré |
| AC3 | refus, erreur réseau ou échec de rechargement : message explicite ; aucun succès inventé |
| AC4 | indicateur **modifications non enregistrées / saisie provisoire**, sans prétendre à un calcul persistant |
| AC5 | unités de sauvegarde indépendantes et brouillons de comptes conservés ; opérations de lot futures non activées |

## Tests

Nouveau `tests/unsaved-changes.test.ts` : réconciliation de comptes, édition indépendante, suppression, protection de navigation et contrôle de l'affichage de confirmation. Les tests de paramètres généraux existants couvrent refus, conflit de révision et rollback de la transaction.

**À vérifier sur Windows :**
```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Scénarios manuels : modifier un thème, emprunter un lien vers une autre page puis rester ou quitter ; recharger sans enregistrer puis annuler ; modifier deux comptes, sauvegarder l'un et vérifier que l'autre reste en brouillon ; provoquer un rejet réseau / une révision obsolète ; contrôler l'avertissement au clavier, le bouton Précédent, la fermeture d'onglet et les messages dans les deux langues.

**CI :** les jobs [Linux/Windows](https://github.com/JeanLamora75/SMN/actions/runs/39550974597) et [Windows portable](https://github.com/JeanLamora75/SMN/actions/runs/39550974571) ont échoué **avant toute étape** ; aucune réussite des tests n'est inférée.

**Limitations :** aucune exécution de tests navigateur, aucune validation du comportement spécifique aux navigateurs ou de la navigation Précédent/Suivant à ce stade. Ne pas annoncer le ticket terminé avant recette.
