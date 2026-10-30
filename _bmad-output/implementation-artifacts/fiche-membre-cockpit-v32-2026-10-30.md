# Fiche membre — Cockpit Agile v32 — extension UX validée
Date : 30 octobre 2026 · Référence Jira : SMN-44 (amendement UX), dépendances SMN-43, SMN-53 et SMN-282.

## Besoin
Optimiser l'exploitation de la fiche membre sans scrolling inutile et conserver l'isolation interéquipes.
- Bandeau de contexte pleine largeur avec nom, rôles Agile issus des pourcentages d'affectation (>0), fonction professionnelle issue de smn_member.professional_function et mention lecture seule.
- Grille desktop à trois unités : bloc historique sur une unité ; bloc Calendrier sur deux unités.
- Deux demi-tableaux côte à côte représentant respectivement la première et la seconde moitié des jours disponibles du mois consulté, avec retour à une seule colonne sur écran étroit.
- Quatre synthèses dans le panneau Historique : début, allocation, part développeur, cumul annuel en demi-journées de présence absente.
- Dates civiles localisées FR/EN par Intl.DateTimeFormat sans interprétation des dates comme instants locaux susceptibles de changer de jour.

## Règles fonctionnelles et sécurité
1. Le périmètre du calendrier et du cumul annuel est strictement l'intersection des dates d'affectation à l'équipe autorisée et des absences centrales du membre ; les autres périodes d'équipe sont exclues.
2. Les motifs personnels, catégories et données médicales ne sont jamais envoyés au client ; la consultation reste réservée à l'administrateur conformément à la sécurité v32 actuelle.
3. Le cumul additionne les demi-journées distinctes (matin et après-midi) et n'additionne jamais deux fois deux absences qui se chevauchent sur un créneau ; l'échec de la source renvoie « Indisponible », pas 0.
4. La fonction professionnelle est facultative ; une valeur manquante est indiquée explicitement. Les rôles Agile sont dérivés uniquement de la dernière version disponible de l'affectation, sans rôle inventé.
5. Aucune écriture de métier, aucune modification de snapshot ancien, aucun DDL au runtime ; API dédiée en lecture seule.

## Code
- src/app/app/admin/members/[id]/page.tsx : périmètre, fonction, largeur.
- src/app/app/admin/members/[id]/member-team-read-only.tsx : bandeau, métriques, calendrier double.
- src/app/app/admin/members/[id]/member-cockpit.css : grille et responsive.
- src/server/members/team-annual-absence.ts : cumul SQL borné par équipe et année.
- src/app/api/admin/members/[id]/team-annual-absence/route.ts : RBAC de lecture.
- src/i18n/member-team-scope.fr.json et .en.json : libellés.
- tests/member-detail-cockpit-ux.test.ts et tests/member-detail-v32-schema-guard.test.ts : régressions visuelles et de périmètre.

## Vérification attendue
Exécuter pnpm typecheck, pnpm lint et les tests ciblés localement. Contrôler desktop large, 1150px et mobile ; données de rôle/fonction présentes et absentes ; affichage français/anglais ; année sans absence (0) ; source indisponible (valeur non affichée) ; équipe différente (refus).
Ces validations ne sont pas attestées avant exécution locale.

## Ajustement validé : navigation du bandeau — 30/10/2026
- Supprimer le lien « Retour aux membres » en dehors du bandeau : gain de hauteur.
- Supprimer le message de consultation seule répété sous le titre et conserver uniquement la pastille de statut.
- À droite de cette pastille, intégrer le lien « ← Retour aux membres » avec la même finition bordée et un état de focus clavier visible.
- Conserver l'URL contextualisée par équipe (teamId) et les protections serveur inchangées.
- Critères de contrôle : présence du lien dans le bandeau, absence du breadcrumb externe, absence de la description répétée, alignement sur grand et petit écran.

## Extension calendrier / historique — 30 octobre 2026 (SMN-44)
- Calendrier : tous les jours civils du mois choisi, avec absences affichées si la date appartient à l'affectation de l'équipe autorisée ; jamais de détail personnel et jamais de restriction au seul sprint.
- Sprint : les dates du sprint sélectionné dans le bandeau global sont surlignées, indépendamment du filtrage des absences. En absence de sprint valide, aucun surlignage.
- Synthèses : trois blocs sur une rangée desktop (début, allocation, demi-journées d'absence annuelles) ; retrait de la synthèse « Part développeur ».
- Historique : suppression de « Applicable depuis » ; trois colonnes distinctes SM, PO, DEV (pourcentages historiques) à la place de « Part développeur ».
- Responsive : conserver le calendrier 1–15 et 16–fin, contrôle de confidentialité par équipe, affichage civil localisé FR/EN.
- Contrôles : alternance des sprints, absence hors sprint, mois entier, historique et rendu responsive ; typecheck/lint/recette locale requis avant clôture.

## Retouche de densité calendrier — 30/10/2026
- Le sélecteur natif de mois est aligné à droite du titre « Calendrier », sans libellé visible mais avec un nom accessible.
- Suppression des deux indicateurs récapitulatifs Matin et Après-midi ; les colonnes de demi-journées du tableau sont conservées.
- La synthèse annuelle est simplement nommée « Absences cette année », sans changer l'unité de calcul (demi-journées).
