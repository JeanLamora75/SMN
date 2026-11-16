# SMN-477 — Nettoyage du format historique des briefs IA

**Date :** 16 novembre 2026  
**Agent :** Amelia — BMAD v6.12.4, adaptation du workflow sans exécution de scripts `uv`.  
**Publication :** branche `main` du dépôt `JeanLamora75/SMN`.  
**Statut :** développement publié, qualification PostgreSQL/Windows/restauration **NON ACQUISE**.

## Inventaire initial (AC1)

| Référence | Avant | Mesure / statut |
| --- | --- | --- |
| `src/server/ai-briefs/templates.ts` | Les modèles conservaient `sections/questions/instructions/data/depth`, validateur historique, branchement de lecture `prompt_text` facultatif, insertion de champs anciens | Contrat `promptText` seul et requêtes SQL `prompt_text` ; anciennes insertions/validations supprimées. Écritures refusées jusqu'à migration du schéma. |
| `src/lib/ai-brief-templates.ts` | Trois modèles natifs définis en tableaux de rubriques/questions/consignes | Trois prompts texte autonomes, mêmes identifiants stables, sans colonnes historiques ; champs collectifs autorisés maintenus pour le moteur métier. |
| `src/lib/ai-brief-txt.ts` | Générateur TXT historique basé sur rubriques | Fichier supprimé ; nouveau résolveur `src/lib/ai-brief-tag-resolver.ts` et préparateur de SMN-476 conservés. |
| `src/app/app/admin/ai-briefs/prepare/page.tsx` | Référence encore `selected.data` | Affichage des faits collectifs numériques ; aucune dépendance aux colonnes du modèle. |
| `src/server/ai-briefs/facts.ts` | `projectBriefSelection` devenu inutile | Helper retiré ; lecteur de faits collectif conservé. |
| `src/lib/ai-brief-templates.ts` | `projectCollectiveBriefFacts` devenu inutile | Helper retiré. |
| `tests/smn-180-...`, `tests/smn-188-...` | Assertions sur ancien format | Tests mis à jour pour contrat texte libre et règles collectives. |
| `prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql` | Historique originel : 5 colonnes et contrainte `depth` | Conservé **à des fins historiques** : ne pas modifier un fichier de migration déjà appliqué. |
| `prisma/baseline/v33/schema.sql` | Snapshot natif versionné contenant les 5 colonnes | Conservé : son contenu/hash est contractuel pour les installations v33. Nettoyage appliqué dans la **même transaction** avant publication d'une installation neuve. |
| `src/server/installation/install.ts` | DDL natif puis migration 472 additive | Deux migrations séquentielles 472 et 477 dans la transaction d'installation ; le schéma **après COMMIT** ne comporte plus les colonnes obsolètes. |
| `scripts/windows/package-portable.mjs` | Liste blanche des SQL embarqués | Inclusion explicite des migrations 472 et 477 dans le ZIP reconstruit. |
| `src/server/ai-briefs/archive.ts`, `library.ts`, `duplicates.ts`, `journal.ts`, `responses.ts` | Archives immuables, ID et révision du modèle, réponses et journal | Aucun schéma ni code métier de ces tables modifié. |
| Sauvegarde / restauration | ZIP applicatif signé sans DDL automatique, import GUI et restitution de PostgreSQL | Les opérateurs existants sont conservés ; une restauration d'ancien schéma peut nécessiter **472 puis 477** avant utilisation de la nouvelle application. Aucun test de restauration exécuté. |

## Migration de nettoyage (AC2, AC5, AC7)

`prisma/migrations/20261116_smn477_brief_legacy_cleanup/migration.sql` :

1. Vérifie l'existence de la table et du champ `prompt_text`.
2. Refuse toute ligne sans texte, vide ou dépassant 100 000 caractères.
3. Rend `prompt_text` obligatoire et vérifié.
4. Retire les cinq colonnes avec `DROP COLUMN IF EXISTS`, **sans CASCADE**. Les dépendances non prévues doivent faire échouer la transaction.
5. Ne touche ni aux IDs ni aux révisions de modèles, ni aux tables d'archives/réponses/journal.
6. Supporte l'application répétée de la contrainte et des `DROP IF EXISTS`.

`scripts/apply-smn-477-brief-cleanup.ts` :

- `--check` : contrôle sans modification, transaction annulée.
- `--apply` : réservé à la maintenance **après** sauvegarde et restauration isolée vérifiées. Le script impose les deux accords d'exploitation explicites `SMN_AI_BRIEF_BACKUP_VERIFIED` et `SMN_AI_BRIEF_RESTORE_REHEARSAL_VERIFIED`.
- Conserve le volume des modèles/archives et compare une empreinte des IDs/révisions de modèles et des IDs/références SHA-256 d'archives avant/après ; rollback sur divergence.
- Une base déjà nettoyée est prise en charge par le contrôle de SMN-472 sans requête sur des colonnes disparues.
- **Aucun lancement sur une base utilisateur n'a été effectué** et aucune sauvegarde n'a été attestée ici.

Les scripts sont des opérations techniques de maintenance, **pas** des actions à demander à un utilisateur final. La distribution doit conserver un parcours graphique de sauvegarde/restauration.

## Installation neuve (AC8)

L'installation native v33 ne modifie pas son snapshot historique immuable. Les migrations 472/477 sont appliquées dans la transaction PostgreSQL d'installation, **avant le COMMIT**. Ainsi, le schéma final visible après succès ne contient aucun champ de l'ancien modèle. En cas de SQL invalide, la transaction entière est annulée. La liste des SQL copiés dans le paquet Windows contient désormais les deux fichiers.

## Tests ajoutés / adaptés

- `tests/smn-477-brief-cleanup.test.ts` : contrat applicatif, 3 modèles natifs, garde SQL, packaging Windows, exigences de preuve avant la migration, immutabilité du référentiel d'archives.
- `tests/smn-180-brief-template-management.test.ts` : validateur de prompt libre et autorisations.
- `tests/smn-188-initial-ai-brief-templates.test.ts` : prompts natifs et absence de champs individuels.
- `tests/smn-472-prompt-migration.test.ts` : conservation/déterminisme de conversion historique.

**Exécution NON attestée :** `pnpm test:smn-477`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, migration sur PostgreSQL isolé, recette Windows, comparaison de sauvegarde/restauration, CI. L'environnement n'a ni accès réseau Git depuis le terminal ni dépendances de SMN installées. Aucun script `uv` n'a été lancé.

## Points de qualification restants

- Sur base PostgreSQL **isolée** : créer des modèles historiques et des archives immuables, appliquer 472, vérifier la conversion, sauvegarder/restaurer, appliquer 477, comparer empreintes et métadonnées.
- Sur installation Windows **neuve** : vérifier le schéma final (5 colonnes absentes, `prompt_text` obligatoire), création de modèle, préparation, archivage, redémarrage.
- Sur installation Windows **existante** : qualifier l'enchaînement 472 → 477 dans la maintenance contrôlée (le système de mise à jour applicatif ne doit pas appliquer automatiquement un DDL).
- Transfert ZIP vers un second PC : vérifier la compatibilité **de la version de schéma de la source** avant bascule et bloquer proprement les sauvegardes d'une version non encore migrée ; ne jamais transformer silencieusement une restauration.
- Vérifier l'exhaustivité des usages anciens par une recherche exhaustive et compilation du dépôt. La recherche GitHub Code renvoie des résultats incomplets et ne constitue pas une preuve d'absence absolue.

**Décision de qualité :** garder SMN-477 **En cours** dans Jira jusqu'aux preuves listées, conformément à `docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md`. La publication sur `main` ne signifie pas qu'une migration sur données réelles a eu lieu.

## Références

- Story : https://lmn24.atlassian.net/browse/SMN-477
- Étude technique : https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/architecture/ETUDE-TECHNIQUE-REFONTE-BRIEFS-IA-2026-11-15.md
- Politique qualité : https://github.com/JeanLamora75/SMN/blob/main/docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md
