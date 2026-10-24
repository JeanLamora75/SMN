# Prompt de développement à transmettre à Amelia — calendrier SMN Option B

Tu es **Amelia**, agent développeur du framework **BMAD Method v6.12.4**. Reprends le développement de **Scrum Master Notebook (SMN)** sur le dépôt [JeanLamora75/SMN](https://github.com/JeanLamora75/SMN), branche **`main`**.

## Mandat

**Implémente le calendrier d'équipe conformément à la maquette UX option B approuvée par l'utilisateur le 24 octobre 2026**, sans réinterpréter librement ses choix. Je veux un rendu **aussi proche que possible de la maquette** en structure, hiérarchie, densité, position des commandes, présentation des événements et bascule de vue, avec adaptation stricte aux composants, thèmes, traductions et données réelles de SMN.

### 1. Lis obligatoirement ces sources AVANT de modifier le code

1. `.agents/skills/bmad-agent-dev/SKILL.md`, puis personnalisation et configuration BMAD nécessaires.
2. `docs/UX-REFERENTIEL-BMAD.md`.
3. `_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md` et `CALENDRIER-RECETTE-UX.md` : les décisions du 22/10 toujours en vigueur.
4. **Nouveau paquet UX approuvé** (à placer dans `_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/`) : `README.md`, `DESIGN.md`, `EXPERIENCE.md`, `RECETTE-UX.md`, `MAQUETTE-CALENDRIER-OPTION-B.html`.
5. Code actuel avant intervention, notamment `src/app/app/team-calendar/team-calendar-view.tsx`, `src/app/app/team-calendar/page.tsx`, `src/app/globals.css`, `src/app/appearance.css`, `src/server/members/team-calendar.ts`, `src/server/members/central-calendar.ts` et les routes API correspondantes.

En cas de conflit, appliquer les décisions explicites du 24/10 **sur leurs seuls points nouveaux** ; conserver les règles du 22/10 pour le reste. Les **contrats écrits DESIGN/EXPERIENCE prévalent sur la maquette interactive** lorsqu'elle simule volontairement des données ou des fonctionnalités.

### 2. Choix UX NON NÉGOCIABLES

**Bascule Cartes / Agenda**
- `Cartes` par défaut, `Agenda` en vue secondaire, avec deux commandes visibles, états actifs clairs, deux vues mutuellement exclusives.
- Même équipe, même Sprint/période, mêmes filtres, mêmes événements et absences dans les deux vues ; aucun changement de cycle lors de la bascule.
- Ne pas limiter le calendrier réel aux **14 jours fictifs** du HTML : préserver la **période complète** [début ; fin] incluse, ou le **mois civil entier** en absence de Sprint/période, avec **7 cartes par rangée à partir du premier jour** sur desktop.

**Affichage des absences — priorité absolue**
- Pour chaque journée contenant au moins une **absence réelle enregistrée**, afficher **UNE SEULE ligne, obligatoirement la PREMIÈRE de la zone événements**, avec le libellé exact de référence **`Absences (N)`** (traductions FR/EN).
- **N = nombre de MEMBRES DISTINCTS** de l'équipe affectés ce jour-là et ayant une absence valide couvrant tout ou partie de la journée. Aucune multiplication due à plusieurs enregistrements pour une même personne (deux demi-journées, périodes qui se chevauchent ou catégories multiples).
- Le compteur **n'inclut pas** les personnes uniquement indisponibles pour cause de jour férié national, fermeture collective ou calendrier individuel non travaillé, sauf si elles possèdent également une absence personnelle enregistrée.
- Ne jamais utiliser directement `collective.reportedUnavailable` comme N : dans la version actuelle du code ce champ **inclut aussi les jours fériés et les fermetures**. Construire un agrégat métier distinct côté serveur à partir des absences individuelles, **sans divulguer les memberId, motifs ni catégories personnelles au rôle `user`**.
- Le bandeau d'absences tient **strictement sur une seule ligne**, sans nom, motif, catégorie, durée ni deuxième ligne d'informations. Il est **au-dessus de toutes les réunions**, même une réunion de 08:00. Il apparaît de manière **identique dans Cartes et Agenda**. S'il n'y a pas d'absence, il n'apparaît pas du tout (pas de `Absences (0)`). Si la donnée manque, afficher un état d'incertitude, pas un faux zéro.
- Exemple impératif : A absent matin + après-midi (2 enregistrements), B absent toute la journée (1 enregistrement) → **`Absences (2)`** ; une ligne, pas trois et pas `Absences (3)`.

**Présentation fidèle**
- Conserver l'en-tête de contexte équipe/Sprint avec dates lisibles, navigation précédente/aujourd'hui/suivante ; barre d'outils avec filtres `Cérémonies et réunions` et `Absences`, bascule à droite ; légende.
- Cartes **compactes**, sans grandes zones vides artificielles ; dates saillantes, fériés directement sous la date, espace avant événements ; rendu proche du HTML approuvé. **Icônes Bootstrap Icons** distinctes pour Planning, Daily, Review, Rétrospective, Affinage, et générique pour les autres réunions. Heures début/fin consultables ; liens fonctionnels vers les fiches de réunions.
- Ordre : **bandeau Absences (N) en premier**, puis cérémonies/réunions dans l'ordre des heures de début, avec d'autres événements existants représentés selon leur nature.
- **Actions en pied**, et non `+` isolé en haut : `+ Réunion` et `+ Absence` côte à côte sur les jours de lundi à vendredi où elles sont autorisées, **y compris jour férié**. **Aucun plus le week-end**. Conserver les modales distinctes, le préremplissage et les validations métier, les droits admin/user, les contrôles serveur et l'historisation.
- États aujourd'hui, week-end, férié, période clôturée, erreur et vide fidèles aux contrats. Préserver FR/EN et tous les thèmes SMN (clair/sombre, ocean/forest/violet) ; ne pas recopier aveuglément les couleurs hexadécimales du prototype.

### 3. Méthode d'implémentation demandée

1. Effectue un **audit technique précis de l'existant** et liste les écarts à `DESIGN.md`/`EXPERIENCE.md` (UI, DTO, sécurité, API, CSS, responsive). Ne supprime ni accès ni fonctionnalités du calendrier historique.
2. Présente un **plan en étapes courtes** (agrégat serveur sécurisé ; composants et ordre métier ; vue Cartes ; vue Agenda ; actions/filtres/accessibilité ; tests/recette) avec dépendances éventuelles.
3. Implémente **sur `main`** dans le cadre de ce mandat, sans modifier Jira sans nouvel accord. Si une décision métier nouvelle est nécessaire, la remonter au lieu de l'inventer. Respecte l'architecture existante et évite les refontes sans rapport.
4. Ajoute des tests ciblés pour le **comptage distinct** (A+A+B=2), la confidentialité du JSON `user`, l'ordre absence→réunions, les dates, la synchronisation Cartes/Agenda, les jours fériés et permissions.
5. Exécute réellement les contrôles disponibles localement : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, tests ciblés puis `pnpm build` lorsque l'environnement le permet. **GitHub Actions est indisponible** ; ne prétends pas avoir exécuté une vérification non réalisée.
6. Fournis les **captures d'écran comparées à la maquette** en desktop (Cartes et Agenda), petite largeur, thème sombre et cas `Absences (2)` ; remets une grille de recette `UXB-01` à `UXB-30` avec preuve, résultat et écarts. Toute déviation visuelle doit être signalée et justifiée ; **ne déclare pas le développement fini avant validation utilisateur**.

### 4. Définition du succès

Le premier regard sur une journée permet de voir immédiatement : **date → Absences (N) si N>0 → cérémonies/réunions avec pictogrammes et heures → actions autorisées en bas**. Cliquer sur **Agenda** conserve strictement cette information et cet ordre. La présence de données réelles, la sécurité des rôles, l'absence de double comptage et la proximité visuelle de la maquette sont des critères bloquants.

**Important :** la maquette et les documents UX ont été préparés par Sally **sans modifier le dépôt ni Jira**. Avant développement, vérifie que les cinq fichiers du paquet ont bien été intégrés ou fournis dans la conversation. Ne prétends pas qu'ils sont déjà publiés sur `main` s'ils ne s'y trouvent pas.