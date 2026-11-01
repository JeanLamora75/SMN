# SMN — Avenant BMAD : refonte de la navigation et du cockpit Indicateurs
Date : 2026-11-01. Statut : décisions fonctionnelles utilisateur validées ; développement non démarré. Références : SMN-339, 340, 343, 347, 348, 349 ; SMN-336. 

## Décisions de navigation et séparation des responsabilités
1. Le menu latéral « Indicateurs dynamiques » devient **« Indicateur »** (singulier) et se place entre **Calendrier** et **Registre**.
2. Menu **Paramètres → Indicateurs** : catalogue global des définitions d'indicateurs, liste, création, modification, archivage, gestion des formules ; **administrateurs exclusivement**. L'API doit confirmer les droits côté serveur, pas seulement masquer les boutons.
3. Menu **Indicateur** : espace opérationnel contextualisé par l'équipe active choisie dans le sélecteur global. Pour l'équipe autorisée : sélectionner les indicateurs, saisir/modifier leurs valeurs par Sprint ou période Kanban et gérer visibilité, affectation et ordre des emplacements d'affichage. Les habilitations doivent être évaluées pour l'équipe active, sans transfert implicite interéquipes.
4. Aucun panneau « Habilitations des Scrum Masters par équipe » dans les trois onglets de l'espace Indicateur : l'administration des habilitations doit être séparée des opérations d'indicateurs ; ne pas supprimer leur contrôle effectif.

## Accueil des indicateurs
- La page d'accueil « Indicateur » affiche d'abord un **tableau par Sprint enregistré dans la base**, limité à l'équipe sélectionnée. Pour Kanban, employer la période/cycle Kanban correspondant, sans inventer de Sprint.
- Chaque ligne représente un cycle et affiche au minimum son identification, sa période, son statut et les indicateurs sélectionnés/leurs valeurs disponibles, leurs unités courtes et états (« — » lorsque non renseigné ; 0 reste 0).
- Dernière colonne : action **Modifier**, ouvrant la modale de saisie des indicateurs du cycle visé ; respecter droits, verrouillage et snapshots de clôture, sans modifier les valeurs figées.
- Couverture de tous les cycles non supprimés, indépendamment du statut ; pagination ou scroll horizontal selon densité.

## Affichage et Cockpit Agile
- Page Indicateur harmonisée avec le référentiel visuel **Cockpit Agile** : bandeau, largeur, filtres, tableaux, composants, boutons et modales cohérents avec les autres modules.
- Onglet « Affichage » : blocs de préférence/écran **repliables**, **repliés par défaut**, avec titre et contrôle accessible déplier/replier. Conserver les choix enregistrés ; le repli ne modifie pas les données.
- Respecter la décision déjà validée sur le tableau de bord : trois blocs persistants Story Points 4 / Tickets 2 / Indicateurs complémentaires 2, emplacements inoccupés visibles.
- Supprimer de la page Indicateur les affordances de gestion globale qui relèvent exclusivement de Paramètres.

## Contrôle des accès
| Opération | Périmètre | Autorité |
| --- | --- | --- |
| Définition, création, édition, archivage, formule globale | Catalogue global | Administrateur |
| Choix indicateurs actifs | Équipe sélectionnée | Admin ou membre habilité sur cette équipe |
| Préférences d'affichage et positions 4/2/2 | Équipe sélectionnée | Admin ou membre habilité sur cette équipe |
| Saisie des valeurs par cycle | Équipe + Sprint/période | Admin ou membre habilité selon règles du cycle |
| Voir cycles/valeurs | Équipe active | Droit de lecture explicite |

Ne jamais fonder l'autorisation sur le seul teamId reçu du client ; la vérifier sur le compte et l'équipe serveur, y compris lors du changement d'équipe.

## Scénarios Given/When/Then — recette
1. Étant administrateur, lorsque j'ouvre Paramètres → Indicateurs, je retrouve le catalogue et la création ; un utilisateur non admin ne peut y écrire.
2. Étant sur l'équipe Koala, lorsque j'ouvre Indicateur, je vois seulement les cycles Koala, sans valeur Panda.
3. Étant habilité, lorsque je clique Modifier sur un Sprint, une modale renseigne les indicateurs du Sprint en question, avec persistance contrôlée et distinction NULL/0.
4. Lorsque je change l'équipe active, listes, préférences, saisies et droits sont recalculés sans fuite interéquipe.
5. Dans Affichage, tous les blocs sont initialement repliés et s'ouvrent au clic/clavier.
6. Sur chacun des trois onglets métier, le panneau « Habilitations des Scrum Masters par équipe » n'apparaît pas.
7. Navigation, tableau, en-têtes et modales suivent le design Cockpit Agile, en FR/EN et thème clair/sombre.
8. Tous les cycles enregistrés non supprimés, y compris les cycles non clôturés, sont pris en compte ; les anciennes captures restent immuables.

## Impacts techniques à examiner avant développement
Navigation : composants menu/shell et paramètres ; catalogue UI et pages/route ; tables et service v33 `smn_indicator_*`, API valeurs et préférences ; sélecteur d'équipe, habilitations `smn_indicator_team_grant` ; réutilisation de la modale SMN-348 ; tests d'isolation, RBAC, cycles clôturés et navigation.
Aucune migration destructive prévue ; ne pas supprimer de table de droits au retrait du panneau visuel.

## Découpage conseillé
UX-IND-01 navigation et transfert du catalogue global dans Paramètres.
UX-IND-02 tableau d'accueil par Sprint/période et action Modifier.
UX-IND-03 cockpit harmonisé et Affichage replié par défaut.
UX-IND-04 suppression du panneau d'habilitations des trois onglets et contrôle RBAC multiéquipes.
Décisions documentées seulement ; aucune prétention de tests ni de mise en œuvre.
