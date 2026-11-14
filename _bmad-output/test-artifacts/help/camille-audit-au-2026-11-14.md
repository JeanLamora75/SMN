# Audit AU — Documentation utilisateur du module Aide SMN

**Agent :** Camille, rédaction et maintenance documentaire  
**Consultation des sources :** 2026-11-14  
**Périmètre :** `content/help/fr/`, `content/help/en/`, les index, catalogue, permissions, aide contextuelle, recherche, tests et preuves CI  
**Nature :** audit en lecture du dépôt ; **aucun article, index, composant runtime ou statut Jira modifié**.

## Méthode et niveaux de preuve

1. Identifier les **14 IDs canoniques** depuis `src/lib/help-catalog.ts` et comparer les index `content/help/.index/fr.json` et `en.json` : **14/14 IDs présents dans chaque langue**, pas de différence d'ensemble.
2. Lire manuellement les **28 fichiers Markdown** et vérifier leur structure (titre, sections, contenu FR/EN), les parcours annoncés et les liens `/app`.
3. Comparer les opérations significatives aux producteurs réels : `src/lib/ticket-csv-contract.ts`, `src/lib/help-setup.ts`, `src/server/help-content.ts`, `src/server/help-search.ts`, `src/server/access-policy.ts`, `src/lib/registry-types.ts`, et les pages métier concernées.
4. Examiner la cartographie `HelpHeaderAction`, ses utilisations effectives dans les pages, et le composant de paramètres mutualisé `SettingsPageShell`.
5. Vérifier les journaux de la [CI dédiée](https://github.com/JeanLamora75/SMN/actions/runs/43649225821), **success**, commit `85fcaa671380414a815ecd16d9481fad498be26f` : contrôle des index, garde-fous offline, suites Node, Chromium ×3, typage, i18n et build. Il s'agit de tests automatisés avec fixtures, pas d'une recette Windows réelle.

**Vérifié** signifie preuve du fait précisément indiqué, **partiel** signifie contenu existant mais procédure ou parcours non attesté de bout en bout ; **non attesté** signifie preuve insuffisante. La présence des fichiers FR/EN n'implique pas la justesse de toutes les instructions.

## Couverture des 14 articles

| Article canonique | FR | EN | Évaluation fonctionnelle documentaire | Action proposée |
|---|---|---|---|---|
| `overview` | Présent | Présent | **Partiel** : liste de liens administratifs dans un guide visible aux utilisateurs ordinaires ; certaines routes de destination ne leur sont pas ouvertes | Adapter la navigation par rôle ou supprimer les liens administratifs non applicables |
| `general-settings` | Présent | Présent | **Partiel** : instructions génériques « voir les champs » sans explication des options réelles | Détailler les champs et leurs effets après vérification |
| `teams` | Présent | Présent | **Partiel** : création attestée par `team-create-button`, mais pas de procédure précise des champs et de leur validation | Vérifier le formulaire réel et préciser le guide |
| `members` | Présent | Présent | **Partiel** : création et gestion présentes dans `team-overview.tsx`, sans aide contextuelle raccordée à cet écran | Raccorder la modale, documenter les onglets, affectations et états |
| `sprints` | Présent | Présent | **Partiel** : lien et écran Scrum vérifiés, procédure de génération trop générale pour servir de tutoriel complet | Documenter les prérequis de génération et contrôles |
| `kanban-periods` | Présent | Présent | **Partiel** : page utilisable en lecture par rôle standard mais aide classée `settings` donc inaccessible à ce rôle ; pas d'aide contextuelle sur cette page | Corriger le décalage documentaire des droits et raccorder l'aide |
| `tickets` | Présent | Présent | **Vérifié sur contrat** : 6 en-têtes `id,type,resume,priority,status,sp`, formats et limites cohérents avec `ticket-csv-contract.ts` et suites CI ; opération réelle non testée ici | Conserver ; recette authentifiée d'import à joindre |
| `calendar` | Présent | Présent | **Partiel** : route calendrier vérifiée, texte générique ; aide contextuelle absente de cet écran et liens administratifs non filtrés pour les lecteurs standards | Compléter actions réelles et raccorder l'aide |
| `registries` | Présent | Présent | **Partiel** : le guide évoque risques/obstacles/dépendances ; la source expose aussi **décisions, actions et faits marquants** | Étendre la couverture des types et statuts, sans inventer des actions |
| `reports` | Présent | Présent | **Partiel** : module réel doté d'onglets modèles, tags, archives et rapports ; guide reste volontairement très générique | Documenter le parcours modèles → tags → génération/consultation, suivant les droits |
| `indicators` | Présent | Présent | **Partiel** : fonctions manuelles/formules pertinentes, mais workflows et prérequis de publication/calcul non détaillés | Préciser les scénarios d'erreur et droits après code/CI |
| `faq` | Présent | Présent | **Partiel** : couvre huit questions utiles ; le lien intitulé « guide de première configuration » mène au Centre d'aide `/app/help`, pas directement à `overview` | Corriger la destination ou le libellé du lien |
| `jira-settings` | Présent | Présent | **Partiel** : page réservée à l'admin vérifiée ; guide imprécis sur les champs et prérequis de connexion | Ajouter les paramètres attestés, préserver la confidentialité |
| `backup` | Présent | Présent | **Partiel** : onglet sauvegardes effectivement conditionnel sous Maintenance ; procédures de sécurité conservatrices | Qualifier création/restauration sur installation réelle, sans suggérer PowerShell |

**Conclusion de couverture :** 14/14 fichiers dans chaque langue, soit **100 % de couverture des IDs**, mais **pas 100 % de couverture des parcours ni des aides contextuelles**. La traduction FR/EN ne présente pas de divergence majeure de sens identifiée lors de cette lecture ; aucune revue linguistique externe n'a été réalisée.

## Écarts prioritaires et preuves

### AU-01 — Aide Kanban non alignée sur l'accès réel (P1 UX)
- `src/lib/help-catalog.ts` déclare `kanban-periods` avec `resource:"settings"`.
- `src/server/access-policy.ts` réserve cette ressource aux administrateurs.
- `src/app/app/admin/kanban-periods/page.tsx` permet la lecture aux comptes ayant `collective:read`, y compris les utilisateurs actifs standards.
- **Conséquence vérifiable par contrat :** un utilisateur standard autorisé à consulter sa liste de périodes n'a pas accès à l'article `kanban-periods`.
- **Recommandation Winston/Amelia :** aligner le droit de lecture de l'aide sur celui du module, en maintenant la gestion des périodes restreinte aux administrateurs. Ajouter des tests `user` en Kanban.

### AU-02 — Aide contextuelle sur des modules documentés mais non raccordés (P2)
- `src/app/app/help/help-header-action.tsx` ne mappe pas `/app/admin/members`, `/app/team-calendar`, `/app/admin/kanban-periods`.
- Les vues correspondantes consultées n'intègrent pas `HelpHeaderAction` ; à l'inverse, les Paramètres bénéficient du composant partagé `SettingsPageShell`, et Sprints, Tickets, Rapports, Indicateurs et Registres possèdent des points d'entrée.
- **Action Amelia :** ajouter des boutons d'aide contextuelle aux en-têtes concernés et un test de clic réel sur chaque vue ; préserver le focus et les brouillons. La seule présence de `contexts` dans le catalogue n'affiche pas un bouton.

### AU-03 — Liens sensibles dans des articles ouverts aux utilisateurs standards (P2)
- `overview` (`collective`) contient des liens vers `/app/admin/settings/*`, `/app/admin/members` et Maintenance, y compris si le lecteur n'a pas les droits.
- `calendar` (`collective`) pointe aussi vers les membres et les paramètres des jours travaillés.
- `faq` (`collective`) présente un lien direct vers Maintenance.
- **Il ne s'agit pas d'une fuite d'accès** : les pages restent protégées côté serveur. Mais les liens donnent aux utilisateurs un parcours inutile ou trompeur.
- **Action Winston/Camille :** arbitrer une stratégie de liens selon droits ou remplacer les renvois administratifs par des libellés de prérequis non cliquables pour les lecteurs standards ; tester le rôle `user`.

### AU-04 — Couverture des registres incomplète (P2 documentaire)
- `src/lib/registry-types.ts` définit les six types `risk, obstacle, dependency, decision, action, highlight`.
- `content/help/{fr,en}/registries.md` développe surtout risques, obstacles et dépendances, sans parcours pour décisions, actions et faits marquants.
- **Action Camille :** revoir les types, états et formulaires effectifs puis compléter les guides dans les deux langues.

### AU-05 — Guides d'exploitation trop génériques (P2 documentaire)
- `reports`, `members`, `general-settings`, et dans une moindre mesure `teams`/`jira-settings`, décrivent surtout « ouvrir, regarder, enregistrer ».
- Le code dispose de fonctions plus précises (onglets Rapports, modèles Office, tags, formulaires membres, validations).
- **Action Camille après revue fonctionnelle :** produire des scénarios guidés et testables, avec état attendu, prérequis d'accès, erreur fréquente et capture anonymisée si approuvée par Sally.

### AU-06 — Accès direct à la bonne réponse FAQ (P3)
- Le lien « guide de première configuration » de `faq.md` renvoie à `/app/help`, et non `/app/help?article=overview`. Il ne s'agit pas d'une 404 mais d'une navigation indirecte.
- **Action Camille :** corriger texte et destination en FR/EN, puis régénérer les index.

### AU-07 — Documentation technique de maintenance datée (P3)
- `content/help/README.md` parle au futur de la qualification SMN-468 ; des tests et une CI ont depuis été ajoutés.
- **Action Camille :** mettre à jour l'état des tests **sans prétendre que l'installation Windows réelle hors Internet est qualifiée**.

## Exigences validées par CI et preuves encore absentes

**Attesté dans les journaux :** génération/vérification des deux index ; présence locale des 28 fichiers ; contrats droits et recherche ; contrôles de chargement différé par code ; 3 répétitions de scénarios Chromium sur fixtures ; pilotage Camille ; typecheck, i18n et build. [Run 43649225821](https://github.com/JeanLamora75/SMN/actions/runs/43649225821).

**Non attesté de bout en bout :** parcours du Centre d'aide authentifié en rôles `admin`/`user`, mesure réseau initiale, aucun SQL écrit sur PostgreSQL réel pendant la navigation, ergonomie 200 % zoom et palettes, **ZIP Windows réellement installé sans Internet externe** et qualité des traductions par relecture humaine.

## Ordre de reprise recommandé

1. **Winston/Amelia + Murat :** corriger AU-01 avec tests des autorisations alignées.
2. **Amelia/Sally :** AU-02, les trois points d'entrée contextuels manquants.
3. **Winston/Camille :** décider AU-03 (liens selon rôles) avant de modifier les articles partagés.
4. **Camille :** prendre en charge AU-04, AU-05 et AU-06 en FR/EN, régénérer les index et laisser Murat confirmer les tests.
5. **Murat :** poursuivre les preuves d'installation et d'absence d'écriture réelle. Ne pas déclarer l'Epic clôturée sur la seule CI Aide.

## Périmètre des modifications

Audit documentaire **uniquement** ; ni article utilisateur ni catalogue, route, code runtime, Jira, index, base de données ou CI modifiés. Les correctifs nécessitent validation de périmètre technique avec Winston/Amelia, et Murat qualifie la recette. Aucun script `uv` exécuté.
