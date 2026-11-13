# Murat — Revue QA Epic SMN-444 / Story SMN-457

Date de revue : 13 novembre 2026. Branche : `main`.
**Statut : qualification partielle, livraison non autorisée à ce stade.**

## Référentiel et règle métier

Stories SMN-445 à SMN-456, SMN-457, contrats BMAD Tickets, parcours Cockpit Agile et droit d'accès v33. Les six colonnes `Id jira`, `Type de ticket`, `Titre du ticket`, `Priorité`, `Statut`, `Story points` sont **obligatoires, dans un ordre libre**, selon le contrat Jira SMN-445 révisé. Une note plus ancienne de SMN-457 exige un ordre fixe : **contradiction documentaire à arbitrer**, ne pas changer silencieusement le validateur. Les valeurs libres sont conservées ; Done/Terminé reconnus ; SP invalides non transformés en zéro.

## Environnement de preuve réellement utilisé

CI dédiée [SMN-444 — Qualification Tickets](https://github.com/JeanLamora75/SMN/actions/workflows/tickets-quality.yml) : Node.js 24 et dépendances du dépôt. Test navigateur : Chrome/Chromium piloté par Puppeteer ; API simulée par serveur HTTP dans une fixture ; comportement des vrais composants React, validation CSV et projection/calculs issus des moteurs métiers.

Exécution attestée dans [run 43524478126](https://github.com/JeanLamora75/SMN/actions/runs/43524478126) :
- contrats purs CSV/calculs : **réussi** ;
- tests de composants, Office et sauvegarde : **réussi** ;
- scénarios Chromium réels (import, Consultation, Comparaison ; FR/EN) : **réussi** ;
- TypeScript et lint : **échec sur règles React ESLint**, erreurs publiées ensuite pour correction. Aucun résultat global vert n'est inféré de ces trois succès.

Nouvelle exécution après correctifs React : [run 43525114093](https://github.com/JeanLamora75/SMN/actions/runs/43525114093), **résultat à relire**. Les commits peuvent annuler des runs précédents ; une annulation n'est pas une réussite.

## Matrice de qualification progressive

| Story | Tests existants / exécutés en CI dédiée | Risques / vérifications complémentaires |
|---|---|---|
| 445 | CSV valides, invalides, BOM, guillemets, doublons, Done/Terminé, SP | Arbitrage documentaire : ordre libre vs fixe ; fichier multi-Mio et 20 000 lignes |
| 446 | Publication/remplacement versionné, SHA-256, refus d'écrasement, verrou, suppression | Clôture de sprint entre confirmation et suppression, vraie concurrence multi-processus, coupure pendant rename |
| 447 | Menu, contexte équipe/cycle, structure Cockpit Agile ; test Node isolé du CSS | Navigation dans un vrai Next.js connecté, suppression et réinitialisation sur changement d'équipe |
| 448 | Prévalidation, erreurs, confirmation, refus d'écrasement ; Chromium réel FR/EN | Réseau coupé au POST, interruption à la publication, focus/contraste complet sur toutes modales |
| 449 | Consultation, filtres, tri, pagination ; Chromium réel | Permissions et données d'une autre équipe en HTTP authentifié, fichiers altérés |
| 450 | SP décimaux exacts, absents/inconnus, agrégations filtrées | Volumes proches des limites et comparaison exacte avec export Word/PPT |
| 451 | Ajouts/retraits, terminés/rouverts, changement SP, pas de double compte | Dates simultanées / fichier remplacé pendant comparaison |
| 452 | Sélecteurs, filtres paginés, détail ; Chromium réel, FR/EN, mobile | Clavier complet, contrastes thème clair/sombre, session interrompue |
| 453 | Contrat d'entrée v33, versions et droits vérifiés statiquement | Vraie modale v33, sauvegarde SQL autorisée/refusée, concurrence, sans CSV→indicateur |
| 454 | HTTPS, clés sûres, stockage versionné, liens dans consultation/comparaison | Configuration Jira administrateur vs utilisateur, attaques redirect/path, test HTTP auth |
| 455 | Moteur Word/PPT ROW, provenance SHA, agrégations et comparaison | Ouvrir et inspecter de vrais DOCX/PPTX, sortie de rapport et protection de l'écrasement |
| 456 | Capture/restauration de fichiers isolés, intégrité, traversal, symlinks, rollback en test de code | **Recette bout-en-bout ZIP source→PC cible avec PostgreSQL isolé, rollback réel après interruption** |
| 457 | Deux nouveaux tests Puppeteer : import et consultation/comparaison sur HTTP simulé | Scénarios d'API autorisées/refusées avec PostgreSQL réel, suppression et modal v33 réelle, complet FR/EN/clavier/mobile |

**Attention** : les tests de composants et certains contrôles de sécurité ne sont que des assertions statiques de source ; ils ne doivent pas être appelés « tests d'intégration réels ». Les deux nouveaux tests Puppeteer pilotent les composants React sans l'application Next.js ni PostgreSQL.

## Corrections publiées

- Workflow CI dédié avec contrats purs, UI/Office/sauvegarde, qualité statique et Chromium.
- Types `TicketsCycleContext`, composants d'icônes valides et import de galerie corrigés.
- Test SMN-447 révisé : le test Node ne tente plus d'importer le CSS partagé ; les vraies interactions sont couvertes séparément dans Chromium.
- Tests navigateur ajoutés : import CSV valide/invalide, antidatage, remplacement confirmé ou annulé, Consultation/Comparaison, filtres, liens Jira, responsive et FR/EN.
- Adaptations React contre les mises à jour de state synchrones en effet, sans désactivation des règles ESLint.

## Critères de sortie SMN-457 (non encore atteints)

1. Dernière CI dédiée **entièrement verte** (quatre jobs) et exécution stable répétée.
2. Recette authentifiée sur PostgreSQL avec admin et user, plusieurs équipes et cycles, sprint clôturé.
3. Coupures réseau et de processus pendant import/suppression, résultat sans publication partielle.
4. Génération de vrais rapports Word et PowerPoint à partir de CSV et comparaison avec les valeurs Consultation.
5. Sauvegarde ZIP → restauration **sur une deuxième installation SMN isolée**, vérification des CSV/JSON/Jira, preuves de rollback.
6. Parcours complets au clavier, focus/dialogues, thème clair/sombre, FR/EN, desktop/mobile.
7. Résolution de la contradiction de description SMN-457/SMN-445 et de toutes les anomalies bloquantes.

Ne pas déclarer l'Epic 444 ni SMN-457 terminées avant ces preuves.
