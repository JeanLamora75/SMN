# SMN-34 — Renforcement du précontrôle de restauration (10 novembre 2026)

## Mission Amelia

Demande : appliquer la recommandation de Winston pour finaliser l'import/restauration de sauvegardes complètes. Base : [SMN-34](https://lmn24.atlassian.net/browse/SMN-34), Epic SMN-2 et [PV de recette](epic2-etape4-proces-verbal-recette.md).

**Verdict d'architecture confirmé sur GitHub main :** une reconstruction v4 des données PostgreSQL 18 et des documents a été prouvée dans un environnement **isolé**. Ce n'est pas une restauration autorisée sur l'installation réelle. `currentErasureEvidence()` produit explicitement `completeHistory:false` parce que tous les effacements historiques/archives privés ne sont pas qualifiés. L'API `/api/admin/backups/restore/preflight` est volontairement en lecture seule et renvoie HTTP 409 avec `canExecute:false`. **Aucune API d'activation destructive n'est ouverte.**

## Modifications effectivement publiées sur main

1. `src/server/backup/restore-readiness.ts` : une archive n'est plus simplement « vérifiée » ; le précontrôle exige aussi un paquet dont `scopeComplete===true` et un `archive.id` identique au `preview.id`. Toute anomalie bloquante de `preview.issues` est propagée en bloqueur `preview-<issue>`. L'ancienneté (`snapshot-older`) reste un avertissement de perte possible ; tous les garde-fous précédents demeurent obligatoires.
2. `src/app/app/admin/backups/backups-admin.tsx` : l'administrateur visualise les motifs issus du précontrôle et les avertissements, en reprenant les clés i18n de la prévisualisation. Pas de bouton « restaurer maintenant » ajouté ni de confirmation trompeuse.
3. `src/i18n/fr.json` et `src/i18n/en.json` : libellés des deux bloqueurs supplémentaires, intitulé des risques et avertissement de perte de données, internationalisés. Aucune nouvelle chaîne UI en dur.
4. `tests/backup-restore-readiness.test.ts` : tests des deux nouvelles conditions et de la propagation des anomalies.
5. `tests/smn-34-restore-qualification.test.ts` : contrat du préflight non destructif, des traductions FR/EN et du verrou vie privée.
6. `.github/workflows/epic2-lot5-cutover.yml` : inclusion explicite de la qualification SMN-34 dans les tests Linux et Windows ; contrôles typecheck/i18n et rollback PG18 isolé conservés. Pas d'utilisation de `uv`.

## Blocages P0 restant à lever avant activation réelle

- **SMN-40/39/38** : démontrer l'historique exhaustif et signé des suppressions individuelles (y compris celles antérieures à l'inscription du registre), qualifier les documents Office, PDF, archives et versions expurgées, vérifier la non-réidentification des agrégats et prouver qu'un paquet ancien ne peut pas faire réapparaître une personne effacée. Ne jamais substituer `completeHistory:true` sans preuves indépendantes. Les archives non inspectables restent bloquantes.
- **Exécuteur hors ligne production** : définir et tester, sans toucher à la base de travail, un orchestrateur mettant l'application en maintenance externe, arrêtant effectivement tous les écrivains, prenant un checkpoint DB+fichiers vérifié, reconstruisant sur cible indépendante et basculant en conservant des points de retour arrière. État ambigu = maintenance maintenue, récupération manuelle. L'arrêt réel des processus Windows doit être attesté.
- **Sessions et reprise** : révocation de toutes les sessions persistantes, redémarrage, audits d'activation, chemins Office/PDF et diagnostics. Une transaction SQL ne protège pas une bascule simultanée des fichiers.
- **Recette Windows isolée** : exécuter REC-01 à REC-14 du [PV](epic2-etape4-proces-verbal-recette.md) sur une installation de validation dédiée, inspecter visuellement les archives sensibles, mesurer RPO/RTO, puis obtenir une décision fonctionnelle explicite. Jamais sur les données réelles de l'utilisateur sans qualification.

## Preuves et limites

- Publication sur GitHub main vérifiable : [readiness](https://github.com/JeanLamora75/SMN/blob/main/src/server/backup/restore-readiness.ts), [interface](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/backups/backups-admin.tsx), [tests](https://github.com/JeanLamora75/SMN/blob/main/tests/smn-34-restore-qualification.test.ts), [CI](https://github.com/JeanLamora75/SMN/blob/main/.github/workflows/epic2-lot5-cutover.yml).
- Les tests automatisés ne sont **pas** exécutés localement par cette intervention ; consulter leurs conclusions GitHub Actions après déclenchement. Un workflow en attente/annulé ou un succès sur un ancien SHA ne constitue pas une recette actuelle.
- Aucune donnée personnelle n'a été lue, effacée, importée ni restaurée. Aucun script `uv` exécuté.

**Statut fonctionnel :** précontrôle amélioré et publication technique, mais **SMN-34 reste en cours**, restauration active non qualifiée. Ce document n'atteste pas la réussite d'une restauration réelle.
