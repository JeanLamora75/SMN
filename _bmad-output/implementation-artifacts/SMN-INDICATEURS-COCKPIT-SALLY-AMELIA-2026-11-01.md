# SMN — Sally → Amelia : réalisation du cockpit Indicateur
Date : 01/11/2026 — État : code publié sur main, recette Windows non exécutée par ChatGPT.

## Revue UX (rôle Sally, adaptée à GitHub)
Règle visuelle : utiliser `smn-page smn-team-page`, le bandeau `smn-panel rounded-4`, les onglets `SettingsTabs` et les tableaux `table table-hover align-middle` des Cockpits Agile. Page Indicateur : onglets « Indicateur » (tableau des cycles de l'équipe), « Sélections par équipe », « Affichage ». Pour chaque cycle, colonne action « Modifier » ouvrant `UniversalIndicatorInput`. Affichage : `details/summary` natifs repliés par défaut, navigables au clavier.
La navigation « Indicateur » (singulier) se trouve immédiatement après Calendrier, avant Registre.
Les habilitations des Scrum Masters sont retirées du cockpit opérationnel et conservées dans la page admin Paramètres → Indicateurs, sous un panneau secondaire repliable.

## Architecture mise en œuvre (rôle Amelia)
- Route opérationnelle `/app/admin/indicators` : sélection d'équipe autorisée, mode Scrum/Kanban vérifié depuis `smn_team`, composant `IndicatorCatalog scope="team"`, sans catalogue global ni habilitations.
- Route administrative `/app/admin/settings/indicators` : accès Admin uniquement, `IndicatorCatalog scope="global"`, et gestion des habilitations hors des onglets métier.
- Tableau : `indicator-cycles.tsx` exploite `/api/admin/indicators/reporting?screen=cycle_list`, la sélection v33 et les valeurs par cycle ; bouton « Modifier » exploite la modale SMN-348. Tous les cycles non supprimés sont lus dans les limites existantes du reporting.
- Préférences : les cinq écrans sont repliés par défaut, la grille 4/2/2 garde ses affectations. Contrôles d'autorisation serveur existants `requireIndicatorTeam` / `indicatorTeams`, sans accès fondé seulement sur l'URL.
- Internationalisation : clé `indicators.navTitle` ajoutée en FR et EN ; autres libellés existants réutilisés.
- Régression statique : `tests/smn-indicators-cockpit-ux.test.ts`.

## État et réserves à vérifier
Le développement a été publié mais ni `pnpm typecheck`, ni `pnpm lint`, ni les tests locaux PostgreSQL ou la recette navigateur n'ont été exécutés dans l'environnement Windows de l'utilisateur. Ne pas marquer la Story Jira comme « Terminé » avant validation.
Points de recette : équipe choisie par le sélecteur global, isolation Koala/Panda, tableau Scrum et Kanban, états et snapshots de clôture, bouton Modifier et rechargement après sauvegarde, préférences pliées au premier affichage, accessibilité clavier et rendu Red & Purple clair/sombre.
Aucune migration ajoutée et aucune ancienne table supprimée pour ce lot.

## Ajustements finaux de l'implémentation
- Navigation active : `teamSwitchDestination` conserve désormais `/app/admin/indicators?teamId=...` lors d'un changement d'équipe, sans conserver de cycle de l'ancienne équipe.
- Le mode de l'équipe est lu explicitement dans `smn_team.agile_mode` après vérification de la liste autorisée, sans déduire Scrum du rôle de l'utilisateur.
- Le tableau des cycles affiche les dates début et fin, les codes indicateurs, les unités et une action **Modifier** ouvrant la modale universelle.
- La restitution `cycle_list` des sprints clôturés utilise la dernière version du snapshot `indicatorsV33` ; en absence de capture, elle affiche une lacune, jamais la valeur courante.
- Contrôle PostgreSQL de la restitution historique étendu dans `tests/smn-dashboard-bmad-pg.test.ts`.
- Le catalogue global reste limité au rôle `admin` dans `/app/admin/settings/indicators`, les habilitations y sont déplacées dans un panneau repliable.
- Aucune recette locale ni migration exécutée par l'assistant ; les points de validation restent ouverts.

## Avenant dashboard — Sélection directe des emplacements (01/11/2026)
Sur les huit positions configurables du tableau de bord (Story Points 4, Tickets 2, Complémentaires 2), une petite action « + » en haut à droite ouvre une modale. Elle ne propose que les définitions actives, non archivées et sélectionnées pour l'équipe active ; les indicateurs déjà attribués à un autre emplacement ne sont pas proposés afin de préserver l'unicité. Le choix peut remplacer l'occupant de l'emplacement ou sélectionner « Aucun ». Le serveur revérifie les habilitations et effectue la substitution transactionnelle ; le tableau de bord recharge ensuite la projection. Les sources de valeurs et snapshots ne sont pas modifiés. Libellés FR/EN et contrôle statique : `tests/smn-dashboard-slot-picker.test.ts`. **Recette navigateur et tests Windows requis avant validation finale.**
