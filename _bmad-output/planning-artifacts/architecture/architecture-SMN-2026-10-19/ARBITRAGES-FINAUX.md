# SMN — Arbitrages ouverts : revue finale du 19 octobre 2026

> **Lecture historique — consolidation du 19/10/2026.** Les constats ci-dessous décrivent leur revue d'origine. A7/A8/A10/A11 ont depuis été validés ; D-PRD-136 fixe **deux rôles MVP : Administrateur et Utilisateur**. Les hypothèses à trois rôles et blocages métier correspondants sont supplantés par [les arbitrages validés](../../prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les réserves techniques et l'absence de lint/Reviewer Gate officiel attesté restent applicables.

> **Mise à jour postérieure (19/10/2026) :** cette revue conserve l'**état historique avant validation**. A7/A8/A10/A11 ont depuis été approuvés et AD-31 corrigé à **deux profils MVP Administrateur/Utilisateur**, voir les [D-PRD-132 à 136](../../prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les tableaux « ouvert » et les trois rôles ci-dessous ne sont plus normatifs pour le MVP.

**Statut :** revue de clôture documentaire, sans modification du périmètre fonctionnel. Cette revue ne prétend ni remplacer une validation produit ni démontrer une implémentation.  
**Sources :** PRD final et handoff Winston ; décisions D-PRD-130/131 ; journal BMAD de cette branche ; validations directes en conversation des domaines AD-TIME, AD-HIST, AD-RPT et AD-SEC, avec PostgreSQL choisi explicitement.

## 1. Décisions de sortie de revue

| ID | Classe | Situation après revue | Décision de conception/limite du socle | Porte de sortie |
| --- | --- | --- | --- | --- |
| **A5** NFR et RPO/RTO | Technique | **À confirmer** | Conserver performances, accessibilité, compatibilité et restaurabilité comme exigences mesurables ; valeurs 2 s/30 s, WCAG 2.2 AA et RPO 24 h/RTO 60 min = objectifs indicatifs, **pas seuils approuvés** | Avant acceptation technique I6 ; environnement et protocole définis |
| **A7** matrice de criticité 3×3 | Métier | **Ouvert** | Prévoir probabilité, impact et classification sans coder de table de gravité/valeurs non décidée | John + utilisateur **avant** Stories de calcul du risque |
| **A8** faits marquants automatiques | Métier | **Ouvert** | Autoriser dès le MVP la saisie manuelle et les faits associés aux objets sources ; le catalogue automatique, événements déclencheurs, règles d'idempotence et déduplication restent non définis | John + utilisateur **avant** automatisme FR-40 |
| **A9** rétrosaisie complète Kanban | Périmètre | **Hors engagement MVP** | Garder la compatibilité conceptuelle ; importer des métriques sur cycles Kanban existants au MVP, **ne pas créer rétrospectivement une période Kanban** sans extension formellement validée | Uniquement si extension demandée |
| **A10** archive PDF | Métier | **Ouvert** | HTML et export PDF à la demande obligatoires ; anciens PDF produits ne sont pas modifiés. Aucune copie automatique permanente imposée, pas de durée de rétention inventée | John + utilisateur **avant** archivage PDF permanent |
| **A11** données personnelles/historiques | Métier et sécurité | **Ouvert — porte pilote** | Contrôles d'accès, minimisation, chiffrement ciblé et audit dès le MVP ; ne pas assimiler immutabilité métier et interdiction de satisfaire une suppression/anonymisation légitime. Pas de purge nominative automatique inventée | John + utilisateur, revue sécurité/juridique adaptée **avant** suppression/anonymisation et pilote |
| **A12** restitution multitemporelle | Technique | **Contrat architectural défini, preuve manquante** | Sources numériques corrigées tracées, six registres issus de la clôture Vn, documents déjà exportés inchangés ; manifeste et indications de provenance | Tests de rapports I2/I4/I6 |
| **G1** gel après interruption | Technique | **Contrat établi, POC non exécuté** | `effectiveAt/processedAt`, données connues à l'ouverture, pas de capacité inventée | Test interruption/reprise I1/I2 |
| **G2** propriétaires/transactions | Technique | **Contrat établi, tests non exécutés** | Un propriétaire métier, transactions atomiques et verrouillage concurrents | Tests intégration dès I0–I2 |
| **G3** installation PostgreSQL | Technique | **PostgreSQL validé, POC requis** | DB PostgreSQL unique dès MVP, privilèges contrôlés, migrations et amorçage non administrateur | POC I0 |
| **G4** base et fichiers | Technique | **Contrat établi, POC requis** | TXT exact stocké de préférence en PostgreSQL ; fichier PDF pas réputé archivé sans A10 ; backup cohérent | POC I0 et tests I5/I6 |
| **G5** Next.js/React/PDF Windows | Technique | **Candidats, non figés** | Preuve de faisabilité du serveur local, du bundling et du PDF ; pas d'affirmation de versions actuelles | POC I0 et vérification des dépendances |

## 2. Rôles : rapprochement des validations successives

### Évidence et règle d'antériorité

1. **Décision antérieure explicite**, conservée dans la mémoire BMAD AD-8/AD-9 : deux rôles « Administrateur » et « Utilisateur ». L'utilisateur peut consulter les informations collectives et **télécharger/exporter** les rapports et briefs autorisés ; il n'administre pas ni ne modifie les objets métier. Les données individuelles nominatives sont réservées à l'administrateur dans ce modèle.
2. **Proposition ultérieure du domaine Sécurité**, acceptée globalement par l'utilisateur à l'exception du SGBD, remplacé par PostgreSQL : trois rôles conceptuels « Administrateur », « Opérateur SM/RTE » et « Lecteur ».
3. **Interprétation documentaire, sans créer de nouveaux privilèges** : retenir la structure à trois rôles comme orientation la plus récente. Le rôle initial « Utilisateur » correspond désormais au profil **Lecteur**, avec son droit de téléchargement conservé. **L'étendue des permissions individuelles de l'Opérateur n'a pas été explicitement tranchée** : ce rôle ne reçoit donc pas automatiquement accès aux données personnelles sensibles.

### Matrice minimale de sécurité proposée pour les Stories I0

| Action | Administrateur | Opérateur | Lecteur |
| --- | --- | --- | --- |
| Administrer les comptes, installations et sauvegardes | Oui | Non | Non |
| Consulter les données collectives | Oui | Oui selon périmètre autorisé | Oui selon périmètre autorisé |
| Gérer cycles, KPI, bilans, registres et générer documents | Oui | Oui selon périmètre autorisé | Non |
| Consulter et télécharger documents autorisés | Oui | Oui | Oui |
| Accès aux coordonnées, absences nominatives, capacités individuelles | Oui | **Non octroyé par défaut ; à arbitrer** | Non |
| Supprimer/réinitialiser l'installation | Oui, avec confirmations | Non | Non |

**Attention :** la capacité du rôle Opérateur à saisir/consulter les données individuelles indispensables à la gestion d'une équipe ne pourra pas être déduite tacitement de la simple attribution de ce rôle. Avant les Stories de droits, confirmer un périmètre d'accès explicite (équipe, opération et catégorie de données). L'implémentation devra choisir une matrice métier cohérente ou limiter les opérations de l'Opérateur aux capacités réellement autorisées. Le principe RBAC à trois profils ne dispense pas des autorisations serveur objet par objet.

### Trace architecturale

Conserver l'historique de **AD-8 et AD-9** sans le réécrire comme si les trois rôles avaient été validés dès la première décision. Ajouter **AD-31**, décision de synthèse chronologique, qui prévaut sur la cardinalité « deux rôles » de ces anciens énoncés ; préserver leurs garanties de lecture/téléchargement et de non-accès aux données sensibles. Aucune migration de comptes existants n'a été réalisée ni n'est nécessaire à ce stade documentaire.

## 3. Portes pour le découpage et le développement

**Autorisé comme base de conception :** découper les Stories de socle I0, persistance PostgreSQL, moteur modulaire, calculs communs, contrôles côté serveur, génération à la demande, historique Vn, import CSV atomique, restitution et archives TXT.

**Bloqué avant décision fonctionnelle ciblée :**
- Calcul/présentation automatique de la criticité 3×3 (A7).
- Catalogue des faits marquants automatiques (A8).
- Archivage permanent systématique des PDF, sa rétention et suppression (A10).
- Suppression/anonymisation des données personnelles et rémanence dans backups (A11).
- Attribution de nouveaux accès à l'Opérateur sur données individuelles (détail du RBAC).

**Validation technique obligatoire sans nouvelle décision métier :**
- POC I0 : runtime TypeScript/Node, PostgreSQL, permission installation, migrations, sessions, PDF local.
- Sécurité : contrôle des accès par URL directe, chiffrement ciblé, récupération administrateur, sauvegarde/restauration.
- Recette : test de DST, reprise après arrêt, versionnement V1/V2, transaction interrompue, CSV refusé, confidentialité TXT, rendu multitemporel.
- A5 : seuils NFR mesurés et approuvés sur configuration de référence avant acceptation technique et pilote.

**Règle de finalisation BMAD :** le document de contrat peut être finalisé avec ces réserves isolées, car elles ont un propriétaire, une frontière et une porte de sortie. Cela ne signifie **ni** que les arbitrages métier sont tranchés, **ni** que le Reviewer Gate indépendant, le lint officiel, les prototypes et la recette sont réussis.

## Décisions postérieures à la revue

**A7 D-PRD-132, A8 D-PRD-133, A10 D-PRD-134, A11 D-PRD-135 : validés par l'utilisateur** avec leurs exigences et critères de recette. **AD-31 D-PRD-136 : correction validée, deux profils Administrateur/Utilisateur uniquement au MVP**, sans rôle Opérateur ni Lecteur séparé, ni matrice de permissions fine. Les anciennes lignes ci-dessus sont conservées volontairement pour la traçabilité de Winston. Les portes techniques A5/A12, POC I0, sécurité, restauration et revue juridique A11 restent non levées.
