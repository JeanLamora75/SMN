# SMN-127 — D7 : protocole de recette PDF de bout en bout

Date : 24 octobre 2026.

## Blocages détectés et corrigés sur main

- La route POST `/api/admin/reports/sprints/[id]/pdf` contenait une **ancienne implémentation suivie de la nouvelle**, ce qui rendait le fichier invalide en TypeScript. L'ancienne branche a été supprimée, la branche idempotente avec verrou PostgreSQL est conservée.
- Le bouton d'export avait perdu la création de son UUID d'opération avant l'appel serveur : restaurée avec `crypto.randomUUID()`, conservée si la tentative échoue et renouvelée après succès.
- Un test statique de non-régression est ajouté dans `tests/smn-127-d7-e2e-contract.test.ts`.

## Prérequis de recette Windows

1. `git pull` et `pnpm install`.
2. Installer `puppeteer-core` et publier le lockfile si l'installation n'a jamais été faite : `pnpm add puppeteer-core`.
3. `pnpm pdf:doctor` et `pnpm pdf:smoke` doivent confirmer la détection Chrome et produire un PDF minimal.
4. `pnpm typecheck`, `pnpm i18n:check`, `pnpm exec tsx --test tests/smn-127-d7-e2e-contract.test.ts`, `pnpm build`.
5. Lancer l'application et PostgreSQL, vérifier `http://127.0.0.1:3003`. Le paramètre `SMN_PDF_INTERNAL_ORIGIN` doit correspondre à l'adresse locale réelle du serveur ; il ne doit pas contenir d'URL distante.

## Parcours fonctionnel manuel — noter succès/échec et capture d'écran

| ID | Scénario | Résultat attendu |
|---|---|---|
| PDF-01 | Administrateur : préparer un Sprint ouvert avec logo FR, indicateurs et notes ; figer le rapport | Un UUID de référence apparaît ; le caractère provisoire est visible |
| PDF-02 | Modifier des données du Sprint après création de référence puis ouvrir son URL | Les données, dates, textes, langue et logo restent ceux de la référence initiale |
| PDF-03 | Générer le PDF serveur depuis cette référence | PDF A4 non vide et ouvrable, tableaux et titres lisibles, mise en page proche de l'HTML |
| PDF-04 | Consulter la bibliothèque et télécharger l'archive | Une archive identifiable ; octets cohérents, nom et date, téléchargement exact sans nouveau rendu |
| PDF-05 | Deux exports simultanés avec le même identifiant d'opération | Une seule archive ; deux réponses renvoient le même ID et les mêmes octets |
| PDF-06 | Relancer le même identifiant après perte de réponse HTTP | Relecture de l'archive existante, pas de seconde génération |
| PDF-07 | Réutiliser un même identifiant pour un autre Sprint ou auteur | HTTP 409 et aucune archive nouvelle |
| PDF-08 | Compte user sans droit de génération, puis compte non authentifié | Génération refusée, fichier privé non révélé |
| PDF-09 | Accorder puis révoquer l'accès user à une archive | L'utilisateur voit/télécharge uniquement avant la révocation |
| PDF-10 | Masquer une archive et essayer l'URL directe | Téléchargement refusé et archive absente des bibliothèques |
| PDF-11 | Déplacer une copie du PDF pour simuler un fichier manquant / corrompu | Erreur de disponibilité/intégrité, aucune nouvelle génération |
| PDF-12 | Tester rapport FR et EN, historique Vn, tableaux longs, impression multipage | Libellés et pagination corrects, pas de coupure de ligne illisible |
| PDF-13 | Simuler coupure entre écriture disque et validation SQL dans un environnement de test isolé | Incident détectable, pas de fausse réussite ; fichiers orphelins conservés pour diagnostic |

## Réserves et limites

- Ceci est une **préparation de recette** et une correction de blocages avérés, pas une exécution E2E. Les cas PDF-01 à PDF-13 nécessitent le poste Windows, Chrome et PostgreSQL ; aucun verdict PASS n'est attribué d'avance.
- La version `puppeteer-core` n'est toujours pas inscrite dans le `package.json` distant consulté au lancement ; les dépendances et `pnpm-lock.yaml` doivent être synchronisés.
- La résolution du navigateur peut échouer sous stratégie de sécurité entreprise. Le diagnostic ne garantit pas le rendu réel de l'application.
- La gestion UI des bénéficiaires et la navigation des utilisateurs restent incomplètes (D6).
- Les cas de crash brutal et de nettoyage des orphelins ne disposent pas d'une récupération automatique sûre (D5).
- Ne pas déclarer SMN-127, SMN-128, SMN-132 et SMN-135 terminées avant la recette et résolution de ces écarts.

## Décision

D7 est **préparée**, avec corrections techniques publiées. Statut recette : **non exécutée / non validée**.
