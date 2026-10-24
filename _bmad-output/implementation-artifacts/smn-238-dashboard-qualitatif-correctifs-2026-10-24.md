# SMN-238 — Raccordement qualitatif du tableau de bord (24/10/2026)

## Diagnostic initial vérifié dans main
- `src/server/dashboard/cycle-reader.ts` renvoyait systématiquement `collectionUnavailable("producer-not-ready")` pour les 3 collections Obstacles / Risques / Notes-Alertes ; les créations dans `smn_registry_item` ne pouvaient donc pas apparaître.
- `RegistryCreate` persistait les fiches par équipe uniquement, sans lien au Sprint du tableau de bord. Les anciennes créations peuvent être retrouvées par leur `occurred_on` dans la période du Sprint lorsque leur liaison était absente.
- La modale Note lisait le brouillon de rapport par `/api/admin/reports/sprints/[id]/notes` : cette API ne représente pas des notes autonomes du cockpit et son chargement pouvait échouer.
- Les 3 tâches de configuration étaient lues et rendues séparément, sans projection dans Notes/Alertes.

## Conception / règles mises en œuvre
1. **Obstacles et risques** — Nouvelle lecture `src/server/dashboard/attention-reader.ts` sous la transaction `REPEATABLE READ READ ONLY` commune au dashboard. Filtrage par équipe, Sprint lié (table `smn_registry_cycle_link`) ou date `occurred_on` dans la période (reprise compatible avec les fiches antérieures sans liaison). Statuts `resolved` et `abandoned` exclus selon le type. Compteurs exacts, cinq éléments maximum ; classement obstacles par ancienneté, risques par échéance. La criticité n'est pas inférée : la source centrale ne fournit pas de priorité vérifiée.
2. **Création depuis le cockpit** — `cycleId` facultatif dans l'entrée de création du registre, autorisé seulement pour `risk` ou `obstacle`. Vérification du Sprint dans la même équipe, non supprimé/non clôturé ; insertion de la liaison et de son audit **dans la même transaction** que la création du registre. La création depuis la page registre sans Sprint reste possible.
3. **Notes autonomes** — `smn_dashboard_note` et `smn_dashboard_note_audit` créées uniquement au premier POST autorisé ; `/api/admin/dashboard/notes` exige `sprintId`, `teamId`, texte non vide de 2 000 caractères maximum. Écriture transactionnelle et audit. La modale n'est plus dépendante du rapport de Sprint. Le dashboard lit ces notes dans le contexte de son Sprint, sans création de table en GET.
4. **Tâches de configuration** — les tâches `todo` restent des alertes globales à traiter, les tâches `done` deviennent des notes **informatives** (pas des alertes actives), `ignored` n'est pas affichée. Les libellés sont traduits FR/EN, la provenance globale est conservée via `configurationKey`, sans rattacher de manière mensongère un réglage au Sprint. Le bloc historique de configuration reste présent pour permettre le changement de statut ; duplication visuelle à réévaluer dans une refonte dédiée.
5. **Indisponibilité / historique** — lectures par source isolées avec SAVEPOINT. Une table manquante reste `schema-missing`, jamais un faux zéro. Le dashboard d'un Sprint clôturé ne projette **pas** les registres actuels : la reconstruction depuis les snapshots qualitatifs reste un incrément à venir de SMN-238.
6. **Diagnostic d'installation** — ajout explicite des quatre relations SMN `smn_dashboard_note` / audit et `smn_registry_cycle_link` / audit à `INSTALLATION_RELATIONS`. Les tables tierces restent interdites.

## Recette attendue
- Créer obstacle/risque dans la modale du Sprint courant ; retrouver la fiche dans la colonne correspondante après `router.refresh()`, et dans la fiche registre avec la même identité.
- Créer une note dans la modale ; la retrouver dans Notes/Alertes du Sprint sélectionné, sans création de brouillon de rapport.
- Tâches de configuration : les trois `done` de la capture s'affichent comme trois informations terminées ; si l'une devient `todo`, elle remonte comme alerte, si `ignored`, elle disparaît.
- Tester 0 / 1 / >5 fiches ; changements de Sprint ; clôture ; affichage FR/EN ; rôle user en lecture seule ; source absente ; absence de SQL de création pendant les lectures ; `pnpm db:diagnose`.
- Commandes locales : `pnpm typecheck`, `pnpm exec tsx --test tests/smn-238-dashboard-attention-recovery.test.ts tests/dashboard-transversal-step5.test.ts tests/installation-diagnostic.test.ts`, `pnpm build`.

## Limites / vérifications
- Aucune exécution locale complète Node/pnpm/PostgreSQL par Amelia via les connecteurs GitHub : **ne pas déclarer la recette terminée**.
- La fiabilité historique qualitative des Sprints clôturés, le statut ROAM résolu, la criticité et la navigation paginée `Voir tout` restent dans le périmètre non clôturé de SMN-238.
- Workflow BMAD : le skill `bmad-build` demande `uv run .../render_skill.py` ; sans checkout local du dépôt Windows ni `uv` disponible dans l'environnement connecteur, la commande officielle n'a pas été exécutée. Travail réalisé directement via GitHub et Jira, sans prétendre à une validation BMAD CLI.
