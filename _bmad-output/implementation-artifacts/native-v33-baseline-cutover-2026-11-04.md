# SMN — Baseline native v33 autonome : première phase de remplacement

Date : 4 novembre 2026. Implementation par GitHub sur la branche main, sans opération sur la base locale de l'utilisateur.

## Objectif
Permettre une installation neuve directement en v33 à partir d'un fichier SQL canonique indépendant de la baseline native v32, sans faire disparaître les garanties sur les installations v33 déjà existantes.

## Choix d'architecture
- `prisma/baseline/v33/schema.sql` : photographie SQL autonome et immuable après activation, regroupant le modèle de la baseline historique consolidée, la palette Red & Purple, les indicateurs dynamiques v33, les droits de gestion d'indicateurs, les emplacements de l'ancien tableau de bord et les schémas Dashboard Builder SMN-355/357.
- `src/server/installation/native-v33.ts` : lecture et validation des objets essentiels de la baseline, avec historique natif `smn_v33_native_baseline` et checksum SHA-256.
- `src/server/installation/install.ts` : l'installation initiale applique le fichier v33 unique dans une transaction ; les données initiales et **une seule entrée de migration** sont créées par l'installateur ; aucune modification des installations existantes.
- `src/server/installation/diagnostic.ts` : reconnaît le nouvel historique natif à une seule entrée, et conserve intactes les voies de reconnaissance des historiques v33 antérieurs (32+1 ou baseline v32+extensions).
- `src/server/accounts/migration.ts` : reconnaît le journal natif v33 avec checksum et présence vérifiée des structures essentielles ; les installations historiques continuent leur ancien chemin d'intégrité.
- `src/server/installation/contract.ts` : accepte les deux tables actives du Dashboard Builder, `smn_dashboard_layout` et `smn_dashboard_team_grant`.
- `scripts/db-upgrade-policy.ts` : la v33 avec une seule entrée canonique est considérée à jour uniquement après diagnostic préalable valide.

## Tests
- `tests/native-v33-baseline.test.ts` : intégrité et contenu du fichier, single-history, anti-tampering, compatibilité avec les anciens historiques, création sans mode Agile global.
- `tests/native-v33-schema-parity-pg.test.ts` : sur deux bases PostgreSQL éphémères **uniquement en CI**, compare tables, colonnes, contraintes, index, fonctions et triggers de l'ancien assemblage et du nouveau fichier.
- `tests/native-v33-auth-compat.test.ts` : succès de la reconnaissance authentification et refus sans écriture si checksum ou structure invalides.
- `tests/smn-338-native-v33-install.test.ts` : installation native isolée, checksum, droits, diagnostic physique, détecteur de triggers désactivés et reconnaissance authentification.
- Ajustement des tests d'upgrade v33 et de l'audit de préflight vers le nouveau journal natif, sans supprimer le refus des journaux incohérents.

## Nettoyage réellement effectué
1. Le test `tests/native-v32-install-contract.test.ts` a été remplacé par les tests v33 qui reprennent ses exigences actuelles (format d'installation et absence de mode global).
2. Le générateur documentaire `scripts/build-smn-338-v33-baseline-candidate.ts` et sa commande `db:baseline:v33:candidate` ont été retirés : l'ancienne ébauche v32+indicateurs n'est plus nécessaire pour l'installation native.

## Ce qui reste conservé volontairement
- `prisma/baseline/v32/schema.sql` et `src/server/installation/native-v32.ts` : les bases v33 existantes peuvent encore avoir une histoire de migration fondée sur la v32.
- Les scripts de migration historique `scripts/apply-smn-338-v33.ts`, `scripts/db-upgrade.ts` et les vérifications de sauvegarde/rollback.
- Les contrats de conservation des snapshots et des historiques de sprint clos.

## Critères de sortie de phase
- CI I0 Windows et Linux verte sur le même commit.
- Test PostgreSQL de parité des schémas réussi.
- Installation native vierge reconnue par le diagnostic et l'authentification.
- Aucun changement sur la base ou les rapports historiques.
- Toute suppression additionnelle exige un examen de dépendance et une vérification CI dédiée.

**Important** : la publication de ces changements ne vaut pas validation. Seuls les résultats des actions GitHub sur le dernier commit font foi.

[CI du projet](https://github.com/JeanLamora75/SMN/actions?query=branch%3Amain)
