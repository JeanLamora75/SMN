# SMN-419 — Catalogue graphique Office : Galerie M1

**Agent :** Amelia (adaptation BMAD en ChatGPT)  
**Date :** 8 novembre 2026  
**Jira :** https://lmn24.atlassian.net/browse/SMN-419  
**Référence Sally :** UX-01, option A « Galerie » dans `_bmad-output/planning-artifacts/catalogue-graphiques-2026-11-08/EXPERIENCE.md`.

## Périmètre livré sur GitHub main

- Nouvelle page `/app/admin/settings/reports/charts`, accessible par la carte **Paramètres → Rapports → Styles graphiques Office**, protégée par session et autorisation `settings/read`.
- Galerie responsive Cockpit Agile à trois colonnes desktop, deux colonnes tablette, une colonne mobile, **sans éditeur latéral**. Miniatures SVG déclaratives (valeurs de démonstration, palette et fond réellement issus de la configuration), nom, description, origine prédéfinie/personnalisée, pastilles des types pour lesquels le style est le défaut global.
- Recherche texte (nom, description, identifiant), filtre d'origine et filtre par type de graphique utilisant le style par défaut.
- Pour un administrateur : **Créer à partir de Cockpit Agile**, **Dupliquer** tout style, **Renommer** un style personnalisé, **Supprimer** un style personnalisé non utilisé comme défaut. Création et duplication produisent une nouvelle configuration indépendante, non une modification du style source.
- Six sélecteurs de défauts (bar, line, area, pie, donut, gauge), avec confirmation explicite, compteur de révision transmis au service SMN-416 et actualisation après sauvegarde.
- Gestion des erreurs et conflits via codes métier renvoyés par l'API, messages FR/EN, état de chargement, absence de résultat, désactivation des actions en cours, confirmation de suppression, focus visible, Escape et boucle de Tab dans les dialogues.
- **Aucune modification** des valeurs v33, exports Office ou rapports archivés. Les réglages visuels avancés de la fiche M2 sont dans SMN-420.

## Fichiers

| Zone | Fichier |
| --- | --- |
| Accès et page | `src/app/app/admin/settings/reports/charts/page.tsx` |
| Galerie et interactions | `src/app/app/admin/settings/reports/charts/style-gallery.tsx` |
| Styles Cockpit Agile | `src/app/app/admin/settings/reports/charts/style-gallery.css` |
| Règles pures testables | `src/lib/chart-style-gallery.ts` |
| Carte de navigation | `src/app/app/admin/settings/settings-catalog-view.tsx` |
| Traductions | `src/i18n/fr.json`, `src/i18n/en.json` |
| Contrats API existants (réutilisés) | `src/app/api/admin/reports/chart-styles/route.ts` |
| Contrats et sécurité | `tests/smn-419-gallery.test.tsx` |
| CI dédiée | `.github/workflows/smn-419-chart-style-gallery.yml` |

## Autorisation et sécurité

L'API de SMN-416 vérifie indépendamment les droits : les lectures sont accessibles aux comptes habilités ; **toutes les commandes POST exigent un administrateur**. L'interface masque les mutations lorsqu'elle n'est pas en mode administrateur. Les trois styles de base ne sont jamais édités ni supprimés. Le service interdit de supprimer tout style défini par défaut pour au moins un type ; la galerie désactive également cette commande.

La fonction de filtre est pure et indépendante de l'équipe active. Les identifiants créés sont des slug sécurisés avec suffixe aléatoire et ne sont pas saisis par l'utilisateur. Les révisions optimistes préviennent un écrasement concurrent et une erreur reste visible avec possibilité de recharger.

## Recette et commandes Windows 11

Dans le répertoire SMN après GitHub Desktop → Fetch/Pull :

```powershell
pnpm test:smn-419
pnpm typecheck
pnpm lint
pnpm i18n:check
```

La CI `SMN-419 — Galerie des styles Office` exécute les contrôles sur Linux et Windows ; un succès n'est reconnu que lorsque GitHub Actions l'a réellement confirmé. Aucun script `uv` n'a été exécuté.

### Contrôles manuels complémentaires

1. Ouvrir **Paramètres → Rapports → Styles graphiques Office** ; vérifier les trois cartes prédéfinies, les miniatures, la recherche et les filtres sur écran large/étroit.
2. Dupliquer Corporate, lui donner un nom distinct, vérifier que l'original reste inchangé puis recharger la page.
3. Renommer le nouveau style, définir ce style comme défaut « Courbes » et vérifier la persistance au rechargement.
4. Vérifier que **Supprimer** est désactivé tant que le style est utilisé par défaut ; réaffecter Courbes puis supprimer avec confirmation.
5. Vérifier qu'un prédéfini n'affiche pas Renommer/Supprimer ; vérifier les codes d'erreur et conflits en cas de mise à jour concurrente.
6. Tester clavier, Escape, Tab dans les dialogues, ainsi que traduction FR et EN.
7. Confirmer que les rapports précédemment archivés n'ont pas été modifiés.

## Correspondance AC

| AC | Développement | Preuve |
| --- | --- | --- |
| AC-01 | Route protégée, carte navigation, galerie seule | Tests de route + recette Sally |
| AC-02 | Miniatures et métadonnées + filtres | Tests de règles pures et composant SVG |
| AC-03 | Créer/dupliquer/renommer/supprimer, protections | Tests contrats, API SMN-416 et recette |
| AC-04 | Six défauts, revision et relecture | Tests des règles + recette PostgreSQL |
| AC-05 | États UX, dialogues clavier, FR/EN, responsive | Tests et recette manuelle |
| AC-06 | Tests M1 + contrat d'API existant | `pnpm test:smn-419` et CI dédiée |

**Statut :** publication du code ne signifie pas recette terminée. La page nécessite les tables SMN-416 sur la base v33 de l'installation, sans exécution de migration implicite.
