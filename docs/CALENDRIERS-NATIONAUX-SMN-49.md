# SMN-49 — Préchargement des jours fériés nationaux

Références : [Jira SMN-49](https://lmn24.atlassian.net/browse/SMN-49) · [Spec BMAD](../_bmad-output/implementation-artifacts/spec-smn-49-calendriers-nationaux.md)

## Fonctionnement

La configuration **Pays de référence** (Administration → Paramètres généraux) détermine quel calendrier SMN importe. Le chargement est automatique au premier accès authentifié suivant la migration v16 ou la sélection du pays. Depuis **Administration → Pays**, un Administrateur peut aussi sélectionner **Recharger les jours fériés nationaux** afin de contrôler à nouveau les fichiers fournis.

Les fichiers JSON font partie du serveur : `src/server/holidays/data/FR.json`, `DE.json`, `GB.json`. Aucun accès réseau, API tiers ou import CSV/ICS n'est nécessaire pour le **préchargement automatique**. L'import CSV manuel est également disponible via [SMN-50](IMPORT-CSV-FERIES-SMN-50.md). Pour chaque installation, les années de référence sont **N−2, N−1, N et N+1**, où N est l'année civile de `smn_installation.created_at` (année de la création initiale et non année courante). Les données fournies couvrent **2024–2035** : hors de cette plage ou pour un autre pays, l'année est **Non configurée** sans bloquer l'installation ni inventer de date.

**Périmètre métier :** France métropolitaine (hors particularités d'Alsace-Moselle et outre-mer), Allemagne (jours fériés fédéraux communs, hors Länder), Royaume-Uni (jours fériés bancaires communs à ses nations constitutives, hors particularités locales). Aucune inférence régionale.

## Robustesse et données

- Schéma version 16 : `smn_national_holiday` (unicité par pays/date) et `smn_national_calendar_coverage` (statut, nombre de dates et diagnostic par pays/année).
- Le validateur refuse un pays discordant, une date impossible, un jour en double, un nom vide, des valeurs de mauvais type et une entrée hors de l'année attendue. Une liste invalide ne crée aucune nouvelle date pour l'année concernée.
- Les imports s'effectuent dans une transaction verrouillée avec `ON CONFLICT DO NOTHING` ; une relance ne multiplie ni les jours ni les états de couverture.
- `configured` est réservé à quatre années explicitement configurées. `not-configured` ne signifie jamais « zéro jour férié ». `invalid` permet de diagnostiquer un jeu invalide.
- Le statut de disponibilité des jours fériés dans la localisation d'un membre n'est vrai que lorsque son pays et l'année consultée possèdent une couverture configurée.
- Les autorisations serveur exigent le rôle Administrateur pour forcer le rechargement ; la lecture du catalogue relève des droits de consultation des paramètres.

## Recette à réaliser sur le poste pilote

Après synchronisation de `main`, sur Windows 11/PostgreSQL 18.6, effectuer sur une **base pilote sauvegardée** :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

1. Vérifier l'upgrade v15 → v16 et la persistance des membres et pays.
2. Choisir FR comme pays de référence, ouvrir Administration → Pays : quatre années, dates nommées, statut « Configuré ».
3. Recharger deux fois et vérifier l'absence de doublons dans `smn_national_holiday`.
4. Essayer ES (pays sans fichier fourni) et confirmer « Non configuré ».
5. Vérifier qu'un rôle Utilisateur ne peut pas déclencher le rechargement direct via POST `/api/admin/countries/calendar` (403).
6. Contrôler le retour explicite `invalid` avec un fichier de test volontairement incohérent **sur une base pilote** ; ne pas modifier les données réelles de référence.

**Validation** : tests de contrat écrits, non exécutés ici. GitHub Actions est hors circuit conformément à `docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md`. Publication ≠ recette. Jira reste « En cours » et l'état BMAD « review » jusqu'aux preuves de qualification locale.
