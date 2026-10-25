# SMN-245 — Édition par section via modales compactes

**Date :** 25 octobre 2026. **Jira :** https://lmn24.atlassian.net/browse/SMN-245.  
**Statut :** implémenté sur une branche de travail ; ni build ni tests locaux effectués, **recette inachevée**.  
**Branche :** `feat/smn-245-registres-edition-sections`, issue de `feat/smn-244-registres-synthese` (PR #131) et dépendant des PR #130 à #126.  
**Référentiel :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{EXPERIENCE,DESIGN,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Constat et implémentation

- Avant SMN-245, la fiche `registry-detail.tsx` comportait encore le formulaire global legacy `RegistryCreate`, à côté du crayon description de SMN-244.
- Ce **formulaire global n'est plus monté sur la fiche**. Les crayons permettent maintenant d'éditer les groupes **Informations générales** (titre, date métier, échéance, responsable), **Statut et suivi** (statut parmi les valeurs existantes, transitions métier respectées), **Description** (modale déjà construite en SMN-244), puis les **sections métier applicables**.
- `src/app/app/admin/registries/registry-core-editor.tsx` : formulaire ciblé par groupe, champs groupés avec Bootstrap ; **réutilisation de l'API PATCH collective et du numéro de révision** `updateRegistryItem` : le type de fiche reste immuable, les champs hors section conservent leurs valeurs stockées, les audits append-only, transitions et signaux métiers existants ne sont pas réimplémentés côté UI ; erreur 409/503/400 sans fermeture ni effacement du brouillon ; succès seulement après réponse `ok` et `revision` validés.
- `src/app/app/admin/registries/registry-section-dialog.tsx` : enveloppe HTML `dialog` centrée, `showModal`, commande Annuler/fermer, Escape intercepté, confirmation uniquement si interaction sur un champ, protection `beforeunload` si brouillon modifié, retour du focus au déclencheur après fermeture. Une seule commande de sauvegarde par formulaire métier déjà existant.
- **Sections métier rebranchées en lecture dans la fiche et en édition dans modales séparées** : évaluation du risque (`RiskAssessment`), ROAM (`RiskRoam`), parties de dépendance (`DependencyParties`), vigilance (`DependencyVigilance`), détails de décision (`DecisionDetail`), relations (`RegistryRelations`), cycles (`RegistryCycles`), associations des actions (`ActionLinks`). Les composants d'origine font leurs PATCH (et contrôles de révision si prévus) et appellent `onSaved` après réponse réussie ; les limites de leur formulaires existants (notamment saisie technique d'UUID dans Relations/Actions) restent à traiter en **SMN-250**, non étendues ici.
- Les actions distinctes **Créer un obstacle depuis un risque** et **Créer une action depuis une décision** sont conservées selon leurs permissions, mais ne deviennent pas des modifications de statut.
- `src/app/app/admin/registries/registry-detail.tsx` : toute commande d'édition conditionnée à `canManage`, édition et refresh de la fiche/requêtes de contexte uniquement après sauvegarde confirmée, aucun droit ajouté au rôle user.
- `src/app/app/admin/registries/registry-description-editor.tsx` : renforcement du garde TypeScript de révision optionnelle (modale SMN-244 conservée).
- `src/i18n/fr.json`, `en.json` : 19 clés de noms de sections, commandes, confirmations, erreurs.
- `src/app/globals.css` : modale sur thème existant, contenu scrollable, 760 px max, groupes sur une ligne lorsque possible, responsive 575 px.

## Tests et changements d'assertions

- **Huit tests supplémentaires écrits**, sans exécution : `tests/smn-245-registry-section-editors.test.ts`.
- Les tests `tests/smn-243-registry-detail.test.ts` et `tests/smn-244-registry-summary.test.ts` sont adaptés : ils ne réclament plus le formulaire global après sa suppression, et vérifient la présence des éditeurs ciblés. Aucun test antérieur n'est supprimé.
- **28/28 contrôles statiques ciblés positifs** sur les sources GitHub ; une inspection complémentaire du producteur de liens de cycles confirme la protection serveur des cycles clôturés `s.status<>'closed'` et le contrôle `s.team_id=r.team_id`. Il ne s'agit ni d'un typecheck ni d'une recette.
- `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` : **non exécutés**.
- Aucune migration appliquée ni nécessaire pour les champs du formulaire, aucune création de données synthétiques, aucun snapshot Sprint Vn modifié.
- Skill agent **Amelia** lu depuis GitHub, personnalisations TOML chargées manuellement. Le sous-workflow `bmad-build` requiert `uv run --no-cache .../render_skill.py` sur checkout local : **non exécuté**, le checkout BMAD/uv n'étant pas disponible ici ; adaptation explicite aux connecteurs GitHub/Jira, sans prétendre à une validation officielle.

## Critères d'acceptation

| AC | Code publié | Preuve nécessaire |
|---|---|---|
| AC1 | Crayon informations, statut, description et huit sections métier applicables ouvrant leur propre modale | Parcours réel pour les six types |
| AC2 | Regroupement des champs, commandes Annuler et Enregistrer existantes, aucune seconde confirmation du succès | Vérifier scrolling et place du bouton Enregistrer dans chaque éditeur métier |
| AC3 | PATCH et validation serveur existants, droits admin/user, révision et audit, interdiction des cycles clos préservées | Tests de non-régression PostgreSQL, rôle user et cycle clos |
| AC4 | Confirmation brouillon si fermeture, révision `409` et panne sans effacement ; Escape et retour focus | Tests manuels de fermeture pendant saisie, panne réseau et conflit |
| AC5 | Rafraîchissement `retry()` après `onSaved`, sans valeur simulée et sans fermeture avant succès | Vérifier données liées, onglets et en-tête après écriture |

**Point de vigilance :** les composants métier réutilisés conservent chacun leur bouton Enregistrer dans leur zone scrollable, et non nécessairement dans le pied de la modale. Une revue tactile et à 200 % de zoom est indispensable. La disponibilité d'un bouton annuler ou sauvegarder ne constitue pas une validation d'accessibilité. Les déclenchements de sortie pendant une requête en cours doivent être vérifiés au navigateur avant fusion.

## Validation Windows 11

Récupérer la branche via GitHub Desktop et exécuter :

```powershell
pnpm exec tsx --test tests/smn-243-registry-detail.test.ts tests/smn-244-registry-summary.test.ts tests/smn-245-registry-section-editors.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recette complémentaire : administrateur vs user, six types, titre/date/owner/échéance, status + réouverture obstacle, évaluation et ROAM, parties et vigilance, décision, liens/cycles + Sprint clôturé, modifications concurrentes, 409, 503, annulation volontaire, Escape, tabulation, retour focus, thèmes clair/sombre, i18n FR/EN, 320/375/768/1024/1440 px et zoom 200 %. Vérifier aussi la fiche Sprint avec snapshots clos sans mutation.

**Définition of Done non atteinte.** La PR doit rester en brouillon avant tests et correctifs éventuels.
