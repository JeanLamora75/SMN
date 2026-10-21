# SMN-58 — Story 3.17 — Capacité manuelle prioritaire

**Jira :** https://lmn24.atlassian.net/browse/SMN-58 · **Dépendances :** SMN-57 (référence en JH), Epic 1 (droits d'écriture), Story 3.18 / SMN-59 (figement initial), futurs workflows de clôture et réouverture.

## Contrat d'acceptation

| Critère | Comportement |
| --- | --- |
| **AC1** | Pour un intervalle inclusif `start/end` (1–93 jours), l'Administrateur enregistre `manualJh=32` lorsque la référence calculée vaut 30. Lecture : `retainedJh=32`, `referenceJh=30`, `source="Saisie"`, révision incrémentée. La référence est **recalculée à chaque GET** et n'est jamais écrite dans la surcharge. |
| **AC2** | Si une absence tardive abaisse la référence de 30 à 28, la même ligne de surcharge conserve la valeur manuelle 32 tant qu'elle n'est pas effacée. L'affichage distingue toujours les trois valeurs : retenue, saisie et référence. |
| **AC3** | `manual_jh` nullable en PostgreSQL : `0` est un nombre valide et reste prioritaire ; `NULL` signifie **aucune saisie**. Le parseur exige `manualJh` numérique pour `set`, accepte 0, interdit chaîne vide, null, négatif, NaN, trop de décimales et dates invalides. |
| **AC4** | L'action explicite `clear` passe `manual_jh` à NULL sans détruire la ligne ; en lecture la provenance redevient `Calcul` et `retainedJh=referenceJh` si la référence est fiable, sinon `Non calculable` avec `retainedJh=null`. Chaque mise à jour conserve `before_jh`, `after_jh`, `operation`, date, acteur et révision dans l'audit. |
| **AC5** | Les colonnes `frozen_at` et `closed_at` sur la **même période de référence** protègent contre la mise à jour directe : le service rejette un `set` ou `clear` (erreur `protected`, HTTP 423) avant les changements, et le `UPDATE` exige ces colonnes NULL. Le workflow de réouverture/ajustement historique n'est **pas** inventé ici et aucune action UI n'y donne accès. **Important :** le projet ne dispose pas encore du workflow de création/clôture/figement des périodes ; [SMN-59](spec-smn-59-capacite-initiale.md) renseigne désormais **`frozen_at` sur cette même ligne à l'ouverture effective, y compris en l'absence de saisie manuelle** ; le workflow de clôture devra encore renseigner `closed_at`. L'AC5 est préparé et testé au niveau service, mais son intégration de bout en bout reste dépendante des workflows futurs. |

## Architecture

- Migration additive PostgreSQL **v21 → v22**, tables `smn_capacity_period_override` avec `UNIQUE(team_id,start_on,end_on)`, `manual_jh NUMERIC(12,4) NULL`, révision, verrou de figement et clôture ; `smn_capacity_period_override_history` historise tous les changements. Contraintes `ON DELETE RESTRICT`, pas de suppression.
- Intégration Prisma, moteur de migration manuelle, sonde et diagnostic d'installation.
- `src/server/capacity/override.ts` : `parseCapacityOverride`, `chooseCapacity`, `readCapacityOverride` et `saveCapacityOverride`. Écriture transactionnelle verrouillant l'équipe `FOR UPDATE OF t` pour sérialiser la création d'une ligne de période, puis la ligne existante `FOR UPDATE` ; contrôle optimiste de révision. Les données de capacité de référence ne sont jamais réécrites.
- `GET /api/admin/development-capacity?start=...&end=...` : conserve les résultats SMN-57 et ajoute `selection` (valeur retenue, provenance, référence, état verrouillé et révision). Calcul de référence en lecture seule, puis lecture de la surcharge.
- `POST /api/admin/development-capacity` : actions strictes `set` (nombre obligatoire) ou `clear` (aucun nombre), rôle Administrateur seulement via `authorizeApi`, CSRF/origine préexistants. Erreurs 400 (validation), 409 (concurrence/effacement déjà absent), 423 (protection), 503 (incident).
- `src/app/app/admin/development-capacity/development-capacity-view.tsx` : distinction valeur retenue / référence / provenance ; champ `0` valide ; bouton **Effacer la saisie** ; blocage explicite pour période protégée ; relecture du calcul après toute modification. Textes centralisés FR/EN.
- `tests/capacity-override.test.ts` : scénarios AC1–5, identité de période, valeurs limites, protection, concurrence, audit et absence d'effet sur les Sprints ou PDF.

## Décisions de frontière

La surcharge est liée **exactement** à l'équipe et au couple de dates inclusives, pas à un Sprint. Une modification des dates dans l'UI ouvre une autre référence de période ; les écritures antérieures demeurent disponibles sur l'ancienne fenêtre. Aucun rapprochement approximatif de plages et aucune copie de surcharge n'est fait. Une future capacité initiale figée ne sera pas recalculée ni réécrite par cette API.

Le code ne modifie pas le moteur de disponibilité SMN-57 : la référence peut changer suite à l'arrivée d'une absence, mais une saisie conserve sa priorité. Les erreurs AC4 de données manquantes restent visibles dans le rapport de référence et ne sont pas remplacées par zéro.

## Qualification

Contrôles statiques GitHub et tests de contrat rédigés ; **pas de test pnpm exécuté, pas de PostgreSQL réel, ni de test HTTP/navigateur Windows** dans cette session. GitHub Actions indisponible. Jira **En cours** / BMAD `review` jusqu'à recette locale ; l'AC5 devra être complété lors du figement/clôture des périodes. Workflow BMAD natif `uv` non lancé faute d'environnement projet local ; adaptation aux outils connectés.
