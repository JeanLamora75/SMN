# SMN-276 — Panneau de confirmation de validation annuelle

**Statut de livraison : code publié sur branche, recette d'exécution non effectuée.**

## Références

- User Story : https://lmn24.atlassian.net/browse/SMN-276
- Branche : `feat/smn-276-calendar-validation-panel`
- Base : `feat/smn-275-annual-validation` (PR #195). Chaîne : SMN-270 → 271 → 272 → 273 → 274 → 275 → 276.
- Skill source consulté : `.agents/skills/bmad-agent-dev/SKILL.md` sur GitHub. Le mécanisme `uv` / BMAD natif n'est pas exécuté depuis cette session utilisant le connecteur GitHub.
- Référentiel commun : `docs/UX-REFERENTIEL-BMAD.md` ; conventions i18n FR/EN.

## Résultat par critère d'acceptation

| AC | Réalisation |
| --- | --- |
| **AC1 — Panneau intégré** | Bouton « Valider l'année » dans `country-calendar-modal.tsx`, réservé à `canManage`. Si l'année est déjà attestée, bouton désactivé. Le panneau `country-year-validation-panel.tsx` est **dans la grande modale existante**, sans boîte de dialogue empilée. Il affiche nom/ISO du pays, millésime sélectionné, périmètre National et **compteur réel fourni par le diagnostic serveur**. |
| **AC2 — Diagnostic** | `GET /api/admin/countries/[code]/calendar/validate?year=...` au chargement, avec états chargement/erreur/Réessayer. Affichage séparé des `blocking` et `warnings` + motif traduit et détail serveur. Chaque anomalie propose « Revoir les dates » ; les détails structurés au format ISO renvoient vers la ligne correspondante si présente. Les dates ne sont jamais inventées par le client. |
| **AC3 — Confirmation** | Case de complétude **décochée** à l'ouverture. Le bouton « Confirmer la validation » n'est actif que si année non archivée, compteur non nul, **zéro anomalie bloquante**, case cochée, diagnostic frais, absence d'enregistrement concurrent et année non déjà validée. Motif lisible de désactivation et `aria-describedby`. |
| **AC4 — Concurrence et succès** | `POST` sur la même route avec `{year,fingerprint,confirmComplete:true,source:"manual-review"}`. L'empreinte est fournie par le **GET serveur**, et n'est pas recalculée en JS. En cas 409 ou 422 : case décochée, relecture du diagnostic, message d'erreur, nouvelle inspection des dates obligatoire avant une confirmation. En cas 200 : fermeture du panneau, rechargement annuel et catalogue, statut recalculé sur données serveur. Aucune réussite affichée avant réponse positive. |
| **AC5 — Navigation/UX** | Annuler revient à la modale, restitue le focus au bouton d'origine et n'envoie pas de requête POST. Le sélecteur d'année, la bascule de vue et la fermeture de la grande modale sont bloqués le temps de l'inspection afin de ne pas confirmer une autre année. Changer d'année après fermeture recrée le composant et efface la confirmation. Les contenus utilisent les styles responsive Bootstrap et les variables de la grande modale, FR/EN et focus clavier. |

## Fichiers

- Nouveau : `src/app/app/admin/countries/country-year-validation-panel.tsx`.
- Nouveau : `src/lib/countries/annual-validation.ts` — types diagnostics, validation structurelle stricte pays/année, correspondance des codes d'anomalies et garde-fou de confirmation.
- Nouveau : `tests/country-annual-validation-ui.test.ts` — tests purs prévus pour périmètre annuel, contrôle des types, blocages, dates.
- Modifié : `src/app/app/admin/countries/country-calendar-modal.tsx` — ouverture, interverrouillage avec édition SMN-274, retour au contexte et actualisation post-confirmation.
- Modifiés : `src/i18n/fr.json` et `src/i18n/en.json` — libellés, anomalies et messages d'état.

## Règles de sécurité et cohérence

- Les permissions de la page admin **et** de l'API (`settings/read` et `settings/write`) restent la source de vérité ; masquer le bouton UI ne remplace jamais les contrôles serveur.
- L'API de SMN-275 effectue la validation transactionnelle et l'audit. Cette story ne crée aucune nouvelle table, ne touche pas au schéma PostgreSQL, ni aux snapshots historiques.
- Le diagnostic est rejeté côté UI si mauvais code ISO, mauvaise année, empreinte/revision invalide, champ critique non conforme ou code d'anomalie non reconnu. Dans ce cas le bouton est inactif.
- Lors d'un conflit, l'utilisateur **ne peut pas confirmer depuis l'aperçu obsolète** : un nouveau passage par la liste des dates est requis, ce qui recharge également le calendrier.
- Un échec de rafraîchissement du catalogue après une validation réussie est annoncé séparément ; il ne provoque jamais de nouvelle requête de validation.

## Vérifications réellement faites

- Contrôle statique des sources GitHub : raccordement du bouton à l'API existante, verrouillage pays/année, confirmation explicite, statuts, absence de deuxième dialogue natif, retour aux dates avec tentative de focus, configuration FR/EN.
- Traductions **3 234 clés dans chaque langue**, mêmes chemins et paramètres d'interpolation.
- Tests unitaires **écrits, non exécutés**.
- Aucun GitHub Actions, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, validation navigateur, ni test PostgreSQL effectué. Le développeur ne revendique pas une recette réussie.

## Recette Windows 11 à réaliser

1. Sauvegarder d'abord la base PostgreSQL SMN ; ouvrir `feat/smn-276-calendar-validation-panel` dans GitHub Desktop (contient également SMN-270 à 275).
2. Compte administrateur : ouvrir Paramètres → Pays → Gérer ; choisir une année avec dates, cliquer **Valider l'année**. Vérifier pays/ISO/année/National/nombre réel, diagnostic, anomalies et liens dates.
3. Sans cocher la case, « Confirmer » reste inactif. Cocher et confirmer une année sans anomalie : statut Configuré après relecture, historisation acteur/source/date côté DB.
4. Annuler le panneau : le calendrier reste inchangé, aucun audit, retour du focus.
5. Choisir une année vide/invalide : action de confirmation bloquée avec motifs précis ; les avertissements non bloquants restent consultables.
6. Depuis deux onglets, modifier un jour férié après avoir ouvert le diagnostic dans l'autre : vérifier le **409**, la case remise à zéro, le diagnostic rechargé et l'obligation de revoir la liste avant de confirmer à nouveau.
7. Après succès, modifier un jour : l'année revient À vérifier. Réimporter le même contenu sans changement : la validation doit persister. Tester suppression de dernière date → Non configuré.
8. Vérifier profil non-admin (aucune action possible), FR/EN, thème sombre, zoom à 200 %, mobile et navigation clavier/Escape.
9. Exécuter localement les commandes `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Reporter les erreurs rencontrées avant toute fusion.

**Garder Jira « En cours » et la PR en brouillon jusqu'à vérification sur ton PC.**
