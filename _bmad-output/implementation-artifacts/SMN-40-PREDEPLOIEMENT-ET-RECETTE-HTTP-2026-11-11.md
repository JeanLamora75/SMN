# SMN-40 — Préparation de déploiement et qualification HTTP
Date : 2026-11-11. État : **préparation technique réalisée ; autorisation de déploiement non acquise**.

## Preuves obtenues

- PostgreSQL 18 isolé, recette intégrée réalisée localement par l'opérateur :
  `EPIC2-SMN40-PG18: old snapshot denied, post-erase clone integrity verified` ;
  1 test réussi, 0 échec.
- Réexécution des migrations de protection SQL sur base `smn40_migration_test` :
  quatre déclencheurs actifs, transactions de recette annulées.
- Suppression directe de membre sans reçu : refusée. Avec reçu transactionnel :
  acceptée sur données fictives puis annulée.
- Restriction d'archives : refus de UPDATE et DELETE confirmé, données fictives annulées.
- Sept tests locaux existants et deux tests simulés de l'exécuteur réussis.
- Contrôle HTTP : contrat de route et jeton signé couverts par tests ; une
  vérification HTTP anonyme en boucle locale est fournie mais son exécution
  doit être observée sur une installation en marche.

## Contrôles disponibles

### Vérifier les contrats locaux

```powershell
pnpm exec tsx --test tests/smn-40-http-and-predeploy.test.ts tests/smn-40-maintenance.test.ts tests/epic2-smn40-executor-qualification.test.ts
```

### Vérifier réellement la barrière HTTP sans session administrateur

Le serveur SMN doit déjà être démarré localement. Cette opération ne transmet
ni cookie, ni jeton valide, ni identité de membre, et ne peut pas déclencher
d'effacement :

```powershell
pnpm exec tsx scripts/smn-40-http-smoke.ts --url=http://127.0.0.1:3003
```

Résultat attendu : 403 `forbidden` pour les deux requêtes.

**Limite** : ce test ne prouve pas le parcours HTTP authentifié et sa validation
de bout en bout ; ce point doit être testé avec une session et une base de
recette explicitement isolées.

### Audit pré-déploiement de la base active — lecture seule

```powershell
pnpm exec tsx scripts/smn-40-predeploy-audit.ts --check
```

Le script refuse les URL distantes, exige une base native locale
`smn` / `smn_*`, ouvre une transaction `REPEATABLE READ READ ONLY`,
puis produit l'inventaire des sept protections, des membres, des archives
PDF et du registre d'effacement externe.

Il **ne vérifie pas** par lui-même l'intégrité d'une sauvegarde, ne qualifie
pas les effacements antérieurs et n'autorise jamais l'application des
migrations. Ne pas interpréter `externalLedger=verified` comme une preuve
de complétude historique.

## Conditions bloquantes avant tout déploiement

1. CI I0 générale verte, ou écarts résolus avec preuves explicites.
2. Parcours HTTP admin sur environnement de recette : refus sans droit, sans
   accusé de copies externes, avec plan altéré/périmé, avec révision modifiée ;
   succès borné après vérification de l'intégrité SQL et du registre externe.
3. Contrôle des sauvegardes de **la base active** : sauvegarde v4 vérifiée,
   archives PDF/Office cohérentes et possibilité de retour arrière qualifiée.
4. Analyse d'impact sur les données réelles : absence de suppression légitime
   empêchée de façon imprévue, règles pour membres archivés et dépendances.
5. Vérification des répertoires externes d'intention, du registre et de l'ancre
   en dehors des sauvegardes, sans inventer d'historique pré-enrôlement.
6. Exécution explicite de la maintenance additive seulement après autorisation
   opérationnelle, jamais par démarrage automatique ou à travers ce document.

## Décision

**NO-GO déploiement et restauration historique** tant que ces conditions ne
sont pas démontrées. Les preuves techniques en sandbox ne remplacent pas une
qualification de confidentialité historique. Ne jamais initialiser un registre
vierge pour déclarer vérifiées des suppressions passées.


## Préparation du registre externe — sans enrôlement

L'audit de l'installation active du 11/11/2026 a constaté 15 membres,
0 archive PDF référencée, 0/7 protections installées et
`externalLedger=unconfigured`. **Ne pas initialiser de registre vierge**
avant qualification des suppressions antérieures.

Le registre utilisera trois variables `SMN_ERASURE_LEDGER_DIR`,
`SMN_ERASURE_ANCHOR_DIR` et `SMN_ERASURE_LEDGER_KEY_HEX`.
Les deux répertoires doivent être absolus, distincts, non imbriqués, hors
des dossiers de sauvegarde, des documents privés et des rapports/modèles Office.
La clé de 32 octets en hexadécimal doit rester confidentielle, sauvegardée et
récupérable selon une procédure sécurisée distincte ; ne jamais la commiter
ni la copier dans une sortie de diagnostic.

Le système vérifie les ancrages HMAC, les déchirures d'écriture et les
intentions en attente. Il ne fournit pas un stockage WORM matériel et
ne peut pas certifier les opérations antérieures à son enrôlement.

### Sauvegarde v4 existante — contrôle sans écriture

Sur l'installation d'origine, après synchronisation GitHub :

```powershell
pnpm exec tsx --test tests/smn-40-backup-readiness.test.ts
pnpm exec tsx scripts/smn-40-backup-readiness.ts --archive 1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5 --check
```

Le premier test valide le contrat de sécurité de la commande.
Le second inspecte l'archive v4 et compare l'inventaire des PDF,
rapports et modèles Office aux fichiers présents.
**Il n'effectue aucune restauration**, et un succès d'intégrité
n'est pas une preuve de retour arrière ni de conformité historique.

La recette REC-04 a précédemment reconstruit un instantané dans un
cluster isolé PG18, sans qualification définitive de restauration :
cette preuve ne remplace pas un contrôle à jour de la sauvegarde active.
