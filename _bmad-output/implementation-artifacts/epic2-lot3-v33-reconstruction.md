# Epic 2 — Lot 3 : reconstruction intégrale v33 sur PostgreSQL 18 isolé

**Date :** 9 novembre 2026  
**Stories :** SMN-31, SMN-33, SMN-34.  
**Cible :** branche `main`, baseline native v33 et archive chiffrée v4, sans bascule active.

## Protocole de validation

La recette est intégrée à `tests/smn-34-v3-postgres.test.ts` et lancée dans le workflow `.github/workflows/smn-34-restore-sandbox.yml` sur PostgreSQL 18. Le nom de fichier du test reste historique : son format effectif est **v4**.

1. Création de deux bases vierges jetables sur un service PostgreSQL 18 de CI ; contrôle de l'URL de maintenance `/postgres` et de l'hôte local avant tout DDL.
2. Installation native v33 dans la base source ; préparation de deux équipes, trois sprints, un membre avec affectation/version, des indicateurs v33 manuels et calculés (avec dépendance), leurs valeurs et préférences, un Dashboard Builder persisté, deux liens (portée transverse et équipe), un risque avec commentaire et l'historique d'affectation du membre.
3. Préparation d'une archive PDF finale en relation avec la base, d'un rapport Word, d'un modèle Word personnalisé et d'un document privé avec métadonnées.
4. Prise d'une empreinte **sur chaque table publique** : nombre de lignes et SHA-256 des représentations JSONB triées. Aucune donnée utilisateur n'est écrite dans les logs.
5. Sauvegarde chiffrée v4, inspection et vérification des composants ; restauration sur une **base de destination vide et distincte** avec `pg_restore --single-transaction`.
6. Comparaison exhaustive des empreintes de **toutes** les tables, incluant les identifiants, clés, relations, révisions et valeurs. Vérification supplémentaire de la valeur d'indicateur 13, de la lecture de rapport, du recalcul de l'indicateur calculé à 26, de la révision et de la présence du layout Dashboard Builder ; contrôle PDF/Office/document et conservation de la source.
7. Destruction des deux bases jetables et des fichiers temporaires même en cas d'échec.

## Couverture et limites

- **Prouvé par ce test si le job PostgreSQL réussit :** intégrité SQL et des composants de fichiers, conservation des relations, stockage et lecture métier indicateurs/Dashboard Builder, et absence de modification de la base source par la reconstruction.
- **Non prouvé par ce test :** rendu navigateur des dashboards, recalcul de toutes les fonctions de formule, régénération effective d'un rapport PDF/Office avec moteur Office sur Windows, ouverture dans MS Office, restauration active, reprise après coupure et toute donnée hors dossiers gérés. Les liens et registres sont représentés par des enregistrements avec portée et commentaire ; leur restitution est contrôlée par empreinte SQL, mais leurs parcours UI ne sont pas testés.
- Le résultat `fullRestoreQualified:false` reste correct : ce lot **n'autorise aucune bascule active**. Les scénarios destructifs sont réservés aux lots 4 à 7.
- Le protocole WAL/fichiers reste conservateur et ne remplace pas un snapshot global strict de producteurs externes.
- Les scripts `uv` BMAD ne sont pas exécutés sur GitHub.

## Vérifications complémentaires attendues avant clôture du lot

- Confronter les jobs GitHub Actions Windows/Linux/PostgreSQL 18 au commit de référence et enregistrer les logs d'exécution.
- Compléter les parcours UI pour liens, registres, régénération Office/PDF et contrôle graphique dans l'interface ; faute d'exécution, ne pas cocher ces cas comme validés.
- Pour une recette locale Windows, utiliser uniquement des bases jetables sur PostgreSQL 18, jamais l'installation réelle ou ses dossiers de données.

## Sources

- [Test de reconstruction](https://github.com/JeanLamora75/SMN/blob/main/tests/smn-34-v3-postgres.test.ts)
- [Workflow de recette](https://github.com/JeanLamora75/SMN/actions/workflows/smn-34-restore-sandbox.yml)
- [Implémentation de la restauration isolée](https://github.com/JeanLamora75/SMN/blob/main/src/server/backup/restore-sandbox.ts)
- [Epic SMN-2](https://lmn24.atlassian.net/browse/SMN-2)
