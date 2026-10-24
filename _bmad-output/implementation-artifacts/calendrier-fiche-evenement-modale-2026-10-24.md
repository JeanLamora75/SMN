# Calendrier SMN — fiche d'événement en fenêtre modale

**Date :** 24 octobre 2026. **Implémentation :** branche `main`. **Statut :** code publié, tests locaux et recette visuelle non exécutés dans cet environnement.

## Objectif utilisateur

Dans le calendrier d'équipe, un clic sur le titre d'une cérémonie ou réunion ouvre sa fiche **dans une modale**, depuis la vue **Cartes** comme depuis la vue **Agenda**. Le contexte équipe / sprint / période ne change pas. La page autonome existante reste accessible par son URL pour compatibilité, mais n'est plus le comportement du clic principal.

## Contenu de la fiche

- Nom de la réunion, catégorie (cérémonie Scrum, réunion issue d'un modèle, exceptionnelle), sprint associé, fuseau horaire ;
- début, fin, durée prévue ;
- statut (tenue, non tenue, annulée, prévue, inconnu) avec précision lorsque l'état « tenue » est inféré ;
- durée réelle éventuelle, et indication de reconstruction lorsqu'applicable.

La fiche affiche les informations provenant du serveur : aucune liste nominative d'absences ni donnée personnelle de membre. L'agrégat `Absences (N)` reste inchangé et n'est **pas** transformé en fiche individuelle.

## Parcours et droits

- `user` : consultation en lecture seule de tous les événements visibles.
- `admin` : pour une cérémonie non clôturée encore planifiée, édition du début et de la durée via `PATCH /api/admin/sprints/ceremonies/[id]` ; portée « occurrence » ou « suivantes » uniquement pour les Daily.
- `admin` : modification de la durée réelle (0–1440 min) via l'API d'audit de durée existante, sauf sprint clôturé.
- `admin` : qualification du statut via l'API de présence existante ; les états « tenue » et « non tenue » restent interdits avant la fin de la réunion par l'API. Une annulation peut être enregistrée plus tôt.
- Les champs non modifiables par les services existants (notamment nom et horaires des réunions issues de modèles et exceptionnelles) sont affichés **en lecture seule**. Aucun nouveau service d'édition métier n'est inventé.
- Les sauvegardes rafraîchissent la fiche et le calendrier ; aucune sortie forcée vers une autre page.
- La modale est navigable au clavier, associée à un titre, focalisée à l'ouverture, fermable par Échap ou Fermer (avec confirmation si modifications non enregistrées) et restaure le focus au titre déclencheur.

## Intégration

- `src/app/app/team-calendar/calendar-option-b.tsx` — titre d'événement converti de lien en bouton ouvrant la modale dans les deux présentations.
- `src/app/app/team-calendar/calendar-meeting-modal.tsx` — formulaire contextualisé, permissions et actions sur services existants.
- `src/app/app/team-calendar/team-calendar-view.tsx` — état de sélection et rechargement après écriture.
- `src/server/sprints/calendar-meeting-detail.ts` — lecture en base avec whitelist de tables, UUID validé et restriction installation/équipe.
- `src/app/api/team-calendar/meetings/[kind]/[id]/route.ts` — endpoint GET autorisé au rôle collectif, sans écriture.
- `src/lib/calendar-local-time.ts` — conversion des heures locales avec rejet des heures DST inexistantes/ambiguës.
- `src/i18n/fr.json`, `src/i18n/en.json`, `src/app/globals.css` — labels et styles.
- `tests/calendar-meeting-modal.test.ts` — validation des références, périmètre SQL, fuseaux horaires et montage modal.

## Grille de recette manuelle à exécuter

| ID | Vérification | Attendu |
|---|---|---|
| EVM-01 | Cliquer sur un Daily en vue Cartes | Ouverture modale sans changement de page |
| EVM-02 | Cliquer sur une réunion en vue Agenda | Même fiche et même période |
| EVM-03 | Vérifier cérémonie, modèle, exceptionnelle | Bon nom, type, sprint, statut, horaires, durée |
| EVM-04 | Se connecter en `user` | Tous les champs en lecture seule ; aucune action d'écriture |
| EVM-05 | Compte admin, cérémonie planifiée | Enregistrer horaire et durée ; vérifier mise à jour sur calendrier |
| EVM-06 | Daily planifié, portée « suivantes » | Seules les occurrences éligibles sont recalculées selon l'API existante |
| EVM-07 | Compte admin, réunion terminée | Enregistrer tenue/non-tenue et motif, puis lire le nouveau statut |
| EVM-08 | Compte admin, réunion future | « tenue » ou « non tenue » refusés ; annulation autorisée |
| EVM-09 | Durée réelle | Sauvegarde et audit via API métier existante |
| EVM-10 | Sprint clôturé | Formulaire visible en lecture seule, aucun POST/PATCH |
| EVM-11 | Heure locale inexistante ou ambiguë (DST) | Refus explicite, aucune mutation |
| EVM-12 | Échap, Tab, fermer, validation de brouillon | Focus restauré et aucun brouillon perdu silencieusement |
| EVM-13 | Thèmes sombre/clair, FR/EN, largeur mobile | Aucun champ masqué ou inaccessible |
| EVM-14 | ID invalide ou compte sans accès collectif | HTTP 400 / 403 ; aucune donnée sensible exposée |

## Commandes de validation Windows

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm exec tsx --test tests/calendar-meeting-modal.test.ts tests/calendar-option-b-ux.test.ts
pnpm build
pnpm dev
```

**Conformité non clôturée** : captures d'écran du navigateur SMN et résultats de tests locaux attendus avant déclaration de livraison terminée. Aucun ticket Jira modifié.
