# Consolidation 09 — Diagnostic de récupération des fichiers PDF

## Livré
- Module serveur `src/server/reports/archive-recovery.ts` : inventaire **en lecture seule** du répertoire privé des archives PDF.
- Comparaison des fichiers PDF présents avec les entrées `smn_report_pdf_archive` et contrôle de l'empreinte SHA-256 / taille pour les fichiers connus.
- Statuts : `registered`, `orphan-candidate`, `missing`, `integrity-mismatch`.
- Fichiers candidats strictement limités à la convention UUID.pdf, sans déplacement, suppression ni exposition du contenu.
- Aucun endpoint ouvert aux utilisateurs ; usage réservé à un futur diagnostic administrateur ou script de maintenance contrôlé.

## Sécurité et limites
- Une entrée orpheline peut correspondre à un archivage encore en cours. **Ne jamais nettoyer automatiquement** les fichiers sur ce seul inventaire.
- Une absence de table d'archive entraîne un classement prudent des PDF présents comme candidats orphelins.
- Le module ne restaure pas les archives manquantes et ne déplace aucun fichier ; prévoir une procédure de réconciliation avec sauvegardes, contrôles de verrouillage et validation humaine.
- Les fichiers non conformes à UUID.pdf et les sous-répertoires sont volontairement ignorés.
- Une interruption brutale ou une suppression externe entre inventaire et lecture reste possible ; le diagnostic doit être exécuté dans une fenêtre de maintenance.
- Le module peut lire des fichiers volumineux ; l'optimisation de scan par flux et la gestion fine d'erreurs restent à compléter.

## Vérifications requises avant intégration
- Tests avec répertoire vide, fichier orphelin, PDF corrompu, PDF manquant, dossiers et liens symboliques.
- Essais PostgreSQL sur base vierge et historique ; simulation d'échec d'archivage et d'arrêt brutal.
- `pnpm typecheck`, `pnpm test`, `pnpm build`, contrôle droits, PDF et archives.
- **Aucune validation technique n'a été exécutée.**

PR brouillon empilée, aucune fusion dans `main` et aucune modification Jira.
