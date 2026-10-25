# SMN-254 — Socle de rapports multiples (livraison technique en cours)

## Périmètre
Branche `feat/smn-254-multiple-report-drafts` depuis `main`. Cette livraison ne remplace ni le studio legacy ni les PDF archivés, ne change aucun calcul métier et n'implémente pas SMN-255.

## Matrice existant / action / risque
| Existant | Action | Risque / contrôle |
|---|---|---|
| `smn_report_draft`, `smn_report_section_options`, `smn_report_content_options` indexés par `sprint_id` | Conserver les lignes et anciennes routes, ne pas convertir en place | Écriture partagée si la nouvelle UI réutilise par erreur les anciennes routes : les nouveaux documents doivent employer leur propre ID |
| `src/server/reports/report-projection.ts`, snapshots de clôture et rapports historiques | Lecture métier inchangée | Vérifier les cas de sprint clos avant bascule |
| `smn_report_pdf_archive` et fichiers privés avec SHA256 | Aucune modification, suppression ni rétro-migration | Tester lecture et checksum de l'archive existante |
| `smn_report_template` + modèle Standard | Lire le modèle et capturer version et copie des réglages lors de la création | Évolution du modèle source ne doit pas changer la copie |
| Autorisation `admin/user` | GET sous `collective/read`, POST/PATCH sous `settings/write` avec vérification du sprint serveur | Tester refus utilisateur et hors périmètre en intégration |
| Thèmes et FR/EN | Pas de changement UI ; langue FR/EN du document conservée | L'interface SMN-255 devra traduire ses messages via JSON |

## Implémentation
- `src/server/reports/report-documents.ts` : création transactionnelle, listing, lecture et modification par ID de document, copie initiale du modèle, contrôle de révision.
- `src/app/api/admin/reports/sprints/[id]/documents/route.ts` : GET/POST.
- `src/app/api/admin/reports/sprints/[id]/documents/[documentId]/route.ts` : GET/PATCH.
- `prisma/migrations/20261025_smn254_report_documents/migration.sql` : table additive, index, contraintes, instructions ré-exécutables.
- `tests/smn-254-report-documents.test.ts` : deux IDs, indépendance A/B, isolation par sprint, droits et conflit de révision.

## Compatibilité et migrations
La table `smn_report_document` est additive et garde un `sprint_id`, `team_id`, `template_id`, `template_version` et un contenu JSON propre à chaque document. Aucune ancienne donnée ne subit de mutation, aucune archive n'est réécrite. L'installation du SQL est idempotente grâce à `IF NOT EXISTS`. Le POST crée aussi la table si elle n'existe pas, comme les fournisseurs legacy ; le déploiement standard de la migration et un test sur base PostgreSQL restent à démontrer.

**Retour arrière :** désactiver les nouvelles routes / revenir au code `main` sans supprimer la nouvelle table. La suppression de table est volontairement exclue pour ne pas perdre les nouveaux brouillons.

## Vérifications
- Code consulté dans GitHub, Story et AC consultés dans Jira : oui.
- Exécution de `pnpm test`, `pnpm typecheck`, `pnpm build` : **non exécutée**, dépôt non disponible en environnement Node 24/pnpm et PostgreSQL de test non connecté.
- Migration exécutée dans PostgreSQL : **non**.
- Test d'intégration admin/user, snapshots, archive et PDF : **non exécuté**.
- CI GitHub Actions : désactivée.

**Statut :** implémentation partielle sur branche, non fusionnée et non validée. Ne pas marquer Jira Done.

## Risques résiduels
1. Absence de test d'installation/migration réelle PostgreSQL et de non-régression legacy.
2. Les anciennes routes de composition restent mono-brouillon par Sprint ; le nouvel éditeur doit cibler l'ID du document et non les anciennes routes.
3. Validation stricte et sérialisation des blocs du futur studio à préciser avant SMN-259.
4. Contrat UX futur « dernier enregistrement accepté » : le contrôle de révision de ce socle rejette une écriture concurrente par 409. À harmoniser lors de la sauvegarde automatique de SMN-263 sans perdre l'ordre intra-session.
5. Les archives d'ancienne génération ne sont pas transformées en documents éditables ; elles restent lisibles par leurs URL historiques.

## Préparation SMN-255
Construire le Centre Rapports en réutilisant les GET existants et nouveaux : liste par Sprint, états vides, filtres, onglets Rapports/Modèles/Archives, navigation contextuelle uniquement vers les routes réelles ; limiter les actions `user` à la lecture. Ne pas toucher au rendu PDF ni à l'archivage pendant cette Story.
