# SMN — Brief BMAD Product Manager — Entreprises et disponibilités

**Agent :** John (bmad-agent-pm) — BMAD v6.12.4  
**Date :** 28 octobre 2026  
**Statut :** cadrage fonctionnel ENT-01 à ENT-14 validé ; conception UX et analyse technique à réaliser.  
**Projet :** Scrum Master Notebook (SMN)  
**Références :** [GitHub](https://github.com/JeanLamora75/SMN) · [Jira SMN](https://lmn24.atlassian.net/jira/software/projects/SMN)  
**Portée de cette publication :** documentation uniquement, aucune modification Jira, aucun développement ni test revendiqué.

## 1. Vision et besoin

Une équipe Scrum ou Kanban peut regrouper des membres de différentes entreprises. Les fermetures propres à chaque entreprise doivent être appliquées automatiquement au calcul de disponibilité et de capacité de ses membres, en plus des jours fériés de leur pays et des absences individuelles. Objectif : solution MVP simple, réutilisation maximale de l'existant, aucun double décompte ni altération des références historiques figées.

## 2. Registre des décisions approuvées

| ID | Décision |
|---|---|
| ENT-01 | Cumuler les jours fériés liés au pays du membre et les fermetures supplémentaires de son entreprise. |
| ENT-02 | Catalogue global des entreprises, partagé entre toutes les équipes de l'installation. |
| ENT-03 | Entreprise facultative pour chaque membre ; absence d'entreprise non bloquante. |
| ENT-04 | Fermetures par journées entières (jour isolé ou période), sans demi-journées. |
| ENT-05 | Pas de transfert entre entreprises : clôturer l'affectation/fiche du membre, puis créer une nouvelle fiche avec la nouvelle entreprise. Vérifier les contraintes techniques existantes sur dates de fin et unicité. |
| ENT-06 | Entreprise : nom, commentaire facultatif, couleur, statut actif/archivé ; fermetures accessibles depuis sa fiche. |
| ENT-07 | Couleur choisie uniquement dans une palette prédéfinie, compatible Cockpit Agile. |
| ENT-08 | Fermetures saisies manuellement ; aucun import CSV/ICS. |
| ENT-09 | Afficher nom et couleur de l'entreprise sur cartes membres, vue Liste et fiche individuelle. |
| ENT-10 | Intégration automatique des fermetures aux disponibilités et capacités dynamiques, sans double déduction. |
| ENT-11 | Catalogue via Paramètres > Entreprises ; gestion des fermetures dans chaque fiche entreprise. |
| ENT-12 | Archivage autorisé avec membres actifs : garder affectations, calendrier applicable, consultation et réactivation ; aucune nouvelle association à une entreprise archivée. |
| ENT-13 | Créer, modifier et annuler des fermetures avec historisation et recalcul automatique des capacités non figées. |
| ENT-14 | Préserver les capacités initiales figées et bilans clôturés ; recalculer seulement les capacités dynamiques. |

## 3. Exigences fonctionnelles

### FR-ENT-01 — Catalogue global

Un administrateur habilité peut créer, consulter, modifier, archiver et réactiver une entreprise. Une entreprise possède un identifiant stable, un nom obligatoire, un commentaire facultatif, une couleur prédéfinie et un état actif/archivé. Les entreprises sont partagées entre équipes de la même installation, sans confusion avec d'autres installations.

### FR-ENT-02 — Affectation des membres

Chaque fiche membre peut référencer zéro ou une entreprise. Le champ est facultatif et ne bloque ni la création ni les calculs. Le nom et la couleur sont visibles sur cartes, lignes et fiche membre ; l'entreprise archivée demeure lisible pour les affectations existantes. Aucun mécanisme de transfert d'entreprise n'est développé.

### FR-ENT-03 — Fermetures de l'entreprise

Pour chaque entreprise : fermetures nommées, avec dates de début et de fin inclusives, état actif/annulé, création, modification, annulation et trace des changements. Les fermetures couvrent des journées civiles entières. Saisie exclusivement manuelle. Le traitement des chevauchements de périodes doit conserver un résultat de capacité correct et ne pas entraîner de double déduction.

### FR-ENT-04 — Disponibilités et capacités

Pour chaque membre, partir du calendrier individuel habituel ; prendre en compte jours fériés du pays, fermetures actives de l'entreprise référencée, absences et règles existantes de capacité. Les intervalles d'indisponibilité se combinent sans double déduction, et seuls les horaires normalement travaillés peuvent être déduits. Une entreprise non renseignée n'ajoute aucune fermeture. Les capacités dynamiques se recalculent lorsque les données pertinentes changent ; références initiales figées et bilans clôturés ne sont jamais réécrits. Préserver les éventuelles corrections manuelles et leurs règles de priorité existantes (à vérifier avant implémentation).

### FR-ENT-05 — Archivage et historique

L'archivage n'efface ni l'entreprise, ni ses fermetures, ni ses affectations antérieures. Les membres déjà rattachés conservent les fermetures applicables même lorsque l'entreprise est archivée. Aucune nouvelle affectation à une entreprise archivée. La réactivation est possible. L'historisation des fermetures est indispensable.

### FR-ENT-06 — Parcours et habilitations

Accessible dans Paramètres > Entreprises. UI cohérente avec Cockpit Agile, FR/EN, thèmes et accessibilité existants. Les actions d'écriture et de consultation doivent respecter les habilitations serveur et le périmètre d'installation ; éviter toute exposition interéquipes non autorisée.

## 4. Critères d'acceptation transversaux

1. Une entreprise globale et ses fermetures bénéficient aux membres de plusieurs équipes de la même installation.
2. Sans entreprise, les membres conservent leurs calculs habituels.
3. Une fermeture d'un jour férié, d'un jour normalement non travaillé ou d'une absence chevauchante ne déduit pas deux fois les mêmes heures.
4. Ajouter, corriger ou annuler une fermeture actualise les seules données dynamiques ; références figées et bilans clôturés sont inchangés.
5. Une entreprise archivée reste visible sur ses membres actifs et ses fermetures continuent d'être prises en compte ; elle ne peut être choisie pour un nouveau rattachement.
6. Le nom et la couleur de l'entreprise apparaissent dans les trois contextes validés (cartes, liste, fiche).
7. Les accès et écritures hors autorisation ou hors installation sont refusés côté serveur.
8. Les données historiques de fermetures existantes ne sont ni perdues ni automatiquement attribuées à une entreprise arbitraire.
9. Tests de non-régression Scrum et Kanban, multiéquipes, absence d'entreprise, calendriers et capacités ; résultats de tests réellement exécutés documentés.

## 5. Hors périmètre MVP

Gestion RH/contrats, transfert d'entreprise, multi-affectation simultanée, import CSV/ICS des fermetures, demi-journées, recalcul des snapshots figés, consolidation SAFe.

## 6. État vérifié et impacts techniques à instruire

- Le module existant `src/app/app/admin/company-closures/company-closures-admin.tsx` utilise `teamId` pour chaque fermeture, avec nom, période, état actif/annulé, révision, et opérations create/update. L'évolution vers un rattachement global à une entreprise requiert un traitement explicite des données historiques par équipe.
- La page actuelle `src/app/app/admin/company-closures/page.tsx` contrôle l'accès aux paramètres.
- Vérifier avec Winston : tables et migrations réelles, rattachement des membres, dates de fin/unicité, moteur de capacité, priorités des corrections manuelles, audit, autorisations et stratégie de transition des fermetures anciennes. Ne pas supposer que les contrôles d'intégration ou tests ont été exécutés.

## 7. Proposition de découpage Jira — non publié

- **Epic** : Entreprises et disponibilités multiemployeurs.
- **ENT-US-01** : Catalogue global, règles d'accès et archivage.
- **ENT-US-02** : Interfaces Entreprises : commentaire, couleur, catalogue et fiche.
- **ENT-US-03** : Rattachement facultatif et affichage sur fiches/cartes/listes des membres.
- **ENT-US-04** : Fermetures par entreprise : création, modification, annulation et historique.
- **ENT-US-05** : Calcul de capacité avec fusion des indisponibilités, historique figé préservé.
- **ENT-US-06** : Migration des données existantes, sécurité, tests et non-régression.

Chaque Story devra être indépendante, petite, vérifiable et assortie de critères d'acceptation et de dépendances avant sa création dans Jira.

## 8. Passage de relais BMAD

**Sally (UX Designer)** : proposer l'interface Paramètres > Entreprises, catalogue, fiche, édition et fermetures ; choix palette préexistante, présentation des entreprises archivées, vues cartes/liste membre, états vides, droits et responsive. Livrer les projets de contrats `DESIGN.md` et `EXPERIENCE.md` sans publication avant nouvelle validation.

**Winston (Architecte)** : contrôler schéma, migration des fermetures rattachées aux équipes, modèle de membre, calculs, historisation et isolation.

**John** : intégrer les avis UX/techniques, finaliser PRD/Stories et solliciter accord explicite avant toute création/modification Jira.

**Amelia** : implémentation uniquement après approbation des contrats et Stories.

## 9. Définition de terminé

Documentation validée, évolution versionnée, anciennes données préservées, autorisations vérifiées, tests automatiques pertinents et recette Windows locale réellement effectués, approbation finale du Product Owner. La publication de ce brief ne constitue pas une livraison technique.
