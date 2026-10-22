# Contrat de développement — Centre Paramètres

**23/10/2026 — Approuvé fonctionnellement, non implémenté par cette publication.** Destinataire : Amelia, agent développeur BMAD v6.12.4.

Lire obligatoirement [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [RECETTE-UX.md](RECETTE-UX.md) et [CATALOGUE-ET-ROUTES.md](CATALOGUE-ET-ROUTES.md).

## Objectif

Créer depuis la sidebar rétractable une **page d'accueil Paramètres** affichant les **14 rubriques** dans les quatre familles approuvées, avec **bascule Cartes/Liste exclusive**, mémorisation du mode et accès aux réglages existants. **Ne pas développer 14 nouveaux formulaires.**

## Invariants métier

1. Respecter les profils SMN Administrateur / Utilisateur et les droits existants : un raccourci ne change pas les permissions d'une route/API (Audit, Sauvegardes, Utilisateurs, Sécurité).
2. Le mode Scrum/Kanban et le produit sont **immuables après initialisation**, cf. SMN-18.
3. Les modules conservent leurs propres API, validation, audit, versionnement et règles de temporalité ; aucune migration de données impliquée par l'indexation.
4. Interface **FR/EN**, tous libellés standard en **JSON de traduction centralisé** ; respect de thèmes et palettes, accessibilité et clavier.
5. Préférence Cartes/Liste **indépendante de la page Équipe**, conservée au retour/rechargement sans écriture métier.
6. Fonction inachevée : carte présente parmi les 14 si prévu au catalogue, honnêtement marquée « À compléter » ou « À venir » et non interactive ; **Intégrations** et **Notifications** absentes jusqu'à livraison de ces fonctions.
7. Préserver favoris, URLs, retours et navigation vers les écrans existants ; aucune page métier déplacée vers Paramètres par erreur.

## Inventaire technique vérifié sur GitHub main (23/10/2026)

| Source actuelle | Situation | Travail attendu |
|---|---|---|
| src/lib/private-navigation.ts | Groupe admin avec liens Paramètres, Cadence, Audit, Sauvegardes, Pays ; menu Équipe/Calendrier séparé | Ajouter/ranger une entrée principale Paramètres et éviter liens redondants sans supprimer les accès métier |
| src/app/app/admin/settings/page.tsx | Rend directement le formulaire général, largeur max 900px | Transformer en **portail** tout en conservant une route fonctionnelle au formulaire existant |
| src/app/app/admin/settings/settings-form.tsx | FR/EN, thème, palette, pays ; mode/produit en lecture seule | Réutiliser ce formulaire, proposer ancrages/langues/apparence, ne pas réécrire métier |
| src/app/app/admin/scrum-cadence | Réglages Scrum | Lien contextuel si mode Scrum |
| src/app/app/admin/sprints | Modèles/cérémonies mélangés avec exploitation des sprints | Identifier les composants du réglage, séparer accès sans casser création de Sprint |
| src/app/app/admin/development-capacity | Vue de capacité | Ne pas prétendre permettre de modifier toutes les règles de capacité |
| src/app/app/admin/countries | Pays + jours fériés CSV/ICS | Lien direct protégé |
| src/app/app/admin/company-closures | Fermetures collectives | Lien direct protégé |
| src/app/app/admin/absence-categories | Catégories | Lien direct protégé |
| src/app/app/admin/users | Comptes | Lien direct protégé |
| src/app/security | Mot de passe individuel et sécurité réservée à admin | Préserver le parcours personnel accessible aux utilisateurs ; carte portail administrateur sous permissions |
| src/app/app/admin/backups | Sauvegardes | Droits spécifiques et liens conservés |
| src/app/app/admin/audit | Journal d'audit | Droits spécifiques et liens conservés |

**Aucun module « Jours ouvrés » autonome vérifié** ; ne pas créer une fausse route. Les nouveaux réglages métier restent des US distinctes à cadrer.

## Lots indépendants et testables proposés

**Lot P1 — Menu et portail :** déplacer l'entrée principale, créer le centre à /app/admin/settings, préserver l'accès au formulaire SMN-18 sous une route non ambiguë ; tester contrôle d'accès et retour.

**Lot P2 — Registre des 14 rubriques :** définir 4 groupes ordonnés, labels FR/EN, icônes, descriptions, destinations réelles, capacité de filtrer par mode et droits, statuts Disponible / À compléter / À venir sans faux lien ; vérifier que les 2 futures rubriques sont masquées.

**Lot P3 — Deux représentations :** cartes 4/2/1, liste, bascule unique en haut à droite, choix mémorisé indépendamment d'Équipe, keyboard/a11y et thèmes.

**Lot P4 — Navigation unifiée et régressions :** raccorder les écrans disponibles et les retours au portail, retirer les doublons de liens administratifs, préserver les URLs existantes et les menus métier, vérifier confidentialité/permissions des routes et des API.

## Mapping Jira

**Epic : [SMN-223](https://lmn24.atlassian.net/browse/SMN-223).** [SMN-224](https://lmn24.atlassian.net/browse/SMN-224) = P1 ; [SMN-225](https://lmn24.atlassian.net/browse/SMN-225) = P2 ; [SMN-226](https://lmn24.atlassian.net/browse/SMN-226) = P3 ; [SMN-227](https://lmn24.atlassian.net/browse/SMN-227) = P4. Détails dans [DECOUPAGE-JIRA.md](DECOUPAGE-JIRA.md).

## Dépendances et exclusions

- **SMN-18** paramètres généraux, **SMN-15** comptes, **SMN-65** cadence, **SMN-32** rétention sauvegardes, **SMN-20** tâches optionnelles de configuration : ne pas modifier leurs règles existantes en les indexant.
- Les sujets « Jours ouvrés », nouvelles règles de capacité, console centralisée de sécurité/sessions : **cartes recensées mais fonctionnalités à spécifier/développer séparément** ; leur état reste « À venir/À compléter » tant que non disponibles. Ne pas inventer de configuration modifiable pour satisfaire une maquette.
- En mode Kanban, montrer seulement les réglages dont le périmètre est pertinent ; ne pas réutiliser Cadence Scrum comme si elle s'appliquait.
- Ne pas ajouter de lien vers une route 404, de composant inerte se présentant comme un bouton, ou de route sans contrôle serveur.

## Définition de terminé

P1–P4 vérifiés avec captures écran cartes/liste, contexte desktop large/tablette/mobile, FR/EN, tous thèmes/palettes, les 14 cartes, droits admin/user, navigation par URL directe, liens et retours, persistance du mode, aucun doublon de paramètres, non-régression de SMN-18 et des formulaires existants.

**Pas de GitHub Actions disponible dans le contexte d'exécution actuel :** indiquer précisément TypeScript/lint/tests/build réellement lancés (ou NON exécutés). Recette utilisateur indispensable. Le présent transfert est exclusivement documentaire et Jira, pas une implémentation.