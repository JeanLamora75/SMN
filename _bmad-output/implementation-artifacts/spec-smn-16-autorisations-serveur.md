---
title: "SMN-16 — Matrice serveur Administrateur / Utilisateur"
type: feature
created: "2026-10-20"
status: review
route: dispatch
review_loop_iteration: 0
baseline_commit: "9a7d8eb91147f40337326d030935da78efffc698"
remote_baseline_commit: "095cf8ffd235f776b1a15a157ad4deccd1c46a70"
context: []
---

<frozen-after-approval reason="Story Jira validée le 19/10 ; développement autonome explicitement autorisé le 20/10, recette globale différée">
## Intent
Appliquer la matrice D-PRD-136/AD-31 avec exactement deux profils sur les opérations serveur. L'Administrateur actif gère les données ; l'Utilisateur actif consulte uniquement les collectifs et les PDF/TXT existants explicitement autorisés.

## Boundaries & Constraints
Toujours : relire la session serveur ; refuser comptes inactifs, rôles inconnus, changement initial non terminé, ressource absente ou hors installation. Respecter les protections propres aux ressources, les refus d'origine des mutations et la confidentialité des réponses. Réutiliser la base existante sans migration ni effacement.
Jamais : troisième profil, permissions par équipe, moteur configurable, faux documents, nouvelles tables métier ou génération PDF/TXT. Les futurs producteurs réutilisent le contrat d'autorisation ; leur absence n'autorise aucun endpoint fictif. Connexion, changement de son secret initial, activité et déconnexion demeurent des opérations de compte propre, disponibles aux deux rôles selon SMN-14. L'installation anonyme reste limitée à l'amorçage déjà contrôlé.

## I/O & Edge-Case Matrix
| Scénario | Résultat |
| --- | --- |
| Administrateur actif, ressource connue dans l'installation | Lecture et mutations métier permises, administration permise ; protections propres toujours appliquées. |
| Utilisateur actif, collectif | Lecture seule ; projection explicite sans coordonnées ni données individuelles. |
| Utilisateur, écriture/génération/administration | Refus serveur ; aucun callback de lecture sensible ou écriture exécuté. |
| Utilisateur, individuel | Refus même en lecture : membres sensibles, coordonnées, absences et capacités nominatives. |
| Utilisateur, PDF/TXT existant autorisé | Lecture et téléchargement permis ; écriture et génération refusées. |
| Document non autorisé, format inconnu, ressource absente/hors périmètre, acteur invalide | Refus fermé sans contenu, sans callback et sans détail d'existence. |
</frozen-after-approval>

## Code Map
- `src/server/access-policy.ts` : contient seulement les anciens contrôles setup/private ; conserver leur compatibilité.
- `src/server/auth/session.ts` : sessionAccount/currentAccount relisent compte actif/rôle/empreinte ; ne pas remplacer les sessions.
- `src/server/auth/authorization.ts` à créer : garde API unique utilisant sessionAccount, Host et Origin, sans confiance dans le rôle fourni par le client.
- `src/app/api/admin/accounts/{route.ts,[id]/route.ts}` : remplacer contrôles de rôle dupliqués par garde centrale ; conserver codes, erreurs, révocation et protections dernier admin.
- `src/app/app/page.tsx`, `src/app/app/admin/users/page.tsx` : aligner décisions page/navigation sur même politique.
- `src/server/dashboard/read.ts` : projection collective actuelle produit/équipe/mode ; pas d'e-mail, hash, absence individuelle.
- `scripts/verify-http-ci.mjs` : serveur réel et PostgreSQL temporaire ; tests comptes existants à conserver.
- Ressources individuelles et archives documentaires : pas de producteurs livrés, tests de contrat uniquement, sans prétendre à des téléchargements réels.

## Tasks & Acceptance
- [x] `src/server/access-policy.ts` : politique pure explicite, actions read/write/generate/download, ressources collective/individual/accounts/settings/documents/backups. Refus par défaut ; métadonnées serveur exists/inScope strictement vraies. Lecture/download documents exigent PDF/TXT et, pour user, explicitement autorisé ; la génération admin vise une collection existante. Exposer une opération protégée qui contrôle avant d'invoquer le callback, pour intégration des futurs producteurs.
- [x] `src/server/auth/authorization.ts` : garde API centrale, acteur uniquement issu de sessionAccount, requête locale et origine requise pour mutations. Aucune construction de rôle ou métadonnée d'autorisation depuis le JSON client.
- [x] Routes comptes et pages privées : utiliser cette politique sans changer le comportement SMN-15 ni exposer Account au client.
- [x] `src/app/api/dashboard/route.ts` : GET collectif authentifié, projection du contrat readCollectiveDashboard, no-store. 403 générique pour refus ; pas d'API individuelle ou d'archive fictive.
- [x] `tests/authorization.test.ts` : tests indépendants de la matrice, toutes combinaisons rôle/ressource/action, absence/périmètre/état du compte, documents ; spy prouvant aucun callback en cas de refus et retour de contenu uniquement autorisé. TDD : constater rouge puis vert.
- [x] `scripts/verify-http-ci.mjs` : tester lecture API dashboard admin/user, projection sans champs individuels, refus anonymes/comptes initiaux, comptes inchangés après POST/PATCH user refusés ; conserver les autres preuves HTTP et révocation.
- [x] `docs/AUTORISATIONS-SMN-16.md`, cette spec et sprint-status : matrice lisible, distinction tests réels/contrats futurs, recette globale Windows à venir. Jira En cours, BMAD review après CI ; ne rien clôturer.

AC1–AC6 : correspondent aux six lignes de la matrice ci-dessus, dans le même ordre. Les tests des producteurs absents sont des preuves du contrat réutilisable, pas la livraison anticipée des Epics métier/archives.

## Implementation Notes
Mandat : publication directe sur main sans PR, corrections autonomes, recette Windows globale différée. Reprise progressive BMAD ; aucun jalon d'approbation technique supplémentaire demandé car déjà autorisé. Base personnelle jamais utilisée par les tests.
Copie locale issue des fichiers GitHub vérifiés ; baseline locale synthétique pour les diffs, révision distante canonique conservée séparément. Aucun push de cet historique local.

## Verification
- Tests ciblés : `pnpm exec tsx --test tests/authorization.test.ts`, rouge avant implémentation puis vert.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` ; local sans URL DB, intégrations PG ignorées explicitement.
- CI main : PostgreSQL 18 réel, HTTP production, TypeScript, Linux et Windows ; paquet autonome Windows après changements source.
- Recette Windows 11 utilisateur non réalisée : contrôle ultérieur global, sans réinstallation.

## Review Triage Log

| Relecteur / observation | Verdict, preuve et traitement |
| --- | --- |
| Blind 1 — combinaisons garde HTTP | medium : le refus d'Origin absente est atteignable mais non exercé ; ajout d'un POST admin sans Origin et preuve de non-écriture. Les combinaisons de génération sans producteur restent hors endpoints livrés, couvertes par le contrat pur. |
| Blind 2 — sessions révoquées sur dashboard | medium : les contrôles de session sont présents, mais une régression de cette nouvelle route passerait inaperçue ; ajout de cookies révoqués après rôle et désactivation. |
| Blind 3 — dernier admin avec un autre acteur autorisé | false : s'il ne reste qu'un admin actif local, le seul acteur API autorisé serait ce même compte et la protection du compte propre refuse avant le comptage ; aucun autre acteur permis ne peut exercer le scénario proposé. Le filtre du comptage reste conservé. |
| Blind 4 — accountById étranger | medium : couverture login distincte de la relecture de session ; test d'un compte authentifié déplacé hors singleton, puis refus dashboard/me. |
| Blind 5 — erreur de contexte en HTTP | medium : le lecteur est testé mais pas son mapping HTTP ; suppression/restauration exacte de l'équipe de test et vérification du refus générique sans contenu. |
| Blind 6 — callback de refus et entrées invalides | low : acteur inconnu déjà couvert ; ajout d'une petite table explicite des autres entrées refusées pour prouver l'absence d'exécution, sans changer la politique. |
| Edge Case Hunter | Aucun défaut signalé après traçage. |
| Verification gap 1 — session hors singleton | medium : même racine que Blind 4, preuve par retrait isolé du prédicat de accountById ; corrigé par le même test. |
| Verification gap 2 — mapping d'erreur dashboard | medium : même racine que Blind 5, une réponse 500 ou détaillée n'était pas détectée ; corrigé par le même test. |

## Résultats locaux — 2026-10-20

- Frontmatter `context: []` : aucun fichier contextuel supplémentaire.
- TDD observé rouge avant implémentation (`canAccess`/`protectedOperation` absents), puis 75 tests ciblés verts via `node --import tsx --test tests/authorization.test.ts`.
- `pnpm lint`, `pnpm typecheck` et `pnpm build` réussis. Suite complète avec le chargeur tsx direct : 131 réussis, 1 ignoré, aucun échec. Sans URL DB ; intégrations PostgreSQL ignorées explicitement.
- `pnpm exec tsx` et `pnpm test` bloqués par la restriction IPC locale (`listen EPERM`), sans changement de code pour contourner les permissions.
- Script HTTP étendu et syntaxe vérifiée ; exécution PostgreSQL/HTTP réservée à CI main. CI Linux/Windows et paquet autonome ensuite réussis. Jira reste En cours et BMAD review, sans clôture.
- Documentation `docs/AUTORISATIONS-SMN-16.md` : matrice et séparation entre endpoints réels et contrats futurs. Recette globale Windows 11 différée, sans réinstallation.
- Fermeture de périmètre AC6 : authentification et gestion des comptes explicitement limitées au singleton, sans migration ; preuve HTTP CI d'une ligne étrangère invisible, non modifiable et inutilisable pour se connecter.

## Adaptation de reprise
Workflow BMAD rendu officiellement dans cet environnement. Mandat utilisateur de développement autonome et fonctionnel déjà validé appliqué au jalon de spécification ; aucune approbation technique intermédiaire requise. Trois revues indépendantes lancées sur le diff avant publication ; corrections de vérification confiées au même développeur. Le statut final attendu reste review pour recette globale Windows différée, sans clôture Jira.

## Vérification après revue
76 tests ciblés de politique et 132 tests locaux réussis sur 133, un ignoré, zéro échec. Lint et TypeScript réussis après les ajouts de tests ; build applicatif déjà réussi sur les mêmes sources. Les scénarios HTTP de session hors périmètre, contexte absent, révocation et Origin absente sont ajoutés ; leur exécution réelle PostgreSQL/HTTP a réussi dans la CI finale référencée ci-dessous.

## Preuves CI finales — 20 octobre 2026

- Application : `f1eea1fe261ef14cb5f34cd0eea7cc8277015975` ; correction de la sonde HTTP seulement : `7c4bc07c9aa2cdd005f1422bbc4c8e931398adc8`.
- [CI complète 39465051577](https://github.com/JeanLamora75/SMN/actions/runs/39465051577) **réussie** : Linux/PostgreSQL 18.6, **144 tests dont 143 réussis, 0 échec, 1 ignoré** ; Windows, **133 tests dont 132 réussis, 0 échec, 1 ignoré**. Lint, Prisma, TypeScript, builds et scénarios HTTP de production réussis. Journaux consultés, dont le message de réussite SMN-16.
- [Paquet Windows 39464637127](https://github.com/JeanLamora75/SMN/actions/runs/39464637127) **réussi** : installation Express complète sur base isolée, reprise préservant les données de l'essai interrompu, port PostgreSQL de remplacement persisté et connexion disponible. [ZIP produit](https://github.com/JeanLamora75/SMN/actions/runs/39464637127/artifacts/12284651790).
- Le premier run [39464637174](https://github.com/JeanLamora75/SMN/actions/runs/39464637174) avait échoué sur la sonde Host, pas sur un refus de rôle : une capture locale a prouvé que fetch remplaçait le Host fourni. La sonde utilise désormais node:http pour envoyer effectivement cet en-tête falsifié, puis vérifie le refus 403. Les scénarios qui suivent ont été réellement exécutés dans le run final.
- Aucune migration, aucune modification des décisions métier ou de la base personnelle. Les tests DB sont exclusivement ceux des runners temporaires.
- **Recette globale Windows 11 utilisateur non exécutée**. Le runner Windows est Windows Server ; ne pas les confondre. Jira reste **En cours**, suivi BMAD **review**, sans clôture.

## Bilan de revue
Les lacunes de vérification retenues sont couvertes par les scénarios ajoutés et réussis en CI. Aucun correctif fonctionnel ou risque bloquant restant identifié ; les branchements des producteurs métier/archives demeurent ceux des futures Stories, comme prévu par le contrat.
