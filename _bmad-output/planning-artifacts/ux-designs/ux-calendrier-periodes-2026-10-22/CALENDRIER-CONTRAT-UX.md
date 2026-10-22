# Contrat UX — Calendrier de sprint / période en cartes de sept jours

**SMN | Sally, designer UX BMAD | 22 octobre 2026**  
**Statut : décisions fonctionnelles et UX validées en conversation, y compris rectification « férié en semaine = + autorisé » ; développement et recette NON exécutés.**  
**Périmètre cible :** page Calendrier de l'équipe ; Scrum = sprint, Kanban = période ; présentation des réunions et création dans une fenêtre modale. Les droits, modèles, API et règles d'intégrité existants restent applicables.

## 1. Décisions fermes et priorités

| ID | Décision validée | Critère clé |
|---|---|---|
| CAL-01 | Sans sprint/période défini, afficher **le mois civil courant du 1er au dernier jour**, sans couper le mois à 28 jours | Tous les jours du mois sont visibles, du 1 à 28/29/30/31 |
| CAL-02 | Avec au moins un sprint/période, **privilégier nettement celui en cours** ; sinon prendre le plus récent | Déterminer le contexte de l'équipe avant de construire la plage |
| CAL-03 | **7 cartes par ligne, une par date, à partir de la première date de la période** ; l'entête des colonnes est une séquence de sept **noms de jours**, commençant par le nom du premier jour de la période | Sprint commençant mercredi = Mercredi, Jeudi, Vendredi, Samedi, Dimanche, Lundi, Mardi ; pas de cases lundi/mardi artificielles avant son début |
| CAL-04 | Une carte = une date au sein de la période ; en tête de la carte **numéro du jour + abréviation du mois sur trois caractères** dans la langue active (ex. « 21 OCT » en français) | Respect des changements de mois et d'année |
| CAL-05 | **Samedi/dimanche : carte grisée SANS bouton +. Jour férié en semaine : carte grisée AVEC bouton + Réunion** si l'utilisateur et la période l'autorisent. | Le gris signale une disponibilité particulière ; il ne suffit pas à interdire l'ajout d'une réunion pour une équipe internationale. |
| CAL-06 | La carte de **la date d'aujourd'hui** est mise en évidence par une **bordure plus épaisse et/ou colorée** ; l'effet s'ajoute au fond grisé éventuel | Aujourd'hui, s'il est férié en semaine, reçoit à la fois le fond gris ET la bordure, et conserve le + s'il est autorisé ; si samedi/dimanche, pas de +. |
| CAL-07 | Liste des **réunions du jour en ordre croissant d'heure de début**, à l'intérieur de sa carte | Tri stable en cas d'horaires identiques ; seuls vrais événements enregistrés sont affichés |
| CAL-08 | **Survol du NOM d'une réunion** : afficher un petit tooltip avec **heure de début ET heure de fin** | Heures locales issues de la zone IANA effective, sans décalage déduit du navigateur |
| CAL-09 | **Clic sur le NOM d'une réunion** : naviguer sur **la page dédiée à cette réunion** (et non ouvrir sa modification en place) | Lien réel vers la réunion par ID ; ne pas inventer de route existante |
| CAL-10 | En bas de toute carte **ouvrée** : une ligne/bandeau « + » ouvrant une **fenêtre modale centrée** pour créer une nouvelle réunion **ce jour-là** | Date préremplie ; voile gris ; aucun formulaire sous le calendrier |
| CAL-11 | Les réunions déjà enregistrées **restent visibles et consultables même sur un jour grisé** ; seule la nouvelle création via « + » est indisponible | Ne pas effacer/dissimuler des données historiques |
| CAL-12 | Le calendrier doit rester consultable pour tous les utilisateurs autorisés ; l'action « + » dépend des **droits d'écriture** et de l'état métier de la période | Pas de bouton trompeur si lecture seule, période clôturée ou action interdite |

Ces décisions remplacent, pour **cette nouvelle vue principale**, la sélection imposée des seuls intervalles fixes 7/14/28 jours et le tableau central d'événements comme représentation première ; les tableaux de disponibilité/absences et les fonctions existantes devront être repositionnés sans perte de service ni fuite de données.

## 2. Sélection de la période affichée

Règles d'implémentation recommandées afin de lever toute ambiguïté, à appliquer **uniquement aux cycles de l'équipe active** :

1. Charger les sprints/périodes disponibles ; « en cours » est fondé sur la date locale de référence de l'équipe et sur les bornes de dates effectives (inclusives), sans se fier au libellé de statut uniquement s'il peut être obsolète.
2. Si une période contient la date de référence, la sélectionner **avant toute autre**, même si une période plus récente est prévue dans le futur. S'il existe exceptionnellement plusieurs périodes contenant cette date, choisir celle dont le début est le plus récent ; signaler une incohérence de chevauchement si nécessaire.
3. S'il n'existe aucune période en cours, sélectionner **la dernière période passée** (date de début la plus récente antérieure/égale à aujourd'hui) ; cela évite qu'une période future éloignée remplace la dernière période réellement travaillée.
4. Si **seules des périodes futures** existent, sélectionner **la plus proche à venir** et indiquer « À venir ». Ce cas est une précision UX proposée, pas une exigence explicite de l'utilisateur ; le confirmer si la sémantique « plus récent » du produit diffère.
5. S'il **n'existe aucune période**, afficher le mois civil actuel entier, toutes dates incluses, le premier jour du mois servant de première colonne.
6. Afficher dans l'en-tête **le type, le nom, les dates de début/fin et l'état** de la période retenue ; en fallback afficher « Octobre 2026 — aucune période définie » (libellé localisé). Prévoir un sélecteur des périodes disponibles et des boutons précédent/suivant si les données le permettent, sans changer la sélection par défaut.
7. Lors du passage à un autre mois/période, actualiser les 7 intitulés de colonnes pour correspondre au **premier jour affiché**, et non nécessairement au lundi.

**Invariance** : la plage de dates est [date début, date fin] INCLUSIVE et ne doit omettre aucun jour, y compris week-end/férié. Si la dernière rangée comporte moins de sept dates, les cases de fin sont **des emplacements vides non interactifs** ; ne pas afficher la période suivante.

## 3. Structure visuelle desktop

~~~text
Calendrier
Sprint 12  |  21 oct. → 31 oct. 2026  |  En cours       [‹] [Choix sprint/période] [›]
Légende : Aujourd'hui = contour renforcé • Jours non ouvrés/fériés = fond grisé

| Mercredi    | Jeudi       | Vendredi    | Samedi      | Dimanche    | Lundi      | Mardi      |
| 21 OCT      | 22 OCT      | 23 OCT      | 24 OCT      | 25 OCT      | 26 OCT     | 27 OCT     |
| Daily Scrum | Daily Scrum | Review      | (grisé)     | (grisé)     | Daily      | Daily      |
| Planning    |             |             |             |             |            |            |
| +           | +           | +           |             |             | +          | +          |
| 28 OCT      | 29 OCT      | 30 OCT      | 31 OCT      | [vide]      | [vide]     | [vide]     |
| Daily       |             | Retro       | (grisé)     |             |            |            |
| +           | +           | +           |             |             |            |            |
~~~

**Nota** : jours/réunions ci-dessus **fictifs**. Une journée fériée **en semaine** garde le fond grisé des jours non ouvrés **mais conserve « + Réunion »** (si création autorisée), car elle peut n'être fériée que pour certains membres. Le week-end reste grisé **sans +**. Si la date est aujourd'hui, sa bordure spécifique reste visible.

- Utiliser la **largeur utile derrière la sidebar** : sept colonnes desktop lisibles avec cartes de hauteur cohérente. Pas de conteneur global max-width: 870px empêchant l'affichage.
- Éviter les débordements des libellés réunion, tout en les gardant suffisamment lisibles. Cas très chargé : limiter visuellement la liste à N éléments puis « + X autres réunions » ouvrant une consultation des autres, **jamais confondre avec + de création**.
- En-têtes de colonnes : vrais libellés de jours localisés. L'abréviation du mois en trois caractères dépend de la langue affichée, notamment gestion du séparateur et des accents.
- État vide : carte avec date et « Aucune réunion » facultatif ; si ouvrée et autorisée, le « + » reste en bas, dans une bande distincte.
- État férié : conserver le **fond grisé**, afficher si disponible le **nom du jour férié** et les pays concernés (sans affirmer que l'ensemble de l'équipe est indisponible), sans masquer les réunions existantes. Sur un **jour de semaine férié**, conserver **+ Réunion** si les droits et la période autorisent l'ajout.
- La bordure « Aujourd'hui » doit être repérable **sans s'appuyer exclusivement sur la couleur** (épaisseur 2-3px ou indicateur textuel/sémantique). Ne pas confondre son état avec « sélectionné ».

## 4. Une réunion : consultation, survol, navigation

- Un nom de réunion est un **lien sémantique** vers sa page dédiée, activable souris/clavier/tactile. Cliquer son nom ne déclenche ni création ni édition directement dans la grille.
- Un **tooltip** apparaît au survol souris et au focus clavier du nom : **début hh:mm et fin hh:mm**, étiquette « Heure locale » + fuseau si nécessaire pour éviter les ambiguïtés. Sur appareils tactiles, rendre les horaires accessibles dans la page de détail et via une solution accessible (bouton info ou activation explicite qui ne compromet pas le lien).
- Les réunions sont triées par leur **début local dans la période**, puis par identifiant stable en cas d'égalité. Les durées traversant minuit doivent conserver leur date de fin réelle.
- Ne pas afficher un lien factice : la route de détail doit exister et vérifier l'accès. Si pas encore disponible, prévoir la création d'une page réunion dans le découpage de développement et ne pas annoncer ce critère réalisé.
- Les annulations/statuts doivent rester visibles si les règles métier rendent ces réunions consultables ; ne pas les convertir implicitement en réunions tenues.

## 5. Ajout d'une réunion : une modale uniquement sur jour ouvré

- Chaque carte **du lundi au vendredi** dont la création est autorisée possède au bas une **barre « + Réunion »** (simple « + » possible avec intitulé accessible), **même si cette date est un jour férié pour certains membres**. **Aucun + sur samedi ou dimanche**, même si une réunion existe. Les permissions et contraintes de période continuent à s'appliquer. La teinte grise ne détermine pas seule les droits de création.
- Clic : **modale centrée sur l'écran** avec fond grisé semi-transparent, focus dans le dialogue et date **préremplie à partir de la carte cliquée**.
- Les champs doivent correspondre à l'API métier effective : à minima **nom/type, date, heure de début, heure de fin ou durée** ; champs additionnels seulement si reconnus. **Ne pas inventer un service générique** si les modèles de cérémonies Scrum et de réunions exceptionnelles sont distincts.
- Boutons « Annuler » / « Enregistrer », validation temporelle (fin > début, dates, fuseau, contraintes du sprint), avertissement de chevauchement s'il existe ; ne jamais perdre le brouillon en fermant sans confirmation.
- Après réussite, fermer la modale, actualiser la carte et maintenir la période et le scroll ; en erreur, conserver les saisies, afficher l'erreur et ne pas afficher fausse réussite.
- La distinction **absence du + pour jour non ouvré** ne signifie pas qu'une réunion préexistante sur cette date est supprimée.

## 6. Jours fériés et équipes internationales — décision RECTIFICATIVE validée le 22/10/2026

**La présente section REMPLACE explicitement la règle précédente « jour férié sans + ».**

**Règle UX définitive :**
1. **Samedi/dimanche** : carte grisée **sans +**, même si des réunions antérieures y existent (elles restent consultables).
2. **Lundi–vendredi, jour férié connu** : carte **grisée comme un jour non ouvré**, mais **avec + Réunion** si l'utilisateur a le droit de créer une réunion et si l'état du sprint/de la période le permet. Le jour férié de certains membres **n'interdit pas** une réunion de l'ensemble de l'équipe.
3. **Lundi–vendredi normal** : carte non grisée avec + lorsque création autorisée.
4. **Aujourd'hui** : bordure épaisse/colorée **indépendante** du fond grisé et de la présence du +.
5. **Avertissement non bloquant recommandé** au clic sur + d'un jour férié connu : « Ce jour est férié pour certains membres de l'équipe. Vérifiez leur disponibilité. » Ne jamais laisser entendre que toutes les personnes sont nécessairement indisponibles. Cet avertissement n'annule pas les autres contrôles métier (droits, période fermée, date invalide, chevauchements).
6. Les réunions déjà enregistrées restent visibles quel que soit le type de jour.

**Fait technique vérifié sur main à la rédaction du contrat initial** : dans src/server/members/team-calendar.ts, les jours fériés nationaux sont résolus selon le **pays effectif de chaque membre**, et non un pays nécessairement commun à l'équipe. La règle rectificative **élimine l'obligation de déterminer un pays commun pour autoriser le +** : c'est le jour de la semaine et la permission métier qui gouvernent l'action. La nuance pays/membres demeure nécessaire **pour afficher honnêtement le grisé et un éventuel libellé férié**. Proposition d'implémentation à confirmer techniquement : griser si au moins un calendrier national applicable connu signale le jour comme férié pour un membre concerné, en affichant un indicateur « férié pour certains membres » plutôt que « férié pour toute l'équipe ».

**Calendriers partiels ou indisponibles** : ne pas inventer le caractère férié ni bloquer automatiquement la création du fait d'une couverture inconnue ; distinguer clairement « inconnu » de « non férié » quand c'est utile.

Les **fermetures collectives de l'entreprise** constituent un cas métier différent et restent à arbitrer séparément ; leur gestion ne doit pas être implicitement assimilée à la règle des jours fériés individuels.

## 7. Inventaire technique vérifié sur main avant développement

| Zone | Constat de code vérifié | Impact |
|---|---|---|
| src/app/app/team-calendar/team-calendar-view.tsx | Page actuelle en colonne smn-page container, choix 7/14/28 jours, calendrier collectif sous forme d'une liste d'événements et tableaux de disponibilités/absences | Refonte substantielle de la vue ; éviter de casser l'existant sans plan de migration UX |
| src/server/members/team-calendar.ts | GET accepte uniquement 7/14/28 et exige start ; données d'absence/fériés par membre | Backend à adapter pour plage arbitraire (mois 28–31 jours et durées réelles des sprints) |
| src/app/api/team-calendar/route.ts | Passe readTeamCalendar au projectCentralCalendar | Contrôler la fourniture réelle d'événements à la nouvelle grille |
| src/server/members/central-calendar.ts | Projection accepte des sources de cycles et réunions EN PARAMÈTRES OPTIONNELS avec valeur par défaut vide | **Les réunions et cycles ne sont pas automatiquement chargés par la route actuelle** ; intégration explicite nécessaire |
| src/app/app/admin/sprints/exceptional-meeting-form.tsx | La création de réunion exceptionnelle existe dans l'écran d'administration, liée à un sprint, avec durée | Réutiliser droits et API lorsque pertinent ; la modale calendrier exige un flux dédié adapté |
| src/app/app/admin/sprints/ceremony-editor.tsx | Édition de cérémonies existante liée au sprint | Ne pas assimiler automatiquement cérémonie et réunion exceptionnelle |
| src/lib/private-navigation.ts | Le menu Événements est actuellement sans route (href null) | **La page de réunion détaillée doit être identifiée ou créée**, sous réserve de validation des routes/droits |

**Aucune vérification en navigateur ni test de code exécutés ici.** Les références ci-dessus décrivent l'état lu sur main le 22/10/2026 ; Amelia doit réexaminer l'existant avant de programmer.

## 8. Découpage recommandé pour Amelia (sans écriture Jira dans cet avenant)

- **C1 — Période/calendrier** : résolution par équipe, préférence période en cours, fallback mois complet, 7 colonnes cycliques à partir du premier jour, navigation.
- **C2 — Jours non ouvrés et fériés** : week-ends gris sans + ; fériés de semaine gris AVEC + si autorisé, avec information non bloquante sur les membres potentiellement concernés ; aujourd'hui contour accentué ; vérifier la signalisation fériée multi-pays.
- **C3 — Réunions et page de détail** : source des réunions, tri chronologique, tooltip des deux heures, vrai lien vers page dédiée avec autorisation.
- **C4 — Création modale** : plus sur jours ouvrés autorisés, date préremplie, contrôles métier, persistance, erreurs, rafraîchissement.
- **C5 — Recette et compatibilité** : responsive, clavier, i18n, fuseaux, sprints Kanban, droits, contenus existants de calendrier collectif conservés ou relocalisés selon un choix UX explicitement documenté.

**Pour toute nouvelle User Story ou modification Jira : accord utilisateur requis avant publication.** Le présent document ne vaut pas instruction de modifier les tickets existants ou de démarrer le développement.

## 9. Hiérarchie documentaire

Ce contrat fait autorité pour la **nouvelle présentation de la page Calendrier**. Les règles UX déjà validées sur la fiche membre et l'équipe restent en vigueur dans leur propre périmètre. Ne pas confondre « calendrier central de l'équipe » avec « calendrier individuel du membre » ni « formulaire de saisie d'absence » ; les données existantes restent protégées.
