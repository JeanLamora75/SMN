# Critères de recette — Centre Paramètres

**Statut initial : NON EXÉCUTÉ.** [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md) font autorité.

| ID | Test attendu | Statut |
|---|---|---|
| SET-01 | Dans la sidebar dépliée/repliée, Paramètres est visible et mène au **portail** et non au formulaire général | Non testé |
| SET-02 | Le portail utilise la pleine largeur de contenu disponible, pas un bloc artificiellement limité à 900px | Non testé |
| SET-03 | Les **14 rubriques** sont organisées dans l'ordre des quatre familles validées | Non testé |
| SET-04 | Vue Cartes : 4 colonnes lisibles grand desktop, 2 tablette et 1 mobile | Non testé |
| SET-05 | Haut droit : bascule par **2 icônes Cartes et Liste**, une seule sélectionnée | Non testé |
| SET-06 | Choisir Liste remplace intégralement les cartes, sans modifier ordre, intitulés, droits ou rubriques | Non testé |
| SET-07 | Recharger/revenir : dernier mode du portail conservé ; sans préférence, Cartes | Non testé |
| SET-08 | Basculer la vue du portail n'affecte **pas** la préférence d'affichage d'Équipe | Non testé |
| SET-09 | Une carte/ligne active entière ouvre la même destination, au clic et à Enter | Non testé |
| SET-10 | Informations générales, Langues, Apparence : accès aux **sections réelles** du formulaire SMN-18 sans doublon d'enregistrement | Non testé |
| SET-11 | Cadence Scrum, Pays/Jours fériés, Fermetures, Catégories, Utilisateurs : accès aux routes existantes autorisées et retour Paramètres | Non testé |
| SET-12 | Sauvegardes et Audit : seules les personnes autorisées voient/ouvrent les liens ; URL et API restent protégées | Non testé |
| SET-13 | Cérémonies, Capacité, Jours ouvrés et Sécurité/sessions : état **Disponible / À compléter / À venir** fidèle à l'implémentation, aucune page 404 | Non testé |
| SET-14 | Intégrations externes et Notifications **absentes** de la page tant que non livrées | Non testé |
| SET-15 | Mode Kanban : aucune présentation trompeuse des réglages réservés aux Sprints Scrum | Non testé |
| SET-16 | Les anciennes URLs actives et favoris continuent à fonctionner ou redirigent correctement | Non testé |
| SET-17 | Les pages opérationnelles Équipe, Calendrier et Sprints restent accessibles via les menus métier appropriés | Non testé |
| SET-18 | Compte Utilisateur : aucun élargissement d'accès aux écrans ou opérations admin en cliquant les cartes ou en saisissant l'URL | Non testé |
| SET-19 | Navigation seule et bascule Cartes/Liste : **aucune modification du paramétrage métier ni de son historique** | Non testé |
| SET-20 | FR/EN, thème clair/sombre, palettes, zoom 200 %, focus clavier, lecteur d'écran : rendu lisible, sélection annoncée | Non testé |
| SET-21 | Erreur technique d'une rubrique : pas de fausse mention « à venir », pas de succès mensonger | Non testé |
| SET-22 | La modification et sauvegarde d'une préférence existante suit toujours ses contrôles actuels, sans régression SMN-18 | Non testé |

Preuves demandées : captures du portail Cartes/Liste desktop + mobile, routes et retours des rubriques accessibles, statut des fonctionnalités partielles, trace d'autorisation/403 API, vérification des deux langues et thèmes, liste de tests/commandes réellement exécutés et résultats. **Rédaction de ces critères ≠ exécution d'une recette.**