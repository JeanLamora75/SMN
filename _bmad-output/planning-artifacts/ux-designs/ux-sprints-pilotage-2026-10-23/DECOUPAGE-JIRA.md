# Jira — Refonte Sprints

**Epic UX approuvée et publiée : [SMN-228](https://lmn24.atlassian.net/browse/SMN-228)**.

| Jira | Objet | Ordre de réalisation conseillé | Périmètre |
|---|---|---|---|
| [SMN-229](https://lmn24.atlassian.net/browse/SMN-229) | Horaires, pause et modèles vers Paramètres | 1 | Dépend de SMN-223/225/227, ne pas créer un nouveau moteur de jours ouvrés |
| [SMN-230](https://lmn24.atlassian.net/browse/SMN-230) | Liste des sprints, filtres/états/tri, pleine largeur | 2 | Rendre la liste utilisable seule |
| [SMN-231](https://lmn24.atlassian.net/browse/SMN-231) | Assistant de création unitaire/lot | 3 | Règles de SMN-66/67 et reprise historique SMN-160 |
| [SMN-232](https://lmn24.atlassian.net/browse/SMN-232) | Menu d'actions par sprint | 4 | Renommer, replanifier, supprimer sous permissions métier |
| [SMN-233](https://lmn24.atlassian.net/browse/SMN-233) | Accès contextualisé au calendrier, réunions, bilan | 5 | Conservation des fonctionnalités existantes, pas de liens fictifs |
| [SMN-234](https://lmn24.atlassian.net/browse/SMN-234) | **Fiche Sprint réelle à enrichir en sept onglets avec édition contextualisée** | **Lots D0–D9** (plan publié) | Epic SMN-228 ; route de lecture partielle existante ; dépend de SMN-83–87, Epic 3, Epic 5 pour registres et Epic 9 pour IA |

## Cadre de réalisation
Les Stories sont destinées à **Amelia**, agent BMAD développeur. Elles ne remplacent ni l'Epic métier [SMN-4](https://lmn24.atlassian.net/browse/SMN-4), ni le centre Paramètres [SMN-223](https://lmn24.atlassian.net/browse/SMN-223), ni les contrats UX **Calendrier / Fiche membre**.

Lire [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [MATRICE-FONCTIONS.md](MATRICE-FONCTIONS.md), [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) et [RECETTE-UX.md](RECETTE-UX.md).

**Statut** : tickets fonctionnellement validés, **aucun développement ni test attestés par la documentation**.

## Avenant contractuel du 23 octobre 2026 — Fiche Sprint SMN-234

Le contrat détaillé [FICHE-SPRINT-CONTRAT.md](FICHE-SPRINT-CONTRAT.md) est **prioritaire pour le seul périmètre de la fiche Sprint** sur toutes les mentions antérieures « future fiche » ou « Synthèse / Cérémonies / Capacité / Indicateurs / Bilan et historique ». La route existe désormais sous la forme d'une **première fiche de lecture partielle**, non d'une fiche entièrement développée.

**Cible :** bandeau Sprint compact sans onglet Synthèse ; **Objectifs / Cérémonies / Capacité / Indicateurs / Registres / Tendances / Bilan**. Icône de modification pour champs éditables via action sécurisée ; aucun crayon sur valeurs calculées. Les règles Paramètres/Calendrier/index Sprints ci-dessus restent inchangées. Le plan d'implémentation par lots D0–D9 est dans `_bmad-output/implementation-artifacts/plan-developpement-fiche-sprint-smn-234-2026-10-23.md`.

**Aucune action logicielle n'est exécutée par ce cadrage.**
