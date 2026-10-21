# SMN-57 — Story 3.16 : capacité de développement fiable en JH

**Jira** : https://lmn24.atlassian.net/browse/SMN-57
**Dépendances** : SMN-44, SMN-46, SMN-48, SMN-49 à 51, SMN-53 à 56. MVP : équipe unique Scrum/Kanban.

## Contrat de calcul

Par date et membre affecté à l'équipe :

- Heures disponibles = nombre de demi-journées disponibles × heures/JH ÷ 2.
- Heures développement = heures disponibles × allocation % × part Développeur % × contribution % (chaque taux divisé par 100).
- Capacité JH = heures développement ÷ heures/JH.

Le taux contractuel n'est pas multiplié une seconde fois : il borne déjà le taux d'affectation dans SMN. Les taux applicables sont choisis parmi les versions d'affectation par date `effective_from` et révision. Aucun Story Point n'est converti en JH.

## Critères d'acceptation

**AC1.** Le moteur `src/server/capacity/engine.ts` calcule une référence indépendante des Sprints sur une fenêtre de 1 à 93 jours. Le paramètre `hours_per_jh` est réglable (8 par défaut, entre 1 et 24, deux décimales), avec historique des corrections. L'Administrateur obtient détail par membre/date et total d'équipe.

**AC2.** Une part Développeur 0 % (même avec 100 % Product Owner) produit **0 JH**, lorsque les données de disponibilité sont connues.

**AC3.** Le résolveur SMN-54/56 forme l'union des indisponibilités : national OU fermeture OU absence. Une demi-journée n'est jamais déduite plusieurs fois.

**AC4.** Sans trame de travail, pays applicable, couverture nationale, version d'affectation ou si des affectations sont ambiguës : `status="not-calculable"`, `totalJh=null` avec provenance datée. Aucune affectation ⇒ origine `no-assignments`, et non 0 fictif. Une fermeture explicite couvre le jour même si la couverture nationale est incomplète, si la trame est connue.

**AC5.** Demi-journées, exceptions individuelles, bornes d'affectation et versions datées sont respectées à la journée. Aucun calcul automatique d'indicateur de Sprint/Kanban.

## Réalisation

- Migration additive **v20 → v21** : `smn_capacity_settings` et `smn_capacity_settings_audit` ; intégration à l'installation, sonde, diagnostic et modèles Prisma. Les capacités figées et PDF anciens ne sont pas modifiés.
- `src/server/capacity/engine.ts` : calcul pur et lecture sur instantané PostgreSQL `REPEATABLE READ READ ONLY`.
- `src/server/capacity/settings.ts` : lecture/écriture auditée du paramètre heures/JH avec contrôle optimiste de version.
- `GET /api/admin/development-capacity` : résultats nominatifs réservés à l'Administrateur ; période obligatoire `start` / `end`.
- `GET/POST /api/admin/capacity-settings` : configuration Administrateur, contrôles d'authentification et d'origine des mutations.
- `/app/admin/development-capacity` : période, calcul, diagnostic des lacunes, ventilation journalière et réglage des heures/JH.
- `src/i18n/fr.json` et `en.json` ; tests `tests/development-capacity.test.ts`.

## Limites et validation

Le paramètre heures/JH transforme la durée des demi-journées en heures, puis en JH. Avec une trame exprimée uniquement en demi-journées, la valeur JH demeure mathématiquement indépendante de ce paramètre ; elle changerait si des heures de travail effectives étaient saisies ultérieurement.

L'arbitrage d'une capacité manuelle prioritaire est prévu dans SMN-58, pas ici.

Tests de contrat rédigés mais **non exécutés** dans cette session. Aucune compilation, exécution PostgreSQL ou recette navigateur attestée. GitHub Actions hors circuit selon la décision SMN. Statuts attendus après publication : Jira **En cours**, BMAD `review`. Le workflow natif BMAD `uv` n'a pas été exécuté : travail adapté aux connecteurs.
