# SMN-409 — Export Office : membres actifs, membres inactifs et fonction

**Jira :** https://lmn24.atlassian.net/browse/SMN-409  
**Référence :** SMN-408 (localisation et drapeau des membres)  
**Statut :** code publié sur `main`, tests et recette utilisateur à contrôler.

## Besoin

L'onglet Centre Rapports → Tags → Tableaux de données métier présente désormais deux sources :
- `{{ROW:MEMBERS_ACTIVE}}` : membres avec une affectation effective jusqu'au dernier jour du sprint (date de fin incluse, aucune sortie avant la date de référence).
- `{{ROW:MEMBERS_INACTIVE}}` : membres ayant eu une affectation dans cette équipe avant la fin du sprint, mais sortis avant son dernier jour.

La détermination du statut est **historique au sprint sélectionné**, pas à la date de génération du rapport. Seule la dernière affectation par membre commencée au plus tard à cette date est retenue, sans doublons. Les affectations commençant après la période sélectionnée sont exclues.

## Champs

Les deux sources acceptent les tags `MEMBER_NAME`, `MEMBER_ROLE`, `MEMBER_FUNCTION`, `MEMBER_START`, `MEMBER_END`, `MEMBER_CITY`, `MEMBER_COUNTRY` et `MEMBER_FLAG`. La **fonction professionnelle** `MEMBER_FUNCTION` utilise la donnée canonique `smn_member.professional_function`, sans confondre avec les parts Scrum Master / Product Owner / Développeur. Le tag `MEMBER_ROLE` conserve sa valeur précédente, identique à la fonction professionnelle, pour préserver les anciens documents. Une évolution dédiée pourrait distinguer les rôles Agile.

La localisation est celle effective à la fin du sprint (SMN-408). Les listes vides dans les tableaux Word/PowerPoint suivent la convention `N/D` ; dans une zone de texte PowerPoint, les libellés traduits sont « Aucun membre actif » / « No active members » et « Aucun membre inactif » / « No inactive members ».

## Compatibilité et sécurité

Le marqueur historique `{{ROW:MEMBERS}}` reste reconnu par le moteur pour la compatibilité des modèles précédents et fournit la réunion des deux ensembles. Il est retiré du catalogue visible. Aucun modèle ni rapport déjà généré n'est automatiquement modifié.

L'extraction s'effectue uniquement au travers des jointures vérifiant `team_id`, `cycleId` et l'installation autorisée, et ne récupère aucune affectation débutant après la date de référence. Les drapeaux Unicode de SMN-408 restent soumis à la compatibilité des polices MS Office.

## Fichiers concernés et validation

- `src/server/reports/office-word-rows.ts` : séparation active/inactive, source historique et fonction.
- `src/app/api/admin/reports/office-templates/generate/route.ts` : injection dans le moteur DOCX/PPTX.
- `scripts/smn-400-word-tables.mjs`, `scripts/smn-401-powerpoint-tables.mjs` : nouveaux marqueurs.
- `src/app/app/reports/office-tags.tsx` : deux familles visibles et documentation du tag fonction.
- `tests/smn-409-office-member-groups.test.ts` : affectations inclusives, anciens membres, rôles/fonctions, régressions Word et PowerPoint.

Recette finale : exécution TypeScript et lint, CI Windows/Linux, puis export réel d'un sprint avec membre parti, membre actif et nouvelle affectation future ; vérifier les deux tableaux indépendants et le rendu dans Word/PowerPoint sur Windows.
