# SMN-281 — Plan de recette transverse Pays et jours fériés

**État initial : NON EXÉCUTÉ — aucune preuve de recette ni de build n'est encore disponible.**

## Périmètre et décisions

- Story Jira : https://lmn24.atlassian.net/browse/SMN-281
- Base : `feat/smn-280-country-catalog-blockers` (PR #200), contenant SMN-270 à SMN-279.
- Branche de recette : `feat/smn-281-country-regression-recipe`.
- Référence : `docs/UX-REFERENTIEL-BMAD.md`, décisions UX-PAYS-01 à 12 ; les brouillons DESIGN/EXPERIENCE de pays non publiés sur GitHub ne sont **pas** assimilés à des fichiers disponibles.
- SMN-281 est une story de **vérification**, pas une demande de nouvelle fonctionnalité métier.
- Tests exécutés **par l'utilisateur sur PC Windows 11**, jamais dans GitHub Actions.
- Ne jamais utiliser la base pilote comme jeu d'essai destructif : faire une sauvegarde et idéalement restaurer sur une base de recette isolée. Les calendriers du pays, les membres et les historiques sont des données métier.
- L'installation SMN est déjà disponible : **aucun** besoin de droits administrateur, nouvel IDE ou Codex CLI.

## Préparation sur le PC

1. Effectuer une sauvegarde de la base PostgreSQL portable SMN ; vérifier qu'une restauration est possible. Ne pas joindre les sauvegardes aux rapports ou aux PR.
2. Dans GitHub Desktop, sélectionner `feat/smn-281-country-regression-recipe`. Elle inclut les évolutions en chaîne SMN-270 → 281. Ne pas utiliser `main`, où elles ne sont pas encore fusionnées.
3. Dans PowerShell ouvert dans le répertoire du projet, vérifier `node --version` (24.x) et `pnpm --version` (12.10.x). Vérifier les prérequis et l'installation existante ; ne pas installer de nouveaux outils.
4. Exécuter **manuellement** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, ou le lanceur fourni `scripts/recette-pays-smn281.ps1` qui enregistre les codes de sortie dans un sous-répertoire horodaté de `_bmad-output/qa-evidence/SMN-281/`. Cela ne lance aucun test GitHub.
5. Démarrer SMN par la méthode habituelle (`pnpm dev` / raccourci portable) sur le **port prévu 3003**, avec une base de recette indépendante ; se connecter avec un compte admin et un compte user de lecture.
6. Choisir un pays actif sans membres, un pays avec membres actifs et le pays de référence, plusieurs millésimes dont un sans jours et une année administrativement validée. Prévoir deux sessions administrateur séparées pour les tests de concurrence.
7. Préparer un CSV UTF-8 et un ICS local contenant des journées entières sur au moins deux millésimes, des doublons et des rejets. Les exemples ci-dessous sont des **données de test** et ne représentent pas des jours fériés nationaux officiels.

## Jeu d'essai et preuves avant modification

Deux fichiers de test sans donnée personnelle sont présents dans `tests/fixtures/` :

- `smn281-recipe-national-multi-year.csv` : dates 2042/2043, doublon, date impossible et code de pays discordant.
- `smn281-recipe-national-multi-year.ics` : deux événements de journée entière, un événement horaire et une récurrence à exclure.

**ATTENTION : ce sont des fêtes fictives, à importer exclusivement dans une base de recette restaurable, jamais dans les calendriers réels du pilote.** Le fichier CSV vise le pays FR. Pour une base contenant déjà des dates 2042 ou 2043, vérifier la prévisualisation avant toute écriture.

Avant le premier commit, conserver des **preuves expurgées** : nombre de dates et statut pour le pays/année testé ; compte et date de validation annuelle ; nombre de lignes d'audit ; au moins un snapshot de sprint clôturé, la valeur « SP initialement engagés » et l'empreinte de référence d'un PDF/TXT historique exporté. Pour un document exporté localement, PowerShell dispose de `Get-FileHash -Algorithm SHA256 -Path "chemin-du-document.pdf"` ; comparer cette empreinte **sur le même fichier non régénéré** après l'opération, et comparer séparément les données si un nouveau rapport est rendu. Ne jamais diffuser un export contenant des données personnelles.

## Matrice de recette

Légende des résultats à renseigner : **OK / KO / BLOQUÉ / NON EXÉCUTÉ**. Chaque preuve doit mentionner le pays (ou code anonymisé), l'année et un identifiant de capture/log ne contenant aucune donnée privée.

### AC1 — Fonctionnel (SMN-270 à 280)

| ID | Test / action | Résultat attendu |
| --- | --- | --- |
| F01 | Catalogue initial, sélection de l'année commune, navigation ±1 année | Toutes les lignes utilisent la même année ; limites 1900 et 2200 |
| F02 | Recherche par nom, code ISO, accents et filtres de statut | Résultats pertinents, pas de confusion inconnu / non configuré |
| F03 | Drapeaux présents et absents | Alt text accessible et repli globe + ISO si fichier absent |
| F04 | Création d'un pays dans une base de recette | Code ISO figé, nom éditable, nouvelle ligne active |
| F05 | Renommage du pays puis annulation d'un autre renommage | Révision et historique du premier ; aucun changement lors de l'annulation |
| F06 | Ouverture de la grande modale Liste puis Calendrier | Même pays/année, même nombre réel de fêtes, jours correctement placés |
| F07 | Ajout national avec date et motif | Jour visible et audité, statut annuel À vérifier jusqu'à validation |
| F08 | Correction d'un nom et déplacement interannuel | Années source/destination mises à jour, pas de doublon silencieux |
| F09 | Retrait confirmé puis retrait de la dernière date | Confirmation obligatoire ; année vidée Non configuré |
| F10 | Diagnostic annuel, anomalies bloquantes et avertissements | Bouton inactif si blocage, message précis, lecture seule sans attestation |
| F11 | Validation explicite d'une année complète | Consentement requis ; statut Configuré uniquement après succès serveur |
| F12 | Import CSV skip/replace avec prévisualisation | Aperçu sans écriture ; totaux et rejets exacts |
| F13 | ICS : inspection, rejet horaires/récurrences, choix d'événements | Aucune écriture avant confirmation ; sélection limitée aux éligibles |
| F14 | Import comportant plusieurs millésimes | Après commit, ouverture sur millésime modifié le plus récent, navigation vers les autres |
| F15 | Import identique / aucune ligne modifiée | « Aucune date modifiée », aucun faux commit, aucune dévalidation |
| F16 | Archiver un pays autorisé puis afficher Archivés/Tous | Même ISO et calendriers conservés ; badge Archivé distinct du statut annuel |
| F17 | Réactiver le pays ; répéter une tentative d'archivage sans confirmation | Réactivation non destructive ; aucune action sans consentement explicite |
| F18 | Import multiannuel, fermeture de la modale | Recherche, filtre de statut et année commune du catalogue conservés |

### AC2 — Autorisations et données privées

| ID | Test / action | Résultat attendu |
| --- | --- | --- |
| S01 | Compte user : page Paramètres/Pays et liens directs | Accès interdit conformément au modèle admin-only |
| S02 | Compte user : appeler GET diagnostic de cycle de vie et GET liste des pays | HTTP 403 ; aucun nom/ID de membre exposé |
| S03 | Compte user : POST création, édition, validation, import, archivage | HTTP 403 et aucune écriture |
| S04 | Compte admin : tenter archivage du pays de référence | Blocage explicite ; invitation à modifier le paramètre général |
| S05 | Compte admin : tenter archivage d'un pays avec membre actif | Blocage, compteur exact et liens vers les fiches uniquement côté admin |
| S06 | Pays avec localisation future d'un membre | Archivage bloqué ; localisations historiques seules non bloquantes |
| S07 | Après archivage, appeler directement les API d'ajout, import, renommage et affectation | Refus serveur ; calendrier encore consultable |
| S08 | Depuis un pays archivé, tenter de réactiver un membre affecté ou créer une affectation future | Refus ; aucun membre n'est rattaché silencieusement |

### AC3 — États et concurrence

| ID | Test / action | Résultat attendu |
| --- | --- | --- |
| D01 | Année absente de la couverture / zéro date | « Inconnu » si absence de preuve ; « Non configuré » seulement si absence connue |
| D02 | Année partielle, configurée techniquement mais non validée, invalide | « À vérifier » / « À vérifier » / « Invalide » respectivement |
| D03 | Date impossible (29/02 non bissextile), date hors année, libellé vide | Rejet et saisie conservée |
| D04 | Doublons dans CSV et conflits avec date nationale déjà présente | Actions rejetées ou politique skip/replace appliquée, sans écrasement implicite |
| D05 | Deux onglets modifient la même année sur empreinte obsolète | 409, aucun écrasement, renouvellement de l'aperçu obligatoire |
| D06 | Deux onglets importent après des modifications divergentes | 409, ancien aperçu invalidé, pas de deuxième commit accidentel |
| D07 | Deux onglets valident/modifient l'année pendant confirmation | 409, case remise à zéro, vérification de la liste imposée |
| D08 | Annulation avant POST puis panne réseau pendant relecture après commit | Aucune écriture en annulation ; après succès confirmé, retry GET uniquement |

### AC4 — Audit et non-régression métier

| ID | Test / action | Résultat attendu |
| --- | --- | --- |
| H01 | Historique de correction nom/date/retrait | Entrée d'audit avec acteur, motif, ancien/nouveau, horodatage |
| H02 | Audit validation annuelle et invalidation après correction réelle | Audit append-only ; révocation uniquement après commit réussi |
| H03 | Import CSV/ICS identique, puis import avec changement | Pas d'invalidation lors du premier ; invalidation de la seule année touchée lors du second |
| H04 | Audit archiver / réactiver | Deux événements, même ISO, calendrier/historique conservés |
| H05 | Comparer sprint clôturé, capacité et engagement initial avant/après import/archivage | Aucun snapshot historique ni engagement initial réécrit |
| H06 | Comparer rapport PDF/TXT historique avant/après opérations Pays | Documents et données historiques identiques ; joindre preuves expurgées |

### AC5 et AC6 — UX, responsive et langues

| ID | Test / action | Résultat attendu |
| --- | --- | --- |
| U01 | Parcours uniquement clavier : catalogue, menu ⋯, modales, annulation, dates | Tab/Entrée/Espace/Échap fonctionnels ; focus revenu au déclencheur |
| U02 | Inspecter ARIA/lecteur d'écran : labels, erreurs et alertes | Champs annoncés ; compteurs et motifs cohérents ; aucun champ sans label |
| U03 | Desktop, tablette, mobile, 200 % zoom | Aucun débordement critique ni bouton invisible, dialogues scrollables |
| U04 | Thèmes clair/sombre et contraste des badges | Labels lisibles ; état annuel et état d'archive distinguables autrement que par la couleur |
| U05 | Choix langue FR/EN, dates locales 29/03/2026 et 25/10/2026 | Jours civils identiques entre langues et DST ; libellés traduits |
| U06 | Drapeau absent, fallback et nom du pays accentué | Code ISO et nom accessibles ; recherche insensible aux accents |

### AC7 — Résultats d'exécution

| ID | Commande | Statut attendu avant exécution |
| --- | --- | --- |
| X01 | `pnpm i18n:check` | NON EXÉCUTÉ |
| X02 | `pnpm lint` | NON EXÉCUTÉ |
| X03 | `pnpm typecheck` | NON EXÉCUTÉ |
| X04 | `pnpm test` | NON EXÉCUTÉ |
| X05 | `pnpm build` | NON EXÉCUTÉ |
| X06 | Recette manuelle F01–U06 | NON EXÉCUTÉ |

## Procès-verbal de recette à remplir

**Branche / SHA :** `feat/smn-281-country-regression-recipe` / ____

**Date et environnement :** ____ ; Node ____ ; pnpm ____ ; PostgreSQL de recette ____

**Sauvegarde/restauration vérifiée :** oui / non / non applicable

**Résultats automatisés :** copier les codes de sortie de `resultats.csv` (ne pas déduire PASS de l'absence de message).

**Scénarios manuels :** noter pour chaque ID ci-dessus OK / KO / BLOQUÉ / NON EXÉCUTÉ, avec capture/log expurgé.

**Anomalies / tickets Jira associés :** ____

**Décision de recette :** NON VALIDÉE / ACCEPTÉE / ACCEPTÉE SOUS RÉSERVES / REFUSÉE

**Décision de fusion :** aucune avant relecture des preuves et accord explicite.

## Critères de sortie

La refonte **ne peut pas être déclarée terminée** avant : (a) résultats d'exécution réels des cinq commandes, (b) scénarios manuels AC1–AC6 vérifiés avec preuves, (c) aucun défaut critique de permissions/intégrité/historiques, (d) anomalies corrigées ou explicitement acceptées, (e) accord du PO pour fusion des PR chaînées.

Les anciennes API de pays/import sont conservées : leur retrait n'est ni couvert ni autorisé par SMN-281.

**Ne jamais déposer en PR un .env, un dump PostgreSQL, des cookies/session ou des captures affichant des noms de membres réels sans anonymisation.**
