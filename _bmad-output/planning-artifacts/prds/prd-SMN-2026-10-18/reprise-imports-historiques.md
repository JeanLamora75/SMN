# SMN — Reprise et imports historiques : exigences et critères d’acceptation

**Statut :** validé fonctionnellement le 19 octobre 2026 ; détails de conception non arbitrés conservés comme questions ouvertes.  
**Référence :** [PRD principal](prd.md), FR-14/FR-16/FR-17/FR-42 à FR-49 ; **D-PRD-125** (HIS-01 à HIS-08), puis **D-PRD-130** ([clarifications A1, A2 et A4](clarifications-d-prd-130.md)).  
**Périmètre :** MVP Scrum/Kanban ; la reprise manuelle des **Sprints Scrum terminés** est actée dès le MVP. Les mécanismes sont conçus pour les périodes Kanban, dont l’extension à la reprise rétrospective doit être précisée sans la présenter comme définitivement exigée au MVP. La version SAFe/PI appartient à la v1.0.

## 1. Décisions antérieures préservées

- **Reprise manuelle des Sprints passés** pour créer un historique exploitable dès l’initialisation du MVP, sans reconstruire les informations inconnues (Product Brief).
- **Import CSV de valeurs numériques consolidées à schéma fixe SMN**, sans import de tickets individuels Jira et sans intégration Jira automatique (F-16/F-19).
- Les **KPI restent facultatifs** ; aucune donnée vide/inconnue n’est égale à zéro, aucun calcul ne compense une source insuffisante (F-14/F-64/F-71/F-72).
- La **capacité initiale historiquement figée**, les **valeurs manuelles prioritaires**, les provenance/qualité et les contrôles de recalcul restent régis par FR-14, D-PRD-031 à D-PRD-035, D-PRD-114/D-PRD-115.
- Les **cycles clôturés** ne sont corrigés qu’en respectant les mécanismes de réouverture et de traçabilité applicables (F-91 à F-96, D-PRD-039/040). Les anciens PDF restent inchangés.
- Les **tendances Scrum** utilisent au maximum les cinq Sprints clôturés de référence et n’incluent jamais des cycles postérieurs au Sprint historique examiné (D-PRD-076 à D-PRD-078). En Kanban, les cinq périodes clôturées et comparables suivent FR-22. **Aucune reconstitution arbitraire d’instantanés qualitatifs** pour les cycles historiquement clos (D-PRD-122/D-PRD-124).
- La reprise historique est une **opération exceptionnelle**, distincte de l’objectif de saisie courante de 15 à 30 minutes par semaine.

## 2. Exigences détaillées validées

### FR-42 / HIS-01 — Renseigner manuellement les Sprints passés

**Besoin :** démarrer SMN avec une base historique utile sans attendre plusieurs nouveaux Sprints.

**Critères d’acceptation :**
1. Le Scrum Master peut **créer un Sprint dans le passé**, avec dates effectives, rattachement à l’équipe et identifiant stable, sans imposer sa saisie dans le présent ni générer de données fictives.
2. Il peut renseigner **les objectifs, valeurs numériques et commentaires effectivement retrouvés**, et laisser vides les données indisponibles, dans le respect des champs facultatifs du bilan.
3. Les **règles de dates, de non-chevauchement dans un même périmètre et de cycle de vie** validées restent applicables, avec identification explicite du fait qu’il s’agit d’une **reprise rétrospective**. Aucun autre cycle existant n’est automatiquement déplacé.
4. Les événements, absences et disponibilités antérieurs **ne sont pas présumés observés** s’ils n’ont pas été documentés : aucune cérémonie « tenue » ou capacité « réelle » ne doit être fabriquée du seul fait de la création rétrospective. **D-PRD-130/A1 :** si le Sprint est créé après sa date/heure réelle de fin, **aucune cérémonie n'est générée automatiquement** ; il est créé « Terminé » et non clôturé. Les événements réellement connus peuvent être ajoutés manuellement ; la date de création SMN reste distincte des dates historiques.
5. Les valeurs reprises restent **consultables et modifiables selon le statut**, avec provenance/historique lorsque disponible ; une correction d’un cycle clôturé respecte les règles de réouverture F-93/F-96.
6. La même approche métier **pourra être étendue aux périodes Kanban** sans créer un moteur indépendant ; la présence exacte de la création rétrospective Kanban au MVP reste **à arbitrer**, car HIS-01 l’exprimait comme possibilité d’extension.

### FR-43 / HIS-02 — Importer un CSV de métriques consolidées

**Critères d’acceptation :**
1. SMN accepte un **CSV à structure fixe documentée** comportant les seules **valeurs numériques consolidées** des cycles/équipes et les identifiants nécessaires à leur rattachement.
2. L’import ne crée **aucun ticket Jira, backlog item ni élément individuel** ; les intégrations automatiques avec Jira demeurent hors MVP (F-16/F-19).
3. Le fichier ne vise que des **cycles déjà existants dans l'installation** ; un cycle inconnu rend le fichier invalide et ne déclenche aucune création de cycle (D-PRD-130/A4).
4. Les métriques importées respectent le **mode** (Story Points Scrum et métriques de flux Kanban), les **unités**, le caractère facultatif des valeurs et les **calculs dérivés** depuis les sources enregistrées ; ne pas convertir SP en JH ni confondre une absence de champ avec zéro.
5. L’import utilise une méthode **manuelle déclenchée par le SM**, enregistrée dans son historique d’opérations.
6. **Contrat déjà approuvé D-PRD-130/A4 :** colonnes `cycle_id`, `metric_code`, `value`, `quality` ; qualité `known` ou `estimated`, cycle existant, métriques sources éligibles. À préciser techniquement : codes du catalogue, encodage/séparateur, sérialisation numérique et identifiants stables.

### FR-44 / HIS-03 — Prévisualiser, contrôler et confirmer l’import

**Critères d’acceptation :**
1. Avant toute application des données, SMN affiche un **aperçu des lignes reconnues**, leurs cycles cibles et les champs interprétés.
2. Les **erreurs de format, valeurs invalides, rattachements manquants et doublons/collisions** sont identifiés par ligne, avec une explication compréhensible.
3. Une ligne ambiguë ou invalide **n’est jamais appliquée silencieusement**, et l’absence de correspondance de cycle n’est pas compensée par une date/équipe fictive.
4. Le Scrum Master peut **annuler sans écrire de valeur métier**, corriger le fichier puis relancer le contrôle, ou **confirmer explicitement les données effectivement acceptées**.
5. L’aperçu distingue **création de valeurs manquantes et modification de valeurs préexistantes**, conformément à HIS-04.
6. **D-PRD-130/A4 :** ligne invalide ou doublon (`cycle_id`, `metric_code`) = **fichier entier refusé** sans écriture. Une fois toutes les lignes valides, **confirmation explicite puis transaction atomique** ; valeur existante conservée par défaut, remplacement seulement choisi après comparaison avant/après. Aucun succès partiel caché.

### FR-45 / HIS-04 — Préserver les valeurs historiques déjà enregistrées

**Critères d’acceptation :**
1. Une nouvelle saisie ou un import visant un **champ déjà renseigné** affiche la **valeur précédente, la valeur proposée et le cycle ciblé** avant toute modification.
2. Le comportement par défaut est **la conservation de la valeur enregistrée** : aucun champ manuel, importé, calculé ou initialement figé n’est **écrasé automatiquement**.
3. Une correction ne peut être validée que par **choix volontaire explicite**, avec trace de la valeur précédente, nouvelle valeur, origine et horodatage, conformément à la capacité d’audit existante.
4. Les champs **absents dans le CSV** ou laissés vides ne signifient ni **0** ni « effacer les données existantes » ; un effacement volontaire suit une action distincte conforme aux droits/règles du champ.
5. Les cycles **clôturés sont protégés** : une correction de leurs données métier suit la réouverture F-93/F-96 et les protections spécifiques des capacités initiales. Un import ne contourne pas cette condition.
6. Un import ultérieur ne réécrit pas les **PDF déjà exportés** et ne modifie pas silencieusement les cycles voisins.

### FR-46 / HIS-05 — Conserver la provenance et qualifier l’historique

**Critères d’acceptation :**
1. Les informations historiques permettent d’identifier, lorsqu’elle est connue, **la provenance** : saisie manuelle, import CSV, référence calculée ou autre source explicitement existante ; conserver l’**instant d’enregistrement** et, lorsque pertinent, la date de mesure.
2. Pour les valeurs concernées, distinguer les niveaux de qualité **Connue / Estimée / Non renseignée**, dans le prolongement de FR-14 et F-14 ; **« estimée » n’est jamais présentée comme observation mesurée**.
3. Les champs non disponibles demeurent **vides/non renseignés**, sans faux zéros ni données supposées. Un zéro explicitement enregistré reste un **zéro valide**.
4. La consultation et les rapports différencient les **données sources**, les calculs déduits et les **appréciations rétrospectives**, sans attester une provenance non démontrée.
5. Les changements d’origine/qualité et corrections de valeurs sont **historisés** lorsque la valeur métier est modifiée. L’audit d’un import HIS-08 n’est pas assimilé à la preuve d’une mesure passée.

### FR-47 / HIS-06 — Produire un bilan historique partiel et transparent

**Critères d’acceptation :**
1. Un cycle saisi rétrospectivement peut disposer d’un **bilan exploitable même si certains KPI, objectifs ou registres qualitatifs sont inconnus**, sans blocage lié à ces champs facultatifs.
2. Les cérémonies non documentées, absences anciennes et capacités réellement constatées **ne sont pas inventées** ; « Non renseigné » reste distinct de « Non tenu », « Annulé », « absent » ou « 0 JH ».
3. Les indicateurs ou graphes ne sont calculés que si leurs **sources sont suffisantes**, dans le respect des formules et fenêtres validées.
4. Si un **instantané de clôture historique** n’existe pas pour les registres qualitatifs, le système **signale l’absence de preuve historique** plutôt que d’afficher une fiche actuelle comme état passé (D-PRD-122/QLT-08).
5. Toute modification ultérieure du cycle exige la **traçabilité** et les protections de clôture existantes ; les PDF/export antérieurs restent intacts.

### FR-48 / HIS-07 — Réutiliser les périodes reprises dans les tendances

**Critères d’acceptation :**
1. Une période historiquement reprise peut contribuer aux **graphiques de tendances** dès lors qu’elle est **correctement identifiée, clôturée et dispose des valeurs source nécessaires**.
2. Les tendances Scrum portent sur **cinq Sprints clôturés maximum** et, lors d’une consultation rétrospective, **n’utilisent aucun Sprint ultérieur** au Sprint examiné (D-PRD-076/077/078).
3. Les tendances Kanban suivent la limite et les **conventions de mesure homogènes de FR-22**, sans cumuler des populations non comparables ou convertir des unités incompatibles.
4. Une période **ouverte ou terminée mais non clôturée** ne devient pas un point historique définitif simplement parce qu’elle est datée dans le passé.
5. Une valeur absente produit une donnée **non disponible**, non un point à zéro dans un graphe ; **la reprise n’attribue pas rétroactivement un statut « mesuré »** aux chiffres estimés.
6. Le recalcul après correction autorisée conserve les **PDF antérieurs** et respecte l’historique des changements.

### FR-49 / HIS-08 — Historiser les imports et leurs résultats

**Critères d’acceptation :**
1. Chaque **tentative d’import CSV** dispose d’un compte rendu traçable, comprenant **date/heure, utilisateur/opérateur, nom du fichier ou identifiant de lot, type et périmètre d’import**, si connus.
2. Le journal indique **lignes lues, reconnues/acceptées, rejetées, éventuellement corrigées**, ainsi que les motifs d’erreur et conflits détectés sans diffuser de secrets.
3. Il distingue un **aperçu annulé**, un **import effectivement validé**, un **échec** ou un lot confirmé appliqué atomiquement ; **aucun échec ou aperçu n’est enregistré comme import intégralement réussi**.
4. Depuis le journal, le SM peut retrouver le **résultat de l’opération et les cycles affectés**, ainsi que les corrections autorisées qui ont été enregistrées, sans modifier ces valeurs en consultant le journal.
5. L’audit d’import est **distinct de l’historique métier** des valeurs modifiées et des historiques de création/replanification de cycles, tout en permettant d’en relier les références.
6. La sauvegarde obligatoire du **fichier CSV original** n’est pas présumée validée ; la rétention, le masquage des données personnelles et les modalités de conservation relèvent du domaine Sécurité et exploitation.

## 2 bis. Précisions validées D-PRD-130 — reprises et imports

Les critères HIS-01 à HIS-08 restent applicables, complétés par les [quatre arbitrages D-PRD-130](clarifications-d-prd-130.md) :

- **A1 / FR-42/FR-16/FR-17 :** Sprint créé après sa fin : **Terminé**, zéro cérémonie générée, événements historiques ajoutés seulement manuellement avec date/statut connus, puis clôture volontaire.
- **A2 / FR-14/FR-42/FR-46 :** capacité initiale historique **Connue** ou **Estimée** par saisie volontaire, sinon **Non renseignée** ; aucun calcul depuis les données actuelles ; provenance, date de saisie et protection des historiques conservées.
- **A4 / FR-43 à FR-45/FR-49 :** CSV à quatre colonnes **cycle_id, metric_code, value, quality** ; quality = known ou estimated ; quatre métriques SP sources Scrum, cinq métriques de flux Kanban. Tout fichier avec ligne invalide, cycle absent, code incompatible ou doublon est **refusé intégralement**, aucune écriture. Prévisualisation, conservation par défaut des champs déjà saisis, confirmation explicite des remplacements puis transaction **tout ou rien**.
- **A3 / FR-41/FR-47 :** conserver les instantanés **V1/V2...**, dernière version utilisée pour le nouveau bilan après reclôture ; aucune création de photographie historique fictive lors d'une saisie passée.
- **Tests :** données manquantes distinctes de zéro, conflits et remplacements explicites, échec de lot atomique, Sprint historique sans cérémonies, capacité estimée identifiée, reclôture sans altération des anciennes versions/PDF.

**Questions encore ouvertes :** codes techniques des métriques, encodage CSV, schéma technique des identifiants, modalités de provenance ; reprise rétrospective Kanban complète non engagée au MVP.
## 3. Décisions de conception encore ouvertes

- **Contrat CSV et transaction :** arbitrés par D-PRD-130/A4 : quatre colonnes, cycle existant, métriques sources compatibles, erreur/doublon bloquant le lot, prévisualisation, remplacement explicite, puis écriture atomique. Restent techniques : codes du catalogue, encodage/séparateur, format des nombres et identifiants.
- **Reprise Kanban rétrospective** : calendrier de livraison et traitement exact des périodes passées ; ne pas la présumer engagée au MVP au-delà de l’architecture réutilisable.
- **Règles d'historique :** A1/A2 fixent la reprise sans génération de cérémonie ni capacité historique fictive ; A3 impose des instantanés versionnés et la conservation des versions antérieures. Restent à concevoir les preuves et la reprise d'un Sprint commencé mais non terminé.
- **Sécurité et conservation** : accès aux fichiers, rétention du CSV original facultative, contenu du journal et anonymisation des informations sensibles.

**Traçabilité :** F-14/F-16/F-19/F-24/F-25/F-64/F-71/F-72/F-91 à F-96 ; D-PRD-031 à D-PRD-035, D-PRD-076 à D-PRD-086, D-PRD-111 à D-PRD-125 ; FR-14/FR-15/FR-20/FR-22/FR-23/FR-24/FR-30/FR-41. Les sources détaillées demeurent [PRD](prd.md), [Reporting](reportings-html-pdf.md) et [Registres qualitatifs](registres-qualitatifs.md).


## Avenant du 30 octobre 2026 — Reprises historiques successives (SMN-159, AC6–AC10)

**Décision validée :** ajouter sous les options du formulaire une case « Enregistrer un autre Sprint après celui-ci », **décochée par défaut**, indépendante de la génération de cérémonies.

- **Si décochée :** après une création réussie, conserver le bandeau de confirmation et masquer le formulaire (comportement initial).
- **Si cochée :** après une création réussie, conserver le bandeau de confirmation et afficher **sous celui-ci** un nouveau formulaire de reprise historique vide (nom, début et fin), avec les deux cases décochées et un nouvel identifiant d'opération.
- **Si erreur :** préserver saisies et cases sans afficher de confirmation ni réinitialiser l'identifiant d'opération ; appliquer les validations existantes.
- **Exigences transversales :** accès administrateur inchangé, aucune modification de l'API ni des contrôles anti-chevauchement, libellé accessible et responsive ; vérifier parcours avec et sans enchaînement, saisies multiples et échec.

**Implémentation visée :** `src/app/app/admin/sprints/historical/historical-sprint-form.tsx` ; aucune migration SQL ni modification du modèle de données. Référence Jira : SMN-159.
