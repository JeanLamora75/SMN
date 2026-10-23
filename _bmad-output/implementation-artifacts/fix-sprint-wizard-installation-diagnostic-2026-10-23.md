# SMN — Correctif diagnostic « schéma de la base non reconnu » après génération de Sprint

**23 octobre 2026 — Analyse de Winston/Amelia ; correctif sans migration de données.**

## Anomalie et chaîne causale

Le diagnostic d'installation, exécuté avant l'accès à la page de connexion, vérifie que tous les objets utilisateur de PostgreSQL appartiennent à `INSTALLATION_RELATIONS` dans `src/server/installation/contract.ts`. La présence d'un objet non répertorié renvoie `schema-incompatible`, et le routeur empêche l'accès à SMN.

Or les fonctionnalités de Sprints validées récemment créent à la demande :
- `public.smn_sprint_wizard_preview:r` via `src/server/sprints/wizard.ts` lors de la prévisualisation de l'assistant ;
- `public.smn_sprint_reschedule_audit:r` via `src/server/sprints/reschedule.ts` lors d'une replanification.

Ces deux tables applicatives sont légitimes mais absentes de la liste de référence précédente. Après leur création, le contrôle peut donc rejeter une base parfaitement exploitable. Le **diagnostic exact de la base du poste doit être confirmé par la commande en lecture seule** ; l'analyse du code établit le défaut de liste, pas l'absence de toute autre erreur sur le PC.

## Correctif

1. Répertorier explicitement les deux tables connues dans le contrat d'installation ; **ne pas désactiver le refus d'objets PostgreSQL véritablement inconnus**.
2. Étendre les tests du diagnostic pour couvrir les deux objets applicatifs et le rejet d'une table étrangère.
3. Ajouter `pnpm db:diagnose` : lecture seule, affichage de la catégorie d'erreur, des objets non répertoriés, du marqueur de version et du compte des migrations, sans afficher le mot de passe de PostgreSQL.
4. **Aucune commande SQL de création/migration/suppression**, aucune modification des données existantes et aucune réinstallation.
5. Les Sprints, historiques, modèles et cérémonies déjà créés restent inchangés.

## Vérification utilisateur (Windows)

Dans le dépôt SMN après synchronisation de `main` contenant le correctif :

```powershell
pnpm db:diagnose
pnpm typecheck
pnpm exec tsx --test tests/installation-diagnostic.test.ts
pnpm dev
```

Le résultat attendu du diagnostic est `initialized`. Si le statut reste `schema-incompatible`, relever uniquement les noms d'objets inattendus et les nombres de migrations (jamais les identifiants de connexion) pour déterminer la vraie cause ; **ne pas modifier manuellement `schema_version` ni `_prisma_migrations`**.

## État des preuves

- Cause structurelle vérifiée par lecture du code `main`.
- Vérifications statiques possibles depuis GitHub.
- Tests Node/Windows/PostgreSQL du poste utilisateur **non exécutés à distance**.
- La compatibilité de base n'est pas déclarée rétablie tant que le diagnostic local n'annonce pas `initialized`.
