# SMN-47 — Pays, ville, région et fuseau horaire du membre

[Jira SMN-47](https://lmn24.atlassian.net/browse/SMN-47) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-47-localisation-pays-fuseau.md)

## Utilisation

Dans **Administration → Membres de l'équipe → Localisation**, chaque membre possède ses propres valeurs : **pays ISO (FR, DE, CA...)**, **région**, **ville**, **fuseau IANA** (`Europe/Paris`, `America/Toronto`...). La langue du site n'est pas liée au pays du membre.

Le pays de référence de l'installation est automatiquement **proposé**. Pour un membre nouvellement créé après cette Story, un pays de référence configuré est enregistré comme première version de la fiche ; les autres informations restent à compléter. Aucune localisation n'est obligatoire pour terminer l'installation Express. Pour un membre créé avant cette fonctionnalité sans information historisée, la proposition n'est pas une donnée passée enregistrée.

Chaque enregistrement requiert une **date d'effet** : aujourd'hui ou une date ultérieure, sans revenir avant la dernière date historisée. Le formulaire garde les versions précédentes. Pour consulter le pays et le fuseau en vigueur à une date passée, utilisez **Consulter une localisation passée**. Avant la première localisation réellement connue, le résultat est **Non renseigné**.

L'aperçu d'horaire prend un **instant UTC** et le convertit dans le fuseau IANA historiquement applicable. L'heure locale affichée suit correctement les changements d'heure ; l'instant UTC original demeure inchangé. Les exemples de fuseaux proposés par l'interface ne constituent pas une liste exhaustive.

## Jours non travaillés

Seuls les **calendriers nationaux** pourront être automatiquement associés au pays dans les prochains incréments. Les spécificités régionales resteront des **absences individuelles nommées et catégorisées**. SMN-47 ne génère ni calendrier régional automatique, ni congé fictif, ni capacité en jours-homme.

Une fiche archivée peut être consultée sans être modifiée. L'historique de localisation empêche toute suppression destructive du membre.

## Recette sur Windows 11

Récupérer `main` avec GitHub Desktop puis, sur la base PostgreSQL pilote :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Tester un membre localisé en France puis déplacé au Canada à une date future ; consulter une date antérieure et une date ultérieure ; vérifier que les deux pays/fuseaux sont distincts et que la langue du site ainsi que les autres personnes sont inchangées. Prévisualiser `2027-03-28T00:30:00Z` puis `2027-03-28T01:30:00Z` pour un membre dont la zone **Europe/Paris** est effectivement enregistrée à cette date : heures locales 01:30 et 03:30 (heure d'été). Une absence de localisation historique doit produire un résultat inconnu, pas une valeur supposée.

Le schéma passe additivement de **v13 à v14**. Tester la migration avant de l'appliquer à une base importante ; les preuves d'exécution restent distinctes de cette documentation.
