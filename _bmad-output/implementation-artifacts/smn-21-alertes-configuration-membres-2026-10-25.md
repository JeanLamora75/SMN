# SMN-21 — Alertes de configuration des membres

## Références
- Jira : https://lmn24.atlassian.net/browse/SMN-21 — avenant AC-UX16 à AC-UX19.
- Dashboard : `src/app/app/page.tsx`.
- Composant : `src/app/app/member-configuration-alerts.tsx`.
- APIs existantes : `/api/admin/members` et `/api/admin/members/[id]/calendar`.

## Règles implémentées
- Membres éligibles : non archivés et actuellement affectés (`isAssigned=true`).
- Alerte si aucun calendrier individuel configuré (`configured=false`), et/ou si aucune répartition de rôle positive parmi SM, PO et Développeur.
- Les jours fériés, la localisation et l'existence d'un calendrier national ne sont jamais des conditions déclenchantes ni bloquantes.
- Une ligne par membre, combinant les motifs, avec lien direct vers sa fiche. Rafraîchissement à chaque ouverture du tableau de bord.
- Visibilité admin uniquement, sans transformation en action, risque, obstacle ou indicateur de Sprint. Affichage accessible et traduction FR/EN.
- Erreur de récupération API : signalement d'indisponibilité, aucune absence de calendrier inventée.

## Recette à exécuter
1. Membre actif avec calendrier et rôles -> aucune alerte.
2. Actif sans calendrier, rôles présents -> alerte calendrier.
3. Actif avec calendrier, rôles absents -> alerte rôles.
4. Actif avec les deux absents -> une alerte combinée.
5. Archivé/non affecté -> pas d'alerte.
6. Pays sans jours fériés -> ne modifie pas le résultat.
7. Cliquer le nom -> fiche du membre ; corriger et revenir -> alerte disparaît.
8. Compte utilisateur -> pas d'exposition des listes nominatives sur le tableau de bord ; FR/EN, mobile, clavier, API indisponible.
9. `pnpm i18n:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## État
Changements livrés sur branche de développement et Jira mise à jour. Les validations locales, tests et build ne sont pas exécutés via les connecteurs GitHub/Jira.
