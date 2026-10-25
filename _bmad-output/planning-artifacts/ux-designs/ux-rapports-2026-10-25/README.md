# SMN — Livraison UX locale, studio de rapports

**Projet :** Scrum Master Notebook · **Agent :** Sally, BMAD v6.12.4  
**Date :** 2026-10-25  
**État :** décisions fonctionnelles UX validées, contrats publiés pour mise en œuvre ; revue visuelle finale et tests techniques à faire  
**Périmètre :** rapports de Sprint ; extrapolations Kanban/SAFe à étudier ultérieurement.

## Contenu

| Fichier | Rôle |
|---|---|
| [DESIGN.md](DESIGN.md) | Contrat visuel, tokens BMAD, composants, styles documentaires, responsive |
| [EXPERIENCE.md](EXPERIENCE.md) | Contrat de comportement, IA, flux, états, droits, données et export |
| [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) | Ordre de réalisation et contrôles Amelia |
| [DECOUPAGE-JIRA.md](DECOUPAGE-JIRA.md) | Matrice des 16 Stories SMN-254 à 269 |
| [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md) | Catalogue des captures et des interactions de démonstration |
| [RECETTE-UX.md](RECETTE-UX.md) | 33 scénarios de recette proposés, **non exécutés** |
| [Synthèse UX approuvée](SMN-SYNTHESE-UX-STUDIO-RAPPORTS-2026-10-25.md) | Registre des 21 arbitrages retenus, source de vérité fonctionnelle |
| [Prototype HTML autonome](mockups/studio-rapports-reference.html) | Quatre écrans interactifs illustratifs, sans serveur ni données réelles |
| Captures PNG | Disponibles dans l'archive UX jointe à la conversation ; non déposées dans ce dossier GitHub |

## Utiliser le prototype

Sur Windows 11, ouvrir le fichier `mockups/studio-rapports-reference.html` avec Chrome/Edge. **Pas besoin d'installer un IDE, un package ou un serveur.** Cliquer sur les 4 entrées de navigation à gauche, utiliser les boutons de démonstration ou réduire la fenêtre pour visualiser le responsive. Actualiser la page **réinitialise** les modifications fictives.

**Important :** aucun bouton du HTML n'accède aux API réelles de SMN, n'écrit sur le disque ou ne génère un PDF. Les champs visibles ne sont pas des données métier.

## Publication GitHub / Jira

- Ce dossier est publié sur `main` à la demande du commanditaire le 25/10/2026.
- Epic UX : [SMN-228](https://lmn24.atlassian.net/browse/SMN-228) ; Stories [SMN-254 à SMN-269](DECOUPAGE-JIRA.md).
- Contrat de lots : [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md).
- Aucun code applicatif n'a été développé ni testé par Sally ; l'archive UX locale contient les captures PNG.

## Adaptations BMAD

- **Lu depuis le connecteur GitHub** : skill `bmad-agent-ux-designer`, workflow `bmad-ux`, spécification DESIGN.md, configuration BMAD et référentiel UX SMN existant.
- **Non exécutés** : scripts `uv` de résolution BMAD, `memlog.py`, reviewers/subagents spécialisés, automatisations de publication. Le registre des 21 décisions préexistait en conversation et a été consolidé sans simulation de script.
- **Contrôle local effectué** : analyse structurelle des documents et exécution du HTML dans Chromium via le chargement en mémoire ; captures et tests de navigation/mise à jour purement démonstratifs. Cela ne remplace pas une validation du code SMN.
- Un processus de revue BMAD multi-lentilles peut être effectué avec autorisation, avant que les contrats passent au statut `final`.

**Hiérarchie normative :** décisions UX approuvées et règles métier SMN ; une fois validés, DESIGN.md/EXPERIENCE.md priment sur les exemples visuels. Ne jamais modifier silencieusement une règle métier établie pour suivre une maquette.