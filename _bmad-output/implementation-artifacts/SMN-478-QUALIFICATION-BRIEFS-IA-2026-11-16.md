# SMN-478 — Qualification des briefs IA et de la distribution Windows

**Date :** 16 novembre 2026  
**Agent :** Amelia (BMAD v6.12.4), adaptation manuelle des workflows, **aucun script uv exécuté**  
**Références :** [Jira SMN-478](https://lmn24.atlassian.net/browse/SMN-478), [Epic SMN-471](https://lmn24.atlassian.net/browse/SMN-471)  
**Publication :** `main` — développements publiés, **recette opérationnelle non validée**.

## 1. Anomalies corrigées pendant la qualification

- `src/app/app/admin/ai-briefs/templates/template-editor.tsx` : expression JSX malformée dans la modale de tags, corrigée (risque de compilation).
- `src/app/api/admin/ai-briefs/templates/route.ts` : l'API rejetait les prompts au-delà de 4 Ko à cause du `readJsonObject` par défaut ; plafond relevé pour couvrir 100 000 caractères de prompt avec échappement JSON, validation métier serveur conservée.
- Modèles natifs : versions anglaises distinctes chargées localement ; aucun changement d'ID ni de révision et aucune écriture en base.

## 2. Matrice d'acceptation

| AC | Éléments publiés | État de preuve |
| --- | --- | --- |
| AC1 édition, insertion, confidentialité, permissions, clavier et responsive | Tests `tests/smn-478-brief-ui-i18n.test.ts`, `tests/smn-478-brief-browser.e2e.ts` ; tests précédents 472–476 | Tests disponibles, **exécution non démontrée** ; scénario Chromium requiert une installation de test authentifiée |
| AC2 FR/EN, extensibilité à 6–10 langues | Catalogue local `src/lib/ai-brief-messages.ts` (FR/EN et fallback FR), `src/lib/ai-brief-native-locales.ts` ; éditeur/administration/préparation/diagnostics raccordés à la langue SMN | Parité des clés couverte par test ; recette UI FR/EN non exécutée. Les nouvelles langues s'ajoutent par ressources dédiées et adaptation du type, sans gonfler le catalogue global |
| AC3 migration et rollback PostgreSQL isolé | `tests/smn-478-brief-migrations-pg.test.ts` : base vide et modèle historique avec archive immuable ; refus du nettoyage avant backfill ; équivalence ID/révision/sha256 ; `tests/smn-478-native-fresh-install-pg.test.ts` | **Non exécuté** : nécessite PostgreSQL local disponible avec droits de création de base jetable |
| AC4 préservation export/import ZIP | Test de transfert GUI réel `scripts/windows/smn-442-acceptance.mjs` étendu pour injecter un modèle personnalisé et une archive TXT, comparer contenu, ID, révision et empreinte après restauration | Code du scénario publié, **exécution Windows non réalisée** |
| AC5 distribution reconstruite des sources récentes | `scripts/windows/package-portable.mjs` embarque un vérificateur de schéma ; `scripts/windows/verify-package.mjs` contrôle les migrations et le vrai schéma après installation | **Aucune nouvelle distribution Windows n'a été générée ni qualifiée ici** |
| AC6 rapport et limites | Présent dossier, tests avec traces et erreurs explicites, rapport Jira | Documentation publiée ; résultats d'exécution manquants |
| AC7 installation vierge Windows | `scripts/smn-478-verify-brief-schema.ts` exécuté par le smoke Windows : `prompt_text` obligatoire, contrainte, trois modèles natifs, anciennes colonnes absentes, version 33 | Exécution non attestée |
| AC8 mise à jour avec historique | Migration 472→477 via PostgreSQL jetable ; empreintes et identifiants ; coupe-circuit d'export/restauration pour schéma obsolète | **Mise à jour réelle d'un Windows existant non testée**. N'applique aucune migration automatiquement à une base active |
| AC9 deux parcours de sauvegarde/restauration et blocage de livraison | Garde export ZIP `src/server/ai-briefs/schema-compat.ts` + restauration en sandbox `restore-sandbox.ts` + avant bascule `fresh-install-cutover.ts` ; verrou des justificatifs `scripts/windows/smn-478-qualification-gate.mjs` raccordé à `create-delivery-evidence.mjs` | Verrou publié ; **les douze justificatifs ne sont pas encore réunis**, donc livraison non autorisée par ce chemin |

## 3. Sécurité de migration et de restauration

Le numéro de schéma 33 à lui seul **n'est pas une preuve** de compatibilité du format des briefs. Les contrôles read-only `assertPortableAiBriefSchema` exigent :
- tables de modèles et archives présentes ;
- `prompt_text` présent et `NOT NULL` ;
- cinq anciennes colonnes effectivement absentes ;
- aucun prompt vide, nul ou dépassant la longueur autorisée.

L'export ZIP est refusé si la base actuellement utilisée n'est pas au nouveau format. Une sauvegarde ZIP plus ancienne pourrait encore provenir d'un schéma historique ; **la base restaurée dans le bac à sable est recontrôlée**. La bascule finale exige le même contrôle sur la candidate. Aucune base ni archive source n'est modifiée automatiquement pour forcer cette compatibilité. Il faut migrer la source **après sauvegarde vérifiée et répétition de restauration isolée**, puis produire un nouvel export.

Les opérations de backup/restauration restent accessibles par l'interface SMN ; aucun PowerShell, IDE ou CLI supplémentaire n'est demandé à l'utilisateur final.

## 4. Scripts de qualification

- `pnpm test:smn-472-476`
- `pnpm test:smn-477`
- `pnpm test:smn-478` — tests unitaires, traductions, compatibilité et contrats Windows
- `pnpm db:test:smn-478` — PostgreSQL jetable avec ou sans historique ; doit échouer clairement si le serveur local n'est pas disponible
- `pnpm browser:test:smn-478` — test Chromium optionnel sur une installation jetable authentifiée (variables `SMN478_BROWSER_URL`, `SMN478_BROWSER_CHROME`, `SMN478_TEST_COOKIE`, `SMN478_TEST_CYCLE_ID`)
- `pnpm validate:smn-478` — orchestration des tests sans navigateur, typecheck, lint et build
- Test Windows complet : `scripts/windows/verify-package.mjs` avec `SMN_FULL_INSTALL_TEST=true` en environnement Windows jetable autorisé par la politique du projet ; test GUI de transfert `scripts/windows/smn-442-acceptance.mjs`.

Ce sont des commandes **internes d'ingénierie**, et non un parcours d'installation utilisateur.

## 5. Garde de livraison

`scripts/windows/create-delivery-evidence.mjs` exige désormais un reçu `SMN478_QUALIFICATION_RECEIPT` lié au SHA du commit, à des journaux locaux existants et à leurs empreintes SHA-256, comportant **douze contrôles distincts** :
1. Unit tests ;
2. typecheck ;
3. lint ;
4. build ;
5. navigateur ;
6. PostgreSQL vierge ;
7. PostgreSQL avec modèles historiques ;
8. rollback PostgreSQL ;
9. Windows neuf ;
10. Windows mis à jour avec archives ;
11. transfert/restauration ZIP du neuf ;
12. transfert/restauration ZIP de l'installation mise à jour.

Un échec, une étape absente ou une empreinte de journal divergente empêche la création des métadonnées de livraison. Cette vérification des fichiers est un garde-fou technique ; elle ne remplace pas le contrôle humain de la provenance des rapports ni une signature indépendante des preuves.

**GitHub Actions :** le projet a une politique interne désactivant Actions jusqu'à décision explicite. Aucun workflow n'a été activé ni exécuté. La validation doit s'appuyer sur les exécutables de qualification autorisés, un poste jetable et les résultats effectivement observés.

## 6. Tests et résultats réellement obtenus lors de cette intervention

- Lecture des stories, de l'architecture, des sources UI, de l'installateur Windows, de la sauvegarde et des opérateurs de restauration via GitHub/Jira.
- Commits publiés directement sur `main`.
- Contrôles statiques ciblés de cohérence des fichiers modifiés et du contrat d'installation.
- **Non exécutés :** TypeScript, ESLint, build, tests node/tsx, PostgreSQL, Chromium, installation ZIP réelle, mise à jour Windows réelle, restauration avec et sans historique.
- **Aucun ZIP de distribution n'a été construit ou validé**, et aucune base SMN utilisateur n'a été modifiée.

## 7. Décision Jira

Rester en statut **En cours**, pas **Terminé**. Les AC3/AC4/AC5/AC7/AC8/AC9 exigent des preuves d'exécution qui ne sont pas encore disponibles. Ne pas inventer de CI verte ni de distribution validée.

**Liens :**
- https://github.com/JeanLamora75/SMN/tree/main
- https://github.com/JeanLamora75/SMN/blob/main/docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md
- https://lmn24.atlassian.net/browse/SMN-478
