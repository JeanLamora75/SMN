# SMN-271 — Ajout et renommage des pays en modale

**Statut : implémenté sur branche, non testé en intégration et non fusionné.**

## Références

- User Story : https://lmn24.atlassian.net/browse/SMN-271
- Branche : `feat/smn-271-country-modals`
- Dépendance : `feat/smn-270-country-catalog` (PR #190 encore en brouillon).
- UX : maquettes Pays / jours fériés validées en conversation, archive source non disponible sur cette session.

## Implémentation par critère

| AC | Changements |
| --- | --- |
| AC1 | `country-form-modal.tsx` : dialogue natif centré, code et nom obligatoires, conversion du code en majuscules, aperçu drapeau avec repli, Annuler/Enregistrer. Bouton « Ajouter un pays » dans l'en-tête du catalogue ; ancien formulaire permanent supprimé. |
| AC2 | Validation côté UI et via `parseCountryInput` dans `catalog.ts` ; unicité déjà imposée par la clé primaire. Erreurs de champ sans perte du brouillon ; refus serveur 400/403/409. |
| AC3 | À la réussite serveur, fermeture puis actualisation du catalogue ; désactivation des filtres et recherche pour rendre le pays visible ; restitution du focus au bouton « Gérer ». Si le rafraîchissement échoue, prévenir sans refaire le POST. |
| AC4 | Menu « ⋯ » de la ligne → Renommer. Code ISO immuable et affiché en lecture seule. `PATCH /api/admin/countries/[code]` modifie exclusivement le nom et la révision ; dates, code et références conservés. |
| AC5 | `smn_country.revision` (entier, valeur initiale 0) et `smn_country_name_audit` (acteur/date/ancien nom/nouveau nom/révision). Opération transactionnelle sous `FOR UPDATE`, refus 409 pour révision périmée, rollback si insertion dans le journal échoue. Route protégée `settings/write` côté serveur. |

## Contrat de l'API

`PATCH /api/admin/countries/DE` avec corps `{"name":"Allemagne renommée","revision":0}`.

- 200 : `{ok:true,unchanged:false,code,name,revision}` après COMMIT et audit.
- 200 : `unchanged:true` sans nouvel audit pour un nom strictement identique après normalisation.
- 400 : `invalid-input` si code, nom ou révision invalide ou paramètres supplémentaires.
- 403 : utilisateur non habilité, session absente ou requête non autorisée.
- 404 : `not-found` si le code n'existe plus.
- 409 : `conflict` si la révision courante a évolué.
- 503 : accès au service indisponible, sans révélation des détails SQL.

## Stratégie PostgreSQL pilote

La fonction `ensureCountryNameSchema`, appelée à la lecture du catalogue et au renommage, crée **de manière additive et idempotente** la colonne `revision` sur `smn_country` et la table `smn_country_name_audit`. Elle utilise un verrou advisory transactionnel dédié.

Cette migration différée respecte la version stricte de l'installation déjà en place ; elle ne doit pas être substituée à `prisma migrate deploy` ou mélangée avec un script qui créerait le même objet sans coordination. La table est inscrite explicitement dans `INSTALLATION_RELATIONS` afin que le diagnostic de base ne déclare pas un faux schéma incompatible. Le modèle Prisma est aligné.

Aucune suppression ni réécriture des lignes historiques. Les pays préexistants reçoivent la révision 0. Les sauvegardes PostgreSQL restent recommandées avant la première ouverture de la nouvelle version.

## Fichiers clés

- `src/app/app/admin/countries/country-admin.tsx`
- `src/app/app/admin/countries/country-form-modal.tsx`
- `src/app/app/admin/countries/country-flag.tsx`
- `src/server/countries/catalog.ts`
- `src/server/countries/name-migration.ts`
- `src/app/api/admin/countries/[code]/route.ts`
- `src/server/installation/contract.ts`
- `prisma/schema.prisma`
- `src/i18n/fr.json` et `en.json`
- `tests/country-rename.test.ts`

## Vérifications et limites

- Vérifications **statiques** : contrat API/admin, révision, audit transactionnel, inscription dans la liste blanche, modèles Prisma et références FR/EN consultés sur GitHub.
- Tests unitaires écrits, **non exécutés**. Aucun test GitHub Actions demandé ou lancé manuellement.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, ouverture dans le navigateur et recette sur PostgreSQL : **à exécuter par l'utilisateur sous Windows 11**.
- Les contrats UX Pays d'origine n'étant pas disponibles ici, fidélité visuelle à confronter avec les maquettes approuvées.
- La PR reste en brouillon ; Jira reste non terminé jusqu'à confirmation de la recette.

## Recette Windows à réaliser

1. Sous GitHub Desktop, choisir la branche `feat/smn-271-country-modals` (elle contient SMN-270 et SMN-271) ; sauvegarder les données PostgreSQL du pilote avant la première ouverture.
2. Démarrer l'application normalement et ouvrir Paramètres → Pays avec un compte `admin`.
3. Ajouter un pays valide (ex. code `NL` s'il est absent), contrôler drapeau, modal, rafraîchissement et focus.
4. Réessayer exactement le même code ; vérifier l'erreur de doublon et la conservation du brouillon.
5. Renommer le pays via « ⋯ » : vérifier le code non éditable et les dates de calendrier inchangées.
6. Avec deux onglets sur un même pays, modifier le nom dans un onglet, puis tenter l'enregistrement dans l'autre : résultat attendu 409/conflit sans écrasement silencieux.
7. Vérifier les versions FR/EN, la navigation clavier (Tab, Entrée, Échap), le rendu mobile, et l'absence des commandes pour un compte `user`.
8. Exécuter localement, si possible, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, puis partager les résultats utiles.

**Ne pas fusionner ni clore SMN-271 sans retour de recette.**
