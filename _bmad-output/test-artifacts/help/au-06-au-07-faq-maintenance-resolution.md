# AU-06 / AU-07 — FAQ et maintenance du module Aide

**Agent :** Camille — rédaction et maintenance documentaire BMAD  
**Date de consultation des sources :** 2026-11-15  
**Périmètre :** première configuration depuis la FAQ ; README de maintenance ; index FR/EN ; tests.  
**État :** changements sur `main` ; consulter la conclusion terminale de la [CI AU-06/AU-07](https://github.com/JeanLamora75/SMN/actions/runs/43691262099).

## AU-06 — Constat et correction

**Écart initial :** la FAQ française présentait le lien « guide de première configuration », mais pointait vers `/app/help` (sommaire), et non vers l'article canonique `overview`. La FAQ anglaise renvoyait également au sommaire.

**Contrainte technique vérifiée :** `src/app/app/help/page.tsx` sait ouvrir un guide via `/app/help?article=<id>`, en consultant les articles autorisés ; toutefois `src/app/app/help/safe-markdown.tsx` n'autorisait initialement aucun lien contenant un `?`. Changer le Markdown seul aurait affiché un texte non cliquable.

**Correction limitée :**
- `content/help/fr/faq.md` et `content/help/en/faq.md` : lien explicite et cohérent vers `/app/help?article=overview`.
- `src/app/app/help/safe-markdown.tsx` : ajout **du seul lien à paramètre `/app/help?article=overview`** dans la liste des formes sûres ; les requêtes arbitraires (`q`, `article` inconnu, paramètres additionnels, URL encodées) et les liens externes restent non cliquables.
- `tests/help-au03-role-safe-links.test.ts` : adaptation du contrôle des chemins pour valider ce lien spécial à un article existant et accessible dans les deux modes.
- `content/help/.index/fr.json`, `en.json` : mise à jour des index à partir de `scripts/build-help-index.mjs`.

**Preuves de code :** `help-catalog.ts` classe `overview` en `collective` pour les modes Scrum et Kanban ; `help/page.tsx` filtre les IDs accessibles via `helpCatalog` avant de charger le contenu. Le lien ne contourne aucun droit.

## AU-07 — Actualisation du README

Le fichier `content/help/README.md` présentait au futur la qualification SMN-468 alors que les tests et une CI dédiée existent désormais. Le contenu a été réécrit afin de distinguer clairement :

- les **14 guides canoniques** et leurs traductions FR/EN, disponibles en fichiers Markdown séparés ;
- le chargement à la demande, le filtrage selon les rôles, la recherche locale et la checklist en `localStorage` ;
- les commandes `node scripts/build-help-index.mjs` et `--check` ;
- les suites de tests SMN-459 à SMN-470 et les non-régressions AU-01 à AU-07, avec le workflow `.github/workflows/help-quality.yml` ;
- les preuves de CI réellement disponibles, notamment le [run AU-05 réussi 43690693920](https://github.com/JeanLamora75/SMN/actions/runs/43690693920) ;
- la vérification **automatisée** d'une arborescence de distribution Windows hors ligne, qui **ne constitue pas une installation Windows réelle validée** ;
- les recettes restantes (sessions authentifiées, PostgreSQL réel, accessibilité, installation sans Internet).

La procédure de maintenance de Camille rappelle l'inspection du code, la documentation des sources et des statuts, la synchronisation des locales et index et l'obligation de rapporter un résultat réel de CI avant toute déclaration de réussite.

## Tests ajoutés

`tests/help-au06-au07-maintenance.test.ts` contrôle :

1. la résolution du guide `overview` pour un utilisateur standard en Scrum et Kanban ;
2. le **rendu cliquable réel** en HTML du lien FAQ dans les deux langues ;
3. le refus des requêtes non autorisées, URL externes et schémas dangereux ;
4. la fraîcheur des deux index, 14 articles par langue ;
5. l'exactitude du README quant aux fichiers, commandes, contrôles de packaging et limites de recette.

Le test est obligatoire dans le workflow de qualité Aide. Aucune donnée réelle de l'utilisateur, aucun changement de permission, aucune écriture PostgreSQL et aucun script `uv`.

## Preuves et limites

- **CI AU-06/AU-07 :** [GitHub Actions run 43691262099](https://github.com/JeanLamora75/SMN/actions/runs/43691262099) — lire son état terminal avant de conclure.
- La vérification d'un lien rendu par le composant en tests Node n'atteste pas une navigation utilisateur réelle sur Windows.
- La simulation offline d'une arborescence de fichiers ne prouve pas que toute la distribution Windows démarre sans Internet.
- Les statuts Jira restent inchangés.

**Prochaine étape après validation :** confier à Murat une recette transversale du module Aide, notamment les profils admin/user, les deux modes Agile, les trois boutons contextuels, la continuité des formulaires et les conditions d'exploitation hors ligne.
