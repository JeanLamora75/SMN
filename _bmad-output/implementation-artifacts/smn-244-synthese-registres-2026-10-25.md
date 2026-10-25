# SMN-244 — Synthèse de fiche à deux colonnes

**Story :** https://lmn24.atlassian.net/browse/SMN-244  
**Date :** 25 octobre 2026  
**Statut :** implémentation incrémentale sur branche, tests locaux et recette non exécutés, **Story non validée**.  
**Branche :** `feat/smn-244-registres-synthese` créée depuis `feat/smn-243-registres-fiche` (PR #130), elle-même dépendante des PR #129, #128, #127 et #126.
**Contrat :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Réalisation

- `src/app/app/admin/registries/registry-summary.tsx` : présentation Synthèse en deux zones, **description intégrale** et journal à gauche, aperçu **cycles effectivement liés**, **relations réellement retournées** et **activité autorisée horodatée** à droite. Absence vérifiée et source indisponible sont affichées différemment, liens uniquement pour les identités réelles de fiches.
- `src/lib/registry-summary-context.ts` : parseurs purs des réponses collectives existantes `GET .../cycles` et `GET .../relations`. Les cycles présentés sont l'intersection entre `cycles[]` et `linkedIds[]`; une association inconnue entraîne un état indisponible plutôt qu'un faux zéro.
- **Limite de données documentée** : le modèle actuel ne possède pas de journal multi-commentaires avec entrées individuelles datées. La zone Journal expose donc un message honnête ; le champ `comment` legacy, qui n'est pas horodaté individuellement, est affiché à part **uniquement à admin**. La persistance/versioning du journal relève de **SMN-247/248**. Ne pas déclarer AC1 complètement validé comme journal réel avant ces Stories.
- L'activité récente montre **Création** depuis `createdAt` et **Dernière modification** depuis `updatedAt` uniquement lorsque disponibles dans la réponse GET administrateur, la modification exigeant une `revision > 1`. Le rôle `user` conserve le masquage volontaire des timestamps dans l'API existante ; aucun nouvel accès à l'audit.
- Le validateur de dates accepte les horodatages ISO 8601 avec fuseau ainsi que le format natif PostgreSQL `timestamptz::text` (`AAAA-MM-JJ HH:mm:ss+HH`). Une chaîne sans indication de fuseau reste indisponible ; affichage localisé `Europe/Paris`.
- `src/app/app/admin/registries/registry-description-editor.tsx` : **crayon description admin** ouvrant une modale native, focus sur le texte, contrôles d'annulation et d'échappement avec confirmation si brouillon modifié ; sauvegarde par **PATCH existant**, révision optimiste obligatoire, conflit 409/503 sans perte de brouillon, fermeture/rafraîchissement seulement après `result.ok` et numéro de révision confirmés.
- `src/app/app/admin/registries/registry-detail.tsx` : intégration du nouveau composant dans l'onglet Synthèse SMN-243 ; même identité métier, aucun snapshot Sprint concerné. L'éditeur legacy est conservé pour les autres champs et son champ description verrouillé sur cette page.
- `src/app/app/admin/registries/registry-create.tsx` : option `lockDescription` locale à l'appel ci-dessus, par défaut `false` afin de ne pas affecter les autres éditeurs.
- `src/server/registries/relations.ts` : consolidation défensive de la lecture des titres liés, en bornant **sources, cibles et objectifs** à l'équipe résolue depuis la fiche installée et en ne suivant aucune association inter-équipe.
- `src/app/globals.css` : vraie grille desktop **2fr/1fr**, empilée sous 992 px ; cartes compactes, thèmes SMN et modale centrée sans nouvelle dépendance.
- `src/i18n/fr.json` et `en.json` : 30 nouvelles clés `registrySummary`, parité JSON contrôlée.
- `tests/smn-244-registry-summary.test.ts` : **12 scénarios de tests créés**, notamment vrais cycles liés, relations, confidentialité, dates et conflits modale ; `tests/smn-243-registry-detail.test.ts` adapté à l'extraction du composant Synthèse.

## Critères de Jira — état et limites

| Critère | Implémentation | Limite à lever |
|---|---|---|
| AC1 | Mise en page 2/3 + 1/3, description intégrale, **zone de journal explicite**, cycles/relations/activité | **Journal multi-entrées réel indisponible** avant SMN-247/248 ; ne pas construire de fausses entrées |
| AC2 | Données persistées lues via API existantes ; aucun rappel statut/responsable/échéance dans les sous-cartes | Inspection navigateur et comptes réels |
| AC3 | État vide vs panne, liens fiches valides seulement, objectifs affichés sans lien fictif | Scénarios source absente / relation incohérente |
| AC4 | Reflow 1 colonne sous 992 px, overflow-wrap, modale responsive | Recette 320/375/768/1024/1440 et zoom 200 % |
| AC5 | Crayon admin, modale description avec PATCH/révision/409/draft, user sans action ; ancien éditeur verrouillé pour description sur cette page | Tests navigateurs admin/user, clavier/Escape et sauvegarde/conflit réel |

## Réserves fonctionnelles et sécurité

- Les APIs `GET .../relations` et `GET .../cycles` ont leurs autorisations collectives existantes ; aucune extension de droits effectuée.
- Le producteur `.../cycles` ne couvre pas toutes les catégories ou tous les modes, notamment les périodes Kanban ; **afficher « indisponible » ou « non applicable » plutôt que zéro** lorsque l'API n'est pas exploitable. Aucun nouveau cycle ou lien n'est créé.
- La vue de contexte est **l'état courant** de la fiche ; les snapshots Vn de Sprints clos sont intacts.
- Les associations en provenance du serveur sont filtrées par équipe avant toute restitution. Le lecteur de relations n'effectue aucun INSERT/UPDATE/DELETE.
- La version date de création/modification ne se substitue pas à un historique complet des actions ; SMN-251 reste à livrer.
- La commande « Modifier la fiche » héritée de SMN-243 reste à supprimer/remplacer par modales par section dans **SMN-245** ; en SMN-244, seule la description est éditée par sa modale dédiée.

## Vérifications réellement effectuées

- **28/28 inspections statiques ciblées positives** sur fichiers relus depuis GitHub (source, droits, parité des dictionnaires, assertions, contexte). Cela **ne constitue ni un typecheck ni un test de rendu**.
- `src/i18n/fr.json` / `en.json` parsés : **30 clés** `registrySummary` de part et d'autre.
- **12 tests ciblés écrits, non exécutés** ; test SMN-243 existant actualisé, également non exécuté.
- **Non exécutés :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette SQL PostgreSQL, navigateur, rôles, clavier, thèmes, Scrum/Kanban, snapshots.
- Pas de migration appliquée (aucun nouveau schéma). Scripts BMAD `uv run` non exécutés : pas de checkout SMN utilisable dans ce processus d'exécution ChatGPT.

## Recette locale Windows

```powershell
pnpm exec tsx --test tests/smn-100-registry-relations.test.ts tests/smn-243-registry-detail.test.ts tests/smn-244-registry-summary.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Compléter les contrôles : un, aucun ou plusieurs cycles/relations ; producteur indisponible ; activité administrateur et utilisateur sans timestamps ; description longue ; crayon admin/user ; PATCH confirmé, erreur réseau, 409, Escape et brouillon ; 320/375/768/1024/1440 pixels, zoom 200 %, FR/EN et thèmes ; vérifier la fiche Sprint fermée.

**Ne pas déclarer SMN-244 terminée ni fusionner la PR sans exécution et résolution des contrôles.**
