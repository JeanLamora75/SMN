# Epic SMN-2 — Étape 2 : protection des données historiques et des archives

**Date :** 9 novembre 2026. **Responsable :** Amelia / BMAD Dev.  
**Référence initiale :** `8f580063` (I0 et suite v33 spécialisées vertes).  
**Périmètre :** SMN-38, SMN-39, SMN-40. **Environnement :** corrections GitHub et tests jetables exclusivement ; aucune donnée privée de l'installation de travail n'a été consultée, supprimée ou anonymisée.

## 1. Réalisations techniques

### Inventaire vérifiable des archives (SMN-38)

- `erasure-archive-review.ts` refuse un inventaire modifié, non trié, incomplet, trop ancien (> 24 heures) ou contenant un objet dont l'empreinte SHA-256 ne correspond plus à la taille, au type et au nom de sa version.
- Les décisions de revue restent **des constats**, non des preuves intrinsèques d'anonymat. Même une décision humaine cohérente ne crée aucun droit d'exécution : `/api/admin/erasure/archive-review` renvoie toujours `executionPermitted:false`.
- `erasure-office-fingerprint.ts` prend en compte **les rapports Office et les modèles Office personnalisés** dans la révision de périmètre. Les répertoires absents, vides ou contenant un fichier inconnu sont distingués. Une modification de modèles, un fichier ajouté, un lien symbolique ou une anomalie d'intégrité rend le plan invalide ou indisponible.
- `erasure-fk-discovery.ts` signale dorénavant les **cycles de clés étrangères** comme état inconnu : plus aucun chemin cyclique ignoré n'est assimilable à un comptage nul.
- Dans la prévisualisation Administrateur, une **grille des preuves nécessaires** identifie les historiques métier, références inconnues, textes libres, archives binaires, métriques collectives, copies externes, risques d'anonymisation et anti-réintroduction. Cette grille n'autorise aucune destruction.

### Couverture des chemins de suppression (SMN-39 et SMN-40)

- `tests/epic2-step2-deletion-coverage.test.ts` recense, dans `src/server/` et `src/app/`, les appels SQL explicites de DELETE, TRUNCATE et DROP de `smn_member`. Il échoue lorsqu'un nouveau chemin non déclaré apparaît. Les deux exécutants bornés sont explicitement reconnus ; l'ancien chemin de cycle de vie reste défensivement interdit via `audit-not-ready`.
- Le garde PostgreSQL `smn40_member_delete_guard` reste le contrôle d'exécution de référence : l'inventaire statique n'identifie pas du SQL construit dynamiquement, du SQL externe ou les accès directs privilégiés.
- Les effacements actuellement admissibles restent strictement limités aux fiches **provisoires isolées** ou à leurs **seules affectations et révisions**, sans cycle, contenu métier ou archive à examiner. Le reçu transactionnel SQL et l'intention HMAC externe restent obligatoires.
- Les membres historiques, anciennes identités, absences, cycles, indicateurs figés, rapports et documents Office/PDF ne sont **pas** automatiquement effaçables ni anonymisables.

### Politique conservatoire de non-réintroduction (SMN-40)

- La comparaison des reçus SQL, marqueurs HMAC, point d'ancrage indépendant, intention d'opération et identifiants pseudonymisés demeure appliquée dans `verifyErasureIntegrity`.
- `completeHistory` doit rester **faux** tant que les autres formes de suppressions personnelles, archives et historiques antérieurs à l'enrôlement ne sont pas couvertes. Les sauvegardes antérieures à la couverture ne peuvent être validées.
- Les contrôles REST de restauration active ne doivent pas être déverrouillés sur une simple preuve cryptographique ciblée ou une liste d'archives révisées.

## 2. Critères d'acceptation : matrice de sortie

| Story | Preuves programmatiques | Réserve de qualification |
|---|---|---|
| SMN-38 AC1 | FK directes/indirectes composites et cycles, scans TXT/PDF/OOXML, alias identitaires, revue de versions SHA | Revue **humaine** des documents, images, objets intégrés et sémantique |
| SMN-38 AC2 | Grille des métriques et historiques v33, refus de conclure sur un zéro heuristique | Décision **métier** de conservation sans réidentification et base justificative |
| SMN-38 AC3–5 | Archive intacte, inventaire horodaté, prévisualisation lecture seule et copies externes signalées | Vérifier la révocation de tous les lecteurs avant usage réel |
| SMN-39 AC1–2 | Moteur transactionnel borné, reçu SQL immuable, intention externe, confirmation indépendante | Traitement des historiques et anonymisation non autorisés |
| SMN-39 AC3–5 | Refus d'archive inconnue et maintien de l'intention après interruption | Version expurgée indépendante et révocation de l'original à développer puis qualifier |
| SMN-40 AC1–2 | Journal HMAC, contrôles temporels, SQL et garde restaurations fail-closed | Preuve d'exhaustivité de **tous** les effacements personnels |
| SMN-40 AC3–5 | Paquet v4 vérifié séparément, copie PostgreSQL antérieure interdite, rétention séparée des PDF | Reconstruction d'un paquet v4 **post-effacement** avec inspection de toutes les archives sur Windows |

## 3. Recette, preuve et limites

Suite automatisée : `tests/epic2-lot4-archive-review.test.ts`, `tests/epic2-lot4-fk-coverage.test.ts`, `tests/epic2-step2-office-fingerprint.test.ts`, `tests/epic2-step2-historical-qualification.test.ts` et `tests/epic2-step2-deletion-coverage.test.ts`.  
Workflows : [Lot 4](../../.github/workflows/epic2-lot4-erasure.yml) et [Epic 2 transversal](../../.github/workflows/epic2-lot8-transversal.yml), plus I0. Une CI verte concerne son SHA exact, pas les commits suivants.

### Vérifications indispensables hors GitHub

1. Sur l'installation Windows ou sa copie isolée, inventorier réellement les archives par SHA-256, y compris modèles Office et fichiers binaires non indexables. Conserver le registre d'inspection dans un répertoire **privé**, sans noms personnels dans Jira/GitHub.
2. Faire arbitrer la conservation des agrégats et snapshots (vélocité, capacités, SP/JH, rapports historiques), en distinguant une valeur d'équipe non réidentifiante d'une valeur construite sur un effectif trop réduit.
3. Préparer les versions expurgées sous de **nouveaux identifiants** ; vérifier que tous les points d'accès SMN refusent les originaux, les copies externes restant sous la responsabilité de leur détenteur.
4. Prouver la couverture globale des suppressions et restaurer **un paquet v4 chiffré post-effacement** sur PostgreSQL 18 isolé, comparer les données et documents, puis seulement proposer une activation fonctionnelle.

**Décision de sécurité :** SMN-38, 39, 40 restent **en cours**. Aucune suppression personnelle historique ni restauration active déverrouillée. L'absence d'archives réelles ou de justification de conservation ne peut pas être simulée par des tests de contrat.

## 4. Cohérence PostgreSQL et archives — complément

Le contrôle `managedBinaryScopeEmpty(db)` ne se contente plus de vérifier des dossiers vides. Il exige désormais que l'inventaire PDF référencé en PostgreSQL et les fichiers des répertoires gérés concordent via `inspectExtraArchives(db)`. Un PDF attendu en base mais absent du disque, un fichier non géré ou une erreur d'inventaire bloquent la suppression même d'un membre provisoire. Le précontrôle de l'interface et l'exécution effective réutilisent ce garde-fou. Régression `tests/epic2-step2-archive-db-integrity.test.ts` exécutée dans les jobs Windows/Linux des workflows de confidentialité et transversal.

Cette qualification des chemins gérés ne démontre pas que les copies externes et les archives non inspectables sont exemptes de données personnelles. Aucune autorisation générale d'effacement historique n'est introduite.
