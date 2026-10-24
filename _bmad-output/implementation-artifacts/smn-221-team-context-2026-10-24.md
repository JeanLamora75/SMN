
# BMAD — SMN-221 : édition de l’équipe, vision et Product Goal

Date : 24/10/2026. Source : demande de l’utilisateur sur la page Équipe
et capture de la vue Cartes.

## Périmètre validé

- Crayon immédiatement à droite du nom de l’équipe.
- Modale unique : nom (requis), Vision Produit, But du produit (facultatifs).
- Conservation et historisation d’une révision collective par validation.
- Enregistrement atomique, audit auteur/horodatage, conflit de révision.
- Pas de changement du produit de référence, du mode, des membres,
  des affectations ou des archives de rapport.
- Consommation par le lecteur de rapport `readTeamReportContext` existant.

## Implémentation de code

- `src/app/app/admin/members/team-overview.tsx` : en-tête et mise à jour locale du nom.
- `src/app/app/admin/members/team-context-editor.tsx` : modale Bootstrap,
  historique de 50 versions maximum affichées, refus des brouillons perdus.
- `src/app/api/admin/team-context/route.ts` : GET lecture collective et
  PATCH écritures admin, contrôle des origines/sessions déjà centralisé.
- `src/server/members/team-context.ts` : contrat, normalisation, persistance,
  contrôle des révisions, transaction, audit, lecture optionnelle sans DDL.
- `prisma/migrations/20261024_smn221_team_context/migration.sql` :
  table `smn_team_context` (vision, product_goal, dod/dor futurs),
  audit `smn_team_context_audit`, évolutions additives.
- `src/server/installation/contract.ts` : inventaire PostgreSQL autorisé.
- `src/i18n/fr.json` et `en.json` : traductions centralisées.
- `tests/smn-221-team-context-editor.test.ts` : validation et non-régression.

## Règles d’exécution

- La nouvelle table d’équipe peut être créée au premier PATCH ; aucune création
  implicite n’est autorisée sur le GET.
- Un nom identique avec textes inchangés produit `changed:false` sans nouvelle
  ligne audit. Les brouillons annulés ne déclenchent aucune requête PATCH.
- Le navigateur propose la révision courante et l’API rejette les révisions
  périmées (409). Un échec SQL annule nom et textes dans la même transaction.
- Les anciens PDF et contenus de clôture ne sont pas modifiés.
- L’audit conserve l’identité de l’auteur en base ; le GET collectif ne l’expose pas.

## Vérification attendue sur Windows

```powershell
pnpm typecheck
pnpm lint
pnpm exec tsx --test tests/smn-221-team-context-editor.test.ts
pnpm build
```

Recette visuelle : ouvrir la page Équipe, le crayon dans son en-tête,
renseigner les 3 champs et sauvegarder ; vérifier immédiatement le titre,
réouvrir et contrôler la persistance, puis contrôler les rapports et le
comportement sur un compte User, en mobile et en EN.

**Statut :** sources préparées pour livraison, les commandes de compilation,
tests complets, PostgreSQL et recette manuelle ne sont pas exécutés via
les connecteurs GitHub/Jira.

## Rectification UX et produit — 24/10/2026

La première livraison utilisait par erreur `dialog.smn-sprint-edit-dialog`
(620 px) avec un contenu `min(90vw,680px)`, provoquant un débordement
et des boutons partiellement masqués. Le correctif introduit
`dialog.smn-team-context-dialog` (largeur commune responsive jusqu'à 760 px,
formulaire et contrôles bornés à 100 %, scroll vertical).

Le contrat de saisie est étendu à `productName` (nom actuel
de `smn_product.name`) dans la modale, le GET/PATCH et les versions audit.
La validation exige un nom de produit non vide ; un changement de nom ne
modifie ni `smn_product.id` ni l'appartenance à l'installation, ni le mode.
Verrouillage de l'équipe **et du produit** pendant la transaction ;
contrôle de révision et rollback commun aux quatre champs.

Les anciennes entrées d'audit ne contenant pas `productName` restent
consultables avec un libellé historique absent : aucune rétro-inférence.

`src/server/auth/request.ts` garde une limite JSON de 4096 octets par
défaut ; la seule route d'édition du contexte demande 48000 octets pour
accepter deux textes Unicode facultatifs jusqu'à 5000 caractères chacun.

Tests renforcés : ajout du seul renommage produit, vérification des clés,
rollback sur échec, préservation de l'historique, protection API, i18n,
largeur responsive et absence de dimensionnement interne dépassant.
Recette avec navigateur réel sur Windows et lancement local des tests
restent nécessaires.
