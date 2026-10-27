# SMN — Brief BMAD Product Manager — Module Liens et ressources

**Auteur :** John (Product Manager, BMAD v6.12.4)  
**Date :** 27 octobre 2026  
**Statut :** cadrage fonctionnel validé sur les décisions D01–D09 ; UX et faisabilité technique à confirmer.  
**Périmètre :** Scrum Master Notebook (SMN), Scrum/Kanban multiéquipes ; SAFe/RTE selon évolution du produit.  
**Références :** `.agents/skills/bmad-agent-pm/SKILL.md`, `docs/UX-REFERENTIEL-BMAD.md`, `_bmad-output/planning-artifacts/ux-designs/ux-parametres-cockpit-2026-10-27/`, Epic SMN-228 (Cockpit Agile), travaux multiéquipes SMN-282, modales SMN-298.

## 1. Vision, problème et résultat attendu
Permettre au Scrum Master/RTE de conserver et retrouver des hyperliens utiles, transverses à toute l'application ou spécifiques à une équipe, puis de les réutiliser comme références cliquables dans le Studio Rapports. Réduire la ressaisie, respecter l'isolation multiéquipes et conserver l'intégrité des rapports publiés. Pas de stockage ni de récupération du contenu des sites cibles.

## 2. Décisions métier confirmées
- **D01** — Création et édition depuis la page **Liens** ; administration globale depuis **Paramètres**.
- **D02** — Les rapports publiés conservent une copie historique des références au moment de la publication.
- **D03** — Catégories configurables dans Paramètres.
- **D04** — Pour un nouveau lien spécifique, équipe du header proposée par défaut.
- **D05** — Administration des liens transverses réservée aux administrateurs.
- **D06** — Dans le Studio Rapports, choix parmi les liens transverses et ceux de l'équipe du rapport.
- **D07** — Gestion des liens spécifiques par administrateurs et utilisateurs habilités à intervenir sur l'équipe.
- **D08** — Catalogue de catégories commun à toutes les équipes.
- **D09** — Suppression directe avec confirmation (pas d'archivage obligatoire).

## 3. Parcours et exigences
### 3.1 Menu / page Liens
- Nouvelle entrée **Liens**, proposée entre **Registre** et **Rapports** dans la navigation.
- Page d'accueil alignée sur le design **Cockpit Agile** : en-tête, recherche, filtres, tri, compteur, bascule exclusive **Cartes / Liste**, responsive, préférences de vue si conventions SMN le permettent.
- Vue par défaut : **liens transverses + liens spécifiques de l'équipe active autorisés à l'utilisateur** ; filtres de périmètre et de catégorie.
- Chaque lien présente au minimum titre, description facultative, catégorie, portée et action **Ouvrir**. Ouverture de l'URL externe dans un nouvel onglet (ou fenêtre selon navigateur), avec protections usuelles `noopener/noreferrer`.
- Aucun lien d'une équipe non autorisée ne doit être exposé dans les listes, la recherche, les API ou les exports.

### 3.2 Données
Un lien comporte : identifiant stable, titre obligatoire, URL HTTP(S) obligatoire validée, description facultative, catégorie globale obligatoire, portée `TRANSVERSE | EQUIPE`, identifiant d'équipe requis seulement pour `EQUIPE`, dates de création et dernière modification, acteur si disponible. La même URL peut apparaître dans plusieurs liens ; ne pas imposer d'unicité globale sur l'URL.
Les catégories sont configurées à l'échelle de SMN (proposition de valeurs initiales : Outils, Documentation, Référentiels Agile, Projet, Autre ; à valider à l'UX / avec l'existant). Le comportement en cas de suppression d'une catégorie utilisée reste à spécifier avant développement : proposer un mécanisme sans données orphelines.

### 3.3 Création, édition et suppression
- Actions directement depuis la page Liens via les modales communes Cockpit Agile. Création spécifique : préremplir l'équipe du header ; un changement de contexte pendant l'édition ne transfère jamais silencieusement le lien.
- Les utilisateurs habilités agissent seulement sur les liens spécifiques des équipes auxquelles ils ont droit ; administrateur seul pour liens transverses, gestion des catégories et changements de périmètre/transferts.
- Suppression immédiate du catalogue après confirmation explicite et contrôle serveur des droits ; aucune destruction des copies conservées dans les rapports déjà publiés.
- Définir le comportement précis des liens déjà insérés dans des **brouillons** lorsqu'ils sont supprimés, transférés ou rendus non accessibles : signalement clair et blocage/contrôle avant publication, sans perte silencieuse.

### 3.4 Administration globale dans Paramètres
- Point d'entrée **Gestion des liens** intégré à l'organisation actuelle du Centre Paramètres, à harmoniser avec le contrat Cockpit Paramètres du 27/10/2026 (sans rétablir des navigations obsolètes).
- Inventaire administrateur de tous les liens, recherche et filtres par équipe, catégorie et portée ; gestion des catégories globales.
- Actions d'administration : lien spécifique → transverse ; transverse → spécifique avec choix obligatoire d'une équipe ; transfert d'une équipe vers une autre ; édition ; suppression confirmée.
- Changements de portée et d'équipe tracés dans l'audit existant si son infrastructure le permet ; sinon expliciter la dépendance et créer le besoin technique correspondant.
- La mutation des périmètres s'applique aux catalogues actifs et ne réécrit pas les rapports déjà publiés.

### 3.5 Intégration Studio Rapports
- Bloc **Liens et références** permettant une sélection explicite et un ordre d'affichage ; seuls les liens transverses et ceux de **l'équipe du rapport** sont sélectionnables (contrôle côté serveur).
- Dans le brouillon, la sélection peut être mise à jour et les liens indisponibles doivent être signalés.
- **À la publication**, figer au minimum identifiant logique, titre, URL, description si utilisée, catégorie/libellé affiché, ordre et instant de capture ; ne plus dépendre du catalogue actif pour afficher les références publiées.
- Exports PDF avec hyperliens cliquables, Markdown avec liens Markdown, et autres formats uniquement si déjà pris en charge dans le produit. La conservation d'une URL n'assure pas sa disponibilité externe ultérieure.
- Ne pas modifier rétroactivement la référence d'un rapport publié si l'URL, la catégorie, la portée, l'équipe ou le lien source changent ou sont supprimés.

## 4. Sécurité, UX et règles transverses
- Contrôles d'autorisation **serveur** systématiques : lecture, recherche, détail, création, modification, suppression, transfert, intégration Studio et exports ; aucune confiance accordée au seul sélecteur d'équipe du header.
- Respect des droits multiéquipes en cours de développement : ne pas supposer que le modèle d'habilitation v1 est déjà livré. Les habilitations fines dépendant de la future gestion des comptes ne doivent pas être inventées.
- Gestion de l'URL externe : n'accepter que `http://` et `https://` ; ne pas interpréter/ouvrir de protocole dangereux ; absence d'extraction/fetch serveur automatique.
- FR/EN via i18n existant ; thèmes configurables, clavier, focus, erreurs, validation, responsive, contrastes ; modales cohérentes avec SMN-298.
- L'ouverture d'un hyperlien est une action distincte de son édition ; éviter tout clic de carte déclenchant une édition involontaire.

## 5. Proposition de découpage en stories (sans numéro Jira)
1. **US-LIENS-01** — Référentiel données, catégories et isolation serveur multiéquipes.
2. **US-LIENS-02** — Page Cockpit Liens : liste, cartes, recherche, filtres et ouverture externe.
3. **US-LIENS-03** — Modales de création, édition et suppression avec autorisations.
4. **US-LIENS-04** — Administration globale et transfert/convertissement de portée.
5. **US-LIENS-05** — Catalogue commun de catégories dans Paramètres.
6. **US-LIENS-06** — Sélection de références dans le Studio Rapports et exports.
7. **US-LIENS-07** — Copies immuables des références à la publication et gestion des brouillons.
8. **US-LIENS-08** — Couverture de tests / recette intégrée : sécurité, permissions, FR/EN, multi-thèmes, PDF/Markdown et non-régression.

**Dépendances principales :** SMN-282 (multiéquipes), Centre Paramètres Cockpit 2026-10-27, SMN-298 (modales), mécanisme de publication/export du Studio Rapports, audit/habilitations existants. Les identifiants définitifs d'Epic et de Stories seront attribués après validation et création Jira, non dans ce brief.

## 6. Critères d'acceptation transverses
1. Avec équipe A active, un utilisateur habilité voit les liens transverses et ceux de A, jamais les liens de B sans droits.
2. Une tentative d'accès API à un lien privé d'une autre équipe est refusée même en manipulant les paramètres.
3. Un utilisateur non administrateur ne peut créer, éditer, supprimer ou transformer de lien transverse.
4. Un administrateur peut convertir la portée et transférer un lien ; l'effet sur la visibilité est immédiat après actualisation ; aucune altération des références publiées.
5. Une création spécifique propose par défaut l'équipe du header ; l'équipe existante ne change pas par simple navigation.
6. Les catégories configurées dans Paramètres sont réutilisées par toutes les équipes.
7. Une suppression demande confirmation ; les liens du catalogue cessent d'être consultables, mais les rapports publiés conservent leurs snapshots.
8. Un rapport ne peut sélectionner que les liens de son équipe et les liens transverses, indépendamment de l'équipe courante du header.
9. Un export PDF expose des liens cliquables et l'export Markdown des liens correctement sérialisés ; références publiées inchangées après mutation de la source.
10. Cartes/Liste, traduction FR/EN, thèmes, accessibilité clavier, modales et responsive respectent les contrats UX approuvés.

## 7. Points à instruire par Sally et Amelia (non décidés)
- Ergonomie de la page et de Paramètres ; densité et actions Cartes/Liste ; filtres ; affichage des URLs longues et états vides.
- UX de sélection et ordre des références dans le Studio, notamment en cas de lien indisponible en brouillon.
- Détail des permissions existantes sur les comptes `user` avant livraison v1 ; voie sûre de migration vers des droits plus fins.
- Stratégie de retrait d'une catégorie utilisée ; conventions de journal d'audit ; compromis UX lors de la suppression.
- Intégration technique réelle aux fichiers de rapport exportés, au schéma et aux services existants.
Ces sujets requièrent une validation en cas de décision fonctionnelle nouvelle ; ne pas les considérer comme implicitement tranchés.

## 8. Hors périmètre
- Synchronisation distante, exploration automatique des sites, extraction du contenu, surveillance de disponibilité, authentification SSO auprès des URL externes, favoris personnels, gestion documentaire (upload de fichiers), partage public inter-organisations.
- Modification des rapports publiés ou contournement des habilitations multiéquipes.

## 9. Suite BMAD / mandat Sally
Activer `.agents/skills/bmad-agent-ux-designer/SKILL.md` depuis GitHub et charger les références nécessaires. Produire dans `_bmad-output/planning-artifacts/ux-designs/` une proposition **DESIGN.md** et **EXPERIENCE.md** couvrant la page Liens (Cartes/Liste), modales, filtres, administration Paramètres, sélection Studio Rapports et états limites. Réutiliser le référentiel UX approuvé et signaler les arbitrages à valider, sans modifier Jira ni implémenter du code à ce stade.
