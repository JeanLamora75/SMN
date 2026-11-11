# ADR — SMN Epic 2 — Restauration fidèle et effacement exceptionnel

Date : 11 novembre 2026. Décision **validée fonctionnellement par l'utilisateur**. Architecture : Winston (adaptation ChatGPT du skill BMAD, scripts `uv` non exécutés).

## Contexte et erreur de cadrage corrigée

Le scénario principal est la **continuité sur un autre ordinateur** ou après incident. Les noms des membres, leurs coordonnées autorisées, affectations, absences, calendriers, fonctions, rôles, historiques, cycles, indicateurs, registres, paramètres et documents doivent être retrouvés **à l'identique**. Le contrôle de risque de réidentification des agrégats ne constitue **pas** un motif général d'anonymisation des sauvegardes.

Un scénario différent, **une demande explicite et définitive d'effacement personnel**, conserve ses protections afin qu'une ancienne sauvegarde ne réintroduise pas les données supprimées.

## Invariants d'architecture

- **AD-1 [ADOPTÉ] — Fidélité par défaut.** Le mode `full-environment-recovery` reproduit l'environnement complet autorisé de l'archive ; aucun nom, membre, historique, lien ni agrégat n'est anonymisé automatiquement au seul motif qu'il est identifiable. Les identités d'utilisateur, comptes et secrets conservent les règles de protection/rotation de sécurité existantes.
- **AD-2 [ADOPTÉ] — Intentions séparées.** `full-environment-recovery` et `exceptional-personal-erasure` sont des opérations distinctes, avec leurs diagnostics et validations. Un audit de réidentification est pertinent pour une demande d'anonymisation/effacement, **pas** comme preuve préalable que des membres encore légitimes doivent être masqués.
- **AD-3 [ADOPTÉ] — Non-réintroduction.** Une suppression définitive reconnue **après la date de l'archive** demeure opposable. Si la preuve temporelle externe est absente, incohérente ou s'il existe des effacements non réconciliés, le système bloque l'activation et ne prétend pas avoir traité les effacements. L'absence de marqueur n'est jamais une preuve magique d'absence d'effacement.
- **AD-4 [ADOPTÉ] — Archive fidèle, usage sûr.** Sauvegardes chiffrées/authentifiées ; empreintes et contrôle d'intégrité des fichiers ; reconstruction isolée et comparaison ; bascule atomique avec point de retour arrière ; séparation entre contenu métier et secrets/identifiants sensibles des sessions. Aucun nettoyage silencieux de personnes.
- **AD-5 [ADOPTÉ] — Audit non destructif.** Les deux bases REC-04 (noms `smn_restore_test_latest_backup_20261111` et `smn_restore_test_latest_compare_20261111`) sont des preuves immuables de recette. Ne pas les effacer, écraser ni promouvoir vers la base active par un contrôle d'audit.
- **AD-6 [ADOPTÉ] — Pas de raccourci production.** La validation de l'intégrité et les tests de bascule sur bases jetables ne qualifient pas automatiquement la bascule Windows sur installation active. La restauration active reste désactivée jusqu'à la qualification opérationnelle complète.

## Matrice de décision

| Scénario | Identité d'un membre encore légitimement présent | Données précédemment effacées | Contrôles |
| --- | --- | --- | --- |
| Migration vers nouveau PC | **Restaurée intégralement** | Ne doivent pas être réintroduites si une preuve externe opposable s'applique | Déchiffrement, intégrité, compatibilité, restauration fidèle, réconciliation des effacements, bascule/rollback |
| Récupération après panne | **Restaurée intégralement** | Même règle | Idem |
| Archivage métier d'un membre | **Conservée** selon règles d'archivage | Aucun nouvel effacement implicite | Cohérence et audit |
| Suppression définitive / anonymisation exceptionnelle | **Effacée ou expurgée uniquement sur ordre explicite** | Non réintroduites | Analyse d'impact, décision, preuves de traitement et conservation sélective des agrégats non réidentifiants |

## Exigences techniques pour la suite

1. Un **contrat de politique pure** classe les opérations et refuse toute transformation d'identité par défaut.
2. Une **preuve de fidélité** contrôle la présence et l'équivalence de la structure/références/membres (données incluses dans la comparaison des empreintes), sans émettre de noms ou d'identifiants dans les journaux.
3. L'évaluation de restauration distingue **risque de réintroduction réellement attesté** et **simple présence légitime de données personnelles**. La première reste bloquante, la seconde ne l'est pas en soi.
4. Qualification de l'enrôlement HMAC, de la fenêtre pré-enrôlement et de la présence éventuelle d'effacements ; aucune confirmation manuelle générique ne contourne les preuves.
5. Les copies externes restent hors contrôle technique ; la documentation de migration explique ce périmètre.
6. Les messages/UI doivent être traduisibles FR/EN, jamais de secret ou de donnée personnelle dans les logs.

## Vérification et dépendances

Jira : SMN-34 (restauration), SMN-38 (analyse d'effacement), SMN-39 (exécution d'effacement), SMN-40 (non-réintroduction), SMN-41 (diagnostics). Référence : code `src/server/backup/restore-sandbox.ts`, `restore-readiness.ts`, `erasure-protection.ts`, `preview-policy.ts`.

**État réel à la rédaction :** double reconstruction isolée de 195 tables et trois tests jetables de rollback Windows rapportés réussis ; opération active et conformité complète des effacements **non qualifiées**. Aucun script `uv` exécuté.

## Notes de décision (mémoire des arbitrages)

- CONTRAINTE : les sauvegardes existent pour permettre la continuité opérationnelle.
- DÉCISION : conserver les identités et historiques en restauration normale.
- DÉCISION : appliquer des règles d'effacement uniquement si une demande explicite et opposable existe.
- REJETÉ : effacer les noms par défaut ; casser la traçabilité des équipes.
- REJETÉ : contourner le registre des suppressions pour accélérer le cutover.
- DIFFÉRÉ : activation du cutover Windows réel, une fois les preuves manquantes acquises.
