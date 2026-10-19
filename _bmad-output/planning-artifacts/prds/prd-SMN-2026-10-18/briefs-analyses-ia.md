# SMN — Briefs TXT et analyses IA : exigences et critères d'acceptation

**Statut :** règles métier validées le 19 octobre 2026, conception technique restant à détailler.  
**Référence :** [PRD principal](prd.md), FR-50 à FR-57 ; **D-PRD-126**, validation groupée **IA-01 à IA-08**.  
**MVP :** Scrum/Kanban, export d'un fichier **TXT plat** transmis manuellement à une IA externe, puis réponse copiée-collée dans SMN. **Aucun connecteur, envoi automatique, API IA, compte membre ou accès collaboratif requis.** Extension SAFe/ART en version 1.0.

## 1. Socle précédemment validé et préservé (F-98 à F-109)

- Le brief TXT constitue une **restitution textuelle du moteur commun de sélection de données des reportings**, sans graphique ; ses informations sont explicables et peuvent être sélectionnées avec un modèle (F-103/F-104).
- Il est **prévisualisé, enrichi par le SM/RTE et contrôlé pour confidentialité avant transmission** ; aucune donnée individuelle de membre ne doit être envoyée à l'IA externe, y compris nom, email, calendrier, absence, capacité ou appréciation individuelle (F-106/F-108). Les textes libres peuvent contenir des informations confidentielles ; leur relecture est nécessaire (F-109).
- Le contenu archivé est le **TXT exact transmis ou choisi comme final**, géré par l'application et **immuable côté SMN**. Le changement passe par **duplication et nouveau brief**, avec lien de parenté ; l'archive initiale n'est jamais corrigée en place (F-99/F-107).
- Le MVP repose sur l'envoi **manuel hors SMN** au prestataire IA choisi, et le retour par **copier-coller**, sans automatisation API (F-102).
- **Une seule analyse IA associée à un brief à la fois** ; si elle est supprimée, le brief demeure, et une nouvelle réponse peut y être liée ensuite. Les analyses humaines ou IA sont modifiables/supprimables, avec date/origine/périmètre et retouches humaines de l'IA clairement identifiées ; l'historisation intégrale de chaque version de texte n'est pas requise (F-98/F-100/F-101).
- Les analyses IA **antérieures sont exclues par défaut des nouveaux briefs**, et inclusion explicitement choisie possible ; les analyses humaines historiques sont également sélectionnables (F-105). Les briefings ne réinjectent pas automatiquement un texte IA précédent comme donnée mesurée.
- Le journal de faits marquants et les autres éléments **qualitatifs collectifs** peuvent être repris sur sélection et après vérification, selon leurs règles d'historique de clôture (F-109/F-110/F-111, D-PRD-124).
- Organisation du stockage, fichiers privés, empreinte SHA-256, sauvegardes, rétention et interface d'identification du prestataire IA restent des **décisions de conception**, pas une architecture validée.

## 2. Exigences et critères d'acceptation détaillés

### FR-50 / IA-01 — Accéder à la génération d'un brief IA depuis le travail courant

**Critères d'acceptation :**
1. Un Scrum Master peut démarrer l'action **« Générer un brief IA »** depuis la fiche d'un **Sprint** ou d'une **période Kanban**, depuis son bilan et depuis la préparation d'un **reporting**, sans saisir à nouveau l'identifiant du cycle consulté.
2. Le formulaire récupère **cycle, dates, mode Agile, équipe/produit, statut, modèle proposé et valeurs exploitables**, dans le respect des permissions et de la confidentialité du TXT ; aucun graphique n'est exporté dans le brief.
3. Un brief sur une **période non clôturée** indique son **statut provisoire et l'instant de préparation**, sans présenter ses chiffres partiels comme résultat final.
4. Les parcours de génération sont des **points d'entrée vers le même moteur de sélection** et non des moteurs indépendants selon l'écran d'origine ; revenir sans archiver n'altère ni le cycle ni ses sources.
5. Les usages SAFe/ART seront étendus en **v1.0**, sans insertion d'une interface ART dans le MVP.

### FR-51 / IA-02 — Configurer et réutiliser des modèles de briefs

**Critères d'acceptation :**
1. SMN fournit **plusieurs modèles préconfigurés** fondés sur des **types d'analyse** (par exemple bilan de cycle, comparaison de tendances, risques et dépendances), mais **le catalogue exact et leur texte initial restent à choisir lors de la conception**.
2. Le SM/RTE peut consulter un modèle et, dans l'administration, **le modifier, en créer d'autres, régler l'ordre des sections, les données incluses, la profondeur historique, les questions et les consignes**, dans les limites d'accès décidées.
3. Lors de la génération, la sélection d'un modèle **préremplit** les réglages, qui peuvent être **adaptés ponctuellement sans écraser le modèle**, sauf action explicite.
4. Une modification d'un modèle **ne réécrit pas le TXT d'un brief déjà archivé** ni les analyses existantes ; les archives reflètent le contenu réellement approuvé lors de leur production.
5. Le modèle doit **toujours appliquer les exclusions obligatoires** de données individuelles, même si une option de modèle les demande par erreur.

### FR-52 / IA-03 — Structurer le TXT et distinguer les sources

**Critères d'acceptation :**
1. Le TXT est **lisible sans format propriétaire** et identifie au minimum **produit/équipe, cycle, statut, dates, date de préparation, modèle et périmètre**.
2. Il distingue explicitement les rubriques de **faits/chiffres collectifs enregistrés**, de **contexte qualitatif collectif**, d'**observations ou analyses humaines** et d'**instructions/questions destinées à l'IA**. Les anciennes analyses IA incluses volontairement sont **marquées comme interprétations IA historiques**.
3. Il peut utiliser, selon sélection et disponibilité, **objectifs/résultats, KPI, capacité collective JH, tendances, ROAM/risques, obstacles, dépendances, décisions, actions et faits marquants**, sans conversion d'unités injustifiée ni reconstruction d'informations manquantes.
4. Le caractère **estimé, calculé, non renseigné ou provisoire** est visible lorsque la donnée le justifie ; **absence ≠ zéro**. Une appréciation humaine ou IA ne devient jamais un constat observé par changement de rubrique.
5. L'ordre et la profondeur historique sont configurables dans les limites métier validées ; la sélection des données peut être mutualisée avec HTML/PDF tout en **appliquant au TXT les protections plus strictes de F-108**.
6. Le document ne contient **aucun graphique ni donnée personnelle individuelle de membre** ; les textes libres font l'objet du contrôle explicite prévu en FR-53.

### FR-53 / IA-04 — Contrôler la confidentialité et la transmission manuelle

**Critères d'acceptation :**
1. Avant de figer/exporter le TXT, le SM/RTE voit **le contenu complet qui pourra être transmis**, peut supprimer des passages, ajouter un **contexte collectif** et adapter les consignes.
2. Les champs individuels structurés des membres (notamment **noms, emails, calendriers, absences, capacités individuelles, évaluations**) sont **exclus du moteur de données du brief** et ne sont **pas réintroduits** par le simple choix d'un modèle.
3. L'application **avertit explicitement** que les descriptions et commentaires libres peuvent inclure **noms, secrets et données confidentielles**, et demande une **validation de confidentialité avant archivage final** ; le SM peut retirer le contenu problématique.
4. **Aucun TXT ni extrait de contexte n'est envoyé automatiquement** vers un prestataire externe, y compris lors de la prévisualisation ou de l'archivage. La transmission est une **action volontaire effectuée hors application** par l'utilisateur dans le MVP.
5. L'approbation d'un TXT ne signifie pas que SMN peut garantir la confidentialité du prestataire externe ; ne pas affirmer un contrôle sur ses politiques de conservation ou la réponse générée.
6. Si le contrôle de confidentialité n'a pas été validé, le processus **ne doit pas présenter le TXT comme « prêt à partager »**.

### FR-54 / IA-05 — Archiver un brief TXT immuable et le dupliquer

**Critères d'acceptation :**
1. Le SM/RTE peut **prévisualiser et ajuster** un brouillon de TXT, puis **archiver explicitement sa version définitive** avec **identifiant stable, horodatage, cycle/périmètre et référence de modèle**.
2. Le **TXT archivé est consultable, exportable et réutilisable** ; son contenu est **non modifiable via SMN**. Les ajustements du modèle ou des données sources n'altèrent pas cet original.
3. L'action **« Dupliquer »** crée **un nouveau brief** (nouvel identifiant, nouveau contenu finalisable) avec **lien explicite vers le brief parent**, sans changer son contenu ou ses analyses liées.
4. L'archivage conserve **le texte exact effectivement finalisé**, et non une régénération depuis les valeurs actuelles à la date d'une consultation ultérieure. Une prévisualisation annulée n'est pas automatiquement archivée.
5. La suppression d'une **analyse IA** ne supprime **jamais** le brief TXT associé ; celui-ci reste utilisable pour un nouvel essai manuel (F-101).
6. **Emplacement disque/base de métadonnées, intégrité par empreinte, sauvegarde et rétention** sont à décider avec l'architecture et la sécurité ; aucune obligation de répertoire ou de SHA-256 n'est actée par IA-05.

### FR-55 / IA-06 — Coller et associer la réponse IA au brief d'origine

**Critères d'acceptation :**
1. Après transmission **manuelle** d'un TXT à l'IA de son choix, le SM/RTE peut **coller le texte de la réponse** dans SMN depuis la fiche du brief ; le texte est associé à **l'identifiant précis** du brief archivé.
2. L'enregistrement conserve **horodatage, provenance IA et périmètre** ; le **nom du prestataire/modèle, s'il est connu, reste facultatif** et n'est pas inventé.
3. **Une seule analyse IA à la fois par brief**. Si une analyse existe déjà, l'utilisateur doit la **modifier ou la supprimer volontairement** ; aucun second enregistrement concurrent ni écrasement silencieux.
4. La suppression de l'analyse **préserve le brief TXT**, et une nouvelle réponse peut ensuite être associée au même brief ; les autres analyses humaines du journal restent distinctes.
5. Aucune commande de SMN ne prétend avoir **appelé l'IA externe** dans le MVP ; le collage n'établit pas automatiquement l'exactitude des conclusions.
6. L'interface permet de consulter **brief original et réponse associée** pour comparer les données transmises à l'interprétation reçue.

### FR-56 / IA-07 — Gérer le journal des analyses humaines et IA

**Critères d'acceptation :**
1. Le **journal historique des analyses** recense les analyses humaines et les réponses IA enregistrées, avec **origine, date, périmètre, auteur connu et liens aux cycles/briefs**.
2. Les analyses **humaines et IA** peuvent être **consultées, modifiées et supprimées volontairement**, avec dates de création et dernière modification ; l'application ne prétend pas conserver une **version intégrale de chaque texte** si cela n'a pas été spécifié.
3. Après modification humaine du texte initialement fourni par l'IA, l'analyse demeure identifiée comme **origine IA retouchée par un humain** : elle n'est pas requalifiée en résultat IA brut, et ne devient pas un fait mesuré.
4. Les analyses humaines antérieures sont **sélectionnables** pour les futurs rapports et briefs ; les analyses IA antérieures restent **exclues des nouveaux briefs par défaut**, sélection volontaire requise pour les y réintroduire (F-105).
5. Si une analyse IA associée à un brief est supprimée, **le brief TXT ne l'est pas** et l'association d'une nouvelle réponse reste possible (F-101).
6. Les règles de confidentialité et de clôture des rapports historiques déjà produits demeurent applicables : modifier une analyse **ne réécrit pas un ancien PDF ou TXT archivé**.

### FR-57 / IA-08 — Sélectionner les analyses dans les reportings sans confondre avis et faits

**Critères d'acceptation :**
1. Le SM/RTE peut sélectionner une ou plusieurs **analyses humaines ou IA enregistrées** dans la préparation d'un rapport HTML/PDF lorsque leur périmètre et les droits applicables le permettent ; ne pas les inclure silencieusement sans sélection ou option enregistrée du modèle.
2. L'affichage indique pour chaque analyse son **origine humaine/IA**, les informations connues de **date, périmètre, référence de brief** et **retouche humaine éventuelle**.
3. Le rapport distingue graphiquement ou textuellement **l'interprétation** de l'IA des **mesures, données sources et observations humaines** ; un commentaire IA ne devient pas un KPI ni une donnée factuelle par sa présence dans le rapport.
4. Les **rapports déjà exportés restent immuables** après modification ou suppression d'une analyse ; un rapport nouvellement généré reflète les analyses sélectionnées dans leur état autorisé et disponible.
5. Lors de la création d'un **nouveau brief TXT**, les analyses IA historiques ne sont **pas incluses par défaut**, même si l'on choisit un modèle contenant une rubrique d'analyses ; leur inclusion nécessite une sélection explicite (F-105).
6. L'inclusion d'une analyse dans un **rapport interne** ne constitue **pas une autorisation de transmettre des données individuelles dans un TXT** : FR-53/F-108 restent prioritaires.

## 3. Limites et points à préciser dans les blocs suivants

- **IA-02 :** liste précise des modèles préconfigurés et questions initiales, conventions de tri/historique, accessibilité et comportement en cas de modification/suppression d'un modèle référencé.
- **IA-04 :** formulation de l'écran de vérification et possibilité de détecter automatiquement des secrets/PII en texte libre ; aucune détection parfaite ou transmission externe automatique n'est promise.
- **IA-05 :** persistance technique, stockage privé, mécanisme d'intégrité, gestion de sauvegarde/restauration, rétention, suppression des métadonnées et confidentialité du journal.
- **IA-06/07 :** attribution éventuelle de l'identité du modèle externe et champs d'auteur, gestion des analyses humaines indépendantes du brief, droits précis et affichage de la retouche.
- **IA-08 :** choix de représentation graphique/textuelle des interprétations, limites de taille et filtres dans les exports.
- **Hors MVP :** API IA, génération autonome d'analyses, envoi automatique, anonymisation garantie de tout texte libre, gestion complexe des versions des analyses ou comparaison fiable de modèles externes.
- Les langues **FR/EN** des éléments standardisés de l'interface sont disponibles dès le MVP (F-112). Les textes libres demeurent en langue de saisie sans traduction automatique obligatoire (RPT-07).

**Traçabilité :** F-98 à F-109, F-110/F-111, F-14/F-24/F-25/F-71/F-72, D-PRD-123 (Reporting), D-PRD-124 (Registres qualitatifs), D-PRD-125 (Reprise historique), FR-26 à FR-33, FR-34 à FR-41. **D-PRD-126** approuve groupément **IA-01 à IA-08**. Le présent addendum est lié au PRD principal et n'ajoute pas d'API ou de comportement externe non validé.
