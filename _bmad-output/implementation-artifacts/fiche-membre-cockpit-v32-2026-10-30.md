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
