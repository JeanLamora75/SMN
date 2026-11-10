# CONTRAT-DEVELOPPEMENT.md — Transfert de Sally à Amelia

**Date :** 10 novembre 2026 — **périmètre documentaire UX uniquement.** Conception validée sur l'organisation en six familles avec recherche et conservation des vues Cartes/Liste. Les fonctionnalités métier existantes ne doivent pas changer.

## Documents normatifs

Lire dans cet ordre : [DESIGN.md](DESIGN.md) (apparence), [EXPERIENCE.md](EXPERIENCE.md) (comportements), [CATALOGUE-ET-ROUTES.md](CATALOGUE-ET-ROUTES.md) (19 entrées et URLs), [RECETTE-UX.md](RECETTE-UX.md) (30 scénarios).

## Architecture cible minimale

1. **Registre central :** modifier `src/lib/settings-catalog.ts` pour produire six familles et 19 IDs fonctionnels dont les destinations historiques sont vérifiées ; ajouter les anciennes sections codées directement dans `settings-catalog-view.tsx` au registre commun. Un seul titre/description/icone/état/URL/permissions/alias i18n par entrée.
2. **Permissions côté serveur :** `src/app/app/admin/settings/page.tsx` ne transmet au client que les entrées autorisées ; aligner les droits de la galerie, des indicateurs, de l'entreprise et de maintenance sur les autorisations de leurs pages réelles. Ne pas élargir l'accès utilisateur. Maintenir la résolution conditionnelle Scrum/Kanban.
3. **Vue unique :** transformer `settings-catalog-view.tsx` pour itérer **uniquement** sur les six groupes ; retirer les sections annexes `showCompanies` sans supprimer leurs fonctionnalités. Utiliser `BootstrapIcon` et traductions `fr.json`/`en.json`.
4. **Recherche client :** entrée `type=search`, `useMemo` ou fonction pure, normalisation accent/casse, découpage AND, filtrage des entrées autorisées uniquement, alias i18n, familles vides masquées, compteur/état vide, effacement et annonces accessibles.
5. **Représentations :** préserver `SETTINGS_VIEW_STORAGE_KEY="smn-settings-catalog-view"` et ses tests ; cartes 4/2/1, liste sémantique, navigation au clavier, tabindex/focus et compatibilité thèmes.
6. **Liens directs :** réutiliser `/settings/general#settings-language` et `#settings-appearance`. Les composants `settings-form.tsx`, `settings-tabs.tsx` connaissent déjà ces ancres ; les préserver. Maintenance et jours fériés utilisent les onglets existants. Ajouter seulement si besoin des retours vers Paramètres sur les écrans n'en disposant pas.
7. **Tests :** unitaires du catalogue (IDs uniques, six sections, conditions de mode et de droits, zéro duplication), de la recherche (accents/alias, deux langues, multi-mots, états), de la vue, des links et des protections, plus recette navigateur.

## Découpage recommandé en Stories Jira

Le présent document **ne crée/modifie aucune Story**. Préparer les éléments ci-dessous pour accord avant toute création ou modification Jira ; vérifier d'abord leur recouvrement avec Epic [SMN-223](https://lmn24.atlassian.net/browse/SMN-223) et Stories SMN-224–227 :

| Lot | Besoin et critères centraux | Dépendances |
|---|---|---|
| UX-PAR-V2-A | Réorganiser catalogue en six familles, 19 entrées uniques et permissions ; conserver URLs | Inventaire routes, i18n |
| UX-PAR-V2-B | Recherche transverse uniquement sur les rubriques permises ; alias FR/EN, état vide, clavier | A |
| UX-PAR-V2-C | Harmoniser cartes/liste Cockpit Agile, icônes Bootstrap, responsivité et préférence | A |
| UX-PAR-V2-D | Qualifier navigation, retours, droits, modes Scrum/Kanban, anciennes routes et recette | A–C |

Stories petites, indépendamment testables dans la mesure possible, avec aucune nouvelle règle métier et pas de migration de données.

## Risques et décisions de réalisation

- **R01 — sécurité :** le code actuel de la vue possède des sections admin annexes; le nouveau registre ne doit pas exposer celles-ci sous un droit trop permissif. Bloquant avant publication.
- **R02 — doublons :** une même route peut être accessible via plusieurs onglets, mais **une seule entrée canonique fonctionnelle** dans le portail. Maintenance reste carte unique.
- **R03 — sections existantes :** ne pas casser les ancres hash ni protections de brouillons du formulaire global.
- **R04 — mode et équipes :** plusieurs équipes et Scrum/Kanban. Ne pas attribuer implicitement un paramètre à une équipe incorrecte.
- **R05 — faux accès :** « Règles de capacité » n'est pas un formulaire réglable vérifié ; garder non cliquable.
- **R06 — langue et thèmes :** anciennes chaînes françaises codées dans le composant entreprises, à traduire en FR/EN.
- **R07 — changements anciens documents :** le portail V2 six familles **supplante** le contrat V1 quatre familles / quatorze rubriques, sans réécrire les autres décisions métier.

## Définition de terminé

Tous les cas applicables de [RECETTE-UX.md](RECETTE-UX.md) ont leurs preuves. Aucun développement terminé sans test réel. Adapter le workflow BMAD au connecteur GitHub : scripts `uv` non exécutés, aucune prétention de validation de code à partir de seule lecture statique.

## Recommandation de mise en production

Faire modifier les fichiers dans un même lot cohérent catalogue + vue + i18n pour éviter un portail cassé entre deux commits, puis recette. Les options de publication (main direct selon fonctionnement SMN) ne dispensent pas de vérifier les actions GitHub et les tests.
