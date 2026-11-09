# Epic 2 — Lot 4 : confidentialité, effacement et non-réintroduction

**Date :** 9 novembre 2026. **Branche :** main. **Statut :** protections et tests renforcés ; fonctionnalité d'effacement destructif non qualifiée et non activée. Aucune donnée de l'installation de travail n'a été modifiée.

## SMN-38 — Analyse d'impact

La prévisualisation conserve l'inventaire des fiches, associations, calendriers, historiques, textes libres, références indirectes, binaires PDF/TXT/OOXML, archives gérées et avertissements relatifs aux copies externes. Reçu d'analyse serveur HMAC expirant en dix minutes et revérification des empreintes. Les informations des images, PDF sans couche texte et objets incorporés ne sont pas réputées contrôlées. Le contrat conserve volontairement les marqueurs complete=false et canExecute=false.

Le test PostgreSQL 18 natif v33 isolé crée une équipe, un membre, son affectation et sa révision ; il détecte les relations, refuse une écriture dans la transaction READ ONLY et conserve la fiche. Les autres sources sont vérifiées par les tests de contrat existants. La preuve de non-réidentification dans les archives non inspectables n'est pas obtenue.

## SMN-39 — Infrastructure de registre externe

Nouveau module : src/server/backup/erasure-ledger.ts.

Trois variables opt-in : SMN_ERASURE_LEDGER_DIR, SMN_ERASURE_ANCHOR_DIR, SMN_ERASURE_LEDGER_KEY_HEX. Les deux dossiers doivent être absolus, indépendants et hors de SMN_BACKUP_DIR. La clé HMAC de 32 octets ne doit jamais être enregistrée dans GitHub ou les sauvegardes.

Initialisation explicitement demandée via initializeErasureLedger, qui fixe le début réel de couverture. Un fichier JSONL reçoit des marqueurs minimaux signés ; un second dossier contient un compteur et une tête signés indépendamment. appendCompletedErasure dispose d'un verrou exclusif, écrit et synchronise le journal et le point d'ancrage. readErasureLedger refuse une troncature, une altération, une discontinuité ou une publication partielle. Pas de réconciliation silencieuse des interruptions. Aucune identité, nom, e-mail ou texte personnel dans les marqueurs.

**Limites :** la chaîne HMAC et les dossiers séparés ne constituent pas une garantie matérielle WORM. Le moteur transactionnel d'effacement, le journal d'intention avant COMMIT, le retour arrière, la révocation des archives immuables et l'anonymisation sans réidentification restent à développer. Le registre n'est pas encore relié à une API destructive : il est volontairement impossible de déclencher un effacement réel à travers ce lot.

## SMN-40 — Barrière de restauration

currentErasureEvidence reçoit désormais la date de la sauvegarde contrôlée et lit les événements postérieurs depuis le registre externe. Le endpoint POST /api/admin/backups/restore/preflight utilise la vraie date du paquet ; aucune preuve cliente ne permet de contourner la barrière.

**Important :** completeHistory reste FAUX pour les preuves réelles, même lorsque les HMAC sont valides, tant que les suppressions ordinaires et exceptionnelles ne sont pas toutes raccordées au registre. Par conséquent, la restauration active reste bloquée, en plus des vérifications nécessaires SMN-34. Une archive antérieure au début du registre ne peut jamais être présentée comme sûre. La rétention des sauvegardes n'efface pas les archives PDF historiques.

## Qualification

Workflow : .github/workflows/epic2-lot4-erasure.yml.

Tests nouveaux :
- tests/epic2-lot4-erasure-ledger.test.ts : ancrage indépendant, signatures, altération, troncature, reprise bloquée et refus avant couverture.
- tests/epic2-lot4-postgres.test.ts : PostgreSQL 18 jetable, installation native v33 et requêtes READ ONLY.

Tests régressifs : backup-erasure-protection, exceptional-erasure-policy, erasure-impact-preview, erasure-impact-receipt, erasure-indirect-archives et erasure-ooxml-content. CI Windows/Linux, typecheck et i18n. La preuve d'exécution est le résultat réel des jobs GitHub Actions, pas la présence des fichiers.


## Preuve CI confirmée — 9 novembre 2026

**GitHub Actions : https://github.com/JeanLamora75/SMN/actions/runs/42625895661** ; commit testé 424dc1ee4bfcc2d70b096199c760afd8d2c7650b.

- privacy-contracts (windows-latest) : **success**, y compris tests du registre, contrats SMN-38/39/40, TypeScript et traductions.
- privacy-contracts (ubuntu-latest) : **success**, mêmes vérifications.
- postgres-18-impact : **success** ; installation native v33 et contrôle READ ONLY sur une base jetable.

**Jira :** commentaires de qualification ajoutés à SMN-38, SMN-39 et SMN-40. Stories conservées en cours ; la CI ne prouve ni effacement/destruction métier, ni absence de réidentification dans des archives non inspectées.

## Critères d'acceptation restant bloqués

- **SMN-38 :** revue manuelle des données sémantiques et binaires non inspectables ; arbitrage de conservation des indicateurs collectifs sans réidentification.
- **SMN-39 :** exécuteur serveur sûr, confirmation distincte, journaux d'intention avant mutation, compensation crash-safe, archivage de nouvelles versions expurgées sans modifier l'original, audit d'exécution final.
- **SMN-40 :** raccordement exhaustif des suppressions au registre, ancre protégée hors hôte, qualification d'une restauration expurgée sans réintroduction, ou refus systématique tant que la sécurité n'est pas démontrée.

**Décision :** les exigences de sécurité empêchent de déclarer le lot 4 intégralement terminé ou de clôturer SMN-39/40. Mieux vaut conserver les opérations destructives désactivées que risquer une fausse anonymisation. Aucune installation utilisateur n'a été réinitialisée, restaurée ou effacée.

BMAD : les commandes uv du skill bmad-build n'ont pas été exécutées, faute d'environnement de travail BMAD local ; vérifications réalisées directement avec GitHub et GitHub Actions.


## Renforcement technique complémentaire — 9 novembre 2026

### SMN-38 : exploration relationnelle et contenus binaires
- Découverte des clés étrangères simples et composites dans pg_catalog ; les paires de colonnes ordonnées servent aux jointures des descendants de smn_member.
- Tout chemin tronqué par le budget ou la profondeur retourne un état unknown, jamais zéro.
- Un document Office contenant des images est non concluant, même si sa couche texte a été lue ; un PDF sans correspondance textuelle positive est non concluant tant que son contenu visuel n'est pas inspecté.
- Tests de contrats : tests/epic2-lot4-fk-coverage.test.ts ; test réel PostgreSQL : tests/epic2-lot4-postgres.test.ts.
- Les identifiants sémantiques et les images non inspectables demandent toujours une **revue humaine**, avec arbitrage de retrait, de production d'une version expurgée et de conservation des indicateurs collectifs.

### SMN-39 : protocole transactionnel de reprise
- src/server/backup/erasure-intent.ts : intention signée et persistée avant toute mutation, verrou exclusif, refus de transactions parallèles, suivi d'une intention interrompue.
- prisma/migrations/20261109_smn39_privacy_receipt/migration.sql : table additive smn_privacy_erasure_receipt, preuve de commit sans identité personnelle, refus SQL des UPDATE/DELETE de reçus.
- src/server/backup/erasure-transaction.ts : BEGIN, verrou PostgreSQL, mutation SQL contrôlée par le futur orchestrateur, insertion du reçu dans la transaction, COMMIT, puis clôture du journal.
- Une intention ne peut être clôturée que si le reçu PostgreSQL correspondant est présent avec identifiant, mode et révision identiques.
- Une panne avant ou pendant le commit laisse une intention en suspens et interdit toute restauration tant qu'un opérateur n'a pas démontré l'état réel.
- La clôture relancée après un événement déjà enregistré ne produit pas de doublon.
- La migration reste **additive et séparée** de la baseline native v33, qui ne doit pas être modifiée. Elle est appliquée sur la base jetable dans le test PostgreSQL 18 ; toute installation existante nécessite une procédure de migration qualifiée avant activation.
- Test PostgreSQL sur une table factice : vérification des reçus, impossibilité de les effacer, rollback après panne injectée, et maintien de l'intention de reprise.

### SMN-40 : anti-réintroduction
- Le précontrôle lit l'intention externe ainsi que le journal HMAC ; tout événement interrompu rend la preuve indisponible.
- Le journal et l'ancre sont interdits dans le dossier de sauvegarde par défaut Windows et les répertoires de données déclarés.
- Le résultat completeHistory reste volontairement FALSE tant que tous les chemins d'effacement métier ne sont pas intégrés. Les sauvegardes anciennes ne peuvent donc pas être approuvées sur la seule existence du registre.

### Conditions de libération non encore démontrées
- Aucun effacement réel de membre, retrait d'accès à une archive PDF/Office ou création de version expurgée n'a été activé ; le composant transactionnel est une primitive interne, pas une route destructrice.
- La preuve de non-réidentification dans des images, PDF scannés, objets Office et copies externes ne peut pas être automatisée intégralement.
- La reprise d'une installation reconstruite et expurgée, puis sa bascule active, doivent être démontrées au lot 5.

**Décision de sécurité :** ne pas déclarer les trois blocages résolus ni clôturer les Stories concernées tant que les vérifications ci-dessus manquent. Un test d'atomicité sur données factices n'est pas une recette d'effacement réel.


## Dernière qualification automatisée — 9 novembre 2026

**GitHub Actions : https://github.com/JeanLamora75/SMN/actions/runs/42634089907** (commit de code 2078a2bc2f0b700463e66b5e73ad4f38006f0d09). Résultat : **3 jobs sur 3 réussis**.

- Windows : contrats de confidentialité, intentions durables, signatures, contrôle de révision, TypeScript et traductions.
- Linux : mêmes contrôles, tous réussis.
- PostgreSQL 18 : installation native v33 isolée, inspection des FK directes et indirectes, transaction READ ONLY, migration additive de reçus sur base jetable, mutation sur table factice, COMMIT avec reçu, rejet de DELETE du reçu, panne injectée avec ROLLBACK, intention externe conservée et refus de restauration.

Les migrations restent séparées de la baseline native v33. Les opérations de test ne portent sur aucune donnée personnelle réelle.

**Qualification :** les mécanismes d'infrastructure sont testés. Le chantier demandé ne peut pas être certifié intégralement terminé à ce stade : aucune suppression de membre ou révocation d'archive en situation métier, ni vérification visuelle de tous les binaires, ni restauration active expurgée ne figure dans ces preuves.


## Complément d'implémentation — 9 novembre 2026 : effacement strict et restrictions d'accès

### Cas désormais exécutable (SMN-39)

L'endpoint Administrateur POST /api/admin/erasure/execute exige un reçu de prévisualisation HMAC valide, lié à l'Administrateur, au mode erase, au membre, à une révision de périmètre revérifiée et à une expiration de dix minutes. La confirmation saisie doit être exactement EFFACER suivi de l'identifiant du plan et les limites relatives aux copies externes doivent être explicitement reconnues.

Le périmètre est volontairement plus étroit que la Story complète. Le moteur accepte uniquement la suppression d'une fiche **provisoire, jamais révisée, sans email, sans FK entrante, sans référence textuelle retrouvée dans une table SMN et sans données binaires/fichiers gérés**. Le répertoire privé doit être réellement présent et vide. Les chemins Office, PDF et les autres stockages gérés sont inspectés ; tout doute, archive, schéma imprévu, référence ou erreur SQL entraîne un refus. Un membre affecté à une équipe, ayant un historique ou ayant fait l'objet d'une publication n'est pas éligible. Aucun mode anonymize n'est autorisé par cette route.

L'exécution qualifiée utilise une transaction PostgreSQL SERIALIZABLE avec contrôle de périmètre renouvelé, DELETE strictement borné, reçu SQL immuable inséré dans le COMMIT, intention extérieure durable créée avant mutation et événement HMAC après commit. En cas de panne ou de résultat incertain, l'intention demeure et la restauration est bloquée. Le seul objet effectivement détruit est la fiche admissible ; la destruction des données de travail de l'utilisateur n'a jamais été exécutée par ChatGPT.

La modale Cockpit Agile n'affiche la confirmation destructive que lorsque le contrôle serveur supplémentaire déclare le cas restreint éligible. Elle demande une revérification, une confirmation textuelle et une reconnaissance du sort des copies externes. Les dossiers non éligibles restent en lecture/analyse sans action destructrice.

### Archives PDF : infrastructure de révocation

La migration additive 20261109_smn39_archive_restriction définit une table de révocation d'accès, reliée au reçu de transaction et protégée par un déclencheur immuable. Le lecteur central readVerifiedPdfArchive refuse de délivrer un PDF dès lors qu'une restriction existe. Il ne réécrit jamais le PDF ni son manifeste original ; toute version expurgée serait publiée sous un nouvel identifiant.

Cette infrastructure **ne constitue pas encore** une fonctionnalité complète de révocation de tous les exports. L'activation de la table sur les installations existantes exige une migration additive qualifiée ; le parcours administrateur d'identification, de revue et de révocation de chaque archive, ainsi que l'inspection de tous les autres chemins de lecture, ne sont pas encore validés. Le contrôle du lecteur ne prouve pas qu'aucune copie locale ou externe n'existe.

### Protection SMN-40 : distinction des preuves

evaluateErasureProtection retourne désormais le motif previously-erased-data dès qu'une trace signée démontre un événement postérieur à la sauvegarde, **même si l'historique global est incomplet**. L'absence d'événement dans un journal dont la complétude n'est pas attestée ne donne jamais la permission de restaurer. Les sauvegardes d'avant la date d'enrôlement du registre et les intentions non résolues sont toujours refusées. Le précontrôle de restauration active continue à refuser la bascule.

### Compatibilité native v33

La migration de reçu d'effacement est ajoutée à l'installation neuve et la liste explicite des objets SQL autorisés au diagnostic v33 a été étendue aux deux tables et fonctions de confidentialité. La baseline v33 elle-même reste immuable. Les migrations existantes sont uniquement additives ; une installation déjà créée doit les appliquer selon une procédure de migration qualifiée.

### Traçabilité des limites

SMN-38 n'a pas de preuve d'absence de données sémantiques ou d'objets binaires pour les membres historiques. L'approche adoptée consiste à **refuser** leur effacement automatisé ; elle ne contourne pas le besoin d'une revue humaine attestée et d'un plan d'expurgation.

SMN-39 n'efface réellement que les dossiers isolés ; un moteur couvrant toutes les relations historiques, archives TXT/Office et règles de conservation des agrégats reste absent. Il est interdit d'appeler l'opération partielle un effacement complet.

SMN-40 garantit à ce stade un **refus conservateur** de restauration active, non une restauration expurgée et validée. completeHistory=false reste obligatoire en l'absence d'instrumentation exhaustive des chemins de suppression. La condition fonctionnelle de non-réintroduction est donc tenue par **blocage**, mais l'acceptation AC3 (restauration conforme) n'est pas prouvée.

Aucune Story ne doit être close sur la seule base de la qualification de l'exécuteur restreint ; les limites sont des lacunes fonctionnelles réelles et non de simples avertissements cosmétiques.


## Dernière recette automatisée de l'extension restreinte

**GitHub Actions #42637559487 : https://github.com/JeanLamora75/SMN/actions/runs/42637559487 — 3 jobs réussis sur 3.**
Référence du code exécuté : commit faeb6e2fc96b42fa12a4322990c239307a40d00a.

- Ubuntu : contrats du registre et d'impact, preuve de non-réintroduction, politique SMN-39, restriction de PDF, pnpm typecheck et i18n:check — succès.
- Windows : mêmes contrôles — succès.
- PostgreSQL 18 : installation native v33 isolée avec reçus additifs, recherche des références d'un membre historique, refus d'UPDATE dans une transaction READ ONLY, suppression effective d'une fiche provisoire isolée, conservation de la fiche historique, journal de commit et marqueurs HMAC, et refus après panne injectée — succès.

Aucune preuve de revue visuelle exhaustive des binaires, de traitement des archives Office historiques ou de reconstruction expurgée n'a été fournie. Les points restants ne sont pas clôturés.

La table de restriction PDF est une **migration additive disponible mais distincte**, dont l'application et le raccordement complet aux parcours d'administration d'une installation existante restent à qualifier. La présence du lecteur qui applique la restriction ne doit pas être assimilée à une révocation effectuée sur des archives réelles.
