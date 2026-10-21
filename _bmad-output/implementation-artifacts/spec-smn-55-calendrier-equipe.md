# SMN-55 — Story 3.14 — Calendrier d'équipe et absences selon les droits

**Jira :** https://lmn24.atlassian.net/browse/SMN-55 · Epic 3. **Dépendances :** SMN-49 (fériés nationaux), SMN-52 (catégories), SMN-53 (absences centrales), SMN-54 (jours régionaux et union des créneaux). **MVP :** une seule équipe par installation Scrum/Kanban. Aucun nouveau modèle ni migration : **schéma v19 conservé**.

## Contrat de sécurité et règles générales

Un `GET /api/team-calendar?start=YYYY-MM-DD&days=7|14|28` renvoie la seule équipe installée, ses dates et un tableau **agrégé**. Le serveur authentifie à l'aide de `authorizeApi(request,"read",{type:"collective",exists:true,inScope:true})`. Il décide lui-même si `actor.role==="admin"`. Les paramètres ajoutés par un utilisateur ne permettent jamais d'obtenir le détail privé : `memberId`, `categoryId` et `kind=planned|unplanned` sont rejetés (400) hors rôle Administrateur. Aucun champ privé n'est sérialisé dans la vue utilisateur : pas de `memberId`, nom de personne, motif, catégorie nominative, date individuelle d'absence ni droit de mutation.

La vue collective contient exclusivement, par date, **membres affectés**, **personnes avec indisponibilité déclarée**, **personnes dont la disponibilité est connue/inconnue** et **membres avec au moins un créneau disponible confirmé**. Une personne est comptée **au plus une fois par date**, même si plusieurs absences coïncident avec un jour férié. Les disponibilités inconnues ne sont jamais inventées à zéro. Le nom de l'équipe est une donnée collective.

Le **détail Administrateur** comprend les membres affectés à la période, un tableau par date applicable, et, sur chaque case, les absences associées à `smn_member_absence` avec **nom/motif textuel, catégorie textuelle, couleur complémentaire**, statut prévu/imprévu et jour férié national textuel. Les droits s'appliquent **côté API**, pas simplement par masquage CSS.

## Critères Jira

- **AC1 :** pour le rôle Administrateur, affichage des absences autorisées avec libellé/motif et catégorie en texte et couleur d'accompagnement. Données récupérées par jointure du catalogue existant et des absences du membre.
- **AC2 :** sélection du membre et du jour dans la grille, ouverture de **l'éditeur central `MemberAbsenceEditor`** déjà utilisé dans le calendrier personnel (SMN-53). Sa sauvegarde appelle le POST central `/api/admin/members/[id]/absences`. Un callback recharge les données collectives : aucun second enregistrement métier par équipe n'est introduit.
- **AC3 :** l'édition de l'absence existante dans l'éditeur commun conserve le même identifiant `absence_id` et son historique de révisions. Le GET de la fiche individuelle et celui de la grille lisent la même table, pas une copie.
- **AC4 :** pour le rôle `user`, uniquement le tableau agrégé, sans `admin` ni identité de membre ou motif ; absence de POST sur la nouvelle route et interdiction du POST central aux non-Administrateurs. Les filtres nominatifs et par catégorie/type sont refusés côté serveur.
- **AC5 :** dates `start`, période `days`, équipe (fixe à une seule, `teamId` acceptée seulement si correspondante), et, si autorisé, `memberId`, `categoryId` et `kind` prévu/imprévu. Ces filtres affectent seulement les lectures. **La grille d'absences filtrée ne change jamais la disponibilité réelle**, toujours déterminée sur toutes les absences. Ni création d'événement ni modification de dates lors d'un GET.

## Données et architecture

- `src/server/members/team-calendar.ts` : parser strict de paramètres, génération de dates UTC stables, lectures par lot (une équipe, affectations sur la période, semaines/exception/localisations, absences et catégories, jours fériés et couverture nationale), union des créneaux via `resolveDayAvailability` SMN-54. Intersections d'affectations calculées **date par date** ; membre compté une seule fois si plusieurs affectations historiques se chevauchent.
- `src/app/api/team-calendar/route.ts` : GET collectif, projection côté serveur strictement dépendante du rôle, validation des filtres.
- `src/app/app/team-calendar/page.tsx` : page accessible aux rôles `admin` et `user` depuis `/app`.
- `src/app/app/team-calendar/team-calendar-view.tsx` : résumé agrégé, navigation 7/14/28 jours, filtres supplémentaires Administrateur, grille nominative et éditeur central embarqué.
- `src/app/app/admin/members/member-absence-editor.tsx` : `onSaved` optionnel déclenchant l'actualisation de la grille après écriture.
- `src/app/app/page.tsx`, `src/app/app/admin/members/page.tsx` : liens d'accès.
- `src/i18n/fr.json`, `en.json` : textes centralisés.
- `tests/team-calendar.test.ts` : contrôle d'accès différencié, absence de fuite de motifs dans la réponse utilisateur, déduplication, périodes et filtres, jour national + absence, calendrier inconnu et absence de mutation.

## Périmètre et limites

Aucun catalogue de jours régionaux ajouté : les jours régionaux saisis par l'Administrateur dans SMN-54 figurent dans les détails de la grille au même titre que toute absence. Les **capacités de sprint en jours-homme**, la gestion des périodes d'entreprise et les cérémonies restent aux Stories spécialisées. Les dates et effectifs ne doivent pas être présentés comme un calcul de capacité développé en dehors des sources de disponibilité connues.

La vue collective ne fournit pas de catégories individuelles, de motif ni d'identité pour les utilisateurs, même dans les réponses réseau. Les données de santé éventuelles ne doivent pas être détaillées dans les motifs (règle de confidentialité de SMN-53).

## Validation et statut

Tests unitaires/de contrat rédigés. Contrôles statiques possibles via connecteurs GitHub ; **aucun test `pnpm`, compilation TypeScript, intégration PostgreSQL/HTTP ou recette Windows n'est déclaré réussi sans exécution**. GitHub Actions indisponible et exclu du processus. Suivi BMAD `review`, Jira `En cours` jusqu'à la recette locale et ses preuves. Le runner/rendu BMAD natif `uv` n'est pas disponible dans ce contexte connecteur, adaptation manuelle via le skill d'Amelia sans prétendre l'avoir exécuté.
