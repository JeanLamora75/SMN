---
name: SMN — Centre de paramètres
status: final
updated: 2026-10-23
description: Contrat d'expérience pour navigation Paramètres, cartes/liste et accès aux écrans existants.
sources:
  - https://lmn24.atlassian.net/browse/SMN-18
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
---

# EXPERIENCE.md — Centre Paramètres SMN

**Contrat fonctionnel/UX approuvé en conversation le 23/10/2026.** [DESIGN.md](DESIGN.md) est la référence pour composition, disposition, typographie et tokens. Ici figurent les interactions et états. Aucun développement/test n'est attesté par ces documents.

## Foundation

- Public principal : **Administrateur Scrum Master / RTE** ; deux profils MVP déjà définis (Administrateur / Utilisateur).
- But : **un point d'entrée unique dans le menu rétractable gauche** pour retrouver les réglages généraux disponibles, sans détruire les écrans existants.
- **Regrouper les accès ≠ fusionner les bases, formulaires ou API**. Chaque écran reste propriétaire de sa validation et de son autorisation serveur.
- La page Paramètres est un **portail de configuration** ; les opérations courantes (création de sprint, membre, réunion, rapports) conservent leurs menus métier.
- Les préférences visuelles sont de l'UX, pas une modification de l'historique métier ; préserver FR/EN, thèmes et palettes existants.

## Information Architecture

Route d'accueil cible : **/app/admin/settings** (choix pour préserver le lien de navigation existant). Son contenu actuel « Informations générales » doit rester accessible par une **route fille ou route dédiée sans conflit**, à identifier lors du développement (proposition : /app/admin/settings/general). Ne pas écraser le formulaire SMN-18.

### Familles et rubriques exactement approuvées

| Famille | Rubrique | Comportement du centre à livrer | Existant vérifié | État UX avant développement |
|---|---|---|---|---|
| **Application et personnalisation** | Informations générales | Ouvrir réglages installation, pays de référence, mode/produit en lecture seule | /app/admin/settings, settings-form.tsx | Fonction existante ; route à adapter |
| | Langues | Ouvrir directement section langue (FR/EN) du formulaire existant | /app/admin/settings, même formulaire | Fonction existante ; lien d'ancrage/section à mettre en place |
| | Apparence | Ouvrir directement section thème/palette du formulaire existant | /app/admin/settings, même formulaire | Fonction existante ; lien d'ancrage/section à mettre en place |
| **Organisation Agile** | Cadence des sprints | Ouvrir paramètres durée/jours/heures/fuseau Scrum | /app/admin/scrum-cadence | Disponible en mode Scrum ; Kanban doit respecter sa route propriétaire |
| | Cérémonies et modèles | Accès au paramétrage des modèles des réunions de l'équipe, pas aux occurrences d'un sprint précis | Composants liés aux cérémonies/modèles dans /app/admin/sprints | **Partiel** : extraire/raccorder une vue de configuration clairement distincte de l'opérationnel |
| | Règles de capacité | Accès aux paramètres de calcul lorsque ces réglages existent, en conservant les écrans de consultation | /app/admin/development-capacity (consultation) | **À compléter** : écran de consultation ≠ règle paramétrable |
| **Calendriers et indisponibilités** | Jours ouvrés | Paramétrer la semaine de référence lorsqu'une API/règle configurable existe | Pas de page dédiée identifiée dans le code consulté ; décision métier lundi–vendredi en vigueur | **À créer** ; le centre ne doit pas modifier la référence lundi–vendredi par une simple option d'affichage |
| | Pays et jours fériés | Accès au référentiel national et imports CSV/ICS | /app/admin/countries | Disponible |
| | Fermetures d'entreprise | Accès aux périodes de fermeture collective | /app/admin/company-closures | Disponible |
| | Catégories d'absences | Accès à la gestion des catégories/couleurs | /app/admin/absence-categories | Disponible |
| **Administration et maintenance** | Utilisateurs et habilitations | Accès comptes utilisateur et rôles, distinct des membres d'équipe | /app/admin/users | Disponible |
| | Sécurité et sessions | Voir sécurité du compte et fonctions d'administration autorisées | /app/security (mot de passe + section admin), gestion de session répartie | **Partiel** : ne pas prétendre à une console centralisée déjà créée ; changement du mot de passe personnel doit rester accessible sans devoir entrer dans l'administration |
| | Sauvegardes | Accès à la gestion et restauration protégées | /app/admin/backups | Disponible avec contrôle de droits spécifique |
| | Journal d'audit | Accès à la traçabilité des opérations autorisées | /app/admin/audit | Disponible avec contrôle de droits spécifique |

**Total : 14 rubriques dans 4 familles.**

Deux rubriques futures hors centre MVP, **masquées** : **Intégrations externes** (Jira, GitHub...) et **Notifications**. La validation de leur nom n'autorise pas la création de connecteurs ou d'automatisations.

### Disponibilité des cartes

- Rubrique déjà fonctionnelle et accessible : **carte/ligne active** vers le véritable écran, avec retour « Paramètres ».
- Rubrique existante dans une autre page mais non autonome (Langues, Apparence, Cérémonies) : rendre le parcours **fonctionnel** par destination/section dédiée avant de l'annoncer disponible ; éviter de multiplier les copies de formulaires.
- Rubrique encore non implémentée : **rubrique toujours recensée parmi les 14**, mais **non interactive et honnêtement marquée « À venir » / « À compléter »**. Éviter toute route 404 ou page vide.
- **Mode Scrum/Kanban** : conditionner les rubriques de cadence au mode installé, sans masquer arbitrairement d'autres fonctions existantes ; conserver les invariants de l'installation.
- Afficher seulement les rubriques qu'un utilisateur connecté est autorisé à voir ; **le centre lui-même est administrateur** dans le MVP selon les droits actuels sur les paramètres. Ne pas afficher les motifs de sécurité/audit/sauvegarde à un compte non autorisé, même via une URL directe.

## Voice and Tone

Titres courts, description orientée tâche « Définir la cadence des futurs sprints », « Consulter les sauvegardes », pas jargon technique ni messages de disponibilité trompeurs. États : « À venir » (non livré), « À compléter » (fonction partielle), pas « En panne ». Les succès d'enregistrement s'affichent **dans l'écran métier**, pas sur le portail.

## Component Patterns

### Bascule Cartes/Liste

1. **Deux icônes en haut à droite** : grille / lignes, libellés accessibles « Affichage en cartes » et « Affichage en liste ».
2. **Mutuellement exclusifs** : une seule représentation rendue à la fois.
3. **Dernier choix mémorisé** entre visites/rechargements, selon un mécanisme sans données personnelles ; par défaut **Cartes** pour un profil sans préférence.
4. La sélection ne change **ni les rubriques disponibles, ni les droits, ni leur ordre**.
5. Toute carte/ligne active dispose d'une grande zone cliquable et d'une cible clavier menant à **la même URL**, sans clic éditant directement une valeur.
6. La sauvegarde de préférence d'affichage ne déclenche **aucune écriture métier**. Réutiliser si possible le mécanisme de préférence déjà déployé sur la page Équipe, sans collision entre préférences (la vue choisie pour Équipe ne doit pas forcer celle de Paramètres).

### Navigation et retour

- Menu latéral « Paramètres » toujours cohérent avec son état déplié/replié.
- Un clic sur le menu mène au **portail**, jamais directement au formulaire général.
- Depuis une rubrique, retour clair vers **Paramètres** sans effacer le brouillon ou invalider les protections de saisie de l'écran métier.
- Les anciennes URLs internes actives ou favoris ne doivent **pas casser** après la réorganisation ; redirections contrôlées si des routes sont déplacées.
- Le portail ne déplace **ni la page Équipe, ni Calendrier, ni création de sprint** (ce sont des opérations, pas des paramètres).

## State Patterns

- Chargement minimal de registre de rubriques ; afficher le catalogue même si un endpoint métier indisponible, sans faire passer une erreur de service pour « Fonction pas développée ».
- Rubrique interdite : ne pas laisser accès par manipulation d'URL, vérifier côté serveur ; pas de fuite du détail de sécurité/audit/backup.
- Rubrique planifiée : état annoncé clairement, pas de clic ni de chevron trompeur.
- Rubrique conditionnelle à Scrum/Kanban : indiquer le contexte et désactiver les entrées sans objet plutôt que simuler une disponibilité.
- Aucun réglage modifié par le seul affichage du portail ou par le changement de vue.

## Interaction Primitives

- Navigation via liens sémantiques, pas seulement onclick sur div ; focus visible, Enter, tabulation, annonce aria-pressed du bouton de vue sélectionné.
- Gestion des liens sous protection d'autorisation ; ne pas réécrire les règles serveur des rubriques lors de la centralisation.
- Retour arrière conserve le mode Cartes/Liste et la position si possible sans mécanisme fragile.

## Accessibility Floor

Navigation clavier complète, labels pour icônes seules, ordre de lecture « titre → contrôle de vue → famille → rubriques », contraste compatible thèmes, 200 % zoom, responsive mobile (4/2/1 selon espace réel). État non interactif non trompeur pour technologies d'assistance.

## Key Flows

**UX-PAR-01 — Administrateur configure l'apparence.** Il ouvre Paramètres dans la sidebar, reconnaît Apparence parmi les trois premières rubriques, clique la carte, rejoint la section correspondante de réglages existants, enregistre, revient au centre et retrouve sa vue préférée.

**UX-PAR-02 — Scrum Master consulte la cadence.** Il choisit Cadence des sprints, découvre l'écran actuel avec valeurs sauvegardées ; rien n'est modifié tant qu'il n'enregistre pas. Le passage en mode Liste sur le portail ne change jamais la cadence.

**UX-PAR-03 — Gestion sensible.** Un administrateur autorisé ouvre Sauvegardes ou Journal d'audit depuis la carte ; l'API conserve les vérifications d'autorisation. Un compte sans permission ne contourne rien en appelant la route directement.

**UX-PAR-04 — Fonction non encore livrée.** Le Scrum Master voit « Jours ouvrés — À venir », comprend que la semaine de référence actuelle est lundi–vendredi ; aucun lien factice n'ouvre une page 404.

## Inspiration & Anti-patterns

Réutiliser **l'UX Cartes/Liste validée pour Équipe** ; ne pas transformer Paramètres en matrice de formulaires inline, ne pas afficher un état « disponible » sur la seule base d'une route non fonctionnelle, ne pas confondre liste de **comptes utilisateurs** et **membres Agile**.

## Responsive & Platform

Desktop Windows 11, tablettes et navigateurs mobiles : cartes 4/2/1 selon largeur utile après sidebar, liste fluide, pas de scrolling horizontal systématique, préférence et navigation identiques.

## Périmètre et réserve

La création effective des **nouveaux moteurs de paramétrage** (jours ouvrés, nouvelles règles de capacité, administration complète des sessions), ainsi que les intégrations externes/notifications, **n'est pas incluse dans la simple refonte de la page d'accueil** et nécessite les décisions métier et Stories propriétaires appropriées.

[CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) et [RECETTE-UX.md](RECETTE-UX.md) servent de transfert à Amelia.

## Avenant validé le 23/10/2026 — Cohérence avec la refonte de Sprints

**Nouvelle Epic [SMN-228](https://lmn24.atlassian.net/browse/SMN-228)**, [Story SMN-229](https://lmn24.atlassian.net/browse/SMN-229). Cette décision ne change **ni les 14 rubriques, ni les quatre groupes, ni la bascule Cartes/Liste** validés pour Paramètres.

- **Jours ouvrés** : devenir le point d'édition des **plages horaires habituelles et de la pause déjeuner de l'équipe**, aujourd'hui disponibles dans la page Sprints via `WorkSlotsForm` et `LunchForm`. **Cela ne rend pas automatiquement la semaine lundi–vendredi configurable** ; si seules les plages sont éditables, l'état de la carte doit refléter une fonction partielle.
- **Cérémonies et modèles** : réhéberger les **modèles réutilisables** (`TemplateForm`) avec fréquence/horaires/durée ; les **occurrences générées** demeurent dans le Calendrier/sprint.
- **Cadence des sprints** : conserver sa page existante et sa temporalité, sans réécriture des cycles déjà créés.
- **Règles de capacité** : ne pas confondre règles générales (éventuelles) et métriques/capacités d'un sprint ; ne pas déclarer modifiable une règle qui n'existe pas.
- Déplacer les composants et les liens sans changer leur source métier ni leurs contrôles d'accès ; ne retirer les éditeurs de Sprints qu'après vérification des nouvelles routes.

Contrat normatif : [refonte Sprints EXPERIENCE.md](../ux-sprints-pilotage-2026-10-23/EXPERIENCE.md) et [matrice composants](../ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md). Les indications initiales ci-dessus (« Jours ouvrés à créer ») s'entendent désormais comme **absence d'un écran complet de configuration des jours**, pas comme absence totale de réglages d'horaires d'équipe.
