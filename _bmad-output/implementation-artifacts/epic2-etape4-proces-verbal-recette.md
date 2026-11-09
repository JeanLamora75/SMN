---
epic: SMN-2
date: 2026-11-09
sha: aad2d6f6a2b59a6e3d7f5fcb98ee36fb26ec6c0b
technical_recette: passed
functional_recette: partial
epic_acceptance: rejected
active_destructive_operations: blocked
---

# SMN-2 — Étape 4 — Procès-verbal de recette finale et dossier de clôture

**Date :** 9 novembre 2026 · **Agent :** Amelia / BMAD Developer · **Référentiel officiel :** GitHub `main` pour le code et BMAD ; Jira pour l'état des Stories.

## 1. Décision

- **RECETTE TECHNIQUE AUTOMATISÉE : RÉUSSIE**, sur le **même commit** `aad2d6f6a2b59a6e3d7f5fcb98ee36fb26ec6c0b`.
- **RECETTE FONCTIONNELLE DE BOUT EN BOUT : PARTIELLE**, faute de validation sur installation Windows indépendante utilisant un jeu de données représentatif, d'inspection humaine des archives privées et de preuve de restauration active post-effacement.
- **ACCEPTATION / CLÔTURE DE L'EPIC : REFUSÉE à ce stade** (verdict de recette, non décision finale de l'utilisateur) : au moins SMN-34, SMN-37, SMN-38, SMN-39 et SMN-40 n'ont pas démontré leurs critères actifs.
- **SÉCURITÉ : CONFORME AU PRINCIPE DE PRÉCAUTION** pour les chemins examinés ; les opérations destructives restent bloquées, `completeHistory:false`, confirmation de reset insuffisante. Il ne s'agit pas d'une certification générale de sécurité ou RGPD.
- **Aucune donnée de l'installation personnelle n'a été effacée, restaurée ou inspectée.** Aucun outil `uv` ni test sur la machine Windows réelle de l'utilisateur n'a été exécuté.

## 2. Baseline unique et preuves de CI

| Gate | Exécution | Résultat constaté | Couverture / limite |
|---|---|---|---|
| I0 général | [42689715707](https://github.com/JeanLamora75/SMN/actions/runs/42689715707) | **SUCCESS** · 5 jobs | Windows, Linux/PG, smoke HTTP, tests unitaires, types et contrats ; ne simule pas l'exploitation Windows réelle |
| Epic 2 transversal | [42689715790](https://github.com/JeanLamora75/SMN/actions/runs/42689715790) | **SUCCESS** · 3 jobs | Contrats Windows/Linux + reconstruction/confidentialité/rollback PostgreSQL 18 |
| SMN-34 / Lot 5 | [42689715574](https://github.com/JeanLamora75/SMN/actions/runs/42689715574) | **SUCCESS** · 3 jobs | PostgreSQL 18 jetable, fichiers, panne avant/après promotion et rollback |
| SMN-37 / Lot 6 | [42689715479](https://github.com/JeanLamora75/SMN/actions/runs/42689715479) | **SUCCESS** · 3 jobs | Installation native v33 isolée, base source conservée et rollback |
| Référentiel | [Commit aad2d6f6](https://github.com/JeanLamora75/SMN/commit/aad2d6f6a2b59a6e3d7f5fcb98ee36fb26ec6c0b) | Identique aux quatre workflows | Une modification ultérieure exige une nouvelle recette |

Les quatre exécutions portent explicitement `head_sha=aad2d6f6a2b59a6e3d7f5fcb98ee36fb26ec6c0b`. Les résultats sont des **preuves de tests CI effectivement exécutés par GitHub Actions**, et non des tests lancés manuellement par cet agent. La documentation de recette ne compte pas comme preuve d'exécution supplémentaire.

## 3. Matrice de recette des 13 Stories

Légende : **T** = tests/contrats techniques réussis sur GitHub Actions ; **P** = acceptation partielle, vérifications hors CI encore requises ; **B** = critère actif bloqué par une protection volontaire ; **NC** = non qualifié en environnement réel. Aucune Story n'est déclarée « terminée » du seul fait des tests.

| Jira | AC techniques / preuve pertinente | Réserve précise | Avis |
|---|---|---|---|
| [SMN-29](https://lmn24.atlassian.net/browse/SMN-29) | Journal et protection audit, `epic2-lot1-audit-coverage.test.ts`, [I0](https://github.com/JeanLamora75/SMN/actions/runs/42689715707) | Vérification exhaustive des producteurs/mutations actuels v33, multiéquipes, Office et Dashboard Builder sur parcours réels | **T / P** |
| [SMN-30](https://lmn24.atlassian.net/browse/SMN-30) | Paquet v4 chiffré et inventaires de documents, [recette PG18](https://github.com/JeanLamora75/SMN/actions/runs/42689715790) | Vérifier sur Windows les répertoires, secrets de récupération et producteurs concurrents réels | **T / P** |
| [SMN-31](https://lmn24.atlassian.net/browse/SMN-31) | Inventaire/signature SHA et reconstruction testée | Confronter aux archives PDF/Office/TXT réelles et aux objets non indexables | **T / P** |
| [SMN-32](https://lmn24.atlassian.net/browse/SMN-32) | Rétention contrôlée, tombstones et purge interrompue, [transversal](https://github.com/JeanLamora75/SMN/actions/runs/42689715790) | Politique et incidente réelles sur la machine Windows ; copies externes indépendantes | **T / P** |
| [SMN-33](https://lmn24.atlassian.net/browse/SMN-33) | Prévisualisation de sauvegarde/restauration et incompatibilités vérifiées | Revue UX et cas de vieilles archives de l'installation distincte | **T / P** |
| [SMN-34](https://lmn24.atlassian.net/browse/SMN-34) | Reconstruction v4 native v33, bascule/rollback et panne après promotion, [Lot 5](https://github.com/JeanLamora75/SMN/actions/runs/42689715574) | **Absence d'activation réelle**, session store persistante et audit après restauration ; preuve SMN-40 et recette Windows indispensables | **T / B** |
| [SMN-35](https://lmn24.atlassian.net/browse/SMN-35) | Contrats d'atomicité, snapshots, archives et interdiction de mutations non auditées | Audit des mutations récemment introduites et contrôles de concurrence en exploitation | **T / P** |
| [SMN-36](https://lmn24.atlassian.net/browse/SMN-36) | Archivage réversible distinct des chemins de suppression ordinaires | Qualification de tous les parcours métier, historiques et révisions avec données représentatives | **T / P** |
| [SMN-37](https://lmn24.atlassian.net/browse/SMN-37) | Installation native v33 indépendante, rollback fichiers/PG, [Lot 6](https://github.com/JeanLamora75/SMN/actions/runs/42689715479) | **Réinitialisation active volontairement bloquée** ; reprise et sessions Windows réelles non éprouvées | **T / B** |
| [SMN-38](https://lmn24.atlassian.net/browse/SMN-38) | Prévisualisation des dépendances, FK et inventaire d'archives, revue SHA des versions | Examen **humain** des images, textes et objets intégrés ainsi que mentions libres/indirectes | **T / B** |
| [SMN-39](https://lmn24.atlassian.net/browse/SMN-39) | Suppression transactionnelle auditée d'un **sous-ensemble provisoire isolé**, traces SQL/HMAC | Aucun traitement général qualifié des membres historiques ayant participé à des sprints ; expurgations, accès aux originaux et conservation collective à vérifier | **T / B** |
| [SMN-40](https://lmn24.atlassian.net/browse/SMN-40) | Prévention testée de la réintroduction, journal HMAC et copie PostgreSQL post-effacement bornée | **`completeHistory:false`** sur le moteur réel ; absence de preuve exhaustive d'anciens effacements, d'archives et de restauration v4 réellement expurgée | **T / B** |
| [SMN-41](https://lmn24.atlassian.net/browse/SMN-41) | Interruption, nettoyage partiel, diagnostic fail-closed, [I0](https://github.com/JeanLamora75/SMN/actions/runs/42689715707) | RPO de 24 h et RTO de 60 min **indicatifs**, aucune mesure end-to-end de production ; Jira affiche encore « À faire » malgré le code | **T / P** |

## 4. Recette métier réelle à effectuer — protocole sécurisé

**Environnement exclusivement :** installation Windows 11 de validation **isolée**, PostgreSQL 18 jetable, répertoires de données et secrets distincts de l'installation de travail. Ne jamais pointer un script de test ou une commande destructive vers la base personnelle. Aucune donnée identifiante ne doit être copiée dans les logs GitHub/Jira.

| ID | Scénario et observations à consigner | Succès exigé |
|---|---|---|
| REC-01 | Inventaire complet des DB, chemins Office, archives PDF/TXT, modèles et copies | Comptages SQL/fichiers cohérents ; toute divergence = REFUS |
| REC-02 | Générer un paquet chiffré v4 comprenant deux équipes, sprints et snapshots v33 | Manifest complet, chiffrement/clé vérifiés, identité source connue |
| REC-03 | Refaire la vérification du paquet après modification d'un octet | Détection de corruption, aucun faux succès |
| REC-04 | Reconstruire le paquet en PG18 **isolé** | Cohérence FK et checksums DB/documents, pas de perte silencieuse |
| REC-05 | Ouvrir Dashboard Builder, indicateurs dynamiques, listes, liens équipe/transverse, rapports Office et PDF | Parcours visibles, droits, données et valeurs inchangés |
| REC-06 | Revue de chaque membre historique et des anciennes identités | Aucune référence non inspectée assimilée à « zéro » |
| REC-07 | Revue PDF/Office/TXT (y compris images/objets) et suppression de l'accès aux originaux expurgés | Empreintes et décisions privées par version ; lecteurs d'originaux révoqués |
| REC-08 | Option A : conserver vélocité/capacité/SP-JH/bilans/snapshots uniquement si non-réidentification démontrée | Petit effectif / corrélation / texte libre évalués, sinon traitement BLOQUÉ |
| REC-09 | Produire un paquet v4 **après** effacement qualifié et tenter une archive plus ancienne | Aucune donnée effacée ne revient ; restauration ancienne REFUSÉE |
| REC-10 | Couper avant stationnement / après stationnement / après promotion PG et pendant fichiers | Rollback vérifiable avant promotion ; après promotion : maintenance et reprise manuelle, aucun faux « réussi » |
| REC-11 | Vérifier toutes les sessions et tâches concurrentes après restauration/reset | Sessions persistantes invalidées, écrivains arrêtés, journal externe attesté |
| REC-12 | Créer une installation native v33 vierge, puis exercer le rollback | Aucun changement involontaire de la source ; données originales intactes |
| REC-13 | Mesurer l'indisponibilité et le point de récupération de données sur le banc de validation | RTO et RPO calculés de bout en bout ; comparaison aux cibles indicative **sans** déclarer la production qualifiée |
| REC-14 | Rejouer les tests de rétention, suppression, audit, archives et droits sur le même SHA final | Aucun cas bloquant, documents de preuves signés/attribués |

Pour chaque REC : enregistrer **date/heure, version, environnement isolé, résultat, identification non nominative du jeu de données, traces et checksum, anomalie Jira éventuelle, responsable de la revue**. La présence d'un bouton de confirmation n'est jamais une preuve d'autorisation technique.

### Dossier privé de preuve

Ne pas committer de sauvegardes, noms, snapshots bruts, documents personnels, clés ou journaux contenant des secrets. Conserver les preuves sensibles dans une zone privée extérieure à GitHub et référencer uniquement leur identifiant non nominatif et leur empreinte depuis le PV.

## 5. Conditions de décision et risques résiduels

**P0 — Avant restauration ou reset actif :**
1. Attester globalement toutes les voies d'effacement/suppression historiques et le journal externe (`completeHistory`), au-delà du périmètre membre provisoire.
2. Qualifier les archives non inspectables, les documents expurgés et la révocation de tous les lecteurs.
3. Vérifier la non-réidentification des agrégats (Option A) ou réaliser une expurgation/suppression effectivement contrôlée.
4. Mettre en place un exécuteur actif admissible après vérifications côté serveur, avec maintenance réelle, arrêt des écrivains, rollback, audit et révocation des sessions. **Ne pas réutiliser les helpers nommés `smn_restore_test_*` pour des installations de travail.**
5. Réussir les scénarios REC-01 à REC-14 sur Windows dédié ; mesurer RPO/RTO observés, sans leur attribuer faussement un niveau de service garanti.

**P1 — Avant clôture globale :**
6. Revoir les producteurs d'audit et les chemins d'archive/suppression couvrant tous les modules v33 ajoutés après la baseline.
7. Faire accepter fonctionnellement les 13 Stories une par une et enregistrer la décision explicite de l'utilisateur dans Jira.

## 6. Synthèse de conformité et autorisations

- **Code et CI de référence : acceptés techniquement.**
- **Fonctions destructives en situation réelle : non acceptées / gardes maintenues.**
- **Protection des données historiques : implémentation préventive en place, couverture exhaustive non établie.**
- **RPO/RTO : objectifs non validés** ; les durées des exercices de bascule ne sont pas des mesures de récupération du service en production.
- **Statuts Jira :** conserver les 13 tickets en l'état ; aucun passage à « Terminé » et aucune clôture de l'Epic sans accord explicite après levée des P0.

## 7. Méthode et limites

Évaluation à distance via connecteurs GitHub et Jira, lecture du code et des preuves GitHub Actions, recoupement du rapport de lot 8 et des étapes 2/3. Aucune exécution locale de `uv`, `pnpm`, PostgreSQL 18 ou Word/PowerPoint ; aucune inspection des archives privées de l'utilisateur ni expérience du redémarrage de sa machine. Les simulations et tests ont été **exécutés par les runners CI** sur le SHA cité. Les critères hors de ce périmètre sont marqués non qualifiés, et non « réussis ».

La présence de `epic-2: backlog` dans l'ancien `sprint-status.yaml` est obsolète par rapport à Jira. Jira prévaut pour l'état des tickets ; le fichier BMAD ne doit pas être corrigé manuellement en l'absence du script de synchronisation sécurisé.
