# SMN-40 — Qualification ciblée de l'archive v4 (11 novembre 2026)

## Objet et preuves techniques

Archive : `a710f9a7-8a48-4fbc-b3ae-17e3c14bed4d`.
Deux restaurations PostgreSQL 18 **physiquement isolées**, conservées :
- `smn_restore_test_latest_backup_20261111`
- `smn_restore_test_latest_compare_20261111`

Résultats rapportés de l'exécution locale : **195 tables chacune, empreintes de toutes les lignes identiques, 0 différence**. Le test de bascule/rollback jetable Windows a réussi **3/3**. Ces preuves ne qualifient ni les informations personnelles ni la bascule réelle de production.

**Interdictions :** ne pas supprimer, modifier ou réinitialiser les deux bases de preuve ; ne pas restaurer la base active ; ne pas déverrouiller un `restorationAuthorized` sur la seule base des tests.

## 1. Archives Office — périmètre et revue

L'inventaire actuel signalé par `smn-40-historical-privacy-audit.ts --check` comprend :
- **1 rapport Office** ;
- **1 modèle Office** ;
- **0 PDF et 0 document privé**.

Leur présence et intégrité sont vérifiées, **pas leur innocuité**. Examiner chacun des deux documents **localement**, dans l'environnement approprié, sans publier leur contenu ni leur nom dans les journaux ou dans GitHub :
- texte, tableaux, commentaires, notes et anciennes révisions ;
- propriétés du document (auteur, dernière modification, chemins et métadonnées) ;
- diapositives/objets masqués, objets embarqués et images ;
- identifiants directs, quasi-identifiants et croisements avec les données d'équipe ;
- éventuels tags non remplacés contenant des valeurs personnelles.

La politique actuelle `assessArchiveReview` exige une décision *liée à l'empreinte* ; un simple « approuvé » ou « aucun nom visible » ne suffit pas. Si le contenu peut réintroduire des données retirées, **restreindre l'accès à l'original** ou le **remplacer par une version expurgée**, et vérifier effectivement la restriction. Garder une trace locale du réviseur, de la date, du hash, de la décision et des justificatifs, sans exposer les données personnelles. Pour l'instant : **revue humaine non attestée et conservation non autorisée**.

## 2. Sept familles d'agrégats — décision indépendante

Pour chaque famille, constituer un inventaire lié à une révision/hash ; vérifier :
- absence d'identifiants directs et indirects ;
- absence de cohortes à une personne / d'effets de déduction par différence ;
- absence de réidentification par croisement entre rapports, itérations ou équipes ;
- snapshots historiques et exports, y compris les états figés.

| Famille | État initial | Décision possible |
|---|---|---|
| `velocity` | Non examinée | Conserver après preuve / expurger / supprimer |
| `capacity` | Non examinée | Conserver après preuve / expurger / supprimer |
| `story-points-per-day` | Non examinée | Conserver après preuve / expurger / supprimer |
| `sprint-report` | Non examinée | Conserver après preuve / expurger / supprimer |
| `indicator-v33` | Non examinée | Conserver après preuve / expurger / supprimer |
| `dashboard-builder` | Non examinée | Conserver après preuve / expurger / supprimer |
| `frozen-snapshot` | Non examinée | Conserver après preuve / expurger / supprimer |

Une famille non qualifiée bloque la conclusion. Une demande d'expurgation/suppression reste **à réaliser et à vérifier indépendamment** avant de considérer les données comme traitées. Référence : `assessCollectiveRetentionSet` dans `src/server/backup/collective-retention-policy.ts`.

## 3. Historique d'effacement — preuve temporelle

Le registre externe HMAC a débuté le **2026-11-11 à 13:36:18.984 UTC**.
La nouvelle archive a été créée **après** le début de cette couverture. Cette différence avec l'ancienne archive d'avant enrôlement doit être constatée par `smn-40-privacy-qualification.ts --archive <UUID> --check`.

Dernière observation fournie : **7 protections SQL**, registre HMAC vérifié, **0 événement enregistré**, aucune intention en attente. Attention :
- aucun événement **enregistré** ne démontre pas l'absence d'opération ancienne ou non journalisée ;
- le rapport historique général peut afficher `preEnrollmentHistoryAttested:false` à juste titre ;
- les éventuelles copies externes, exports, sauvegardes antérieures et données expurgées restent à réconcilier ;
- l'intégrité et l'absence d'intentions d'effacement doivent être **recontrôlées au moment d'une future opération**, sans réutiliser une attestation périmée.

Il ne faut ni inventer une attestation historique ni déclarer une donnée sûre en l'absence de traces. Les divergences non explicables bloquent le processus.

## Commande de qualification non destructive

```powershell
pnpm exec tsx scripts/smn-40-privacy-qualification.ts --archive a710f9a7-8a48-4fbc-b3ae-17e3c14bed4d --check
```

Cette commande ne modifie ni la base active, ni les bases REC-04, ni les archives. Son résultat constitue **un inventaire d'exigences**, et non une autorisation. Les décisions humaines restent nécessaires.

## État de validation

| Élément | Statut |
|---|---|
| Double reconstruction et empreintes de 195 tables | Validé par sortie locale |
| Exercices jetables de rollback Windows (3/3) | Validé par sortie locale |
| Qualification Office des deux fichiers | **En attente de lecture / preuve locale** |
| Qualification des sept familles | **En attente de revue des données** |
| Chronologie HMAC de la nouvelle archive | À confirmer par script dédié |
| Couverture des événements non journalisés et des copies externes | **Non démontrée** |
| Bascule/rollback en production réelle | **Non qualifiés** |
| Autorisation de restauration active | **Interdite** |

Aucune des étapes de ce document ne doit altérer les deux bases isolées conservées comme preuves.
