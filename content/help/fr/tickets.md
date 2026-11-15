# Tickets / CSV : transformez vos exports en indicateurs et en historique

Un fichier CSV est bien plus qu'une liste de tickets. Importé dans SMN au bon moment, il devient une **photographie datée de votre sprint ou période Kanban**. SMN en calcule des statistiques, vous aide à suivre leur évolution et peut réutiliser ces photographies pour alimenter des rapports.

> **Le conseil de Camille :** pensez « mesure dans le temps », plutôt que « import technique ». Une photographie au début du sprint et une autre à la fin donnent des informations bien plus utiles qu'un fichier isolé.

## 1. Comprenez ce que vous allez obtenir

**Votre parcours en quatre temps :** préparer le CSV, importer une photographie, consulter les KPI calculés, puis comparer et réutiliser les données.

### Des KPI calculés automatiquement

Dans l'onglet **Consultation**, SMN calcule notamment :

- **Nombre de tickets** : combien de tickets contient la photographie.
- **Tickets terminés** : combien sont reconnus comme terminés à partir de leur statut.
- **Somme des Story Points** : total des estimations numériques exploitables.
- **Tickets estimés ou non estimés** : une aide pour mesurer la qualité des estimations.
- **Répartitions** : nombre de tickets et Story Points par type, statut et préfixe d'identifiant.

Les résultats sont calculés à partir des tickets importés. Ils s'adaptent aussi aux filtres : l'écran permet de choisir entre **tous les tickets de la photographie** et **les tickets correspondant aux filtres actifs**.

> **Attention aux chiffres :** un total calculé sur des tickets filtrés n'est pas nécessairement le total du sprint. Vérifiez la portée sélectionnée avant d'utiliser un KPI dans une revue ou un rapport.

### Du calcul automatique à vos indicateurs SMN

Le module Tickets met ces chiffres à votre disposition. Vous pouvez ensuite ouvrir le bouton **Indicateurs** pour **renseigner manuellement les indicateurs configurés pour le cycle**, lorsque vous disposez des droits correspondants.

**À bien distinguer :** SMN calcule automatiquement les statistiques visibles dans Consultation, mais **n'inscrit pas automatiquement ces chiffres dans tous vos indicateurs manuels**. À vous de choisir la bonne valeur, sa période et l'indicateur auquel la reporter. Les indicateurs calculés par formule suivent leur propre définition.

> **Exemple :** vous filtrez les tickets de type Bug et obtenez 12 tickets. Vous pouvez utiliser ce résultat comme référence pour un indicateur manuel « Bugs du sprint », s'il existe dans votre catalogue. Pensez à relever la date de photographie et à conserver le même périmètre lors des mesures suivantes.

## 2. Préparez un CSV que SMN pourra comprendre

La première ligne de votre fichier doit contenir **exactement les six noms de colonnes attendus** (les anciens intitulés Jira ne sont pas utilisés) :

`id,type,resume,priority,status,sp`

### À quoi sert chaque colonne ?

- **id** — Identifiant unique du ticket, par exemple `PROJ-123`. Il permet de reconnaître le même ticket entre deux photographies et, si le **Lien Jira** est configuré, de reconstruire son URL.
- **type** — Type de ticket (Story, Bug, Task, etc.). Il permet les filtres et répartitions par catégorie.
- **resume** — Titre ou résumé. Il permet de comprendre de quoi parle le ticket.
- **priority** — Priorité. Elle aide à trier et à filtrer les tickets.
- **status** — Statut au moment de l'export. Il sert à distinguer les tickets terminés et à comparer leurs évolutions.
- **sp** — Story Points. Ils permettent le calcul des sommes d'estimations et le repérage des tickets non estimés.

**Exemple de fichier minimal :**

`id,type,resume,priority,status,sp`

`PROJ-101,Story,Créer le formulaire,High,Done,5`

`PROJ-102,Bug,Corriger la validation,Medium,In Progress,3`

Dans cet exemple, SMN peut compter **2 tickets**, dont **1 terminé**, et additionner **8 Story Points**. Il ne s'agit pas d'un calcul de vélocité à lui seul : la signification d'un KPI dépend du périmètre et de la méthode de suivi.

### Vérifications avant l'import

- Chaque colonne obligatoire doit apparaître une seule fois. L'ordre des colonnes peut varier ; les colonnes supplémentaires sont admises.
- Les identifiants `id` ne doivent être ni vides ni dupliqués dans un fichier.
- Les séparateurs reconnus sont **virgule**, **point-virgule** et **tabulation**.
- Le fichier doit être au format `.csv`, faire au maximum **8 Mio** et contenir au maximum **20 000 tickets**.
- Les Story Points non numériques peuvent déclencher un avertissement : la valeur est conservée, mais elle ne participe pas aux totaux numériques.

> **Conseil qualité :** utilisez une convention de statuts stable d'un export à l'autre. Le calcul des tickets terminés reconnaît notamment « Done » et « Terminé ». Un statut personnalisé n'est pas automatiquement équivalent à un ticket terminé.

## 3. Importez une photographie à la bonne date

1. Ouvrez [Tickets](/app/tickets) et vérifiez l'**équipe** ainsi que le **sprint ou la période Kanban** sélectionnés.
2. Cliquez sur **Importer CSV**, si vous disposez des droits nécessaires.
3. Vérifiez le cycle affiché dans la fenêtre d'import.
4. Sélectionnez le **fichier CSV**.
5. Renseignez la **date de référence** : c'est la date métier de la photographie, pas forcément le jour où vous effectuez l'import.
6. Au besoin, dépliez **En-têtes CSV attendus** pour contrôler les six colonnes.
7. Lancez la validation, corrigez les éventuelles erreurs, puis terminez l'import.

**Pourquoi la date de référence est-elle si importante ?** Parce qu'elle permet de retrouver l'état des tickets à un instant précis et de comparer plusieurs observations du même cycle.

> **Exemple :** vous exportez les tickets lundi, mais ne les importez que mardi. Si vous souhaitez conserver la situation du lundi, utilisez cette date comme **date de référence**. Gardez cette convention pour toute la durée du sprint.

### Si une photographie existe déjà à cette date

SMN demande une **confirmation de remplacement**. Vérifiez soigneusement le cycle, la date et le fichier : le remplacement substitue la photographie courante de cette date. Il ne crée pas une deuxième photographie consultable pour la même date.

## 4. Consultez les tickets et interprétez les KPI

Dans l'onglet **Fichiers**, sélectionnez une photographie. La liste indique notamment sa date de référence, son nom de fichier, la date d'import et le nombre de tickets.

Ouvrez **Consultation**. Vous pouvez alors :

1. Rechercher un ticket par son identifiant ou son contenu.
2. Filtrer par **type**, **statut**, **priorité** ou **préfixe**.
3. Trier et parcourir les résultats.
4. Lire les indicateurs calculés, en vérifiant s'ils portent sur **tous** les tickets ou seulement ceux **filtrés**.
5. Identifier les Story Points absents ou non numériques avant d'interpréter leur somme.

Si l'adresse de base est renseignée dans **Paramètres → Lien Jira**, l'identifiant du ticket peut devenir un lien vers Jira. Ce réglage **reconstruit une URL** : il ne remplace pas l'import CSV et n'établit pas, à lui seul, une synchronisation automatique avec Jira.

## 5. Historisez votre sprint ou période et comparez les évolutions

Chaque photographie est rattachée à **une équipe**, **un sprint ou une période Kanban** et **une date de référence**. Ce rattachement constitue l'historique métier consultable dans SMN.

Une méthode simple consiste à enregistrer plusieurs situations à des dates utiles :

- **Début de cycle** — Le périmètre initial et les estimations.
- **Milieu de cycle** — Les tickets ajoutés, modifiés ou terminés.
- **Fin de cycle** — L'état final utilisé pour le bilan.

Lorsque deux photographies de dates différentes sont disponibles, ouvrez **Comparaison**. SMN peut identifier les tickets **ajoutés**, **retirés**, **terminés**, **rouverts**, les **Story Points modifiés** et les autres changements détectés.

> **Conseil de Scrum Master :** une évolution du nombre de tickets ne signifie pas automatiquement une amélioration ou une dégradation. Confrontez les écarts aux événements du sprint : changement de périmètre, nouvelle anomalie, découpage de Story, etc.

## 6. Réutilisez l'historique dans vos rapports

Les photographies ne servent pas uniquement à l'écran Tickets. Elles peuvent également fournir des **sources de données pour les rapports** du sprint ou de la période.

1. Ouvrez [Rapports](/app/reports).
2. Dans **Modèles**, choisissez un modèle Word ou PowerPoint adapté.
3. Sélectionnez le **cycle** concerné.
4. **Si le modèle exploite des tickets**, sélectionnez les photographies demandées dans les champs proposés.
5. Générez ou enregistrez le document, puis vérifiez les tableaux, données et éventuelles comparaisons réellement renseignés.

**Important :** tous les modèles de rapports n'utilisent pas nécessairement les tickets. Le résultat dépend des **tags présents dans le modèle**, des sources sélectionnées et des données disponibles. L'existence d'un CSV importé ne garantit pas qu'il apparaîtra automatiquement dans n'importe quel rapport.

> **Bonne pratique :** conservez une convention de dates et de statuts stable. Vous rendrez vos comparaisons plus faciles à expliquer lors des revues de sprint et des échanges avec les parties prenantes.

## 7. Résolvez les problèmes fréquents

- **Importer CSV est indisponible** — Vérifiez le contexte d'équipe et de cycle ainsi que les droits d'administration.
- **Le fichier est refusé** — Contrôlez les six en-têtes, les identifiants, la syntaxe CSV et les limites de fichier.
- **Les Story Points ne s'additionnent pas** — Recherchez les valeurs vides ou non numériques, et vérifiez la portée des filtres.
- **Un ticket n'est pas compté comme terminé** — Vérifiez sa valeur dans `status` et la convention de statut reconnue.
- **Comparaison est désactivée** — Importez au moins deux photographies à des dates de référence différentes pour le même cycle.
- **Une ancienne photographie a disparu** — Vérifiez si elle a été remplacée par un autre import à la même date ou si elle a été supprimée.
- **Les tickets n'apparaissent pas dans le rapport** — Vérifiez que le modèle les utilise et que les bonnes photographies ont été sélectionnées.

## Votre contrôle final

Vous devez pouvoir répondre à ces quatre questions : **quel cycle ai-je mesuré ? à quelle date ? quels KPI ont été calculés ? quelles photographies permettront de justifier ces résultats dans un rapport ?**

Quand ces réponses sont claires, vos imports CSV ne sont plus de simples fichiers : ils deviennent un historique utile au pilotage de l'équipe.
