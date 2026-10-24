# SMN — Fiche Sprint, onglet Capacités : rôles Agile, fonction, contribution

**Date :** 24 octobre 2026. **Périmètre :** ajustement UX du volet Capacités de la fiche Sprint (SMN-234 D5), sans impact sur les calculs J/H.

## Objet et sources
Demande : ajouter trois colonnes à la table nominative « Capacités » : **Rôles Agile**, **Fonction**, **Contribution**. Afficher les rôles multiples séparés par des virgules.

Sources persistées existantes (aucune migration requise) :
- `public.smn_member.professional_function` : intitulé de fonction.
- `public.smn_member_assignment_version.scrum_master_percent`, `product_owner_percent` et `developer_percent` : parts des rôles Agile datées ; retenir un rôle si sa part est supérieure à 0 %.
- `public.smn_member_assignment_version.contribution_percent` : coefficient de contribution daté.

## Conception et réalisation
- `src/server/sprints/presence-metadata-read.ts` : requête en lecture seule bornée à l'équipe, aux seuls membres de la projection et aux dates du Sprint ; application des révisions effectives sur les journées où les membres sont affectés. Sélection du dernier couple date/révision applicable. Rôles distincts et ordonnés SM/PO/Dev ; contribution unique ou évolution temporelle des taux.
- `src/server/sprints/presence-detail-read.ts` : enrichissement optionnel après `readDevelopmentCapacity` ; les attributs additionnels ne font jamais échouer les J/H déjà calculés. Accès nominatif réservé à l'administrateur par le parent.
- `src/lib/sprint-presence.ts` : propriétés facultatives dans le contrat d'affichage et validation lors de la relecture des snapshots ; un ancien snapshot sans métadonnées conserve ses données originales et montre `—`.
- `src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx` : 3 nouvelles colonnes après « Membre » ; valeurs absentes sous forme de tiret ; pourcentages FR/EN et séparateur « → » lorsqu'une contribution évolue ; séparation des rôles par « , ».
- `src/i18n/fr.json` et `src/i18n/en.json` : intitulés des nouvelles colonnes.
- `tests/smn-234-sprint-capacity-metadata.test.ts` : rôles multiples et traduction, révisions datées, taux variable, absence de donnée, ancienne clôture, droits utilisateurs, requête en lecture seule.

## Contraintes et recette
- N'altérer ni `presenceJh`, ni `developmentJh`, ni les totaux J/H ; aucune colonne SQL nouvelle ou modification des tables persistées.
- La fonction professionnelle actuelle ne doit pas être substituée à un historique ancien : le snapshot de clôture fait foi. Les anciennes clôtures sans ces colonnes affichent des tirets.
- Les rôles et taux doivent refléter les versions enregistrées et pertinentes sur le Sprint, jamais les valeurs du jour si elles sont ultérieures.
- **Limite de vérification :** modification via le connecteur GitHub ; aucune commande locale `pnpm`, aucun test sur PostgreSQL et aucun rendu dans le navigateur n'a été exécuté dans ce contexte. GitHub Actions désactivé.

### Recette Windows / PowerShell

```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-capacity-metadata.test.ts tests/smn-234-sprint-presence-d5.test.ts
pnpm build
pnpm dev
```

Visiter `http://localhost:3003/app/admin/sprints`, ouvrir une fiche de Sprint et l'onglet **Capacités**. Contrôler les colonnes FR/EN, un membre Scrum Master et Développeur, une fonction vide, une contribution simple puis révisée, un Sprint clos avant/après le nouveau snapshot, le profil `user` et la vue tablette/mobile.

**Statut :** correctif préparé / publié selon la PR correspondante ; clôture fonctionnelle conditionnée à la recette locale.
