# Avenant BMAD — Dashboard Builder : commandes d'en-tête et icônes configurables

**Date :** 2026-11-05  
**Projet :** Scrum Master Notebook — BMAD v6.12.4  
**Epic :** [SMN-353](https://lmn24.atlassian.net/browse/SMN-353)  
**Stories :** [SMN-382](https://lmn24.atlassian.net/browse/SMN-382) et [SMN-383](https://lmn24.atlassian.net/browse/SMN-383)  
**Origine :** demandes utilisateur et captures de l'en-tête et de la personnalisation du Dashboard Builder.

## SMN-382 — Visibilité des commandes et dropdown Actions

### Défaut constaté
Sur le bandeau Cockpit Agile bleu, les commandes « Actions » et « Actualiser » ne sont pas suffisamment contrastées. Le dropdown Actions est présenté comme un panneau peu intégré et peut être rogné par le bandeau. La capture confirme un menu flottant dont la présentation est inadéquate.

### Contrat fonctionnel / UX
1. Boutons explicites, cohérents avec Bootstrap 5.3 et les thèmes SMN, positionnés à droite du header métier et visibles dans tous les états (défaut, survol, focus, désactivé).
2. Icône de rafraîchissement et texte « Actualiser » ; indicateur d'activité pendant la requête et interdiction des activations simultanées.
3. Dropdown Actions aligné sur le déclencheur, non rogné, avec contraste, z-index, dimensions et navigation adaptés desktop/mobile.
4. Entrées correspondant au contexte et aux habilitations : Personnaliser, Copier vers une autre équipe, Réinitialiser ; aucun lien fictif ni divulgation d'actions interdites.
5. Fermeture clic extérieur, Échap et sélection ; focus restauré ; ARIA approprié ; compatibilité clavier.
6. Conserver les fonctions existantes, les données et le shell global. Aucune modification du moteur v33.

### Cibles techniques probables
`src/app/app/dashboard-builder/dashboard-consultation.tsx`, `dashboard-editor.tsx`, `dashboard-dimensions.module.css`. Examiner les contraintes `overflow` du conteneur `cockpitHeader` avant de modifier le dropdown. Ne pas créer de second shell.

## SMN-383 — Sélecteur transversal Bootstrap Icons

### Contrat fonctionnel / UX
1. Chaque bloc et chaque emplacement, y compris l'en-tête dynamique, possède une icône **facultative et indépendante**.
2. Dans l'éditeur, une commande compacte « Choisir une icône » voisine du titre lance un sélecteur réutilisable.
3. Le sélecteur permet recherche textuelle, catégories, aperçu, sélection, suppression, validation et annulation. Seul le libellé humain apparaît dans l'interface ; les identifiants d'icône ne sont pas affichés comme texte principal.
4. Icônes officielles Bootstrap, SVG locaux sans CDN et sans interprétation de HTML arbitraire. Catalogue central, versionné, noms validés côté serveur, fallback explicite.
5. Application dans les titres des blocs et emplacements en consultation et en personnalisation, avec tailles et alignements constants, contraste et responsive.
6. La propriété facultative `icon?: string` est ajoutée à `DashboardBlock` et `DashboardSlot`; compatibilité ascendante des JSONB v1; les dispositions existantes restent valides.
7. Les opérations sur brouillon, sauvegarde optimiste, duplication, copie vers une autre équipe, changement de modèle et réinitialisation conservent correctement les icônes, sans fuite entre blocs.
8. Les rôles, droits, calculs v33, indicateurs et données historiques ne sont pas touchés.

### Architecture proposée
- Faire évoluer `src/app/app/bootstrap-icon.tsx` comme rendu SVG partagé ; éviter deux sources divergentes.
- Nouveau catalogue partagé : noms, libellés FR, catégories, critères d'accessibilité, validation serveur.
- Nouveau composant client `IconPicker` indépendant du Dashboard Builder : `value`, `onChange`, `disabled`, `label`.
- Dans `src/server/dashboard-builder/layout.ts`, valider strictement les icônes optionnelles et ne pas incrémenter automatiquement le schéma s'il demeure rétrocompatible.
- Mise à jour des rendus `dashboard-editor.tsx` et `dashboard-consultation.tsx`.

## Critères de recette transversaux
- Tests unitaires, contrats JSONB, tests de duplication et copie, validation des noms inconnus.
- Tests UI clavier : Tab, Échap, Enter, focus après fermeture, contraste et lecture par lecteur d'écran.
- Tests des modes consultation, personnalisation, Scrum/Kanban et droits en lecture seule.
- Thèmes clair/sombre, largeur mobile, noms longs et états vides.
- Exécution réelle `pnpm typecheck`, `pnpm lint`, tests ciblés et recette visuelle Windows avant statut « Terminé ».
- Aucune modification automatique des rapports édités ou des données de sprint.

## État d'exécution
- **BMAD :** cadrage publié ; aucune implémentation ou recette validée par cette documentation.
- **Jira :** SMN-382 et SMN-383 créées sous SMN-353, laissées À faire.
- **Blocage workflow Amelia :** `bmad-build/SKILL.md` exige l'exécution unique de `render_skill.py` et l'arrêt sur erreur. Tentative réelle effectuée le 05/11/2026 ; échec : script introuvable faute de copie locale du dépôt dans l'environnement d'exécution ChatGPT. Aucun script BMAD ni suite de tests n'a été exécuté. Ce blocage n'autorise pas de contourner le workflow officiel.
