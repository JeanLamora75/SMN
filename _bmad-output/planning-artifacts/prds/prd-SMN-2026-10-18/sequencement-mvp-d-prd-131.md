# SMN — D-PRD-131 : séquencement fonctionnel du MVP

**Statut : validé globalement par l'utilisateur le 19/10/2026.**  
**Périmètre :** MVP Scrum et Kanban, 81 exigences FR-1 à FR-81 inchangées. SAFe/ART reste en version 1.0.  
**Sources :** [PRD](prd.md), [revue BMAD](validation-report.md), [clarifications D-PRD-130](clarifications-d-prd-130.md), [journal](.memlog.md).

## Décision et objectifs

Organiser le MVP en **sept incréments I0 à I6**, sans réduire, déclasser ni supprimer les exigences approuvées. Obtenir très tôt un premier parcours Scrum utilisable (I1), puis compléter Scrum, ouvrir Kanban sur un socle mutualisé, intégrer la reprise historique, les briefs IA et la recette. Le **MVP n'est complet qu'après I6**. Le résultat intermédiaire d'I1 n'autorise pas un passage au pilote.

| Incrément | Résultat métier / contenu cible | Dépendances | Critères de démonstration de l'incrément |
|---|---|---|---|
| **I0 — Socle de l'application** | Initialisation Express/Guidée, produit unique, équipe et mode Agile fixe, navigation, persistance, contrôle d'accès, confidentialité et protections techniques indispensables | Aucune | Une installation cohérente est initialisée ; identité produit/mode préservée ; données persistées et protégées |
| **I1 — Premier parcours Scrum utilisable** | Membres, calendrier et configuration de base, création d'un Sprint, métriques et données qualitatives minimales, bilan et aperçu HTML | I0 | Parcours initialisation → Sprint → informations → bilan HTML démontrable sans données inventées |
| **I2 — Scrum complet et reporting professionnel** | Gestion approfondie des événements Scrum, disponibilités/absences/capacités, six registres, clôtures et instantanés versionnés, modèles, prévisualisation et PDF | I1 | Cycle Scrum complet, clôture/reclôture et consultation des versions ; rapport HTML/PDF fidèle, sans altérer les PDF déjà produits |
| **I3 — Kanban et mutualisation** | Génération/gestion des périodes Kanban, cinq métriques de flux, objectifs/bilans, événements et registres pertinents, rapport utilisant les composants réellement communs | I0 et socle commun consolidé I1/I2 | Un cycle Kanban complet produit un bilan et un rapport ; absence de règles Scrum appliquées indûment |
| **I4 — Reprise historique et imports** | Sprints rétrosaisis, données connues/estimées/absentes, import CSV quatre colonnes avec prévisualisation et transaction atomique, historique des corrections, tendances | Cycles, métriques, versions et rapports issus de I1–I3 | D-PRD-130 A1–A4 vérifiable : aucune cérémonie ni capacité fictive ; anciennes versions/PDF conservés ; CSV invalide refusé intégralement |
| **I5 — Briefs IA et ergonomie consolidée** | Briefs TXT, modèles, analyses collées manuellement et archivées, confidentialité, tableau de bord, parcours responsive et saisie minimale | Données de cycle, bilans, reporting et registres | Brief factuel et confidentiel, analyse identifiée séparément, écrans essentiels utilisables sur les trois supports |
| **I6 — Recette complète et préparation du pilote** | Recette fonctionnelle et transversale Scrum/Kanban, sécurité, sauvegarde/restauration, intégrité, performances/accessibilité, mesures des cinq conditions cumulatives et décision humaine explicite | Tous les incréments précédents | Matrice FR/tests/preuves, résultats effectivement observés et décision documentée ; pilote refusé si condition non démontrée ou anomalie bloquante |

## Dépendances et garde-fous transversaux

1. **Socle réutilisable dès I0/I1.** Mode et produit fixes pour l'installation, composants partagés pour cycles, calendriers, membres, registres, métriques, reporting et journalisation lorsque les règles métier sont réellement communes ; différences Scrum/Kanban explicites.
2. **Sécurité dès le premier incrément.** Accès, confidentialité, intégrité transactionnelle, protection des opérations et sauvegardabilité nécessaires à chaque livraison sont mis en œuvre à mesure que les fonctionnalités apparaissent ; I6 est leur **recette globale**, non leur première implémentation.
3. **Versionnement anticipé.** Les clôtures et instantanés immuables doivent être conçus dès les premières clôtures opérationnelles (I2). I4 complète reprise et correction sans refonte ni fabrication d'historique.
4. **Ergonomie et fiabilité progressives.** I5 consolide l'expérience et le support responsive, sans reporter à cette étape toute utilisabilité ni protection des saisies.
5. **Aucune réduction du périmètre approuvé.** Les FR-1 à FR-81, D-PRD-001 à D-PRD-131 et les cinq conditions cumulatives restent de référence. Les incréments regroupent des capacités mais ne sont **pas** des lots contractuels de User Stories : leur découpage, technologies, estimation et calendrier relèvent de l'architecture puis des Epics/US.
6. **Périmètre v1.0 intact.** SAFe/ART, ainsi que les formats PPTX/DOCX/XLSX post-MVP, ne sont pas anticipés comme des livraisons du MVP.
7. **Preuves et validation.** Les critères ci-dessus sont des objectifs de démonstration, **pas des tests déjà exécutés**. La recette I6 vérifie les cinq conditions de succès, dont trois Sprints complets et une période Kanban en conditions réelles, rapport de Sprint en moins de 30 minutes, saisie courante au plus 30 min/semaine, tendances fiables et rapports HTML/PDF sans anomalie bloquante.

## Rattachement principal aux exigences (indicatif, non exclusif)

- **I0** : FR-1 à FR-3, FR-58 à FR-61, socle FR-66 à FR-73.
- **I1** : FR-4 à FR-9, FR-14 à FR-16, FR-20/21, première restitution FR-26 à FR-27 et registres nécessaires.
- **I2** : FR-10 à FR-19, FR-25 à FR-41, compléments Scrum et FR-26 à FR-33.
- **I3** : FR-21 à FR-24, FR-22/23, adaptations Kanban de FR-25 à FR-41.
- **I4** : FR-42 à FR-49, D-PRD-130 et tendances historiques associées.
- **I5** : FR-50 à FR-65, notamment IA-01 à IA-08 et consolidation UX.
- **I6** : FR-74 à FR-81 ; recette transversale FR-1 à FR-73.

**Attention :** cette correspondance n'est pas une affectation exclusive ni un report d'exigences de sécurité/UX/qualité à leur incrément principal. Une même FR peut être introduite puis complétée à plusieurs étapes.

## Suite BMAD

Le constat élevé **A6 (séquencement du MVP)** de la revue est **arbitré fonctionnellement** par D-PRD-131. Cela n'efface pas les constats initiaux ni les écarts secondaires encore ouverts. Finalisation du PRD et passage à Winston (Architecture) après le traitement des réserves de phase ; Epics et User Stories Jira uniquement après autorisation distincte. **Aucun développement, test applicatif, estimation de charge ou passage au pilote n'est attesté.**
