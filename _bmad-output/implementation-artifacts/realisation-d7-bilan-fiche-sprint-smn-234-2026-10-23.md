# SMN-234 — D7 : Bilan du Sprint (Analyse + Analyse IA)

**Date :** 23 octobre 2026 · **Branche :** `main` · **Epic :** SMN-228 · **Statut :** code et tests publiés, contrôles partiels réussis, compilation/recette intégrée à effectuer.

## 1. Résultat métier livré

L'onglet **Bilan** de `/app/admin/sprints/[sprintId]?tab=review` dispose désormais de **deux blocs distincts**, côte à côte dès le format `lg` Bootstrap et empilés sur mobile :

1. **Analyse du Scrum Master** : texte libre éditable par l'administrateur, sauvegarde indépendante, version, dernière date de modification et identifiant de l'auteur (nom de compte affichable).
2. **Analyse IA** : texte libre également **éditable manuellement** et sauvegardé/historisé indépendamment ; **aucune génération automatique, aucun appel à un service IA** n'a été ajouté au lot D7. Une saisie humaine dans cette zone porte explicitement l'origine `human`, pas `ai-generated`. Le texte peut être corrigé sans déclencher de génération.

Chaque bloc possède un **crayon Bootstrap `pencil-square`** lorsqu'il est effectivement éditable (admin, Sprint non clôturé). La modal contient un champ texte multiligne, compteur de caractères, Annuler / Enregistrer, avertissement de modifications non sauvegardées et gestion des erreurs. En cas de conflit de révision, le brouillon est conservé, la sauvegarde refusée avec message explicite. Un succès ferme la modal et rafraîchit la fiche. Le rôle `user` possède uniquement la consultation collective.

**Validation :** maximum 3000 caractères par analyse (dimensionné sous la limite existante de `readJsonObject`, 4096 octets par requête), champ vide autorisé comme `null`. L'endpoint D7 utilise une lecture JSON **streaming plafonnée à 16 Ko** (y compris pour les accents et emojis) sans relever la limite de 4 Ko des autres endpoints. Deux analyses distinctes, donc **deux écritures et deux historiques indépendants**. La dernière révision, son auteur et sa date sont affichés. Les anciennes versions sont conservées en table d'audit ; **le navigateur ne comporte pas encore une interface de comparaison/navigation de toutes les anciennes révisions**, qui demeure une extension possible de l'historique.

## 2. Persistence et provenance

Deux tables SQL, initialisées **uniquement lors d'une mutation admin explicite ou de la préparation d'une clôture** :
- `public.smn_sprint_review_analysis` : clé primaire composite `(sprint_id,kind)`, `kind` = `manual|ai`, texte, `revision`, `origin` (`human|ai-generated|human-edited-ai`), `human_edited`, `generation_id`, auteur et horodatage.
- `public.smn_sprint_review_analysis_audit` : un enregistrement immutable par **modification effective** d'un des deux blocs, avec identifiant Sprint, `kind`, avant/après, auteur, date. Les sauvegardes identiques sont idempotentes : aucune fausse nouvelle révision.

**Garantie contre les écrasements :** `writeSprintReview` verrouille le Sprint, refuse un Sprint clôturé, contrôle la `revision` du bloc visé, et exécute la modification puis son audit dans **une transaction**. Chaque sauvegarde humaine enregistre `human_edited=true`; le drapeau `generation_id` d'une future analyse générée est conservé, et une correction humaine est marquée `human-edited-ai`. Une future génération (Epic 9) **devra impérativement vérifier** ce drapeau, la `revision` et une décision d'écrasement explicite avant toute substitution. **Aucun générateur n'est exécuté ni implémenté aujourd'hui.**

**Autorisation :** `PUT /api/admin/sprints/review-analysis` réutilise `authorizeApi(req,"write",settings)` (session, origine et rôle). La lecture est intégrée à la transaction collective `withDashboardRead` et vérifie `sprint_id`, `team_id`, installation initialisée et mode Scrum. Aucun GET nominatif non protégé n'est créé.

## 3. Instantanés Vn et historique des clôtures

Le workflow `ensureClosureSchema` prépare les tables D7 pour les **nouvelles clôtures**. Au moment de clôturer, `reviewClosureSnapshot` capture **les deux blocs, leur texte, auteur, date, révision, origine et protection contre écrasement**, sous `snapshot.reviewAnalysis.manual` et `snapshot.reviewAnalysis.ai`.

- Un Sprint en cours lit les enregistrements courants ; absence de table ou d'enregistrement = deux blocs non renseignés, et non des textes imaginaires.
- Un Sprint **clôturé** lit **exclusivement le dernier snapshot Vn**, sans substitution de textes actuels ou de révisions plus récentes.
- Un ancien snapshot sans `reviewAnalysis` affiche **« Historique du Bilan indisponible »**, pas une valeur vide prétendument sauvegardée. Un snapshot malformé est explicitement indisponible.
- Modifier ou créer un Bilan sur un Sprint clôturé est refusé serveur et les crayons sont absents.

## 4. Fichiers livrés

| Fichier | Livrable |
|---|---|
| `src/lib/sprint-review-analysis.ts` | **Nouveau** contrat partagé, validation des deux zones, champs historiques et provenance |
| `src/server/sprints/review-analysis.ts` | **Nouveau** producteur SQL, audit, révisions, protection de clôture, lecture collective SELECT-only et snapshots |
| `src/app/api/admin/sprints/review-analysis/route.ts` | **Nouvelle** API `PUT` sécurisée |
| `src/app/app/admin/sprints/[sprintId]/sprint-review-panel.tsx` | **Nouveau** panneau en deux colonnes, crayons, modal, auteur/date/version, messages FR/EN |
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Raccordement conditionnel de l'onglet `review`, en préservant D1–D6 |
| `src/server/sprints/closure.ts` | Capture du Bilan dans le JSONB historique Vn |
| `src/i18n/fr.json` et `src/i18n/en.json` | 24 nouvelles traductions dans chaque catalogue |
| `tests/smn-234-sprint-review-d7.test.ts` | **Nouveaux scénarios** de validation, refus hors équipe, versions indépendantes, conflits, rôles, audit et snapshots |

## 5. Vérifications réellement effectuées

- **GitHub / intégration statique :** 20/20 contrôles de cohérence positifs (fichiers publiés, contrôle équipe, transactions, historique, verrous de révision, copies Vn, RBAC, affichage, traductions, aucune IA inventée).
- **Module pur isolé :** le fichier réel `src/lib/sprint-review-analysis.ts` a été recopié localement, **SHA Git `b93522747f0f1f776d96e5c431ceb9dd0629e91c` identique à `main`** ; `tsc --strict --target es2022 --module commonjs` a réussi. **20/20 assertions isolées réellement exécutées sous Node.js 22**, couvrant les deux types, les champs vides, les limites, les états de provenance, les auteurs et les snapshots malformés.
- **Non exécutés :** `pnpm typecheck` global, le fichier de tests intégré `pnpm exec tsx --test tests/smn-234-sprint-review-d7.test.ts`, `pnpm i18n:check`, `pnpm build`, transaction PostgreSQL réelle, tests API Next.js et recette utilisateur/navigateur. La vérification isolée d'un module pur **ne prouve pas** la bonne intégration de l'application. GitHub Actions indisponible ; les scripts locaux BMAD (`uv`) n'ont pas été exécutés.

## 6. Recette Windows 11 (à réaliser)

Après mise à jour de `main` dans GitHub Desktop, ouvrir PowerShell à la racine du projet :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-review-d7.test.ts tests/smn-234-sprint-trends-d6.test.ts tests/smn-234-sprint-presence-d5.test.ts tests/smn-234-sprint-ceremonies-d4.test.ts tests/smn-234-sprint-indicators-d3.test.ts tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-detail-d1.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

Dans SMN : **Sprints → fiche d'un Sprint de test → Bilan**. Vérifier :
- Les deux blocs côte à côte puis empilés à 375 px, dark/light, FR/EN, clavier, focus, Annuler, caractère max.
- En admin : éditer Analyse (révision V1), puis Analyse IA (révision V1 distincte), puis Analyse (V2, IA reste V1). Contrôler auteur/date, contenu au rafraîchissement et absence de génération IA. Tester les champs vidés volontairement.
- Test de conflit : ouvrir deux sessions admin sur le même Sprint et le même bloc, enregistrer dans une session, constater le refus de la vieille révision dans l'autre ; vérifier que l'autre bloc n'est pas touché.
- Rôle `user` : deux textes consultables et aucun crayon. Sprint clôturé : instantané Vn inchangé, aucun crayon et API 409. Ancien snapshot sans Bilan : état historique indisponible explicite.
- Vérifier qu'un nouveau snapshot préserve réellement le texte et les dates/auteurs ; ne pas modifier d'anciens Sprints de production pour cette recette.

## 7. Suite

**D7 publié mais non recetté au sens Definition of Done**. SMN-234 reste ouverte. **D8 — Registres** demeure conditionné aux données persistées de l'Epic 5 (six registres, période de validité, snapshots). **D9 — Validation transverse** devra inclure la recette des lots D1–D8, avec traitement de toute anomalie trouvée en local.

## Références

- Jira : https://lmn24.atlassian.net/browse/SMN-234
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
- [Audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
