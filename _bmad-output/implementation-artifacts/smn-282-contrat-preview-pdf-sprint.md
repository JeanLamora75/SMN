# SMN-282 — Décision technique : prévisualisation PDF Sprint (27 octobre 2026)

## Constat vérifié dans les fichiers consultables
- `src/app/api/admin/reports/sprints/[id]/pdf/route.ts` crée l'URL interne `/app/admin/sprints/{id}/report/preview?reference={uuid}`.
- `src/server/reports/frozen-pdf.ts` accepte précisément cette URL et attend le sélecteur HTML `.smn-report-printable article` pour produire le PDF.
- `src/server/reports/render-reference.ts` conserve le contenu figé et son empreinte SHA-256.
- `next.config.ts` ne définit aucune réécriture de cette URL.
- Les chemins Next.js conventionnels de cette page ont été interrogés sur la branche, sans fichier trouvé. Ce constat n'est **pas** une preuve exhaustive d'absence dans tout le dépôt.

## Barrière de sécurité maintenue
La route PDF Sprint standard avec `teamId` répond `503 team-pdf-preview-pending`. La levée de cette barrière est interdite tant que la page interne n'est pas identifiée ou créée et revue.

## Contrat obligatoire de la page interne
1. Authentification par session réelle ; rejeter les accès anonymes, les comptes non autorisés et les sessions invalides.
2. Résolution de l'équipe active **par le serveur** en v28, sans accorder de droits à partir du seul paramètre `teamId`.
3. Vérification croisée de l'identifiant Sprint, de l'équipe et de la référence figée au moment du chargement, en SQL.
4. Vérification cryptographique de l'empreinte de la référence avant d'afficher toute donnée.
5. Rendu exclusivement depuis la charge utile figée ; ne pas recomposer depuis un Sprint modifiable.
6. Réponse non indexable et non cacheable ; ne pas exposer de données d'autres équipes dans l'HTML ou dans les chargements secondaires.
7. Interdire les accès directs avec référence ou équipe croisée (A/B), y compris dans le navigateur PDF.
8. Garder une voie distincte v27 protégée et vérifier la non-régression.
9. Garantir le sélecteur `.smn-report-printable article` attendu par le générateur, puis revalider archive/idempotence.

## Recette 6C complémentaire
Tester la visite directe de la page, la génération via Puppeteer, les références croisées entre deux équipes, une référence altérée, une session expirée, un compte `user`, et la compatibilité v27. Consigner le résultat effectif, sans déclarer de contrôle exécuté par anticipation.

**Statut :** diagnostic statique et contrat publiés ; aucune exécution de tests, migration v28 ou fusion.
