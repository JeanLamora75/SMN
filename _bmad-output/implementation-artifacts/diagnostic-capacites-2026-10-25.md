# Diagnostic capacité — Sprint, tableau de bord et développement (25 octobre 2026)

## Constat sur `main` avant correctif

Le moteur `readDevelopmentCapacity` est effectivement invoqué par :
- `GET /api/admin/development-capacity?start=…&end=…` lorsque l'utilisateur lançait explicitement le calcul ;
- `readSprintMemberPresence` pour la fiche Sprint non clôturée (estimation de présence + J/H de développement) ;
- `readSprintCapacityKpiView` pour les références calculées C01/C02, sans écraser les valeurs enregistrées ;
- `readCycleDashboard` / `readActualCapacity` pour le réel courant.

**Ancienne règle corrigée dans cette PR** : le moteur imposait une affectation datée avec version, un calendrier individuel, un pays et une couverture nationale complète. Désormais, seuls l'affectation/version et le calendrier individuel sont des prérequis. Les absences et fermetures enregistrées restent déduites. Le pays est facultatif ; les jours fériés connus sont déduits s'ils correspondent à son pays. Une absence d'import national ou de ligne de jour férié ne bloque plus le calcul.

La capacité initiale du tableau de bord provient d'un **snapshot d'ouverture immuable** ; la capacité réelle est progressive, bornée aux journées antérieures à la date de lecture et n'est pas inventée pour un Sprint futur. Les données de clôture Vn restent figées. Les C01/C02 de la fiche Sprint présentent séparément la **saisie manuelle** et la **référence calculée**.

## Défauts de déclenchement / diagnostic constatés

1. L'écran « Capacité de développement » démarrait avec deux dates vides. Aucun appel de calcul ne se produisait avant le clic explicite sur « Calculer ».
2. Après modification du paramètre `heures/JH`, le rapport était effacé sans recalcul automatique.
3. La fiche Sprint affichait le nombre de jours non fiables mais ne remontait pas les codes d'entrée manquante produits par le moteur ; il était difficile d'expliquer pourquoi 3 membres « actifs » n'aboutissaient pas à un total.
4. Le tableau de bord n'offrait pas de chemin direct vers un diagnostic pour le Sprint sélectionné.

## Correctifs proposés

- La page de développement reçoit les dates du Sprint de référence **réellement enregistré** (priorité au `cycleId` validé via le contexte serveur) ; elle calcule immédiatement sa période et annule une lecture périmée si l'utilisateur change les bornes. Si aucune période Scrum appropriée n'existe, dates manuelles préservées.
- Après sauvegarde du nombre d'heures/JH, recalcul explicite de la période sélectionnée.
- Les motifs `no-assignments`, `ambiguous-assignment`, `assignment-version`, `work-calendar` et les causes liées aux réunions exceptionnelles sont projetés sans données supplémentaires et visibles **uniquement dans l'onglet admin Capacité du Sprint**. Les anciens blocages `member-country` et `national-coverage` sont supprimés.
- Un lien « Vérifier la capacité » sur le tableau de bord, visible seulement aux comptes autorisés à lire les données membres, conserve le Sprint actif sélectionné.
- Traductions FR/EN ajoutées sans changer de tables, de formules ni de snapshots.

## Règle métier du 25 octobre 2026 — jours fériés facultatifs

| Source | Précondition du calcul | Conséquence |
| --- | --- | --- |
| Affectation non ambiguë et version datée applicable | Oui | Sinon J/H inconnus |
| Calendrier de travail individuel applicable | Oui | Sinon J/H inconnus |
| Taux d'affectation, part développement, contribution | Oui | Multiplicateurs appliqués aux demi-journées disponibles |
| Pays du membre | Non | Aucun jour férié national déduit sans pays |
| Couverture nationale `configured` / import national | Non | Aucun blocage si absent |
| Jour férié effectivement enregistré pour pays + date | Non | Déduction des demi-journées connues |
| Absence individuelle enregistrée | Non | Déduction réelle sans double comptage |
| Fermeture collective enregistrée | Non | Déduction réelle sans double comptage |

Le statut national peut rester « inconnu » comme information de qualité des données sans rendre les J/H non calculables. Les snapshots d'ouverture et de clôture restent immuables.

## Contrôles et limites

- Vérifications statiques par inspection des fichiers exacts sur GitHub : formules inchangées, lecture courante conservée, ouverture/snapshot historiques inchangés, droits de lecture nominatifs maintenus, clés FR/EN comparées.
- Tests ajoutés `tests/capacity-refresh-diagnostics.test.ts` et `tests/capacity-holiday-optional.test.ts` ; tests existants `tests/development-capacity.test.ts` et `tests/team-calendar.test.ts` mis à jour. **Tests déposés mais non exécutés via pnpm dans le dépôt**.
- **Non réalisés ici** : connexion à PostgreSQL local Windows, inspection des trois développeurs de l'utilisateur et de leurs dates effectives, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette navigateur.

### Vérifications fonctionnelles recommandées

Sur un Sprint **non clôturé**, contrôler pour chacun des trois développeurs :
- affectation à l'équipe, date d'entrée et version des parts Développeur, allocation, contribution et contrat, couvrant les dates du Sprint ;
- calendrier hebdomadaire effectivement applicable aux mêmes dates (et non seulement « configuré aujourd'hui ») ;
- pays et calendrier national **facultatifs** : s'ils sont présents, les jours fériés enregistrés pour le pays sont déduits ; aucun statut `configured` n'est obligatoire ;
- absence et fermeture ; si le pourcentage Développeur est 0, un J/H de présence positif et 0 J/H de développement sont légitimes.

Cliquer sur « Vérifier la capacité » depuis le tableau de bord pour voir la période du même Sprint. Pour un Sprint futur, le réel doit rester non enregistré ; pour un Sprint clos, ne jamais recalculer la photographie Vn.

**Le diagnostic du code ne prouve pas que la base PostgreSQL locale possède les prérequis requis.**
