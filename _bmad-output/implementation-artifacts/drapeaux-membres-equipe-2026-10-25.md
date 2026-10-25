# SMN — Drapeaux des pays / fiche Équipe

## Source et ressources
- Archive fournie par l'utilisateur : `w160.zip`.
- 254 fichiers PNG validés : 250 `[a-z]{2}.png` (ISO2 pays), 4 variantes régionales du Royaume-Uni (`gb-eng`, `gb-nir`, `gb-sct`, `gb-wls`).
- Chemin public standard : `public/flags/<iso2-minuscule>.png` ; URL Next.js : `/flags/fr.png`, `/flags/de.png`, etc.
- L’archive `SMN-drapeaux-public-flags.zip` a été construite avec le préfixe `public/flags/` pour dépôt direct à la racine du projet. **Les PNG ne sont pas encore présents sur GitHub** : le connecteur GitHub utilisé n'intègre pas le transfert du ZIP binaire. Copier les ressources avec GitHub Desktop.

## Développement publié
- `src/server/members/quick-create.ts` : projection du `country_iso2` effectif à la date courante dans l'API de liste des membres, via une jointure latérale sur les versions de localisation.
- `src/app/app/admin/members/country-flag.tsx` : composant drapeau réutilisable, nom du fichier normalisé, fallback silencieux en absence d'asset.
- `src/app/app/admin/members/team-overview.tsx` : drapeau à gauche du nom, aligné à la ligne sur cartes et vue liste.
- `tests/smn-team-member-country-flags.test.ts` : vérifications statiques ciblées.

## Règles
- Les pays sont des codes ISO 3166-1 alpha-2 déjà enregistrés sur la fiche de localisation du membre. Ne pas déduire le pays du nom, de la nationalité ni du pays d'installation si la fiche n'en comporte pas.
- La taille visuelle est de `1em`, conservant le ratio de l'image.
- Absence de code, format invalide ou PNG indisponible : pas de drapeau, nom intact.
- Aucune mutation de données membres n'est faite pour l'affichage.

## Recette
1. Ajouter les 254 PNG au dossier `public/flags` depuis l'archive fournie ; vérifier les URLs `/flags/fr.png`, `/flags/gb.png`.
2. Vérifier l'affichage sur l'écran Équipe, en vue cartes puis liste, pour un membre avec un pays renseigné et un membre sans pays.
3. Modifier le pays dans la fiche de localisation, revenir sur Équipe et rafraîchir.
4. Tester sur un écran étroit, noms longs, absence de fichier.
5. Exécuter `pnpm exec tsx --test tests/smn-team-member-country-flags.test.ts`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

**Statut : code publié, actifs binaires préparés mais non transférés sur GitHub, tests et recette non exécutés.**
