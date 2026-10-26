# SMN-278 — Retour contextuel après un import national multiannuel

**État : code publié dans une branche dédiée, sans recette sur Windows, sans fusion.**

## Références
- Jira : https://lmn24.atlassian.net/browse/SMN-278
- Branche : `feat/smn-278-import-contextual-return`.
- Base : `feat/smn-277-unified-country-import` (PR #197), incluant les développements SMN-270 à 276.
- Référentiel UX : `docs/UX-REFERENTIEL-BMAD.md`.
- Skill BMAD : `.agents/skills/bmad-agent-dev/SKILL.md`, consulté dans le dépôt. L'environnement GitHub connecteur ne permet pas d'exécuter le moteur `uv`/BMAD natif ; les étapes sont adaptées manuellement. **Aucune validation automatisée prétendue.**

## Règle d'orientation retenue (hypothèse UX à confirmer en recette)

En cas de commit ayant réellement changé des dates, ouvrir automatiquement la **plus récente des années effectivement modifiées**, puis afficher des accès immédiats aux autres millésimes concernés. C'est une proposition cohérente avec la Story mais le PO n'a pas formellement tranché ; elle reste réversible à la recette.

La liste des millésimes **effectivement écrits** est fournie par la transaction serveur : `changedYears`. Elle n'est jamais inférée de toutes les lignes de prévisualisation (certaines peuvent être ignorées ou rejetées).

Pour un aperçu avec **zéro ligne à écrire** : ne pas envoyer de commit inutile ; afficher « Aucune date modifiée » et proposer la consultation des millésimes présents dans le fichier, sans décréter leur validation ni révoquer quoi que ce soit.

## Implémentation par critère d'acceptation

| AC | Réalisation |
| --- | --- |
| **AC1 — Transition post-commit** | Le succès du commit CSV ou ICS ferme le **panneau d'import** et remet en avant la grande modale calendrier du pays déjà ouvert. Le mode Liste est sélectionné, l'année d'arrivée est mise à jour dans cette modale uniquement. Ni `preview`, ni `inspect`, ni erreurs ne déclenchent cette navigation. |
| **AC2 — Années touchées** | `executeHolidayCsv` retourne `changedYears` (ensemble des années modifiées, trié décroissant), et `executeHolidayIcs` propage cette propriété. L'année la plus récente devient la sélection locale ; les autres apparaissent dans un bandeau de navigation. Le sélecteur d'année comprend les années impactées même hors du calendrier national préchargé. |
| **AC3 — Données rechargées** | `CountryCalendarModal` recrée `AnnualHolidays` grâce à `reloadVersion` et relit `GET /api/admin/countries/calendar` pour l'année choisie ; la liste du catalogue est rafraîchie par `onChanged`. Le badge annuel provient de cette lecture, **jamais** d'une estimation issue du preview. Les règles de dévalidation administrative continuent à s'appliquer dans SMN-275, uniquement aux années réellement modifiées. |
| **AC4 — Import sans changement** | Pour `preview.proposed===0` : message « Aucune date modifiée », aucun appel `commit`, bouton « Consulter les années du fichier ». Celles-ci sont seulement des années **examinées** ; le bandeau évite de les présenter comme des années **modifiées**. L'année actuelle reste sélectionnée par défaut. |
| **AC5 — Résilience** | Après commit réussi, le bilan est stocké dans l'état de la **grande modale**, hors du composant de lecture des dates ; il survit donc à l'erreur réseau du GET. Un bouton « Réessayer l'ouverture du calendrier » incrémente le jeton de lecture GET et réessaie aussi la liste des pays si nécessaire. **Il ne rappelle jamais le POST d'import.** En cas de réponse serveur 200 mais sans années vérifiables, ne pas inventer de destination : conserver l'année courante et afficher une réserve explicite. |
| **AC6 — Retour catalogue** | Le `selectedYear`, la recherche et les filtres demeurent dans `CountryAdmin` ; la navigation post-import ne change que le `year` local de `CountryCalendarModal`. La fermeture du dialogue revient donc au contexte de départ. |

## Contrats techniques

- CSV : `POST /api/admin/countries/import-csv` renvoie après commit `{ok:true,preview,created,replaced,changedYears:number[]}`. Il construit les années depuis les lignes réellement **insérées ou modifiées** de la transaction PostgreSQL et conserve l'ancien contrat en l'enrichissant.
- ICS : `POST /api/admin/countries/import-ics` renvoie la même propriété `changedYears`, recopiée de la transaction CSV mutualisée.
- Preview/inspect : pas de mutation ; `changedYears` n'est pas fabriqué pour ces phases.
- `src/lib/countries/import-navigation.ts` : distinction stricte **années examinées / années proposées / années réellement modifiées**, sélection de millésime, réponse serveur vérifiée par totaux et périmètre.
- En cas de métadonnées de succès incomplètes, considérer l'écriture comme potentiellement réussie, conserver son bilan et la possibilité de rafraîchir le calendrier ; **ne jamais redéclencher le commit** pour « réparer » la navigation.
- Les imports restent protégés côté serveur (compte admin, empreinte de preview, collision 409, transaction et audit). Aucun nouveau droit ni changement de base.

## Fichiers

- `src/server/holidays/csv-import.ts`
- `src/server/holidays/ics-import.ts`
- `src/lib/countries/import-navigation.ts` (nouveau)
- `src/app/app/admin/countries/country-holiday-import-panel.tsx`
- `src/app/app/admin/countries/country-calendar-modal.tsx`
- `tests/country-import-navigation.test.ts` (nouveau)
- `src/i18n/fr.json`, `src/i18n/en.json`

## Vérifications réellement réalisées

- Contrôle statique de la remontée de `changedYears` depuis les deux endpoints, de l'année sélectionnée localement, du changement de `reloadVersion`, du maintien des filtres globaux, de la distinction 0 modification / succès / métadonnées inconnues, et de l'absence de POST sur « Réessayer ».
- Traductions FR/EN : **3 261 clés chacune**, mêmes noms et mêmes paramètres d'interpolation ; aucune clé nouvelle absente.
- Cas de tests unitaires rédigés pour les années multiannuelles et la séparation années examinées / années écrites, les retours sans mutation, collisions, totaux incohérents et destination récente, **non exécutés**.
- **Pas** de GitHub Actions, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette PostgreSQL ou navigateur. L'utilisateur exécutera ces vérifications sur son PC Windows 11.

## Recette locale (utilisateur)

1. Sauvegarder la base PostgreSQL pilote et ouvrir `feat/smn-278-import-contextual-return` dans GitHub Desktop ; cette branche comprend également SMN-270 à 277.
2. Ouvrir Paramètres → Pays ; saisir une recherche, choisir un filtre et un millésime commun. Ouvrir « Gérer » sur un pays et importer un fichier CSV comportant de nouvelles dates dans deux années distinctes (ex. 2026 et 2042).
3. Après le **seul** POST de commit réussi : le formulaire d'import doit disparaître, la vue Liste du pays rester ouverte sur **2042**, et un bouton **2026** doit permettre de relire le millésime précédent ; dates et badges doivent provenir de la base.
4. Revenir à 2042 via le bandeau, puis fermer la grande modale : retrouver exactement la recherche, le filtre et l'année commune d'avant import.
5. Répéter avec ICS (inspection, sélection manuelle, aperçu et confirmation) puis avec un mélange d'ajouts/remplacements et de dates rejetées : seules les années réellement écrites doivent figurer dans la liste « Années modifiées ».
6. Importer un fichier ne produisant que doublons ou lignes rejetées : afficher « Aucune date modifiée », aucun commit SQL, permettre « Consulter les années du fichier » sur demande, sans afficher « Configuré » automatiquement.
7. Avant import, disposer d'une année validée et d'une autre non modifiée : après commit réel, la première passe « À vérifier » et la seconde conserve sa validation.
8. Couper le backend **après** confirmation positive et avant GET : constater le bilan persistant, puis « Réessayer l'ouverture » **sans second POST** et sans doubler les audits.
9. Tester FR/EN, clavier, mobile et navigation depuis le bandeau ; exécuter sur le PC `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

**Ne pas fusionner ni marquer la story « Terminé » avant recette utilisateur.**
