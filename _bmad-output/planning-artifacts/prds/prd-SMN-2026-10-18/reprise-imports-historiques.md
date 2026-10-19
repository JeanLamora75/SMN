# SMN — Reprise et imports historiques : exigences et critères d’acceptation

**Statut :** validé fonctionnellement le 19 octobre 2026 ; détails de conception non arbitrés conservés comme questions ouvertes.  
**Référence :** [PRD principal](prd.md), FR-42 à FR-49 ; **D-PRD-125** (validation groupée HIS-01 à HIS-08).  
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
4. Les événements, absences et disponibilités antérieurs **ne sont pas présumés observés** s’ils n’ont pas été documentés : aucune cérémonie « tenue » ou capacité « réelle » ne doit être fabriquée du seul fait de la création rétrospective. Les adaptations exactes des générations automatiques pour les cycles repris seront précisées avant développement.
5. Les valeurs reprises restent **consultables et modifiables selon le statut**, avec provenance/historique lorsque disponible ; une correction d’un cycle clôturé respecte les règles de réouverture F-93/F-96.
6. La même approche métier **pourra être étendue aux périodes Kanban** sans créer un moteur indépendant ; la présence exacte de la création rétrospective Kanban au MVP reste **à arbitrer**, car HIS-01 l’exprimait comme possibilité d’extension.

### FR-43 / HIS-02 — Importer un CSV de métriques consolidées

**Critères d’acceptation :**
1. SMN accepte un **CSV à structure fixe documentée** comportant les seules **valeurs numériques consolidées** des cycles/équipes et les identifiants nécessaires à leur rattachement.
2. L’import ne crée **aucun ticket Jira, backlog item ni élément individuel** ; les intégrations automatiques avec Jira demeurent hors MVP (F-16/F-19).
3. Le fichier peut viser des cycles déjà existants ou des cycles historiques explicitement identifiables ; **le comportement exact lorsqu’un cycle n’existe pas doit être configuré/validé**, jamais créer implicitement un cycle avec des dates inventées.
4. Les métriques importées respectent le **mode** (Story Points Scrum et métriques de flux Kanban), les **unités**, le caractère facultatif des valeurs et les **calculs dérivés** depuis les sources enregistrées ; ne pas convertir SP en JH ni confondre une absence de champ avec zéro.
5. L’import utilise une méthode **manuelle déclenchée par le SM**, enregistrée dans son historique d’opérations.
6. **À spécifier avant implémentation :** colonnes et types du CSV, séparateur/encodage, identifiants stables de rattachement, conventions de dates et prise en charge exacte des cycles Kanban historiques.

### FR-44 / HIS-03 — Prévisualiser, contrôler et confirmer l’import

**Critères d’acceptation :**
1. Avant toute application des données, SMN affiche un **aperçu des lignes reconnues**, leurs cycles cibles et les champs interprétés.
2. Les **erreurs de format, valeurs invalides, rattachements manquants et doublons/collisions** sont identifiés par ligne, avec une explication compréhensible.
3. Une ligne ambiguë ou invalide **n’est jamais appliquée silencieusement**, et l’absence de correspondance de cycle n’est pas compensée par une date/équipe fictive.
4. Le Scrum Master peut **annuler sans écrire de valeur métier**, corriger le fichier puis relancer le contrôle, ou **confirmer explicitement les données effectivement acceptées**.
5. L’aperçu distingue **création de valeurs manquantes et modification de valeurs préexistantes**, conformément à HIS-04.
6. **À arbitrer en conception :** import atomique de tout le lot ou validation partielle explicitement sélectionnée, et règles d’unicité/gestion des lignes en doublon. Les erreurs ne doivent jamais aboutir à un succès partiel dissimulé.

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
3. Il distingue un **aperçu annulé**, un **import effectivement validé**, un **échec** et, si la conception l’autorise, une validation partielle explicitement choisie ; **aucun échec ou aperçu n’est enregistré comme import intégralement réussi**.
4. Depuis le journal, le SM peut retrouver le **résultat de l’opération et les cycles affectés**, ainsi que les corrections autorisées qui ont été enregistrées, sans modifier ces valeurs en consultant le journal.
5. L’audit d’import est **distinct de l’historique métier** des valeurs modifiées et des historiques de création/replanification de cycles, tout en permettant d’en relier les références.
6. La sauvegarde obligatoire du **fichier CSV original** n’est pas présumée validée ; la rétention, le masquage des données personnelles et les modalités de conservation relèvent du domaine Sécurité et exploitation.

## 3. Décisions de conception encore ouvertes

- **Matrice CSV fixe exacte** : colonnes, types, séparateur/encodage, format de dates, identifiants, options facultatives et choix des données Kanban.
- **Validation du lot** : atomique intégrale ou sélection explicite des seules lignes valides, sans réussite partielle silencieuse.
- **Correspondance de cycles absents et doublons** : comportement lors d’un cycle non créé, gestion d’une ligne répétée et proposition de correction visible.
- **Reprise Kanban rétrospective** : calendrier de livraison et traitement exact des périodes passées ; ne pas la présumer engagée au MVP au-delà de l’architecture réutilisable.
- **Règles d’historique** : génération d’événements dans une reprise manuelle, qualité des données historiques, instantanés de clôture manquants et reclôture.
- **Sécurité et conservation** : accès aux fichiers, rétention du CSV original facultative, contenu du journal et anonymisation des informations sensibles.

**Traçabilité :** F-14/F-16/F-19/F-24/F-25/F-64/F-71/F-72/F-91 à F-96 ; D-PRD-031 à D-PRD-035, D-PRD-076 à D-PRD-086, D-PRD-111 à D-PRD-125 ; FR-14/FR-15/FR-20/FR-22/FR-23/FR-24/FR-30/FR-41. Les sources détaillées demeurent [PRD](prd.md), [Reporting](reportings-html-pdf.md) et [Registres qualitatifs](registres-qualitatifs.md).
