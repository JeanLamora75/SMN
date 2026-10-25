---
name: Scrum Master Notebook — Studio de rapports
status: draft-validation-ux
updated: 2026-10-25
description: Contrat d'expérience du Centre Rapports, de la bibliothèque de modèles, du studio, de la fraîcheur des données et de l'export ; décisions approuvées, document à valider.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md
  - https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/sprints/%5BsprintId%5D/report/page.tsx
  - SMN-SYNTHESE-UX-STUDIO-RAPPORTS-2026-10-25.md
---

# SMN — EXPERIENCE.md — Studio de rapports

> **Statut : proposition de contrat à approuver.** Les 21 arbitrages UX et la synthèse ont été validés le 25 octobre 2026. Ce fichier décrit **comment l'expérience doit fonctionner**, non son implémentation effective. Le pair [DESIGN.md](DESIGN.md) fixe l'identité, les tokens et la mise en page. La [maquette HTML](mockups/studio-rapports-reference.html) illustre les flux, sans connexion ni données réelles. En cas de divergence, **les contrats approuvés DESIGN.md et EXPERIENCE.md prévalent sur les maquettes**. Les contrats sont publiés dans le dépôt comme spécification ; les Stories Jira SMN-254 à SMN-269 sont créées. Aucune modification applicative n'est induite.

## Foundation

- Produit : **Scrum Master Notebook** ; utilisateur principal : Scrum Master, éventuellement RTE en version SAFe ultérieure. Priorité à la préparation rapide de bilans **fiables, exhaustifs et adaptés aux destinataires**.
- Surface : application web Next.js/React avec Bootstrap existant ; desktop principal, tablette pleinement éditable et mobile à édition limitée. Style visuel hérité du SMN existant, défini dans [DESIGN.md](DESIGN.md) ; par exemple `{colors.brand-primary}`, `{spacing.studio-plan-width}`, `{components.studio-canvas.pageBackground}`.
- MVP : Scrum/Kanban monoéquipe ; pour les rapports de Sprint décrits ici, les données métier sont celles du Sprint choisi. L'extension aux périodes Kanban et PI SAFe devra définir des jeux de données compatibles avant activation, sans feindre leur existence actuelle.
- Rôles : `admin` (création/gestion selon droits courants) et `user` en lecture seule au MVP. Administration des modèles personnalisés réservée à l'administrateur ; **les API contrôlent les habilitations**, pas seulement la présence d'un bouton.
- Provenance : la base métier SMN fait autorité pour SP, tickets, capacité et données historiques. Un rapport n'autorise **aucune réécriture** de ces mesures ; toute correction se fait à la source. Les champs non disponibles ne sont pas fabriqués.
- **Non-objectifs explicites :** pas de composition pixel libre, pas de génération IA au sein du studio, pas d'approbation de publication obligatoire, pas d'historique durable des brouillons, pas d'orientation mixte dans un document, pas de résolution de conflits concurrente.
- **Source de conception :** 21 décisions `UX-R01` à `UX-R21`, détaillées dans la synthèse jointe ; elles prévalent sur les recommandations de l'atelier qui n'ont pas été retenues.

## Information Architecture

| Surface | Accès utilisateur | But | Référence visuelle |
|---|---|---|---|
| Centre Rapports / vue Rapports | Menu « Rapports » ou raccourci depuis la fiche Sprint | Chercher, filtrer, créer, reprendre plusieurs brouillons indépendants par Sprint | [Centre](mockups/studio-rapports-reference.html#centre) |
| Centre / vue Modèles | Onglet « Modèles » | Prévisualiser, choisir, dupliquer les modèles ; administrer les personnalisés suivant droits | [Modèles](mockups/studio-rapports-reference.html#modeles) |
| Centre / vue Archives | Onglet « Archives » | Lire, exporter et comparer dans la mesure disponible les versions figées, sans mutation | [Archives](mockups/studio-rapports-reference.html#archives) |
| Assistant court « Nouveau rapport » | Depuis Centre ou raccourci Sprint | Choix modèle/version, titre, langue ; création d'un brouillon complet | [Création](mockups/studio-rapports-reference.html#centre) |
| Studio / Composition | Ouvrir un brouillon | Organiser rubriques/blocs, styles, graphiques, couverture, sommaire | [Studio](mockups/studio-rapports-reference.html#studio) |
| Studio / Rédaction | Onglet « Rédaction » | Rédiger directement dans les commentaires et blocs libres | [Studio](mockups/studio-rapports-reference.html#studio) |
| Studio / Aperçu | Onglet « Aperçu » | Lire les pages fidèles au futur document imprimé, sans poignées d'édition | [Studio](mockups/studio-rapports-reference.html#studio) |
| Comparaison de données | Indicateur « Données à vérifier » | Voir différences de sources et actualiser volontairement un rapport | [Studio — comparer](mockups/studio-rapports-reference.html#studio) |
| Export / contrôle qualité | « Exporter PDF » | Export immédiat si conforme, avertissements consultables sinon | [Export](mockups/studio-rapports-reference.html#export) |
| Figer et archiver | Action distincte du studio | Capturer une version immuable volontaire | [Archives](mockups/studio-rapports-reference.html#archives) |
| Briefs IA (hors studio) | Espace de briefs IA existant à confirmer | Préparer les analyses ; le studio ne propose que leur sélection explicite | Spine uniquement |

**Routes :** le tableau ci-dessus décrit des **surfaces**, **pas des URL définitives**. Les routes applicatives exactes doivent être cartographiées avant développement ; conserver l'ancienne préparation de rapport tant que la nouvelle n'est pas validée. La fiche Sprint nouvelle est différée dans certaines décisions antérieures : ne pas créer de lien vers une route absente ; le raccourci contextuel sera activé uniquement là où une fiche est effectivement livrée.

### Contexte et navigation

- Une entrée « Rapports » dans la navigation privée SMN conduit au Centre Rapports. Onglets « Rapports », « Modèles », « Archives » ; conserver les filtres si possible lors du retour depuis un rapport.
- Raccourci depuis une fiche Sprint réelle : ouvrir **le même Centre** avec filtre Sprint appliqué, sans dupliquer la page ; proposer « Retour au Sprint » uniquement si une destination vérifiée existe.
- Recherche locale ou serveur selon volume ; champs de filtre : Sprint/période, modèle, état, dates, équipe **seulement lorsque plusieurs équipes existent**.
- Création : modèle versionné, nom proposé, langue FR/EN ; pas de formulaire long. Chaque nouveau document possède ses contenus rédactionnels propres, même s'il est issu du même Sprint qu'un autre.
- Priorité au **dernier brouillon** d'un rapport à sa réouverture ; aucune vue « historique du brouillon ».

## Voice and Tone

Ton factuel, bref et orienté vers l'action, sans jugement automatique sur la performance de l'équipe. Tous les libellés d'interface et messages dans les ressources FR/EN SMN existantes (à vérifier, sans clés inventées en production).

| Dire | Ne pas dire |
|---|---|
| « Enregistré » seulement après confirmation du serveur | « Enregistré » dès qu'une modification quitte le champ |
| « Données du Sprint modifiées depuis la dernière actualisation » | « Vos données ont été corrigées » sans preuve de changement |
| « Actualiser les valeurs du rapport » | « Mettre à jour automatiquement les commentaires » |
| « Analyse IA sélectionnée — interprétation » | « Résultat du Sprint » pour une analyse générée |
| « Capacité réelle disponible : 32 J/H » | « 32 J/H de travail réalisé » |
| « SP initialement engagés : 24 » | « Engagements : 27 » si les 27 incluent les ajouts |
| « Non renseigné » / « Non calculable » | « 0 » faute de données |
| « Exporter en PDF » / « Figer et archiver » | « Publier » comme étape obligatoire |
| « Avertissements non bloquants » | « Rapport non valide » si le PDF reste utilisable |

## Component Patterns

| Composant | Comportement contractuel | Style associé |
|---|---|---|
| `centre-report-header` | Présente le périmètre et une création uniquement si droits ; navigation onglets stable | `{components.centre-report-header.background}` |
| `report-row` | Ouvre le brouillon ou la version figée correspondante ; actions autorisées, état/nom/version exacts ; multiple par Sprint | `{components.report-row.radius}` |
| `model-card` | Prévisualiser, utiliser, dupliquer ; édition réservée aux modèles personnalisés et aux droits d'admin ; versions immuables dans les rapports épinglés | `{components.model-card.radius}` |
| `studio-plan` | Réordonner, masquer si facultatif, insérer, naviguer vers les blocs ; structure reflétée immédiatement au centre ; raccourcis clavier équivalents au glisser | `{components.studio-plan.width}` |
| `studio-canvas` | Document paginé A4, mode Rédaction directe ; changement de zoom sans mutation ; Aperçu sans poignées de composition | `{components.studio-canvas.pageBackground}` |
| `studio-properties` | Propriétés du bloc sélectionné (type, graphique/tableau, options de sources, largeur autorisée, page break) ; aucun effet sur d'autres rapports | `{components.studio-properties.width}` |
| `report-block` | Liaison typée à une source SMN ou contenu humain ; lecture des réserves ; changement de présentation sans édition du chiffre métier | `{components.report-block.selectedOutline}` |
| `status-label` | Brouillon, sauvegarde, fraîcheur, archive ; états jamais véhiculés par couleur seule | `{components.status-label.radius}` |
| `primary-button` | Selon contexte : créer, exporter ; l'export propre lance directement le PDF sans confirmation supplémentaire | `{components.primary-button.background}` |
| `quality-panel` | Affiche sévérité, chemin vers bloc concerné, corriger ou poursuivre selon niveau ; ne signale pas les rubriques masquées volontairement | `{components.quality-panel.border}` |
| `focus-indicator` | Toutes actions clavier avec indication de focus | `{components.focus-indicator.width}` |

### Création et modèles

1. L'utilisateur choisit un **modèle système protégé** ou **personnalisé** (bibliothèque commune administrée).
2. Une génération unique préremplit rubriques, indicateurs disponibles, titres, couverture, sommaire et emplacements de commentaires. Les valeurs absentes restent marquées indisponibles, sans faux chiffres.
3. Le brouillon **épingle la version du modèle** utilisée. Lorsqu'une nouvelle version existe, l'utilisateur reçoit une option **non obligatoire** de comparaison et d'adoption ; protéger ses modifications manuelles, jamais d'application silencieuse.
4. L'orientation A4 héritée du modèle s'applique **au document entier** ; pas de feuilles mixtes. Couverture, sommaire, titre et visuels peuvent être surchargés pour le rapport sans changer le modèle.
5. Les commentaires ont des emplacements prévus par le modèle **et** des blocs texte ajoutables librement.
6. Les modèles personnalisés : gestion par administrateur selon permissions et versionnement ; les modèles système sont duplicables mais non éditables directement.

### Données, graphiques et tableaux

- Chaque bloc métier pointe sur une source explicitée et son contexte temporel/qualité. KPI affiché en graphique, tableau ou les deux, lorsque la représentation est pertinente.
- Les **SP initialement engagés** restent distincts des SP ajoutés, retirés et terminés ; idem pour les tickets. La capacité prévue/réelle est une disponibilité **en J/H**, pas de l'effort réalisé.
- Les historiques figés, corrections après clôture et limites de preuve restent explicites ; ne pas projeter les valeurs actuelles sur un ancien Sprint.
- Lorsque des données sources changent, le **rapport courant ne change pas** avant choix volontaire. Comparaison des valeurs anciennes/nouvelles lorsque calculable ; actualisation ciblée des valeurs liées et des graphiques, sans altérer textes humains et analyses IA.
- Un commentaire potentiellement obsolète après mise à jour peut être **signalé**, mais jamais réécrit automatiquement. Si aucun mécanisme fiable ne permet de le détecter, ne pas afficher une prétendue analyse sémantique exhaustive.
- Un changement de source du rapport A **n'actualise pas** le rapport B du même Sprint ; aucune synchronisation implicite de rédaction.

### IA : frontière volontaire

L'agent IA produit des **briefs sur une surface distincte**. Le studio n'a pas de bouton « générer l'analyse IA » contextuel, ni de suggestion automatique. Le Scrum Master inclut **expressément** une analyse disponible ; attribution explicite, date et réserves de provenance. Si la liste de briefs n'est pas disponible ou les permissions ne le permettent pas, indiquer « Aucune analyse disponible » sans créer de contenu factice.

### Sauvegarde et édition simultanée

- Autosave des changements du brouillon, état `Modifications en cours → Enregistrement… → Enregistré` uniquement après accusé serveur ; état `Échec` avec réessayer/assistance.
- Reprendre le **dernier état sauvegardé** ; Annuler/Rétablir uniquement en session, pas de versions intermédiaires durables ni de points de restauration.
- Concurrence : **la dernière écriture acceptée par le serveur gagne** entre sessions/onglets, sans verrou, comparaison ni fusion forcée. Risque d'écrasement **explicitement accepté**. Au sein d'une même session, sérialiser/invalider les écritures plus anciennes pour conserver l'ordre logique.
- Protection lors de navigation : avertir seulement pour changements réellement non confirmés. Un export ne doit **jamais prétendre** contenir des modifications qui n'ont pas été sauvegardées : proposer une nouvelle tentative, ou exporter la dernière version confirmée en le disant explicitement et avec un choix conscient.
- Ne pas supposer qu'une sauvegarde hors ligne puis une synchronisation automatique existent ; comportement hors réseau à valider par l'équipe technique.

### Mise en page documentaire

- L'aperçu paginé rend le format choisi et des en-têtes/pieds réels. La pagination tient compte des couvertures, sommaires, sauts de page et option « conserver ensemble ».
- Texte long = flux entre pages ; paragraphes et titres non coupés brutalement. Tableau long = suite par lignes et répétition d'en-têtes ; autoriser une ligne exceptionnellement longue à être gérée proprement (fractionnement si possible ou avertissement). Graphique/KPI = bloc insécable si sa taille tient sur une page.
- Les débordements horizontaux font l'objet d'un diagnostic contextuel et d'options proposées : réorganiser explicitement les colonnes, version compacte, annexe. **Jamais cacher, tronquer ou réduire à illisibilité les données automatiquement.**
- Vérifier le rendu des PDF générés et le rendu aperçu : aucune parfaite fidélité technique n'est présumée. La CSS actuelle contient `break-inside: avoid-page` sur les sections, ce qui est à réévaluer pour les longues rubriques.

## State Patterns

| Surface | État | Réaction UX requise |
|---|---|---|
| Centre Rapports | Chargement | Lignes/squelettes, sans noms ou compteurs fictifs |
| Centre Rapports | Aucun rapport | Message factuel et création si habilité |
| Centre Rapports | Aucun résultat filtré | « Aucun rapport correspondant » + effacer filtres |
| Centre Rapports | Erreur | Expliquer l'échec, commande « Réessayer », conserver les filtres |
| Centre Rapports | Interdit | Consultation/édition selon droits, sans escalade via URL |
| Modèles | Liste vide | Modèles système réellement disponibles ou message de manque ; aucune carte factice |
| Modèles | Version nouvelle | Comparaison avant mise à jour volontaire du brouillon |
| Studio | Préparation initiale | Chargement contextualisé, absence de source non masquée |
| Studio | En cours de modification | Statut visible « Modifications en cours » |
| Studio | Sauvegarde en cours | Statut visible « Enregistrement… » |
| Studio | Enregistré | Accusé serveur, puis « Enregistré » |
| Studio | Échec de sauvegarde | Avertissement et « Réessayer » ; pas d'export trompeur |
| Studio | Source métier modifiée | Badge « Données à vérifier », comparaison et actualisation volontaire |
| Studio | Source non disponible | Bloc « Non renseigné / Non calculable », explication si connue |
| Studio | Aucun commentaire IA | Invitation à consulter les briefs existants, jamais génération directe |
| Studio | Bloc débordant | Diagnostic et propositions, sans perte silencieuse |
| Export | Conforme | PDF direct, brouillon conservé |
| Export | Avertissement | Liste facultative, corriger ou poursuivre |
| Export | Bloquant | Expliquer, bloquer le PDF invalide et proposer correction |
| Archives | Version figée | Consultation/export en lecture seule ; aucune modification rétroactive |
| Archives | Absence | Liste vide, aucun archivage automatique |

## Interaction Primitives

- **Souris/tactile :** sélection de bloc, clic sur plan pour naviguer, glisser-réordonner lorsque disponible ; les mêmes fonctions essentielles ont des boutons Monter/Descendre et commandes clavier.
- **Clavier :** `Tab` dans l'ordre visuel, `Entrée` pour activer, `Échap` pour fermer les dialogues, focus restauré au déclencheur ; raccourcis d'annulation uniquement quand le champ de texte n'en détourne pas la fonction.
- **Barres de commandes :** accès constant aux modes, Annuler/Rétablir, état de sauvegarde, Export PDF, Figer et archiver ; la sauvegarde de section individuelle n'existe plus.
- **Actions sensibles :** supprimer rapport/brouillon et figer/archiver requièrent une confirmation ciblée selon la gravité ; export direct n'exige pas une étape de publication.
- **Dialogue :** intitulé explicite, validation contrôlée selon droits ; en mobile volets temporaires plutôt que trois panneaux comprimés.
- **Notifications :** états inline persistants quand décision nécessaire ; toast transitoire uniquement pour succès non critique, jamais seule forme d'une erreur bloquante.
- **Animation :** discrète et désactivable ; mode réduit respecté.

## Accessibility Floor

- Cible de recette WCAG **2.2 AA**, à **vérifier**, non attestée. Focus visible `{colors.focus-ring}` et contrôle sans souris de toutes actions importantes.
- Contrastes de texte/statuts et thèmes clair/sombre vérifiés ; ne pas coder l'état par couleur seule.
- Sur petit écran, zoom 200 % et grandes polices : pas d'actions masquées hors d'atteinte, liste de rapports lisible, tables pouvant être consultées intégralement.
- Images et graphiques importants : alternatives textuelles, valeurs tabulaires et sources disponibles ; PDF : ordre de lecture et balisage accessible à étudier, ne pas promettre conformité sans vérifier le moteur.
- Les boutons icônes ont un nom complet (« Masquer les propriétés », « Réordonner vers le haut »), avec états aria appropriés. Toute erreur pointe l'élément concerné, et un sommaire d'erreurs propose des liens de navigation.
- Annoncer les états de sauvegarde et de qualité de manière non intrusive ; une modification automatique de données ne doit pas provoquer des annonces excessives.
- Contenus FR/EN à vérifier en conditions réelles ; ne pas traduire automatiquement les commentaires humains ni les analyses IA insérées.

## Responsive & Platform

| Form-factor | Droits d'édition UX | Comportement |
|---|---|---|
| Desktop | Tous les droits applicables, studio complet | Plan + feuille A4 + propriétés, panneaux rétractables séparément |
| Tablette | **Toutes fonctions d'édition** selon rôle | Feuille prioritaire ; plan et propriétés en volets escamotables ; actions tactiles et alternatives sans drag |
| Smartphone | Commentaires/texte et petites corrections, consultation, export | Lecture reflow distincte de l'aperçu A4 fidèle ; gros tableaux scrollables sans effacer de colonnes ; pas d'édition complexe de disposition |

Ce sont **les capacités d'interface**, indépendantes des habilitations administrateur/utilisateur. Les points de rupture chiffrés sont une question d'implémentation/réception sur matériel cible.

## Key Flows

### UJ-R01 — Léa, Scrum Master, prépare un bilan exécutif

1. Léa ouvre la fiche du Sprint et choisit « Rapports » ; le Centre s'ouvre filtré.
2. Elle voit le brouillon existant ou crée un rapport distinct en sélectionnant modèle, titre et langue.
3. SMN génère une version complète avec seulement les données métier disponibles et des zones de commentaire.
4. Léa ouvre **Composition**, règle un graphique et masque une section facultative, puis **Rédaction** et écrit la conclusion.
5. Le statut passe à **Enregistré** après confirmation de la sauvegarde ; Léa passe en **Aperçu**.
6. **Moment clé :** elle lance « Exporter PDF », le contrôle ne détecte aucune anomalie : un PDF est exporté directement **sans publication ni archivage**.
7. Elle retrouve le brouillon intact à la réouverture. Si l'enregistrement a échoué, l'export ne prétend pas intégrer ses dernières modifications.

### UJ-R02 — Léa produit deux rapports indépendants pour un même Sprint

1. Léa prépare un bilan exécutif puis un bilan exhaustif, chacun avec modèle/version distinct.
2. Elle rédige des commentaires différents et réordonne les blocs du rapport exhaustif.
3. Une correction métier intervient dans SMN (par exemple SP terminés revus) ; les deux brouillons signalent leur fraîcheur propre, **sans s'actualiser seuls**.
4. Elle ouvre la comparaison uniquement dans l'exhaustif et choisit d'actualiser ses chiffres ; ses commentaires sont préservés.
5. **Moment clé :** l'exécutif conserve volontairement son état précédent et son indication « Données à vérifier » ; aucune donnée ou commentaire n'a sauté d'un rapport à l'autre.
6. Si une source ne permet pas de comparer les valeurs, SMN le signale sans inventer de différence.

### UJ-R03 — Léa présente un rapport long, avec un tableau dépassant la page

1. Léa ouvre un modèle exhaustif ; choisit format A4 paysage **pour l'ensemble** du document via les options prévues.
2. Dans la section Risques, son tableau déborde verticalement : SMN le distribue entre plusieurs pages, en répétant les en-têtes.
3. Un autre tableau déborde horizontalement : SMN affiche un avertissement contextuel, sans supprimer de colonnes.
4. Elle choisit une variante compacte ou déplace des détails dans une annexe ; le rendu reste lisible.
5. **Moment clé :** l'aperçu et le PDF conservent **toutes les données** sans graphique coupé ni en-tête manquant.
6. Si un rendu valide reste impossible, le contrôle bloque seulement l'export techniquement défectueux, avec cause explicite.

### UJ-R04 — Malik, lecteur `user`, consulte une archive sur téléphone

1. Malik ouvre « Rapports » puis « Archives » depuis son téléphone.
2. Il recherche un Sprint, ouvre une version figée et consulte une lecture adaptée au mobile.
3. Il peut ouvrir l'aperçu fidèle A4 et exporter le PDF si ses permissions le permettent.
4. **Moment clé :** il ne peut ni modifier une archive immuable ni administrer les modèles, même via une URL directe.
5. Si l'archive n'existe pas ou si l'accès est refusé, le message indique clairement l'état sans liens morts.

### UJ-R05 — Léa sélectionne une analyse IA explicitement

1. Léa prépare un brief IA sur la surface distincte prévue à cet effet.
2. Dans le studio, elle ouvre le sélecteur de briefs **existants**, sans démarrer de génération.
3. Elle choisit le brief pertinent, vérifie l'attribution et l'ajoute dans une rubrique de rédaction.
4. **Moment clé :** le rapport présente l'analyse comme interprétation datée et sourcée, jamais comme métrique calculée par SMN.
5. Si le brief est absent/indisponible, elle peut rédiger son propre commentaire sans action IA implicite.

### UJ-R06 — Léa sauvegarde dans deux onglets (choix de simplicité assumé)

1. Léa édite le rapport dans deux onglets ; chacun ouvre un instantané du dernier état connu.
2. L'onglet A enregistre une modification ; l'onglet B enregistre ensuite une autre version plus ancienne.
3. **Moment clé :** la dernière écriture acceptée devient la version du brouillon, **sans verrou ni dialogue de fusion**.
4. Léa est informée dans les règles d'aide de ce risque de perte ; seul Annuler/Rétablir dans la session peut parfois corriger avant écrasement.
5. Les écritures de chaque onglet ne sont pas transmises en désordre : le serveur ne confirme jamais prématurément une modification.

### UJ-R07 — Léa fige volontairement une version

1. Après un export direct, Léa poursuit ou corrige son brouillon.
2. Elle choisit séparément « Figer et archiver » ; SMN récapitule le rapport et la version qui sera capturée.
3. **Moment clé :** une archive immuable est créée ; un correctif futur produit une **nouvelle** version figée, jamais une réécriture de l'archive antérieure.
4. Si l'archivage échoue, le brouillon et les archives précédentes demeurent intacts, avec erreur visible.

## Matrice de conformité des 21 décisions

| Décision | Traçabilité dans ce contrat |
|---|---|
| UX-R01 / R02 / R03 | Fondation, Création, Studio, UJ-R01 |
| UX-R04 / R10 | Modèles, mise à jour volontaire, bibliothèque |
| UX-R05 / R06 / R07 | Blocs, commentaires, frontière IA, UJ-R05 |
| UX-R08 / R13 / R14 / R21 | Document A4, pagination, sommaire, UJ-R03 |
| UX-R09 / R17 | Export et contrôle qualité, UJ-R01 / R07 |
| UX-R11 / R19 | Studio, Responsive & Platform |
| UX-R12 / R20 | Sauvegarde, états, UJ-R06 |
| UX-R15 / R16 | Indépendance et fraîcheur, UJ-R02 |
| UX-R18 | Centre et raccourci Sprint, UJ-R01 / R04 |

## Gates de conception, tests et dépendances

1. **G0 — Inventaire :** comparer toutes les sources de données et permissions avec l'existant ; rechercher notamment les rapports/archives et le pipeline PDF. Aucune route ni table n'est présumée créée.
2. **G1 — Modèle de données :** plusieurs rapports par Sprint, version de modèle épinglée, blocs, références de données, brouillons et archives ; décisions d'architecture et migrations séparées.
3. **G2 — Sauvegarde :** confirmer exclusivement sur ack serveur ; ordonnancement intrasesion et politiques de réessai/erreur ; pas d'historisation par accident.
4. **G3 — Impression :** vérifier la CSS `@page`, les longues sections, le sommaire, la répétition d'en-têtes, l'orientation unique et l'export sans gel ; tester portrait et paysage sur un vrai moteur PDF.
5. **G4 — Sécurité :** tester authentification et droits côté serveur, sanitation HTML/markdown/images, ressources documentaires et téléchargement.
6. **G5 — Accessibilité/i18n :** vérifier à la main clavier, lecture, FR/EN, thèmes SMN et mobile ; la conformité n'est pas réputée acquise par la seule rédaction du contrat.

La matrice de recette testable figure dans [RECETTE-UX.md](RECETTE-UX.md), document de préparation **sans exécution de tests**. Les exemples visuels utilisent des données fictives et ne constituent pas des preuves métier.