# SMN-287 — Recette UX (à exécuter, non exécutée)

**Contrats :** [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [Story SMN-297](https://lmn24.atlassian.net/browse/SMN-297).

| ID | Scénario | Résultat attendu |
|---|---|---|
| UX-T01 | Création sans mode Agile | Erreur associée au groupe radio, aucune création |
| UX-T02 | Création avec Scrum ou Kanban | Mode enregistré, badge correct, pas d'activation implicite |
| UX-T03 | Édition sans cycle historique | Mode modifiable par admin, validation côté serveur |
| UX-T04 | Édition après cycle, même supprimé | Mode verrouillé, explication visible, mutation API refusée |
| UX-T05 | Modale de la page Équipe | Mode en lecture seule, lien Paramètres pour admin, données générales éditables |
| UX-T06 | Archiver équipe active parmi plusieurs | Confirmation, conservation données, disparition du sélecteur |
| UX-T07 | Consultation de l'historique archivé (UX-01) | Admin peut consulter en lecture seule, équipe non réactivée |
| UX-T08 | Écriture métier sur équipe archivée (UX-02) | Aucune action métier en UI ; API directe refusée sans mutation |
| UX-T09 | Archiver dernière équipe active (UX-03) | Refus expliqué, y compris demandes concurrentes |
| UX-T10 | Réactivation | Même ID, même mode, mêmes historiques et verrou ; équipe éligible au sélecteur |
| UX-T11 | Basculer A Scrum ↔ B Kanban | Menus Sprints/Périodes et données corrects, pas de fuite interéquipes |
| UX-T12 | Choix du cycle | En cours > plus récent > aucun ; conflit de cycles signalé |
| UX-T13 | Brouillon en cours au changement d'équipe | Confirmation, Annuler conserve formulaire et contexte |
| UX-T14 | Erreur réseau / cycle vide / droits insuffisants | États distincts ; aucune fausse donnée visible |
| UX-T15 | FR/EN, clair/sombre et palettes | Toutes chaînes présentes ; contraste/focus lisibles |
| UX-T16 | Mobile + desktop | 320, 375, 390, 768, 1024, 1440, ~1880 px et zoom 200 %, sans chevauchement |
| UX-T17 | Clavier/lecteur d'écran | Fieldset/legend, focus restauré, alertes annoncées, une seule modale |

## Preuves à renseigner
Pour chaque scénario : OK / KO / non exécuté, date, environnement, capture ou log, éventuel ticket anomalie. Préserver les contrôles existants de SMN-282 et des Cockpits Équipe/Calendrier/Sprints/Rapports.

## Conditions techniques
Recette uniquement après schéma, sauvegarde/restauration et isolation vérifiés ; `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` à exécuter sur environnement pertinent, résultat exact documenté. Aucun test effectué par Sally dans ce lot documentaire.
