# SMN-277 — Import national CSV/ICS unifié

**Statut : code publié sur branche, sans tests d'exécution ni fusion.**

## Références

- User Story : https://lmn24.atlassian.net/browse/SMN-277
- Branche : `feat/smn-277-unified-country-import`
- Base : `feat/smn-276-calendar-validation-panel` (PR #196), dépendant des stories SMN-270 à SMN-275.
- Référentiel : `docs/UX-REFERENTIEL-BMAD.md`
- Skill Amelia : `.agents/skills/bmad-agent-dev/SKILL.md`, consulté sur GitHub dans la séquence précédente.

## Décisions d'implémentation

La grande modale de gestion des pays (SMN-272) existe déjà. Afin d'éviter toute deuxième modale native superposée et de préserver l'accessibilité, « Importer » affiche **un seul panneau unifié dans cette grande modale**. Il remplace les deux formulaires permanents CSV et ICS visibles dans le catalogue. Cette adaptation respecte l'objectif de SMN-277 : un seul parcours d'import associé au pays actif.

**Ne pas changer les règles de données côté serveur :** garder `POST /api/admin/countries/import-csv` et `POST /api/admin/countries/import-ics` ainsi que le calcul et le contrôle d'empreinte du backend. Aucun nouvel endpoint, migration SQL ou abonnement ICS.

## Correspondance aux critères d'acceptation

| AC | Implémentation |
| --- | --- |
| AC1 | `country-holiday-import-panel.tsx` : bouton Importer dans la modale annuelle, pays actif affiché mais non modifiable, fichier local .csv/.ics détecté d'après son extension (majuscule acceptée), lecture UTF-8 stricte, rejet fichier vide/format non reconnu ou supérieur à 1 MiB, politique commune skip/replace, action d'analyse, aucun deuxième formulaire technique permanent. |
| AC2 | CSV : appel `stage=preview` de l'endpoint historique, respect de l'en-tête, colonnes, pays, dates, doublons, conflits et rejets motivés. L'aperçu ne provoque aucune écriture métier. Pagination commune 50 lignes. |
| AC3 | ICS : `stage=inspect` d'abord, événements lisibles/admissibles et exclusions expliquées (horaire, durée, récurrence, annulé, etc.) ; sélection manuelle par case et sélection/désélection des seuls événements éligibles ; `stage=preview` ensuite. Import local uniquement, pas d'URL ni d'abonnement. |
| AC4 | Un seul rendu d'aperçu CSV/ICS : ligne, date, année, nom, décision `create/replace/reject`, libellé antérieur, motif du rejet, compteur proposé/rejeté global, tableau des ajouts/remplacements/rejets par millésime, année indéterminée distincte, pagination. Pas de restriction aux seuls millésimes préchargés. |
| AC5 | Changement de fichier/stratégie/sélection ICS invalide les aperçus en cours ; pendant les appels réseau, les contrôles et la fermeture de la grande modale sont protégés. Le commit réutilise l'empreinte du preview serveur, sans la calculer en client. Après **409**, l'ancien aperçu est jeté et l'utilisateur doit lancer une nouvelle analyse ; pays, fichier et sélection restent conservés. Toute autre erreur conserve le brouillon et le panneau. |
| AC6 | Le commit ne valide jamais administrativement l'année. API protégées `settings/write` côté serveur, traduction FR/EN, focus sur l'en-tête à l'ouverture puis bouton Importer au retour, navigation clavier dans la liste des événements et l'aperçu ; responsive grâce au conteneur SMN existant. |

## Contrat d'interaction

- CSV : `POST /api/admin/countries/import-csv`, `{stage:"preview"|"commit",country,policy,csv,fingerprint?}`.
- ICS : `POST /api/admin/countries/import-ics`, `{stage:"inspect"|"preview"|"commit",country,policy,ics,selected,fingerprint?}`.
- Format et policy ne sont pas interchangeables après l'aperçu. L'aperçu reçu est validé pour le code pays et la politique courants (`isExpectedImportPreview`) avant activation du bouton.
- Pour ICS, seuls les événements interprétables comme jours entiers uniques peuvent être sélectionnés ; le backend revalide le choix.
- Le serveur reste responsable des décisions finales, des dates, des doublons, de l'écriture atomique et de l'audit.
- Après confirmation positive, SMN-277 ferme le panneau et recharge **l'année déjà sélectionnée**, avec message de résultat ; **SMN-278** prendra en charge l'orientation automatique après import multiannuel et le retour contextuel.
- Une réponse réseau ambiguë peut être revérifiée via un nouvel aperçu ; ne jamais envoyer deux commits en parallèle.

## Fichiers

- `src/app/app/admin/countries/country-holiday-import-panel.tsx` — nouveau formulaire/aperçu unifié.
- `src/app/app/admin/countries/country-calendar-modal.tsx` — bouton, intégration, retour à l'année courante.
- `src/app/app/admin/countries/country-admin.tsx` — suppression des deux formulaires permanents CSV/ICS du catalogue et indication du nouveau chemin.
- `src/lib/countries/holiday-import.ts` — formats, validation d'aperçu, statistiques annuelles, pagination.
- `tests/country-holiday-import.test.ts` — tests purs ajoutés, **non exécutés**.
- `src/i18n/fr.json`, `src/i18n/en.json` — 19 libellés supplémentaires dans chaque langue.
- Les composants `holiday-csv-import.tsx` et `holiday-ics-import.tsx` restent dans le dépôt comme références historiques, mais ne sont **plus montés dans la page Pays**.

## Contrôles réellement effectués

- Lecture et revue statique des routes CSV/ICS et de leurs politiques d'empreinte, des nouveaux composants et de leur intégration dans la grande modale.
- Les deux catalogues FR/EN comportent **3 253 clés** chacun, aucun chemin en plus ou en moins et aucun désaccord sur les paramètres interpolés.
- Contrôles de code : absence de seconde modale, absence des deux anciens écrans permanents, utilisation des mêmes endpoints, destruction de l'aperçu sur conflit 409, pas d'appel à l'API de validation administrative par l'import.
- Tests unitaires **écrits, non exécutés**.
- **Aucune** exécution GitHub Actions, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette navigateur ou vérification PostgreSQL. Selon la décision utilisateur, elles seront effectuées sur Windows 11.
- Ce travail suit les sources BMAD lues via GitHub ; le moteur de workflows `uv` ne peut pas être rendu/exécuté sans checkout complet dans l'environnement connecteur.

## Recette manuelle Windows 11

1. Sauvegarder la base PostgreSQL SMN, puis sélectionner `feat/smn-277-unified-country-import` dans GitHub Desktop ; cette branche contient SMN-270 à SMN-276.
2. Avec un compte admin, ouvrir Paramètres → Pays → Gérer un pays → Importer. Vérifier que le pays est fixé et qu'aucun ancien formulaire CSV/ICS n'est affiché dans les outils du catalogue.
3. Charger un CSV UTF-8 ≤1 MiB : vérifier en-tête, séparateurs, dates invalides, doublons, pays incohérent, stratégie skip/replace et prévisualisation sans écriture.
4. Charger un fichier ICS ≤1 MiB : vérifier lecture et motifs d'exclusion pour événements à heure, récurrents, annulés, multi-jours ; sélection manuelle puis aperçu sans écriture ; aucune URL distante.
5. Importer un fichier multiannuel (ex. 1999 et 2042) : vérifier les totaux globaux et par année, les lignes acceptées/rejetées, l'ancien libellé, la pagination ; valider et vérifier l'audit en base.
6. Depuis deux onglets, changer une date après l'aperçu dans l'autre ; au 409, l'aperçu périmé disparaît, les sélections restent, une nouvelle analyse est obligatoire.
7. Tester un fichier trop volumineux, non UTF-8, extension non prise en charge, erreur serveur, annulation avant commit, double clic sur Confirmer ; aucune écriture involontaire.
8. Vérifier que le commit **ne valide pas automatiquement** l'année ; une année attestée réellement modifiée repasse À vérifier, les snapshots clôturés ne sont pas réécrits.
9. Vérifier FR/EN, mobile, zoom 200 %, clavier, rôle non-admin ; exécuter `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` en local.
10. SMN-278 traitera le retour automatique sur les millésimes touchés et le parcours contextuel après import.

**Pas de fusion ni de statut « Terminé » avant recette utilisateur.**
