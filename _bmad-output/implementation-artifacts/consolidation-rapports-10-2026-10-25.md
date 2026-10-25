# Consolidation 10 — Recette technique globale et non-régression

## Audit et correctif ciblé
- Le scanner d'archives traite maintenant les liens symboliques, les entrées non régulières, les PDF >20 Mio, les fichiers disparus entre listing et lecture, et les erreurs d'E/S comme des anomalies d'intégrité.
- Un test Node/tsx a été ajouté pour un PDF sain, un fichier corrompu, un PDF absent et un fichier orphelin dans un répertoire temporaire. Le test n'a pas été exécuté.
- Aucun fichier d'archive n'est supprimé par le scanner.

## Procédure de validation locale sur la branche cumulée
Dans PowerShell (après récupération de la branche et installation pnpm existante) :
```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm pdf:doctor
pnpm pdf:smoke
```
**Exécuter les migrations** par la procédure réellement retenue dans SMN, sur une base de recette sauvegardée, avant d'activer l'archivage du Studio. Ne pas lancer de migration inconnue sur la base de production.

## Campagne de validation obligatoire
1. Vérifier les migrations sur une base vierge et une copie de base contenant des anciennes archives PDF.
2. Vérifier POST export direct sans archive et PUT archivage confirmé sous compte admin ; rejeter les actions d'un utilisateur lecture seule.
3. Valider export lorsque le brouillon est sauvegardé, bloquer pendant une saisie ou un envoi, gérer les conflits de révision.
4. Vérifier deux archivages concurrents du même rapport et les numéros V1/V2 uniques.
5. Comparer les octets téléchargés au PDF initial ; corrompre un fichier en recette et confirmer le refus.
6. Simuler fichiers orphelins, fichiers manquants et arrêt du service durant l'archivage, sans nettoyage automatique.
7. Vérifier les scénarios détaillés de `RECETTE-UX.md`, le zoom 200 %, les thèmes, le mobile et l'accessibilité.
8. Vérifier la fidélité des graphiques, tableaux, images, sommaire et pagination ; actuellement certains blocs sont bloqués par sécurité.

## Statut honnête
- Vérifications effectuées : lecture du code, modification ciblée, rédaction du test et de la campagne.
- **Non exécuté** : toutes les commandes locales, migrations PostgreSQL, tests, build, génération PDF, essais d'autorisations et recette UX.
- Pas de fusion dans `main`, pas de changement Jira.
- Ne pas déclarer la refonte terminée avant preuves de recette et corrections d'éventuels échecs.
