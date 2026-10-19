# SMN — D-PRD-130 : résolution des écarts de cohérence A1 à A4

**Statut :** validé par l'utilisateur le 19/10/2026.  
**Références :** [PRD](prd.md) FR-14/FR-16/FR-17/FR-25/FR-41/FR-42 à FR-49 ; [reprise et imports](reprise-imports-historiques.md), [registres qualitatifs](registres-qualitatifs.md), [risques/dépendances](risques-dependances.md) ; [revue BMAD](validation-report.md).

**Portée :** les quatre arbitrages sont approuvés conjointement. D-PRD-130 précise les exceptions rétrospectives et la version des états historiques, **sans supprimer** les règles normales de génération de cérémonies, capacité initiale figée à l'ouverture effective, clôture volontaire, provenance, protection des données et anciens PDF.

## A1 — Création rétrospective d'un Sprint (FR-16/FR-17/FR-42)

**Règle :** lorsqu'un Sprint Scrum est **créé dans SMN après sa date/heure réelle de fin**, il suit un parcours explicite de **reprise historique**, distinct de la création normale.

1. L'identifiant, l'équipe, le produit et les **dates réelles du Sprint** sont enregistrés séparément de **la date/heure réelle de création de sa fiche dans SMN** et de son indicateur « Reprise historique ».
2. Le Sprint est créé au **statut « Terminé »**, jamais « Clôturé » automatiquement. Sa clôture ultérieure reste **volontaire** (FR-16/F-93/F-96). Les protections de correction et de réouverture s'appliquent ensuite normalement.
3. Contrairement à FR-17 pour la création ordinaire, **aucune cérémonie n'est générée automatiquement** : ni Planning, ni Daily, ni Review, ni Rétrospective.
4. Le SM peut **ajouter manuellement** uniquement les événements historiques qu'il est réellement en mesure de documenter, avec **date, nature et statut connus**. Le système n'affirme pas que les cérémonies absentes ont été tenues, non tenues ou annulées.
5. Aucun événement « Tenue », capacité réelle ou présence n'est inféré de la seule date passée. **Les règles de génération normale restent intactes** pour les Sprints créés avant leur démarrage.
6. Règles de dates et de chevauchements inchangées ; aucune autre période n'est automatiquement déplacée. Une reprise de Sprint déjà commencé mais **non terminé** n'est **pas** couverte par cette exception et reste à spécifier si nécessaire.

**Tests exemples :** un Sprint rétrosaisi vieux de six mois commence « Terminé », a zéro cérémonie créée automatiquement et peut recevoir une Review historique saisie avec date/statut connus ; la création normale d'un Sprint futur conserve la génération des cérémonies.

## A2 — Capacité initiale des Sprints rétrosaisis (FR-14/FR-42/FR-46)

**Règle :** quand l'ouverture réelle du Sprint est antérieure à sa création dans SMN, le mécanisme de **gel automatique à l'ouverture** de FR-14 **ne reconstruit pas artificiellement une capacité initiale ancienne**.

1. **Connue** : le SM peut saisir la **capacité initialement prévue à l'époque en JH** effectivement retrouvée, en précisant sa provenance lorsqu'elle est disponible.
2. **Estimée** : le SM peut saisir **volontairement une estimation historique en JH** à partir d'éléments pertinents de l'époque, clairement qualifiée **Estimée** ; elle n'est pas présentée comme la valeur historiquement observée ou gelée automatiquement lors du Sprint.
3. **Non renseignée** : aucune valeur numérique n'est assignée ni déduite lorsqu'il n'existe pas d'information fiable. **Non renseigné n'est ni 0 JH ni une estimation automatique.**
4. Les affectations, coefficients de contribution, jours travaillés ou absences **actuels** ne servent **jamais implicitement** à reconstruire la capacité prévue au lancement du Sprint historique.
5. Une valeur historique renseignée est **protégée contre les recalculs automatiques**, avec distinction **date de l'époque représentée / date de saisie SMN**, type de source, qualité et corrections traçables ; les modifications de cycles clôturés passent par la réouverture autorisée.
6. La **capacité réellement constatée** suit sa propre règle de provenance : elle n'est pas fabriquée par la saisie de la capacité initiale. Les indicateurs dérivés ne sont calculés que lorsque leurs sources existent.

**Tests exemples :** « 24 JH connus » → 24 JH, qualité Connue ; « 22,5 JH estimés » → 22,5 JH, qualité Estimée ; sans donnée → Non renseignée, aucun écart fictif.

## A3 — Versions d'instantanés après réouverture/reclôture (FR-16/FR-25/FR-41)

**Règle :** chaque **clôture effective** d'un cycle crée une **version d'instantané** des **six registres qualitatifs associés**, comprenant également leur **association au cycle** telle qu'elle est connue à cette clôture.

1. **Première clôture** : créer un instantané immuable **V1**, avec identifiant de cycle, numéro de version, horodatage réel de la clôture, informations qualifiées et liens associés.
2. **Réouverture volontaire** : le cycle revient au statut **« Terminé »** (FR-16, et équivalent autorisé Kanban), sans effacer V1. Durant la réouverture, le **bilan non clôturé** lit les fiches courantes conformément à FR-41.
3. **Nouvelle clôture volontaire** : créer une version **V2** immuable, puis V3, etc., sans remplacer ni supprimer V1. Les ajouts/suppressions d'associations et modifications métier entre les clôtures restent traçables.
4. Un **nouveau bilan ou rapport** d'un cycle **actuellement clôturé** utilise **la dernière version de clôture** ; les versions antérieures restent **consultables et datées** à des fins de compréhension et d'audit.
5. Les **PDF/rapports déjà générés** sont toujours **inchangés**, y compris ceux émis lorsque V1 était la dernière version ; un nouveau document peut refléter V2 tout en identifiant la version lue.
6. **Reprise rétrospective** : une clôture effectuée aujourd'hui ne prouve **pas** l'état qualitatif à la date ancienne du Sprint. Ne pas créer un **état fictif** à partir de fiches centrales actuelles ; pour les informations historiques inconnues, afficher **Non renseigné / état historique indisponible**. Si des informations historiques sont explicitement retrouvées, leur **date d'effet, provenance et degré de connaissance** sont distingués de la **date d'enregistrement/clôture dans SMN**.
7. Les règles de liens multi-cycles D-PRD-121, de protection des historiques D-PRD-122 et QLT-08 restent applicables ; seules les modalités exactes de stockage/versionnement technique et de consultation graphique relèvent de l'architecture/UX.

**Tests exemples :** clôture V1 « risque ouvert », réouverture, passage « résolu », clôture V2 ; nouveau bilan « résolu », V1 conservée « ouvert », PDF antérieur inchangé. Un Sprint rétrosaisi sans état connu ne reçoit pas un risque « ouvert à l'époque » à partir de son statut courant.

## A4 — CSV fixe, prévisualisation et import atomique (FR-43 à FR-46/FR-49)

**Format métier validé :** **quatre colonnes obligatoires** et **seulement ces quatre colonnes** dans le contrat minimal :

| Colonne | Règle |
|---|---|
| `cycle_id` | Identifiant stable d'un Sprint Scrum ou d'une période Kanban **déjà existante dans cette installation** ; pas de création implicite de cycle |
| `metric_code` | Code reconnu dans le catalogue des **métriques sources** autorisées pour le **mode de l'installation** et ce cycle |
| `value` | Valeur numérique consolidée ; `0` explicite valide, cellule vide/invalide rejetée ; contraintes d'unité et de signe adaptées à la métrique |
| `quality` | `known` (Connue) ou `estimated` (Estimée), obligatoire ; autres codes rejetés |

**Exemple purement illustratif (les valeurs d'identifiants et codes ne constituent pas le catalogue technique final) :**

```csv
cycle_id,metric_code,value,quality
SPRINT-001,sp_done,24,known
SPRINT-001,sp_initial,30,known
```

1. Le **catalogue des métriques sources** doit couvrir les **quatre SP** validés en Scrum (**engagement initial, SP ajoutés, SP retirés, SP terminés**) et les **cinq métriques de flux Kanban** validées (**commencés, Throughput, WIP en fin de période, Cycle Time moyen, Lead Time moyen**). Les **indicateurs dérivés** sont calculés par SMN et ne sont pas importés comme des métriques sources.
2. Une éventuelle prise en charge des **capacités JH** passe par des codes du catalogue **explicitement autorisés**, soumis à FR-14/A2 et à la protection des valeurs figées ; elle ne crée **pas une cinquième colonne CSV** et n'autorise pas de recalcul historique arbitraire.
3. Proposer le **téléchargement d'un modèle CSV**, avec le contrat de colonnes et, lorsque pertinent, les identifiants réels des cycles de l'installation pour éviter les erreurs. Il n'est pas possible de mélanger une installation Scrum et une installation Kanban dans une même opération.
4. Avant toute écriture, **valider et prévisualiser la totalité du fichier** : colonnes et types, cycles connus, codes autorisés, valeurs et unités, `quality`, doublons exacts ou contradictoires visant le même couple **(`cycle_id`, `metric_code`)**, et statut de cycle.
5. **Une erreur sur une ligne rejette l'import de l'ensemble du fichier** : aucune donnée n'est écrite. Un cycle absent, une métrique inconnue/incompatible, un doublon ou une valeur/qualité invalide sont des erreurs explicites.
6. Pour une métrique **déjà renseignée**, conserver la valeur **par défaut**, afficher **avant / après** et demander une **sélection explicite de remplacement** pour autoriser sa modification. Les valeurs non sélectionnées restent inchangées ; ce sont des **conservations volontaires**, pas des erreurs ou imports partiellement réussis cachés.
7. Pour un **cycle clôturé**, toute modification de données suit **la réouverture préalable** et les protections FR-14/FR-45. Aucun import n'écrase un champ initial figé ou un PDF/TXT historique sans permission métier appropriée.
8. Après **confirmation explicite**, appliquer les écritures réellement autorisées **en une seule transaction, tout ou rien**. Si une validation devient caduque ou que l'écriture échoue, **aucune modification du lot n'est persistée** ; état et erreurs sont expliqués.
9. Consigner dans le **journal d'import** horodatage, opérateur, fichier/lot, **lignes validées, valeurs appliquées, conservées sans modification, rejetées, erreurs** et les corrections autorisées. Un aperçu annulé ou une erreur n'est jamais annoncé comme une importation réussie.
10. **Choix techniques non arbitré par D-PRD-130 :** noms définitifs des `metric_code`, encodage et prise en charge des séparateurs, format des décimales, schéma d'identifiants, mécanisme transactionnel, et éventuelle conservation du fichier d'origine. Ces choix devront respecter le contrat métier à quatre colonnes, la cohérence des unités et la fiabilité des imports.

**Cas de recette prioritaires :** fichier valide → aperçu puis confirmation ; fichier avec doublon → 0 écriture ; un cycle inconnu → 0 écriture ; métrique incompatible → 0 écriture ; valeur 0 explicite → acceptée ; métrique existante → conservation par défaut, remplacement seulement confirmé ; cycle clôturé → correction rejetée sans réouverture ; panne en cours d'écriture → aucune modification persistante.

## Suivi des écarts et limites

- **A1, A2, A3, A4 :** **arbitrages fonctionnels résolus** par validation D-PRD-130, **non développés ni testés**.
- **À concevoir** : saisie ergonomique des événements historiques et provenance, schéma technique des instantanés/versionnement, catalogue des codes CSV, validation des unités et sérialisation des fichiers.
- **Non décidé** par ce lot : création rétrospective complète des périodes Kanban au MVP (HIS-01 reste une possibilité à arbitrer), traitement d'un Sprint commencé mais non terminé lors de son import, règles fines de conformité/droits et conservation de fichiers.
- **Journal de validation :** `.memlog.md`. Les constats du rapport de validation du 19/10/2026 restent leur **constat historique initial** ; leurs quatre premiers écarts doivent être considérés comme **résolus fonctionnellement après D-PRD-130**, sous réserve d'une future vérification d'implémentation.
