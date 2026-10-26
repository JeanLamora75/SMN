---
name: "SMN — Extension Équipes dans Paramètres (SMN-282)"
status: "user-requested-specification; architecture-arbitration-required"
updated: 2026-10-26
jira: https://lmn24.atlassian.net/browse/SMN-282
epic: https://lmn24.atlassian.net/browse/SMN-3
---

# Avenant de conception et contrat de préparation — Gestion des équipes

**Commande fonctionnelle du 26 octobre 2026 :** créer la Story 3.26 / [SMN-282](https://lmn24.atlassian.net/browse/SMN-282) et en documenter le besoin. **Cette demande n'autorise pas implicitement de renverser D-PRD-137**, d'effectuer une migration, de publier du code applicatif ou de déclarer une recette.

## 1. Objectif métier

Permettre à un administrateur Scrum Master de créer une nouvelle équipe et de modifier une équipe existante depuis **Paramètres > Équipes**, sans repasser par l'assistant d'installation.

La nouvelle destination proposée est `/app/admin/settings/teams`, sous la famille « Organisation Agile » du **portail Paramètres** (Cartes/Liste). Il s'agit d'une **route cible non implémentée** : la rubrique ne devient cliquable qu'une fois l'écran sécurisé et fonctionnel.

## 2. Formulaire minimum demandé

| Champ | Obligatoire ? | Validation de conception |
| --- | --- | --- |
| Nom de l'équipe | **Oui** | 1–120 caractères après trim/normalisation ; refus du blanc |
| Nom du produit | **Non** | 0–120 caractères ; absence non remplacée par un faux nom |
| Vision du produit | **Non** | 0–5 000 caractères ; texte libre conservé |
| But du produit (Product Goal) | **Non** | 0–5 000 caractères ; texte libre conservé |

Le mode **Créer** part de valeurs vides et le mode **Modifier** préremplit les valeurs réellement persistées pour une équipe identifiée, avec un mécanisme de sauvegarde contrôlée. Aucun champ supplémentaire n'est rendu obligatoire sans validation métier explicite. Annuler ne sauvegarde rien ; erreurs et brouillons préservés ; confirmation après transaction et audit réels.

## 3. Parcours UX visé

1. Depuis le menu principal « Paramètres », ouvrir le portail et sélectionner l'entrée « Équipes », dans « Organisation Agile ».
2. Une page dédiée propose la création et la sélection d'une équipe autorisée à modifier. Pas de route de création fictive, pas de suppression/archivage induits.
3. L'Administrateur renseigne le formulaire, seul nom d'équipe obligatoire. Boutons « Enregistrer » / « Annuler », erreurs sous les champs et message après succès confirmé.
4. Une équipe créée reste indépendante des membres et cycles existants ; la sélection de l'équipe active n'est pas changée silencieusement.
5. Utilisateur `user` : aucune commande ou API d'écriture. Vérifier les protections serveur sans inférer une autorisation à partir d'un bouton visible.

Responsive et accessibilité : Bootstrap, thèmes actuels, FR/EN dans `src/i18n/fr.json` et `en.json`, clavier, focus, erreurs accessibles, 320/375/768/1440px et zoom 200 %. Suivre [DESIGN](DESIGN.md), [EXPERIENCE](EXPERIENCE.md) et le [centre Paramètres](../ux-parametres-2026-10-23/DESIGN.md).

## 4. ⚠ Contradictions documentées et arbitrages bloquants

**Règle existante D-PRD-137 :** une seule équipe et un seul produit par installation Scrum/Kanban (MVP), seconde équipe refusée même par API ; multiéquipes réservé à SAFe v1.0. Voir [clarification D-PRD-137](../../prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md) et [Epic 3](https://lmn24.atlassian.net/browse/SMN-3).

**Modèle réel `prisma/schema.prisma` :** `SmnTeam.installationId @unique`, `SmnProduct.installationId @unique`, `SmnTeam.productId` obligatoire, `SmnProduct.name` non nullable. Il ne permet pas de créer honnêtement une équipe supplémentaire avec un nom produit laissé vide sans décision et migration appropriées.

**Autre conflit :** [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) et `src/server/members/team-context.ts` rendent aujourd'hui `productName` obligatoire pour une modification. Le nouveau contrat exige que seul le nom de l'équipe soit obligatoire ; harmonisation indispensable.

**Décisions métier à obtenir avant développement mutatif :**
- Étendre ou non le multiéquipe aux installations Scrum/Kanban dès maintenant ; si oui, acter un nouvel amendement explicite à D-PRD-137, préciser migration et compatibilité existante.
- Définir produit partagé entre équipes ou produit propre à chaque équipe, politique de nom produit absent, règles de renommage.
- Définir la sélection d'équipe active, l'isolation des permissions/données, membres/affectations, sprints/périodes, capacités, rapports et journaux ; ne pas réutiliser le premier `teamId` par défaut.
- Choisir gestion des équipes homonymes, création d'une équipe vide, états et accès après enregistrement ; ne pas inventer d'archivage/suppression.

**En attendant, D-PRD-137 demeure la règle normative.** Cet avenant et la Story décrivent un besoin **à arbitrer**, pas une fonctionnalité « Ready for Development » ni une permission de contournement du serveur.

## 5. Impacts techniques préparatoires

- Portail : `src/lib/settings-catalog.ts`, `src/app/app/admin/settings/page.tsx`, `src/app/app/admin/settings/settings-catalog-view.tsx`.
- Création et édition : nouveau route/page à concevoir ; réutiliser la logique `src/app/app/admin/members/team-context-editor.tsx` et `src/server/members/team-context.ts` **sans détourner l'API PATCH existante en créateur**.
- Sécurité et persistance : `src/app/api/admin/team-context/route.ts`, `src/server/access-policy.ts`, `prisma/schema.prisma`, migrations transactionnelles, mécanisme de version et audit.
- Contexte collectif : `src/app/app/private-shell.tsx`, recherche des requêtes à hypothèse monoéquipe, tous producteurs métiers liés à `teamId` ; garder les historiques immuables.
- Tests : refus rôle user, création avec seul nom, sauvegarde des textes optionnels, édition préremplie, absence de produit, rollback, conflit 409, double soumission, isolation interéquipes, non-régression des anciennes données, i18n, a11y, responsive. Commandes `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` **à exécuter réellement**.

## 6. Suivi

- [Jira SMN-282](https://lmn24.atlassian.net/browse/SMN-282) : story unique de cette évolution, AC1–AC8 et dépendances.
- [Jira SMN-221](https://lmn24.atlassian.net/browse/SMN-221) : éditeur du contexte de l'équipe actuelle et audit à réutiliser.
- [Jira SMN-223](https://lmn24.atlassian.net/browse/SMN-223) : centre Paramètres déjà existant.
- **Statut** : spécification publiée, développement et recette non engagés. Rouvrir la phase BMAD de cadrage avant de lever les arbitrages ci-dessus.


## 7. Arbitrage validé — Plusieurs équipes Scrum/Kanban au MVP (26/10/2026)

**Règle prioritaire et nouvelle :** le Product Owner a explicitement validé **la création de plusieurs équipes dans une installation SMN Scrum/Kanban dès le MVP**. Cela remplace la contrainte monoéquipe inscrite dans la version initiale de D-PRD-137, mais uniquement sur le nombre d'équipes. Les paragraphes historiques « multiéquipes réservé à SAFe » et « en attendant D-PRD-137 demeure la règle normative » rédigés avant cette validation ne doivent plus être appliqués comme cible produit sur ce point.

**En attente d'arbitrage, donc développement toujours bloqué :** politique de rattachement produit et de champ produit vide ; sélection et persistance de l'équipe active ; isolation de toutes les lectures/mutations et historiques ; gestion d'homonymies. Les éléments hors monoéquipe de D-PRD-137 restent applicables jusqu'à décision contraire. Aucun code ou test produit par cet amendement.
