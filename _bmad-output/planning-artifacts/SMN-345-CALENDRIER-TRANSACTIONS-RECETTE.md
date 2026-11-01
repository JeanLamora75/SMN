# SMN-345 — Transactions calendaires et d'entreprise avec indicateurs

Date : 01/11/2026. Agent : Amelia (BMAD Developer). Implémentation via lecture/modification des fichiers GitHub ; aucun script `uv` local n'a été exécuté.

## Modifications

- `src/server/indicators/calendar-integration.ts` : contrôleur de verrou global v33 et adaptateur de recalcul par équipe, type de cycle et fenêtre de dates. L'adaptateur choisit les cycles Scrum/Kanban recouvrant l'ancienne ou la nouvelle fenêtre, tous statuts, et réutilise le même `pg.Client` dans une transaction déjà ouverte.
- `src/server/closures/company-service.ts` : le processus de création/édition des fermetures acquiert le verrou v33 **avant** les verrous métier et recalcule les indicateurs concernés **avant le COMMIT**. Le job historique de recalcul des capacités est conservé et reste déclenché après commit, sans toucher aux capacités figées.
- `src/server/members/absence.ts` : création, mise à jour, suppression d'absence ; même verrou global d'abord et recalcul dans la même transaction, avec ancienne et nouvelle plage. Une absence v33 sans équipe explicitement résolue est rejetée.
- `src/server/capacity/engine.ts` : autorise la lecture pure des capacités sur le schéma v33, sans changement d'algorithme. `externalTransaction:true` évite toute nouvelle commande `BEGIN/COMMIT` et lit les données non validées visibles dans le client de l'écrivain.
- La révision globale des indicateurs s'incrémente dans la même transaction que les modifications calendaires. Une erreur de calcul, de source ou d'écriture annule la transaction entière et laisse la révision précédente.

## Décisions de sûreté

Le lecteur de capacité existant fournit actuellement `CAL_CAPACITY_JH` (valeur calculée ou NULL si non calculable). Les cinq autres tags calendaires techniques ne sont **pas inventés** à partir de données insuffisamment spécifiées : ils sont transmis comme sources absentes, et les formules qui en dépendent deviennent `unavailable/missing_source`. Il reste à définir précisément leurs unités et règles d'agrégation avant leur alimentation métier. Cela ne doit pas être présenté comme une couverture fonctionnelle complète de tous les tags.

La sélection des cycles est conservatrice sur l'union des périodes ancienne et nouvelle. Elle conserve les cycles clos ; aucun champ des capacités initiales figées ou des snapshots historiques n'est modifié par le nouvel adaptateur. Les droits API préexistants restent en vigueur ; aucun nouveau point d'entrée public n'est créé.

## Validation

`pnpm db:test:smn-345` installe une base v33 temporaire, vérifie les valeurs non commitées, la sélection par dates, le rollback de l'écriture métier et de l'indicateur, le conflit de verrous entre deux clients PostgreSQL, puis les écritures réelles d'une fermeture et d'une absence. `pnpm validate:smn-345` réexécute aussi les tests SMN-343/344, TypeScript et ESLint. La CI `Vérification I0` exécute les tests sur PostgreSQL 18 isolé.

L'installation personnelle `smn` reste en v32. Aucun changement local ni mise à niveau v33 n'est effectué.

## Liens

- [SMN-345](https://lmn24.atlassian.net/browse/SMN-345)
- [Architecture consolidée](SMN-IND-ARCHITECTURE-CONSOLIDEE.md)

## Compatibilité et preuves constatées

Le garde d'installation `src/server/schema/compatibility.ts` reconnaît maintenant la version 33 pour les capacités existantes ; le test `tests/schema-compatibility.test.ts` maintient le refus de la version suivante. Le lecteur d'absences ne s'appuie plus sur la colonne historique supprimée `smn_installation.mode` ; la résolution serveur des équipes conserve ses contrôles d'appartenance.

Sur le commit `80890362`, le job CI [Vérification I0](https://github.com/JeanLamora75/SMN/actions/runs/41296273521) rapporte `Recette PostgreSQL isolée SMN-345` : **success**, et le job de vérification TypeScript : **success**. La réussite intégrale des autres jobs CI reste indépendante de cette preuve.
