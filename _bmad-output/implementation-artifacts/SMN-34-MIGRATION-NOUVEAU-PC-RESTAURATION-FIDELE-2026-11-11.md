# SMN-34 — Migration fidèle vers un nouvel ordinateur (contrat et recette)

**Décision fonctionnelle validée le 11 novembre 2026.** Rédaction Winston/Amelia via GitHub, sans exécuter `uv`.

## Objectif utilisateur

Installer SMN sur un autre ordinateur et retrouver **la même équipe, les mêmes personnes nommément identifiées, leurs calendriers, leurs histoires d'affectation et toutes les données métier**, sans réinitialisation ni anonymisation implicite.

## Règle centrale

La sauvegarde est un **instantané fidèle**. Les données personnelles des membres encore légitimement conservés font partie de l'état à migrer ; aucune revue des possibilités de réidentification ne doit déclencher leur retrait par défaut. L'exception est une **suppression définitive attestée** postérieure à l'instantané.

## Scénarios distincts

**A — Récupération de l'installation existante :** source et installation d'origine connues. Vérifier intégrité, version, documents et état de protection externe, reconstruire en sandbox, vérifier équivalence et revenir en arrière en cas d'incident.

**B — Installation sur un PC neuf :** la destination peut être vierge, sans `smn_installation` ni même base SMN. Le contrôle actuel `different-installation` ne peut pas être réutilisé comme une erreur intrinsèque d'un vrai transfert : il faut un **workflow d'import de l'identité d'installation depuis la sauvegarde authentifiée**, sans accepter une simple déclaration du client. Tant que ce workflow n'est pas opérationnel et testé sur un PC neuf, ne pas déclarer la migration supportée par une restauration active.

## Chaîne de confiance (exigences bloquantes)

1. Sauvegarde chiffrée, manifeste authentifié, inventaire complet de la base et des fichiers (y compris Office/PDF lorsqu'ils existent).
2. Chaîne de récupération de la clé ou phrase de secours ; ne pas écrire le secret dans les rapports ni GitHub.
3. Transfert sécurisé du **registre externe des effacements**, de son ancre d'intégrité et des justificatifs de couverture avec vérification indépendante. Ne **jamais** reconstituer artificiellement le registre à zéro sur le nouveau PC ; toute preuve manquante déclenche un blocage explicite ou un plan de réconciliation vérifiable.
4. Reconstruction dans une base vierge et isolée ; validation schéma, intégrité des relations, dossiers privés et ressources Office.
5. Contrôle de fidélité des personnes : `smn_member`, historiques d'identité, affectations et leurs révisions, absences, calendriers, sprints, définitions/valeurs d'indicateurs, autres tables pertinentes et pièces jointes. **L'absence de noms dans les journaux est une mesure de sécurité, pas une anonymisation de la sauvegarde.**
6. Contrôle des opérations d'effacement ayant eu lieu après l'instantané ; si de telles opérations sont attestées, produire un état reconstruit **conforme** et prouver sa non-réintroduction, ou interrompre sans modifier la cible.
7. Cutover sûr, retour arrière testé sur le nouvel hôte, réinitialisation des sessions sensibles et vérification par l'utilisateur des équipes et membres.

## Tests d'acceptation

- Migrer une équipe avec plusieurs membres nommés : les noms, fonctions, calendriers et anciennes affectations sont conservés à l'identique.
- Migrer une seconde équipe sans membre : elle reste présente et vide.
- Indicateurs v33, tableaux de bord, rapports et fichiers Office : aucune disparition silencieuse.
- Archivage simple d'un membre : l'identité et les historiques sont conservés conformément au statut métier.
- Effacement définitif après la sauvegarde : le transfert est bloqué jusqu'à réconciliation opposable ; ne pas réintroduire les données effacées.
- Destination neuve sans installation SMN : import sécurisé de l'identité de la sauvegarde, **pas** remplacement arbitraire d'une installation inconnue.
- Simulation d'incident : préservation du point de rollback et de la sauvegarde source.
- Les deux bases REC-04 de référence ne sont jamais écrasées par les essais.

## État réel au moment de la rédaction

Les restaurations isolées (195 tables et zéro écart) et trois tests de rollback Windows en environnement jetable ont été rapportés réussis. Le contrat de préservation et la vérification de tables membres ont été ajoutés au code, avec tests automatisés publiés. **Import sur PC neuf, transport du registre externe, cutover réel et reprise de sessions ne sont pas encore qualifiés.** Ne pas activer une fonctionnalité prétendant achever la migration avant ces validations.

Références : `src/server/backup/restoration-fidelity-policy.ts`, `scripts/smn-40-isolated-privacy-audit.ts`, `src/server/backup/restore-readiness.ts`, ADR `ADR-SMN-EPIC2-RESTAURATION-FIDELE-VS-EFFACEMENT-2026-11-11.md`.


## Lot complémentaire — politique de destination neuve (11/11)

Le contrat pur `src/server/backup/new-computer-migration-policy.ts` distingue :
- destination SMN initialement vierge et vérifiable ;
- destination déjà peuplée ou porteuse d'un registre ;
- destination impossible à vérifier.

La comparaison d'identité entre deux installations ne doit pas à elle seule rendre la migration impossible, mais **aucun écrasement d'une installation existante n'est permis via ce mode**. Le paquet doit être vérifié, son inventaire complet, PostgreSQL compatible et la preuve externe d'effacement **indépendamment réconciliée**. La politique autorise au maximum une **reconstruction isolée**, jamais un cutover de production.

Les booléens de preuve utilisés par la fonction pure sont des **résultats attendus de validations serveur**, jamais des champs acceptables d'un utilisateur ou d'une API. Aucun endpoint d'exécution n'est exposé à ce stade. La préparation du transfert chiffré du registre externe et sa vérification sur le nouveau PC restent à implémenter. Le script de sauvegarde ordinaire ne doit pas embarquer le secret HMAC du registre dans l'archive.

Tests : `tests/new-computer-migration-policy.test.ts`. Contrôles : refuse destination existante, fichiers ou tables déjà présents, registre existant, version PG incompatible, paquet incomplet, preuve de registre absente. Aucun effet sur les bases REC-04.
