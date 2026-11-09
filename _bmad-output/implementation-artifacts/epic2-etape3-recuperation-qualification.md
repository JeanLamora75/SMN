# Epic SMN-2 — Étape 3 : opérations de récupération et d'incident

**Date :** 9 novembre 2026 · **Agent :** Amelia — BMAD Dev · **Cibles :** SMN-34, SMN-37, SMN-41  
**Référentiel :** GitHub `main` / native v33 / PostgreSQL 18 / Windows 11. Les scripts `uv` BMAD ne sont pas exécutables via GitHub et n'ont pas été invoqués.

## Décision de sécurité

L'activation destructive sur l'installation active n'est **pas autorisée** au stade actuel : `currentErasureEvidence` maintient `completeHistory:false` puisque le registre n'atteste pas tous les chemins historiques d'effacement et toutes les copies. Aucun paramètre client, confirmation saisie, succès CI, dossier vide ou simple passage d'un test PostgreSQL 18 ne lève le verrou.

**Distinction impérative :** la reconstruction v4, le cutover et le reset en environnements *jetables* ont des preuves automatisées. La restauration active et la réinitialisation de l'installation personnelle doivent rester inaccessibles tant que les preuves de non-réintroduction, la vérification des archives et la recette Windows réelle ne sont pas réunies.

## Réalisations de l'étape 3

### SMN-34 — Restauration sécurisée

- Reconstruction PostgreSQL 18 native v33 depuis un paquet chiffré v4 et vérification base/fichiers, indicateurs dynamiques, Dashboard Builder, liens, PDF/Office et documents privés : scénario `smn-34-v3-postgres.test.ts` (nom de fichier historique, vérifications v4).
- Reprise coordonnée des répertoires `documents`, `report-pdfs`, `office-reports`, `office-templates` et des noms de bases **strictement jetables**, avec conservation séparée des originaux et journaux HMAC.
- **Renforcement de sûreté :** une panne **après** `candidate-promoted` produit `cutover-manual-recovery-required`. Jamais de rollback isolé des fichiers si la base peut être déjà promue. Injection explicite dans `epic2-lot5-coordinated-pg.test.ts`, avec vérification des contenus base active, base rollback, fichiers actifs et fichiers rollback.
- L'interruption **avant** promotion reste réversible en environnement de test, preuve du retour à l'état antérieur.
- Le marqueur de maintenance persistant précède toute opération hors ligne. Il protège les accès applicatifs, mais **ne remplace pas** l'arrêt des écrivains ni le contrôle des connexions actives.

### SMN-37 — Réinitialisation contrôlée

- La prévisualisation recense réellement les tables et les lignes PostgreSQL, ainsi que les archives PDF/Office, documents et sauvegardes. Une référence absente ou incohérente n'est pas assimilée à un stockage vide.
- Une nouvelle installation native v33 et un administrateur indépendant sont créés sur une base locale jetable. Le jeu de données d'origine est conservé, puis contrôlé à nouveau.
- Une répétition de bascule base/fichiers conserve un rollback vérifié, y compris pour un candidat vierge.
- Le verrou de maintenance est partagé entre les procédures `offline-restore` et `offline-reset`, sans permettre deux opérations simultanées et sans déverrouiller la route POST de reset active.
- Annulation, confirmation incorrecte et non-administrateur ne doivent jamais modifier l'installation.

### SMN-41 — Diagnostics et RPO/RTO

- Une sauvegarde ne peut être `succeeded` que si son paquet **existe** et qu'il a été vérifié. Un marqueur `success` ou une vérification revendiquée sans fichier réel sont insuffisants.
- Les dossiers de publication partielle et les purges interrompues sont classés `interrupted` / `partial`, pas `succeeded`. Les journaux de cutover signés permettent de repérer une promotion dont la reprise exige un opérateur.
- `recovery-drill-measurement.ts` distingue un **temps de bascule d'exercice** des métriques de récupération d'un service de production. Le calcul n'est proposé que si bases, fichiers, rollback, journal et invalidation des sessions **d'exercice** sont tous vérifiés.
- Les **cibles** RPO 24 h / RTO 60 min demeurent indicatives. `productionRpoMinutes`, `productionRtoMinutes`, `measuredDataLossMinutes` sont `null` et `objectivesValidated:false` : aucune mesure en situation d'exploitation n'a été inventée.

## Conditions de levée de blocage avant opération active

1. **SMN-40 :** établir un registre exhaustif depuis l'origine, y compris suppressions hors moteur actuel, identités historiques et copies restaurables. Vérifier les preuves de non-réintroduction d'un paquet v4 **post-effacement**.
2. **SMN-38/39 :** traiter les archives non inspectables, copies externes et métriques collectives selon l'**Option A** validée : conservation seulement si la non-réidentification est démontrée.
3. **Point de récupération préalable :** paquet v4 vérifié, clé de récupération disponible sans exposition des secrets, comparaison des versions PostgreSQL/SMN, point de rollback SQL/fichiers indépendant et intègre.
4. **Maintenance :** marqueur externe persistant et non réinscriptible, arrêt de HTTP/jobs/écrivains, aucune connexion concurrente, journal durable avant chaque changement d'état, procédure explicite de levée du verrou.
5. **Bascule et tests :** reconstruction quarantaine, vérification des dépendances et hashes, invalidation des sessions persistantes, diagnostic de santé applicative puis décision de remise en service.
6. **Panne ambiguë :** garder la maintenance active, ne jamais retenter silencieusement ni inverser uniquement une ressource ; inspecter journaux et bases avant intervention humaine.
7. **Recette réelle :** installation Windows 11 **de validation, distincte de celle de l'utilisateur**, avec échec injecté avant/après bascule et simulation de coupure matérielle, restauration d'archives réelles expurgées, mesure complète RTO (indisponibilité → retour au service) et RPO (dernière donnée durable protégée → point de défaillance).

## Matrice d'acceptation

| Story | Vérifié techniquement | Blocage avant clôture |
|---|---|---|
| SMN-34 AC1/2/5 | reconstruction v4 + v33, documents, liens, Office, snapshots et cohérence dans PostgreSQL 18 jetable | exécuteur actif et preuve globale SMN-40 |
| SMN-34 AC3 | rollback avant promotion, refus manuel après promotion, journaux et checkpoints séparés | panne réelle, retour en service et audit sur Windows |
| SMN-34 AC4 | contrat d'invalidation de sessions dans le banc isolé | invalidation et audit **persistants** en environnement actif |
| SMN-37 AC1/2/4/5 | impact exact, refus d'exécution, installation indépendante et rollback | consentement final et recette sur installation de test dédiée |
| SMN-37 AC3 | cutover d'une base v33 vierge sur banc PG18, fichiers anciens conservés | opération active non autorisée, non-réintroduction et preuve de récupération |
| SMN-41 AC1–4 | diagnostics, artefacts interrompus, refus des faux succès, incident après promotion | vérification de bout en bout sur disque réel et secrets |
| SMN-41 AC5 | mesures isolées distinguées des cibles et sans RPO/RTO inventés | mesures complètes en exploitation pour qualifier les objectifs |

**État final recherché :** chaque job Windows/Linux/PG18 vert **sur un même SHA**. Aucun statut Jira « Terminé » ni déverrouillage d'API de destruction avant validation des preuves réelles.
