# Epic 4 — Correction P0 : état intermédiaire (22 octobre 2026)

Base : `fix/epic4-i18n-crosscutting`. Branche : `fix/epic4-p0-hardening`.

## Corrections appliquées
- **P0-01** : initialisation explicite des colonnes d'occurrences modèles et migration PostgreSQL de mise à niveau. L'ordre global des migrations et leur exécution réelle restent à valider.
- **P0-02** : `editCeremony` verrouille la cérémonie ET le Sprint associé et refuse l'édition si `s.status='closed'`.
- **P0-03** : extraction de dates locales selon le fuseau horaire du Sprint pour l'aperçu de capacité de replanification. Le moteur de déplacement protégé et le recalcul persistant restent absents.
- **P0-04** : initialisation des dépendances de snapshot, lecture des tendances depuis le dernier instantané de clôture ; trigger PostgreSQL interdisant UPDATE et DELETE sur ces snapshots. Couverture complète des associations métier non auditée.
- **P0-05** : **non résolu**. Le toggle `impacts_capacity` n'est toujours pas intégré au moteur de capacité, notamment les quotités, plages de disponibilité, corrections de durée et dédoublonnage.

## Gates
**NO-GO maintenu.** Les P0-03, P0-04 et P0-05 ne sont pas totalement levés.

## Vérifications
- Lectures GitHub et inspection de modifications : effectuées.
- Compilation TypeScript : non exécutée.
- Prisma validate / migrate : non exécutés.
- Recette PostgreSQL 18.6 : non exécutée.
- Tests fonctionnels et de sécurité : non exécutés (GitHub Actions indisponible).

Aucune modification des données utilisateur, Jira ou de la branche main.
