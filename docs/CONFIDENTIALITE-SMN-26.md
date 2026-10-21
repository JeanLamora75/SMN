# SMN-26 — Confidentialité des vues et documents

[Jira SMN-26](https://lmn24.atlassian.net/browse/SMN-26) · Story 1.18, I0.

## Protections développées

Le contexte collectif utilise une liste blanche de cinq attributs : identifiants produit et équipe, noms produit et équipe, et mode Scrum/Kanban. Le tableau de bord et la fiche équipe passent par le projecteur commun. La fonction projectCollectiveBrief fournit un contrat minimal aux futurs modules IA et reporting : elle n'exporte aucun attribut individuel ni champ libre.

La route GET /api/documents/[id]/download vérifie la session, le rôle et l'équipe active dans PostgreSQL avant de lire le fichier. Les données du document viennent d'un manifeste privé, et non de paramètres de permission transmis par le navigateur. Les droits sont ceux de la matrice existante : administrateur, ou utilisateur avec autorisation explicite.

Le stockage est désactivé en l'absence de la variable d'environnement SMN_PRIVATE_DOCUMENTS_DIR. Celle-ci doit désigner un dossier absolu situé hors du dépôt, hors de son dossier de travail et hors du répertoire public. Aucun document ou manifeste n'est créé automatiquement.

Dans ce dossier privé, chaque identifiant possède deux fichiers : id.meta.json et id.txt (ou id.pdf). Le manifeste doit contenir les champs id, teamId, format (TXT/PDF), userAuthorized (booléen) et sha256 (empreinte hexadécimale de 64 caractères). L'identifiant d'équipe doit correspondre à l'équipe active. Le fichier doit correspondre à l'empreinte, ne pas être un lien symbolique et ne pas dépasser 12 Mio. Le PDF doit commencer par la signature PDF et le TXT doit être UTF-8 valide.

Les réponses autorisées utilisent Content-Disposition attachment, un type MIME fixe, Cache-Control no-store et nosniff. Les refus et absences renvoient 404 sans identification du document. Les erreurs du serveur sont journalisées sans contenu, identifiants ou chemins privés.

## Portée et limites

Les générateurs de rapports, les briefs IA, la procédure de publication de fichiers et la revue des textes libres ne font pas encore partie du socle I0 : les Epics métier devront adopter ce contrat et gérer les autorisations, créations et suppressions de documents. Aucun PDF/TXT de démonstration n'est présenté comme existant.

Tests écrits : tests/collective-privacy.test.ts, tests/private-documents.test.ts. Vérifications HTTP négatives ajoutées à scripts/verify-http-ci.mjs. Les tests automatisés réels, les navigateurs, l'accès effectif à un document produit par un module métier et une recette Windows restent à valider.

Commandes prévues : pnpm i18n:check ; pnpm lint ; pnpm typecheck ; pnpm test ; pnpm build. Ne pas déclarer la story terminée avant ces validations.
