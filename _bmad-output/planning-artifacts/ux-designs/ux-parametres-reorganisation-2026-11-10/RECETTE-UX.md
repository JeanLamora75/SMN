# RECETTE-UX.md — Paramètres V2 en six familles

**Responsable du contrat :** Sally, 10/11/2026. **Tous les cas : NON EXÉCUTÉS.** Vérifier en navigateur Windows 11 sur l'application réelle après implémentation par Amelia. Capturer les preuves et distinguer résultat constaté / attendu.

## Organisation et intégrité

| ID | Contrôle | Résultat |
|---|---|---|
| PAR2-01 | Le clic Paramètres dans sidebar ouverte ou fermée affiche le portail, pas le formulaire | Non testé |
| PAR2-02 | Six familles exactement dans l'ordre défini par EXPERIENCE : Application, Organisation, Pratiques Agile, Calendriers, Rapports, Administration, hors familles masquées par droit/mode | Non testé |
| PAR2-03 | Inventaire complet de 19 IDs canoniques avant filtrage ; une seule entrée par fonction ; aucune duplication Entreprises/Fermetures/Indicateurs/Styles | Non testé |
| PAR2-04 | Les sections spéciales anciennes ne produisent aucune rubrique supplémentaire en dehors du registre central | Non testé |
| PAR2-05 | Les titres/descriptions et icônes utilisent FR/EN et BootstrapIcon homogènes ; pas de chaîne française de production codée en dur | Non testé |
| PAR2-06 | « Règles de capacité » demeure non interactive et marquée À venir ; états partiels honnêtes ; aucune route fantôme | Non testé |

## Recherche

| ID | Contrôle | Résultat |
|---|---|---|
| PAR2-07 | Champ « Rechercher un paramètre… » visible, clavier et lecteur d'écran | Non testé |
| PAR2-08 | « cérémonies », « daily » donnent « Cérémonies et modèles » dans Pratiques Agile, sans résultat non pertinent | Non testé |
| PAR2-09 | « sauvegarde », « audit », « mises à jour » renvoient à Maintenance (sans triple duplication) si et seulement si l'utilisateur a accès aux fonctions correspondantes | Non testé |
| PAR2-10 | Recherche insensible à casse et accents, espaces, plusieurs termes ET, FR/EN | Non testé |
| PAR2-11 | Résultat zéro : message + effacement ; aucune section vide | Non testé |
| PAR2-12 | Bouton Effacer et Escape vident le champ ; toutes rubriques permises réapparaissent sans changement de mode | Non testé |
| PAR2-13 | Recherche ne demande aucune API métier, ne divulgue aucune destination non autorisée, ne garde pas les requêtes après rechargement | Non testé |

## Présentation et navigation

| ID | Contrôle | Résultat |
|---|---|---|
| PAR2-14 | Cartes : quatre colonnes desktop large, deux tablette, une mobile selon largeur réelle après sidebar | Non testé |
| PAR2-15 | Liste : même ordre et contenu, une ligne cliquable par destination réelle, pas de scroll horizontal systématique | Non testé |
| PAR2-16 | Bascule Cartes/Liste avec état exclusif accessible, préférence conservée après rechargement | Non testé |
| PAR2-17 | Préférence du portail indépendante de celle d'Équipe | Non testé |
| PAR2-18 | Recherche active conservée durant bascule Cartes/Liste sans tri ni changement de familles | Non testé |
| PAR2-19 | Langues et Apparence atteignent les onglets correspondants de /settings/general ; brouillons du formulaire protégés | Non testé |
| PAR2-20 | Pays/Jours fériés et Fermetures mènent au bon onglet ou route réelle ; ouverture et retour fonctionnels | Non testé |
| PAR2-21 | Maintenance mène aux onglets disponibles Updates/Backups/Audit ; retours cohérents | Non testé |
| PAR2-22 | Les pages spécialisées Liens/Indicateurs peuvent revenir au portail sans perte involontaire des brouillons | Non testé |
| PAR2-23 | Toutes les anciennes URLs/favoris existants restent fonctionnels (portail, général, cadence, maintenance, tableaux métier) | Non testé |

## Permissions, fiabilité et accessibilité

| ID | Contrôle | Résultat |
|---|---|---|
| PAR2-24 | Admin / user et permissions `settings`, `accounts`, `backups`, `audit` : aucune entrée ni résultat de recherche sensible affiché sans droit | Non testé |
| PAR2-25 | Appels directs aux routes/API refusés sans droit même si URL devinée ; indicateurs et styles admin uniquement | Non testé |
| PAR2-26 | Scrum : cérémonies/horaires appropriés ; Kanban : cadence Kanban ; pas de lien Scrum depuis Kanban | Non testé |
| PAR2-27 | Un portail consulté sans modification ne provoque aucune écriture de données, d'audit ou de configuration métier | Non testé |
| PAR2-28 | Fonction partielle, erreur réseau et absence de configuration représentées sans confusion « À venir » / panne | Non testé |
| PAR2-29 | Clavier complet Tab/Enter/Escape, ordre H1/H2, focus, aria-pressed, aria-live et labels des icônes | Non testé |
| PAR2-30 | FR/EN, clair/sombre, toutes palettes, zoom 200 %, téléphone portrait, tablette, desktop et sidebar rétractée | Non testé |

## Preuves de recette attendues

- Captures du portail complet Cartes et Liste, desktop + mobile ; six familles et recherche filtrée.
- Capture des résultats « cérémonie », « sauvegarde », « aucun résultat » ; vérification des alias i18n.
- Matrice des 19 destinations réellement joignables, de leur statut, des retours au portail et des protections d'accès.
- Résultats réels de `pnpm typecheck`, `pnpm i18n:check`, tests ciblés Node/tsx et `pnpm build` si disponibles. Aucun script `uv` sur GitHub.
- Vérification des anciennes destinations et de l'absence d'écriture en base par simple navigation.

**Définition de terminé :** tous les critères applicables attestés ; les exclusions explicitement documentées. La présence des tests ou des captures non validées n'est pas une recette.
