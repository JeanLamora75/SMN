# SMN-44 — Affectations datées et parts de rôles

[User Story Jira](https://lmn24.atlassian.net/browse/SMN-44) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-44-affectations-roles-dates.md)

## Administration de l'équipe Scrum/Kanban

Ouvrir **Administration → Membres de l'équipe**, puis **Gérer l'affectation** pour un membre existant.

La fiche propose les champs suivants :
- date d'effet (aujourd'hui ou date ultérieure, jamais antérieure à la dernière version) ;
- temps contractuel, affectation à l'équipe et coefficient de contribution (0 à 100 %) ;
- parts de rôles : **Scrum Master**, **Product Owner**, **Développeur**, totalisant **exactement 100 %**.

Exemple : Scrum Master 20 %, Product Owner 0 %, Développeur 80 %, affectation à l'équipe 80 %, temps contractuel 100 %, coefficient 75 %. Ces composantes restent indépendantes et ne constituent **pas** une valeur de capacité en JH. Un membre 100 % PO ou SM ne possède aucune part de développement.

Les demandes incohérentes sont refusées par l'interface et par le serveur ; une équipe différente de l'unique équipe installée ne peut pas être créée par ce formulaire ni via l'API.

## Historique et dates

Enregistrer la version ajoute une ligne d'historique, sans modifier les précédentes. Les anciennes données restent associées à leurs dates, et une version future ne change pas les données applicables aujourd'hui. Les corrections réalisées le même jour génèrent une révision supplémentaire : la plus récente s'applique à ce jour mais les anciennes révisions restent consultables.

L'équipe MVP ne prend en charge **qu'une équipe interne**. Les affectations multiéquipes concernent une version SAFe ultérieure. Le départ, l'archivage, la réactivation et les changements de calendriers seront traités dans les Stories suivantes.

## Préparation de la recette sur Windows 11

Mettre GitHub Desktop à jour depuis la branche `main`, puis exécuter sur une installation pilote :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Contrôler un membre créé dans SMN-42 : premier rôle 100 %, changement daté 20 % SM/80 % Développeur, taux contractuel et allocation cohérents, coefficient indépendant, historique version 1 et 2 présent, 100 % PO donnant zéro part Développeur, tentative de date passée rejetée, rôle Utilisateur sans accès aux fiches individuelles, aucune perte des identifiants et capacités toujours non calculables.

**Migration PostgreSQL 10 → 11 additive** : avant toute application à des données importantes, tester sur base pilote avec sauvegarde indépendante vérifiée. Les vérifications décrites ne sont pas une preuve qu'elles ont été exécutées.
