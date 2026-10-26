# SMN-280 — Gérer les pays archivés et les blocages depuis le catalogue

**Statut : implémentation proposée sur une branche ; non testée et non fusionnée.**

## Références et dépendances

- Story : https://lmn24.atlassian.net/browse/SMN-280
- Branche : `feat/smn-280-country-catalog-blockers`
- Base technique : `feat/smn-279-country-archive` / PR #199, après SMN-270 à 278.
- Documents d'autorité : `docs/UX-REFERENTIEL-BMAD.md` et skill `.agents/skills/bmad-agent-dev/SKILL.md`. Le skill a été lu via GitHub, y compris `customize.toml` et surcharge projet. Le script officiel `uv` et les commandes BMAD CLI ne sont pas disponibles dans cette session.

## Objectif

Compléter le parcours **catalogue → action contextuelle → diagnostic des dépendances → correction → revérification → confirmation → retour au catalogue**, sans changement supplémentaire du schéma et sans dupliquer la logique serveur de SMN-279.

## Critères d'acceptation

| AC | Implémentation proposée |
| --- | --- |
| **AC1 — Visibilité** | Les vues `Actifs` (défaut), `Archivés` et `Tous` restent indépendantes de la recherche, de l'année commune et du statut annuel. Un calendrier d'un pays archivé reste disponible en lecture seule. Le badge « Archivé » est distinct du statut « À vérifier » ou « Configuré ». |
| **AC2 — Actions accessibles** | Le menu natif `<details>/<summary>` est accessible via Tab/Entrée/Espace, se ferme par Escape et restitue le focus au bouton de menu. Il propose **Renommer + Archiver** sur un actif et **Réactiver seulement** sur un archivé : jamais de suppression définitive. Le panneau de menu est présenté dans le flux du tableau pour ne pas être tronqué dans le conteneur responsive à défilement. Les utilisateurs non-admin n'ont pas de menu de mutation. |
| **AC3 — Blocage membre** | Le panneau de contrôle existant de SMN-279 affiche le nombre réel de membres actifs bloquants et jusqu'à vingt liens vers les fiches autorisées, provenant du GET serveur sécurisé. Le bouton de confirmation reste désactivé tant qu'un blocage existe. « Revérifier les dépendances » relance **uniquement le GET de diagnostic** après correction, sans POST d'archivage. |
| **AC4 — Pays de référence** | Message explicite invitant à modifier d'abord les informations générales. Aucun lien inexistant, aucune sélection automatique d'un autre pays. Un nouveau contrôle est nécessaire avant une éventuelle confirmation. |
| **AC5 — Archivage et réactivation** | Confirmation explicite, décochée par défaut, avant POST. Après un succès serveur, refresh du catalogue et message différencié « archivé » ou « réactivé ». Le changement est appliqué à la **même ligne du même code ISO**, sans création ni perte de jours fériés. Si le filtre Actifs/Archivés ferait disparaître cette ligne, bascule ciblée vers **Tous**, tout en gardant recherche/année/statut annuel. Aucun deuxième POST si le rechargement du catalogue échoue. |
| **AC6 — Responsive et accessibilité** | Un seul dialogue natif de confirmation (pas d'empilement avec d'autres modales) ; fermeture Escape et Annuler sans mutation ; restauration de focus après fermeture, avec retour sur le filtre si la ligne a disparu ; restitution du focus également après annulation d'un renommage ; FR/EN, thème par classes Bootstrap existantes, largeur variable. Lecture seule des calendriers conservée pour utilisateur non-admin. |

## Fichiers

- `src/app/app/admin/countries/country-admin.tsx` : menu contextuel accessible et non rogné ; bascule de filtre après archivage/réactivation ; focus et messages distincts.
- `src/app/app/admin/countries/country-lifecycle-modal.tsx` : aide contextuelle, liens membres, contrôle des dépendances, confirmation bloquée, validation d'état/révision au GET.
- `src/lib/countries/lifecycle-ux.ts` (nouveau) : choix d'action, état de blocage et choix de filtre après mutation.
- `tests/country-lifecycle-ux.test.ts` (nouveau) : cas de tests purs, **non exécutés**.
- `src/i18n/fr.json`, `src/i18n/en.json` : sept textes complémentaires chacun.

## Contrat de sécurité et limites

- Les APIs admin de SMN-279 sont réutilisées **sans assouplir leurs droits**. Le navigateur ne décide jamais seul si un archivage est permis.
- Le GET des membres bloquants n'est exposé qu'à l'administrateur. Les liens sont construits exclusivement depuis les IDs fournis par le serveur.
- La vue de contrôle n'écrit ni affectation membre, ni pays de référence, ni calendrier. Les changements doivent être effectués depuis leurs parcours métier existants.
- Aucune nouvelle migration ; audit, verrouillage, révision optimiste, conservation des archives et blocage transactionnel restent ceux de SMN-279.
- L'UX choisit d'afficher **Tous** lorsqu'une mutation ferait disparaître la ligne courante. Ce détail est à confirmer lors de la recette sur PC.

## Contrôles réellement effectués

- Sources GitHub consultées : story Jira, contrat UI et API de SMN-279, catalogue, modale, référentiel UX et skill Amelia.
- **Revue statique** : présence des trois filtres, séparation badge archivé/statut annuel, actions conditionnelles, contrôle clavier Escape, liens membres, bouton Revérifier, désactivation de confirmation, retour de focus.
- **Parité i18n : 3 286 clés FR/EN**, mêmes clés et mêmes paramètres d'interpolation.
- Tests unitaires rédigés mais **non exécutés**.
- Aucun GitHub Actions, pnpm lint/typecheck/test/build, test PostgreSQL ni recette navigateur réalisé, sur instruction de l'utilisateur. Les résultats statiques ne valent ni compilation ni exécution.

## Recette utilisateur sur Windows 11

1. Sauvegarder la base SMN et sélectionner `feat/smn-280-country-catalog-blockers` dans GitHub Desktop. La branche comprend les stories SMN-270 à 279.
2. Dans Paramètres → Pays : vérifier Actifs par défaut, puis Archivés/Tous ; combiner recherche, statut annuel et année commune.
3. Sur un actif, ouvrir `⋯` au clavier : uniquement Renommer et Archiver. Sur archivé : uniquement Réactiver. Vérifier Tab, Entrée, Espace, Escape et comportement mobile.
4. Tenter un archivage avec membres actifs : confirmation impossible ; compteur et liens vers les fiches réels. Modifier une localisation dans une fiche, revenir puis « Revérifier les dépendances » ; aucune tentative POST avant autorisation.
5. Tenter un archivage du pays de référence : message expliquant de modifier les réglages généraux, **sans faux lien** ni remplacement automatique.
6. Archiver un pays autorisé, avec case cochée : succès distinct, ligne visible dans « Tous » si elle disparaîtrait du filtre Actifs, jours fériés en lecture seule.
7. Réactiver le même pays : retour du même code ISO et des dates existantes, succès distinct, aucune réimportation.
8. Tester annulation et fermeture par Escape : aucune mutation, focus revenu au déclencheur ou au filtre. Vérifier la même règle après annulation du renommage.
9. Vérifier le rôle user : aucune action d'archivage/renommage, consultation du calendrier uniquement. Tester FR/EN, thème sombre et écran étroit.
10. Après recette, exécuter localement `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; partager les erreurs avant fusion.

**PR en brouillon et Jira « En cours » tant que les tests/recette du PC ne sont pas attestés.**
