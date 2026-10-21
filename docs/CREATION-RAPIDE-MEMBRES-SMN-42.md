# SMN-42 — Création rapide des membres

[Story Jira](https://lmn24.atlassian.net/browse/SMN-42) · [Contrat de développement BMAD](../_bmad-output/implementation-artifacts/spec-smn-42-creation-rapide-membres.md)

## Parcours Administrateur

Dans **Administration → Membres de l'équipe**, accessible également depuis la fiche de l'équipe :

1. L'installation Express reste possible **sans aucun membre**. Ouvrir le parcours de création initiale plus tard.
2. Une équipe Scrum/Kanban déjà créée est affichée. Le formulaire propose **3 membres** ; il exige entre **3 et 50** fiches.
3. Choisir par exemple **5** puis sélectionner « Créer les fiches provisoires ». Une seule transaction PostgreSQL crée cinq identités métier, cinq affectations et un lot de suivi.
4. Les rôles initiaux sont, dans l'ordre : Scrum Master, Product Owner, Développeur, Développeur, Développeur.
5. La liste présente des noms provisoires (Membre 1…N), le rôle, la date d'arrivée et l'affectation 100 %. Les autres paramètres de pourcentage pertinents sont également enregistrés à 100 %.
6. **La capacité de développement reste non calculable** tant que les données nécessaires des fonctionnalités ultérieures ne sont pas renseignées. La fiche ne crée ni compte de connexion ni objectif/KPI de cycle.

Ce parcours rapide n'est utilisable que pour **le premier lot de l'équipe** ; il ne crée pas plusieurs fois les premiers rôles. Les enrichissements de fiches et les évolutions d'affectation seront développés dans SMN-43 et SMN-44.

## En cas de problème

Une erreur durant la transaction entraîne un rollback. Si le serveur a commité mais que le navigateur n'a pas reçu la réponse, une nouvelle tentative avec la même clé récupère le lot existant. Un rechargement montre également la composition enregistrée. Aucun résultat de création n'est déclaré sans confirmation de la persistance.

Seul l'Administrateur peut consulter et modifier le référentiel individuel ; l'Utilisateur ne reçoit ni la liste des personnes ni leurs champs individuels par l'API protégée.

## Particularités techniques

Le schéma de PostgreSQL passe additivement de **v8 à v9**, avec tables centrales de membres, affectations datées et lots idempotents. L'API vérifie l'unique équipe de l'installation ; elle n'accepte aucune seconde équipe interne. La date initiale d'arrivée correspond à la date UTC de création, conservée séparément de l'horodatage ; elle sera modifiable plus tard.

Les textes d'interface sont localisés en français et anglais, sans modifier les contenus métier. Le maximum de **50 fiches** est une limite de sécurité du parcours rapide, pas une règle métier sur la taille des équipes. Toute évolution de ce plafond demandera une décision.

## Qualification obligatoire

Après récupération de `main` depuis GitHub Desktop, exécuter sur la machine de test :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Puis tester sur PostgreSQL 18.6, avec une installation pilote sans données métier importantes. **Aucune exécution locale n'est déduite de la seule présence des tests dans le dépôt.**
