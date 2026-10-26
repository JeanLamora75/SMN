# SMN-285 — Implémentation Cockpit Agile / Page Équipe

**Date :** 26 octobre 2026. **Agent :** Amelia — BMAD v6.12.4.  
**Branche :** `main` (publication directe explicitement demandée).  
**Statut :** code publié, validation automatisée et recette navigateur **à exécuter sur le PC du commanditaire**. Ni GitHub Actions, ni environnement applicatif SMN complet ne sont disponibles dans la session.

## Implémentation et liens
- [Composant TeamOverview](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/team-overview.tsx) : nouveau bandeau bleu avec Équipe, Vision, But, actions Liste/Cartes/Ajouter ; panneau filtres et contexte ; liste/cartes ; modale de création conservée.
- [CSS spécifique Équipe](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/team-cockpit.css) : design inspiré des Registres, responsive, 6 cartes desktop, réserves de faible hauteur, palettes.
- [Filtres purs](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/team-cockpit-filter.ts) : recherche insensible à la casse et aux accents, rôle exercé si part > 0, fonction exacte, états actifs/provisoires/archives si présents.
- [Chargement CSS dans page](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/page.tsx) : styles circonscrits au parcours Équipe.
- [Traductions FR](https://github.com/JeanLamora75/SMN/blob/main/src/i18n/fr.json) et [EN](https://github.com/JeanLamora75/SMN/blob/main/src/i18n/en.json) : `teamCockpit`.
- [Tests ciblés](https://github.com/JeanLamora75/SMN/blob/main/tests/smn-285-team-cockpit.test.ts) ; tests de contexte équipe et de drapeaux adaptés aux nouveaux sélecteurs.

## Vérifications réellement réalisées dans cette session
- Lecture sur GitHub des contrats DESIGN.md, EXPERIENCE.md, recette UX et code source avant modification.
- Contrôles statiques par lecture après publication : toutes les icônes `BootstrapIcon` utilisées sont autorisées par le composant ; clés i18n de `teamCockpit` référencées présentes dans les deux JSON ; absence de l'ancien sous-titre ; JSX du hero et styles CSS isolés présents.
- Vérification structurelle des modifications sur `main` via `fetch_file` après écritures.

**Non exécuté ici :** script officiel BMAD `bmad-build` (checkout complet du projet absent), `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et tests navigateur. **Aucun résultat vert n'est revendiqué.** L'agent a adapté le développement au connecteur GitHub sans exécuter le workflow local. Pas de PR, conformément à l'autorisation de publication directe.

## Recette locale sur Windows 11
Dans PowerShell, après mise à jour du dépôt :
```powershell
git pull origin main
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```
Si l'application est déjà exécutée via `pnpm dev`, vérifier que les fichiers actualisés sont effectivement chargés ; aucun besoin de GitHub Actions.

### Scénarios de recette manuelle
1. **Large écran** : en haut une seule zone bleue « Équipe | Vision Produit | But du produit | Liste Cartes Ajouter » ; pas de panneau produit indépendant ni de sous-titre générique.
2. **Données** : contrôler Vision et Goal réels de l'équipe, texte long, cas absent, état de chargement et erreur.
3. **Effectif** : à cinq membres, six cartes sur une ligne avec tuile Ajouter, puis six réserves courtes et pâles ; à douze ou plus, tous les membres et Ajouter restent accessibles.
4. **Rôles** : SM/PO/Dev affichés simultanément et bleus uniquement lorsque part de rôle > 0 ; drapeaux et fonction réelle.
5. **Filtres** : recherche (nom, fonction, accents), rôle, fonction, statut ; bouton Filtrer puis Effacer ; mêmes résultats et compteurs en Cartes/Liste ; cas sans résultat.
6. **Actions** : ouvrir une fiche, modifier le contexte avec le crayon existant, créer une personne via chacune des deux entrées et annuler sans création.
7. **Droits** : utilisateur lecture seule, aucun ajout ni modification visibles/acceptés ; vérifier périmètre d'équipe autorisé au serveur.
8. **Responsive** : 320/375/390/768/1024/1440/1880 px et zoom navigateur 200 %, sections du bandeau refluant, focus clavier.
9. **Langues et thèmes** : FR/EN, thème clair et sombre, palettes existantes ; vérifier lisibilité et contrastes.

**Règles de suivi :** ne pas considérer la Story terminée ni cocher l'intégralité des AC-01 à AC-14 avant validation effective des tests et de la recette par le commanditaire. Les fonctions nouvelles n'ont pas changé les API, le modèle Prisma, la fiche membre V2, la page Registres ou la gestion multiéquipes SMN-282.

## Documentation contractuelle
[Brief BMAD](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-equipe-cockpit-2026-10-26/BRIEF-BMAD-UX-EQUIPE-OPTION-A.md) · [Jira SMN-285](https://lmn24.atlassian.net/browse/SMN-285).
