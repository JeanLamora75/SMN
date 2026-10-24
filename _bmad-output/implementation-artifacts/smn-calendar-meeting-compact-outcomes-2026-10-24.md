

# Amelia BMAD — Éditeur compact et commentaires de réunion

Date : 24 octobre 2026. Demande utilisateur : densifier la modale
« Fiche de l'événement » et créer des décisions, actions ou faits marquants
depuis la même réunion.

## Contrat implémenté

- `calendar-meeting-modal.tsx` : identité compacte, rangées fonctionnelles,
  boutons Bootstrap `floppy` avec libellés accessibles ; conserver les
  sauvegardes distinctes et les contrôles de l'édition d'origine.
- `src/app/globals.css` : flex/grid responsive, champs `min-width:0`,
  icônes 38 × 38 px alignées aux formulaires.
- `src/app/app/bootstrap-icon.tsx` : icône de sauvegarde sans CDN.
- `src/server/sprints/calendar-meeting-outcomes.ts` : validation du
  couple kind/UUID, vérification du contexte de réunion et du Sprint
  non clôturé, date métier dans le fuseau de la réunion, création
  transactionnelle d'une fiche `smn_registry_item`, de sa première
  révision auditée et du lien vers la réunion. Lire les résultats
  existants n'écrit jamais en base.
- `src/app/api/team-calendar/meetings/[kind]/[id]/outcomes/route.ts` :
  GET collectif authentifié ; POST administrateur avec refus des
  clôtures. Aucun ID d'équipe, Sprint ou propriétaire libre dans la
  requête du formulaire : la portée est dérivée côté serveur.
- `src/server/installation/contract.ts` : déclaration explicite de la
  nouvelle table optionnelle de liaison ; aucune perturbation des cinq
  tables obligatoires du diagnostic d'installation.
- `src/i18n/fr.json` / `en.json` : messages, types et erreurs ;
  `tests/calendar-meeting-outcomes.test.ts` : tests source et service.

## Règles importantes

Les catégories sont celles des registres Epic 5 :
- Décision -> `decision`, état initial `active` ; fait marquant
  automatique correspondant créé selon la règle des registres.
- Action -> `action`, état initial `todo`.
- Fait marquant -> `highlight`, état initial `recorded`.

Le texte du commentaire est l'original complet en description
(1 à 2000 caractères) ; un titre court est obtenu de sa première
ligne (240 caractères max). L'utilisateur peut ouvrir la fiche
registre créée pour l'enrichir plus tard. L'événement clôturé ne
peut plus recevoir de nouveau compte rendu, mais reste consultable.

Le texte saisi non enregistré déclenche la confirmation existante
à la fermeture de la modale. Un événement n'est pas automatiquement
déclaré tenu par l'ajout d'un commentaire.

## Recette non encore exécutée dans l'environnement connecteur

```powershell
pnpm typecheck
pnpm lint
pnpm exec tsx --test tests/calendar-meeting-outcomes.test.ts tests/calendar-meeting-modal.test.ts
pnpm build
```

Vérifier sur Windows 11 la modale Calendrier en vues Cartes/Agenda,
le repli mobile, la présence des quatre lignes fonctionnelles,
les sauvegardes et les trois catégories de registres avec une
réunion à statut connu, puis les cas refusés et la clôture.
Ne pas déclarer la Story clôturée sans recette.
