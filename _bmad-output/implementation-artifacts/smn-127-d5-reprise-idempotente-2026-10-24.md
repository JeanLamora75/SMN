# SMN-127 / SMN-132 — D5 : idempotence des exports et diagnostic de récupération

## Incrément publié sur main
- Chaque clic de génération fournit un UUID `X-SMN-Export-Operation`. La même clé est conservée dans le composant client pendant les tentatives échouées et renouvelée après téléchargement réussi.
- Une serrure PostgreSQL `pg_advisory_lock` portée par la session du client DB sérialise toute la séquence recherche d'archive / rendu Puppeteer / écriture / COMMIT pour une même clé. La serrure est relâchée dans `finally`.
- La table d'archives reçoit une colonne `operation_id` et un index unique partiel. Lorsqu'une archive existe déjà pour cette opération, les octets sont relus et revérifiés et aucune génération n'est lancée.
- La réutilisation d'une clé pour un autre Sprint, une autre référence ou un autre auteur renvoie `retry-conflict`. Une archive devenue corrompue bloque la relance : aucune régénération silencieuse.
- `auditPdfArchiveStorage` fournit un inventaire en lecture seule des fichiers PDF orphelins, manquants ou au nom inhabituel. **Aucune suppression automatique** ; ne jamais effacer une archive potentiellement validée alors que son COMMIT est incertain.

## Limitations bloquantes
- Aucun test PostgreSQL, Windows, Puppeteer, build ou typecheck n'a été exécuté dans cet environnement.
- Un arrêt brutal avant le COMMIT peut laisser un fichier orphelin ; la fonction d'audit permet de le signaler mais pas de le supprimer ni de le réconcilier. D5 partielle sur ce point.
- La fenêtre ambiguë où COMMIT a réussi mais une exception réseau a été levée exige encore un protocole de récupération et des tests de panne injectée.
- Le verrou ne protège qu'une clé identique ; deux clés différentes créent volontairement deux archives. Les limites de concurrence et délais de génération doivent être vérifiées en charge.
- L'interface n'expose pas encore le diagnostic des fichiers orphelins ; il doit rester réservé à l'administration.
- Installation `pnpm add puppeteer-core` et publication du lockfile toujours nécessaires si non effectuées.

## Vérifications locales
`git pull`
`pnpm typecheck`
`pnpm exec tsx --test tests/smn-127-d5-retry.test.ts`
`pnpm pdf:smoke`
`pnpm build`

Recette prioritaire : deux requêtes simultanées avec la même clé, nouvelle tentative après coupure avant réception de réponse, fichier manquant/corrompu, arrêt brutal entre écriture et COMMIT, absence de droits de génération.
