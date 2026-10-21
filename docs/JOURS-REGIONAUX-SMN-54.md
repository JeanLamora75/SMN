# SMN-54 — Saisir un jour régional sans créer de catalogue régional

[Story Jira SMN-54](https://lmn24.atlassian.net/browse/SMN-54) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-54-absences-regionales.md) · [SMN-53](ABSENCES-INDIVIDUELLES-SMN-53.md) · [SMN-52](CATEGORIES-ABSENCES-SMN-52.md)

## Procédure Administrateur

Dans **Administration → Membres**, ouvrir **Calendrier individuel** du membre concerné. Choisir la date souhaitée, puis dans **Absences individuelles**, cliquer sur **Préparer un jour régional non travaillé**.

La date et les créneaux sont initialisés à la journée complète. La catégorie **Autre** est proposée seulement si elle est active ; l'Administrateur peut choisir une autre catégorie. Saisir impérativement le **nom/motif local**, par exemple « Fête de la région », sans créer d'entrée dans le calendrier férié national. Les dates et les demi-journées sont ajustables. Enregistrer normalement l'absence.

L'absence reste **unique sur la fiche du membre**, indépendamment de son affectation à l'équipe MVP. Elle reste traçable et corrigeable comme toute autre absence ; aucune absence n'est copiée dans une autre équipe. Le GET par date indique également si **une affectation Scrum/Kanban est applicable** : en son absence, la saisie demeure enregistrée sur le membre, sans déduction imputée à une équipe.

## Ne pas déduire deux fois

La synthèse de disponibilité d'une date affiche les demi-journées normalement travaillées rendues indisponibles par **l'union** du calendrier national et des absences individuelles. Un jour férié national et un jour régional/une absence sur la même demi-journée ne provoquent qu'une seule déduction. Une demi-journée non travaillée dans la trame normale ne donne aucune déduction supplémentaire.

La référence nationale suit le **pays effectivement enregistré sur la localisation du membre à cette date** ; le système ne devine ni pays ni calendrier régional. Si le pays est inconnu, si la couverture nationale est insuffisante ou si la trame de travail n'existe pas, le total est **non déterminé** (pas un « zéro » implicite). Un jour national connu par sa date est considéré confirmé même si l'année entière est seulement partielle.

La synthèse est une **résolution journalière des créneaux**, pas encore le calcul de capacité de sprint en jours-homme (Story 3.16). Le calendrier d'équipe et les libellés textuels selon les droits sont désormais développés séparément par [SMN-55](CALENDRIER-EQUIPE-SMN-55.md), avec une grille détaillée Administrateur et une vue uniquement collective pour l'Utilisateur. Leur recette locale reste nécessaire. Les absences individuelles exposent toujours **nom, motif, catégorie et couleur** dans l'API Administrateur.

L'import régional ne déclenche **ni alerte collective ni suppression de Daily**. Les PDF précédents et capacités initiales figées demeurent inchangés.

## Recette locale

Sur une **base pilote isolée PostgreSQL 18.6**, après synchronisation de `main`, exécuter si possible :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Dans l'application, configurer un membre, sa trame de travail et son pays effectif. Ajouter une absence régionale avec motif et catégorie, vérifier qu'aucune entrée nationale n'est créée. La même date que le férié national doit déduire au plus **2 demi-journées**, pas 4 ; un chevauchement partiel avec une absence ne double pas la déduction. Tester la date hors calendrier connu : disponibilité inconnue. Tester une date non travaillée, une exception de trame, la désactivation de la catégorie « Autre », et une correction historique. Vérifier l'absence d'effet sur les Dailies, cérémonies et PDF archivés.

**Contrôle différé :** visualisation dans le calendrier d'équipe — dépend de SMN-55.

**Validation :** tests de contrat ajoutés mais non exécutés, intégration PostgreSQL et recette navigateur non attestées. GitHub Actions volontairement exclu. Jira **En cours**, suivi BMAD **review**.
