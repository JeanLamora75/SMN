# AU-03 — Liens documentaires adaptés aux droits de lecture

**Responsables :** Camille (MA, FR/EN), Winston (décision d'architecture)  
**Date de consultation du dépôt :** 2026-11-15  
**Source :** [audit Camille](./camille-audit-au-2026-11-14.md), `src/lib/help-catalog.ts`, `src/server/access-policy.ts`, `src/app/app/help/safe-markdown.tsx`, `src/lib/help-setup.ts`, articles FR/EN.

## Décision de Winston

Les guides `overview`, `calendar`, `faq`, `indicators` sont accessibles en lecture avec le droit `collective`, aussi bien pour le rôle `user` que pour `admin`. La politique centrale `canAccess` réserve `settings` et `backups` aux administrateurs.

**Règle AU-03 :** aucun lien Markdown actif d'un guide accessible au rôle `user` ne doit viser une destination exigeant un droit non disponible pour ce rôle ou incompatible avec le mode Scrum/Kanban. Conserver les liens directement accessibles ; pour un écran ou une opération administratifs, expliquer le prérequis et l'emplacement dans la navigation **sans lien trompeur**.

Lier une destination autorisée en lecture n'autorise jamais son écriture. Cette règle ne duplique pas le moteur de permissions dans `SafeHelpMarkdown` : le catalogue et `canAccess` restent sources de vérité, et les tests inspectent les liens réellement écrits. Le Centre d'aide et sa checklist continuent à filtrer les étapes suivant rôle/mode. Aucun changement de schéma, d'API ou de règle de droits.

## Fichiers mis à jour par Camille (FR/EN)

| Article | Changements éditoriaux | Sources de preuve | Statut documentaire |
|---|---|---|---|
| `overview` | Retrait des liens directs vers Paramètres généraux, Équipes, Membres et Maintenance ; explication des prérequis. Suppression des deux liens de cadence mode-incompatibles ; navigation Scrum/Kanban conservée dans les instructions | `help-catalog.ts`, `help-setup.ts`, `access-policy.ts` | Vérifié dans le code |
| `calendar` | Liens Membres et jours travaillés remplacés par des informations de navigation conditionnées par les droits | `help-catalog.ts`, `access-policy.ts`, route `/app/team-calendar` | Vérifié dans le code |
| `faq` | Lien Maintenance remplacé par une mention conditionnelle des autorisations | `help-catalog.ts`, `access-policy.ts` | Vérifié dans le code |
| `indicators` | Retrait du lien vers les paramètres des indicateurs ; fonction administrative toujours décrite | `help-catalog.ts`, `access-policy.ts` | Vérifié dans le code |

Les deux index `content/help/.index/fr.json` et `en.json` ont été recalculés selon `scripts/build-help-index.mjs`. Les autres articles et leurs IDs canoniques restent inchangés. Le lien FAQ vers le Centre d'aide (`/app/help`) n'est **pas** modifié : sa précision de navigation est suivie distinctement par AU-06.

## Matrice de vérification

- Pour chaque locale **FR/EN** et chaque mode **Scrum/Kanban**, charger le catalogue filtré pour `user`.
- Pour chaque article autorisé, extraire ses liens `/app` et s'assurer que leur destination appartient aux routes de lecture autorisées pour ce rôle et ce mode.
- Tester la présence des liens génériques nécessaires et des prérequis administratifs écrits en clair ; vérifier la persistance des droits d'administration.
- Contrôler la fraîcheur des index et la synchronisation des deux locales.

Test bloquant : `tests/help-au03-role-safe-links.test.ts`, raccordé à `.github/workflows/help-quality.yml`.

## Vérification CI

[GitHub Actions AU-03 — run 43651701273](https://github.com/JeanLamora75/SMN/actions/runs/43651701273) : contrôler le résultat **terminal**. Un résultat intermédiaire ne suffit pas à déclarer la CI réussie.

## Limites et suite

- Les tests documentaires attestent les routes et le filtrage catalogue, pas une navigation authentifiée sur un serveur Next.js/PostgreSQL.
- Les descriptions administratives en texte conservent un intérêt pour les comptes administrateurs ; l'expérience peut être enrichie ultérieurement par des liens dynamiques dépendant du rôle, sous un nouveau cadrage Winston/Amelia.
- La recette réelle sur deux rôles et deux modes demeure à réaliser.
- Aucune modification Jira ni base PostgreSQL, aucun script `uv` exécuté.
