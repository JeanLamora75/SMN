# SMN — Brief BMAD UX : Calendrier « Cockpit Agile », option A

**Date :** 26 octobre 2026  
**Agent :** Sally — UX Designer BMAD v6.12.4  
**Statut :** conception graphique approuvée, développement et recette non réalisés dans ce lot.  
**Périmètre :** `/app/team-calendar`, sprints Scrum et périodes Kanban.

## Décision approuvée
Harmoniser **fidèlement** la présentation du Calendrier d'équipe avec le design **Cockpit Agile** de la page Registres. Le Calendrier reste un outil de consultation et planification. Il ne devient pas une copie fonctionnelle du registre. Les modèles métier, API, base de données, habilitations, chronologie et traductions FR/EN sont préservés.

## Sources normatives (dans l'ordre des domaines)
- `docs/UX-REFERENTIEL-BMAD.md` : référentiel transverse ;
- `_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md` et `CALENDRIER-RECETTE-UX.md` : **comportements et règles existants** ;
- `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/DESIGN.md`, `EXPERIENCE.md`, `AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md` : **identité visuelle** ;
- Maquettes approuvées lors de l'atelier : `SMN_Calendrier_Maquette_Cockpit_A.png` (desktop), `SMN_Calendrier_Maquette_Cockpit_A_Mobile.png` et `SMN_Calendrier_Maquette_Cockpit_A.html` (prototype illustratif). Les références graphiques originales sont conservées dans le dossier d'atelier utilisateur ; **elles ne sont pas intégrées à cette publication texte**.

En cas de conflit : contrats approuvés > maquette illustrative. Remonter les écarts métier préexistants, sans correction furtive.

## Composition cible — Option A
1. **Bandeau d'identité** bleu foncé, arrondi, pleine largeur, comme aux Registres : titre « Calendrier d'équipe », sous-titre court, équipe autorisée, cycle, dates et état provenant des vrais producteurs. Sélecteur sprint/période, précédent, suivant, Aujourd'hui et bascule Cartes/Agenda répartis proprement.
2. **Panneau commandes** blanc, arrondi, à bordure subtile : filtres indépendants « Cérémonies et réunions » et « Absences » ; fuseau actif visible, sélecteur si plusieurs zones ; légende compacte hors des éléments primaires.
3. **Panneau calendrier** à cartes modernes et lisibles : sept dates par ligne sur desktop, date et éventuel férié accolés, respiration avant la première réunion, événements ordonnés avec icônes, horaires et repères distincts pour absences (accent indicatif turquoise compatible thèmes, sans statut d'alerte). Week-ends et fériés grisés, aujourd'hui reconnaissable par bordure renforcée.
4. **Pied de carte** : deux commandes explicites côte à côte `+ Réunion` et `+ Absence` si l'action est autorisée ; ne pas les supprimer pour épurer.
5. **Agenda** : mêmes données et filtres, visuellement harmonisé avec le mode Cartes.

## Invariants métier et UX
- Période active prioritaire ; sans période : mois civil courant complet ; aucune date fantôme. Sept cartes par rangée en partant de la première date du cycle.
- Toutes les dates et réunions historiques consultables, y compris week-ends. Week-end : **aucune création**. Jour férié en semaine : **actions autorisées selon permissions**, même si fond grisé.
- Tri stable des réunions par heure de début ; tooltip/heure et informations accessibles ; aucune altération des horaires IANA.
- Les deux actions ouvrent les **modales existantes** avec date préremplie ; préserver validations, erreurs, brouillons et rafraîchissement.
- Rôles admin/user, restrictions serveur, données nominatives d'absence et cloisonnement par équipe conservés. Ne pas élargir le périmètre d'accès.
- Vues Cartes et Agenda exclusives, filtres indépendants, fuseau actif, FR/EN JSON, thèmes et états loading/empty/error.
- Aucun changement de route, backend, DB, calcul de capacité, modèle de données ou régénération de périodes.

## Responsivité et accessibilité
Desktop 7 colonnes sur largeur utile ; tablette grille consultable avec défilement si nécessaire ; mobile commandes refluées, vue Agenda utilisable et navigation horizontale explicite si Cartes. Vérifier 320 / 375 / 390 / 768 / 1024 / 1440 px, zoom 200 %, clavier, focus, aides visibles, contrastes thème clair/sombre, FR/EN.

## Implémentation envisagée (à confirmer)
- `src/app/app/team-calendar/team-calendar-view.tsx` : bandeau, navigation, commandes, filtre, fuseau, organisation des panneaux ;
- `src/app/app/team-calendar/calendar-option-b.tsx` : cartes et Agenda, séparateurs, styles événements/actions ;
- `src/app/app/team-calendar/page.tsx` : entrée/import CSS dédié éventuel ;
- `src/app/globals.css` : lire tokens et styles préexistants ; préférer styles **scopés** au calendrier, pas de modification globale affectant les Registres ;
- `src/i18n/fr.json`, `src/i18n/en.json` seulement pour nouveaux libellés ; vérifier parité ;
- `calendar-meeting-modal.tsx` et formulaire d'absence : uniquement vérifier la non-régression.

### Écart existant à isoler
Le code du 26/10/2026 ouvre actuellement une modale de réunion après clic sur son titre, alors que CAL-09 prévoit une navigation vers la page de réunion. **Cette US est graphique** : relever ce conflit dans la recette, ne pas le corriger silencieusement.

## Recette / preuves
Comparatif captures Registres / Calendrier cible / Calendrier réel ; Scrum et Kanban ; Cartes/Agenda ; rôle admin et user ; férié ouvré, week-end, aujourd'hui, mois traversé, aucune période, période close ; fuseaux, absences, réunions multiples, tooltip, création ; FR/EN, thème clair/sombre et tailles ci-dessus. Exécuter réellement `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` si disponibles, en documentant chaque résultat et les limites. Ne pas déclarer la refonte terminée sans preuves et validation visuelle de l'utilisateur.

**Lien de livraison Jira :** à renseigner après création de la Story. Aucun code ni test applicatif réalisés par Sally.
