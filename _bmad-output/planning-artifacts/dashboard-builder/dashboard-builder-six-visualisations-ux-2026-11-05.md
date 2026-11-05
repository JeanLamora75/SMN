# SMN — Dashboard Builder — Six nouvelles visualisations d'indicateur
**Contrat UX BMAD — Sally (UX Designer) — 05/11/2026**

**Statut :** six intentions visuelles validées lors de l'atelier utilisateur du 05/11/2026 ; spécifications de réalisation et de recette. Ce fichier ne démontre ni développement ni recette. Les illustrations de la conversation sont des maquettes générées, non des captures du code ; la planche de six vues n'est pas considérée comme une archive pixel-par-pixel dans GitHub.

**Epic :** [SMN-353 — Dashboard Builder](https://lmn24.atlassian.net/browse/SMN-353). **Agents :** Sally définit le contrat, Amelia implémente, Winston valide les adaptations d'architecture si nécessaires. **Compatibilité :** BMAD v6.12.4, Bootstrap/Cockpit Agile, indicateurs dynamiques v33, modèles de géométrie M01–M06.

## 1. Règles communes non négociables (VIS-00)

1. **Un seul indicateur par emplacement :** un seul intitulé métier et **une seule valeur source** avec son unité éventuelle. Aucun deuxième KPI (ratio, cible, terminés/restants, moyenne d'une autre source, comparaison) n'est affiché par défaut. Les graphiques historiques décrivent exclusivement les observations de **ce même indicateur**.
2. Le titre du bloc M01–M06 et le titre de l'emplacement restent distincts et suivent la configuration existante ; la maquette ne doit pas créer deux titres techniques concurrents. Icône/couleur du bloc ou de l'emplacement : réutiliser les données enregistrées par le sélecteur existant, sans imposer une nouvelle couleur.
3. Composants/shell réutilisés : `dashboard-consultation.tsx`, `dashboard-visualization.tsx`, `dashboard-dimensions.module.css`, `slot-wizard.tsx`, ainsi que l'en-tête et la navigation existants. Les nouveaux types de visualisation sont **distincts** et n'écrasent pas `number`, `card`, `card-watermark`, `gauge`, `line`, `bar`, `list`, `list-watermark`, `text`. **Aucune géométrie M07–M12.**
4. L'assistant de sélection propose une miniature propre, un libellé métier français/anglais et uniquement les vues compatibles avec la source. Réutiliser les mécanismes de brouillon/annulation/enregistrement optimiste et la persistance actuelle. Pas de migration destructive de layouts historiques ; codes de vues stables/versionnés.
5. Les données numériques sont fournies par le moteur v33 et formatées selon le format utilisateur, **au plus deux chiffres après la virgule**. Pas de recalcul du métier côté React. La valeur zéro est un résultat affichable, pas une absence. Distinguer chargement, indisponible, nul, erreur, valeur invalide et absence d'historique.
6. Accessibilité : la valeur et son unité sont disponibles en texte ; graphique décoratif `aria-hidden` si la valeur est déjà annoncée, sinon description concise non redondante ; clavier, lecteurs d'écran, contraste, couleurs non seules porteuses d'information ; thèmes clair/sombre Bootstrap ; responsive M01–M06, hauteurs S/M/L et textes longs sans débordement.
7. Les nouveaux rendus n'exigent **pas** une deuxième métrique numérique. Lorsque la représentation demande un pourcentage ou un domaine min/max, ces informations doivent venir d'une **configuration de présentation explicite et validée** : voir VIS-01, VIS-03, VIS-04 et VIS-06. Ne pas inférer une cible du nombre, d'un sprint précédent ni d'un objectif fictif. Ne pas afficher le pourcentage dérivé comme un second KPI.
8. **Interprétation des couleurs :** la palette du thème (ou la couleur d'icône configurée) conduit la présentation. Pour la tendance seulement, la direction et le sens restent identifiables par la forme de la flèche, indépendamment de la couleur. Pas d'association métier « rouge = mauvais » systématique : une diminution peut être favorable selon le KPI.
9. **Source de la maquette :** les six prototypes approuvés pendant l'atelier servent d'intention graphique (demi-cadran, barres horizontales, piles en batterie, flèche, anneau segmenté). Leur typographie illustrative, exemples chiffrés et contenus auxiliaires **ne constituent pas des données réelles ni des éléments à reproduire**.

## 2. Catalogue et contrats spécifiques

### VIS-01 — Tachymètre (demi-cercle avec aiguille)
- **Visuel :** arc épais limité à 180°, partie couverte par la valeur, aiguille fine pivotant autour du centre inférieur ; une **valeur unique** bien lisible au centre sous l'aiguille ou au milieu du demi-cadran, avec unité. Un seul intitulé au sommet.
- **Source :** un indicateur numérique sélectionné ; `min` / `max` de **présentation** configurés pour définir l'échelle (ou 0–100 pour un indicateur explicitement de type pourcentage). Ne pas supposer que tous les KPIs sont des pourcentages.
- **Comportement :** normalisation `(valeur-min)/(max-min)` et projection angulaire 180° ; borne égale/inversée/non finie => état « Échelle invalide » sans aiguille trompeuse ; hors bornes => état explicite ou limitation visuelle signalée, jamais troncation silencieuse.
- **Interdits :** ratio secondaire affiché, seconde valeur, valeur simulée.

### VIS-02 — Histogramme horizontal
- **Visuel :** plusieurs barres horizontales lisibles, libellées par cycle/sprint sur l'axe vertical ; axe numérique horizontal gradué ; même style SVG léger que l'histogramme vertical existant. Une seule série, correspondant à **un seul indicateur** observé sur plusieurs cycles. Valeur courante unique éventuellement présentée par le composant selon le contrat des graphiques déjà en place ; **pas d'indicateurs de plusieurs équipes différents**.
- **Source :** reprendre la série historique authentique utilisée par `line` / `bar`. Nombre de cycles et sélection de période cohérents avec le catalogue v33.
- **Comportement :** valeurs nulles = barre absente / lacune représentée, pas zéro inventé ; zéro et négatifs pris en charge sur axe à origine 0 ; libellés tronqués avec accès au texte complet ; pas de défilement horizontal intempestif.

### VIS-03 — Pile de remplissage horizontale
- **Visuel :** forme de batterie couchée, contours sobres, segments remplis dans le sens gauche → droite ; à proximité ou au centre, **une valeur et son unité**, sans tableau « terminés / restants / total », sans ratio textuel supplémentaire.
- **Source :** même indicateur, valeur et unité ; remplissage paramétré via min/max ou domaine explicite, voire 0–100 si % natif.
- **Comportement :** proportion des segments selon la valeur ; pas de correspondance fictive `28 SP = 40 %` sans domaine ; préserver le 0 (batterie vide) et la valeur à maximum (pleine). Si échelle invalide, afficher la valeur lisible et un état d'échelle non calculable.

### VIS-04 — Pile de remplissage verticale
- **Visuel :** même identité que VIS-03 mais batterie debout, remplissage **du bas vers le haut**, segments superposés ; valeur/unité de **l'unique indicateur** au centre de la batterie ou dans une zone attenante compacte. Conserver un titre unique.
- **Source et comportement :** mêmes règles de domaine et d'états que VIS-03 ; orientation verticale seule différence fonctionnelle. Aucun deuxième KPI.

### VIS-05 — Indicateur de tendance à flèche
- **Visuel :** un titre, une valeur/unité et **une seule grande flèche**, sans badge secondaire, delta chiffré ni comparaison fictive.
- **Règle de direction validée :** valeur numérique **strictement positive** → flèche montante (↗ ou ↑) ; valeur **égale à zéro** → flèche horizontale (→) ; valeur **strictement négative** → flèche descendante (↘ ou ↓). C'est le **signe de la valeur source**, et non une variation supposée par rapport au sprint précédent. Aucune source historique supplémentaire obligatoire.
- **Comportement :** vert/neutre/rouge proposés à titre esthétique, mais forme et texte accessible du sens indispensables. Un pourcentage de tendance n'est pas ajouté. Aucun jugement automatique de performance.
- **Valeur nulle / erreur / absente :** état explicite et flèche absente, sans direction déduite.

### VIS-06 — Cercle gradué épais
- **Visuel :** anneau fermé, relativement épais, graduations discrètes régulières, portion colorée proportionnelle à la valeur de remplissage ; **valeur du seul indicateur et unité centrées dans l'anneau** ; titre unique au-dessus. La valeur affichée n'est pas remplacée par un ratio.
- **Source :** min/max de présentation configurés, ou 0–100 si indicateur intrinsèquement en pourcentage.
- **Comportement :** progression horaire ou antihoraire documentée et stable, sans saut de graduation ; 0 = anneau vide, maximum = plein ; échelle invalide et valeurs hors domaine gérées explicitement, pas de pourcentage secondaire présenté par défaut.
- **Accessibilité :** valeur textuelle au centre ; anneau expliqué si nécessaire par un libellé non redondant.

## 3. Cadrage de l'échelle et des données (VIS-DATA)

**Décision d'implémentation conservatrice :** les représentations normalisées exigent un domaine de présentation min/max explicite, stocké et validé dans les options de l'emplacement. Il s'agit de paramètres visuels, **pas de nouveaux indicateurs ni de valeurs métier**. Les options ne sont proposées que pour VIS-01, VIS-03, VIS-04 et VIS-06 ; un domaine `min < max` et des nombres finis sont obligatoires. Un indicateur de pourcentage intrinsèque peut proposer un préréglage 0–100 visible et modifiable, mais les bornes ne doivent pas être imposées silencieusement aux autres unités. Toute règle de dépassement doit être rendue compréhensible.

La maquette d'histogramme horizontal utilise une série de cycles historiques de **la même définition d'indicateur**, pas plusieurs indicateurs. La tendance est le **signe de la valeur courante** ; toute fonctionnalité future de `DELTA` serait un autre modèle et demanderait une décision métier distincte.

## 4. Recette transverse Amelia (RX-6VIS)

1. Six codes de visualisation distincts, stables, sélectionnables uniquement pour source `indicator`, miniatures et FR/EN ; aucune régression des neuf vues déjà existantes.
2. Enregistrement, rechargement, duplication, copie d'équipe, réinitialisation et conversion de contexte préservent les nouvelles vues sans toucher aux anciennes configurations.
3. Cas KPI : 0, positif, négatif, décimales, unité longue, valeur grande, nul/absent/erreur, échelle valide/invalide/hors bornes ; arrondi conforme au moteur.
4. Cas historique : séries courtes/longues, nulls et zéro, cycles distincts, absence d'historique, respect des snapshots et du cycle sélectionné.
5. M01–M06 en consultation, en-tête et corps, tailles S/M/L, mobile et desktop, clair/sombre ; titres longs, contraste et focus.
6. Captures de rendu **comparées aux six maquettes de l'atelier** par Sally/utilisateur ; tests unitaires/intégration ciblés, typecheck, lint, CI Windows/Linux et recette locale explicitement tracés. **Aucun succès non exécuté ne doit être annoncé.**

## 5. Impacts techniques / responsabilités
- Sources & compatibilité : `src/server/dashboard-builder/sources.ts`.
- Modèles : `src/server/dashboard-builder/visualizations.ts`.
- Adaptateur d'historique : `src/server/dashboard-builder/batch.ts` ; garder la lecture v33 existante.
- UI de consultation : `src/app/app/dashboard-builder/dashboard-visualization.tsx` et `dashboard-consultation.tsx`.
- Styles : `src/app/app/dashboard-builder/dashboard-dimensions.module.css`.
- Assistant : `src/app/app/dashboard-builder/slot-wizard.tsx` ; validation et persistance d'options : `src/lib/dashboard-builder/slot-options.ts`, `src/server/dashboard-builder/layout.ts`.
- Tests : tests unitaires métiers et UX ciblés, puis tests d'intégration/historique.

**Dépendances Jira :** [SMN-359](https://lmn24.atlassian.net/browse/SMN-359) (registre de visualisations), [SMN-360](https://lmn24.atlassian.net/browse/SMN-360) (données et historique), [SMN-365](https://lmn24.atlassian.net/browse/SMN-365) (assistant), [SMN-368](https://lmn24.atlassian.net/browse/SMN-368) (responsive), [SMN-375](https://lmn24.atlassian.net/browse/SMN-375) (recette). Ces dépendances sont des interfaces partagées, pas une raison de fusionner les six Stories.

**Référentiel UX supérieur :** [Référence de restitution Cockpit Agile](../ux-designs/ux-dashboard-builder-2026-11-04/REFERENCE-RESTITUTION-VALIDEE.md), [Dossier UX Builder](./dashboard-builder-dossier-ux-bmad-v1.md), [Référentiel transversal](../../../docs/UX-REFERENTIEL-BMAD.md).

**Traçabilité de la planche :** validation dans la conversation du 05/11/2026. Le PNG de synthèse n'est pas déclaré publié dans GitHub ; les exemples chiffrés illustrent les proportions sans engagement métier.

## 6. Traçabilité des six User Stories Jira (créées le 05/11/2026)

Les six Stories suivantes sont **vérifiées comme enfants de l'Epic SMN-353** :

| Contrat UX | User Story | Objet |
|---|---|---|
| VIS-01 | [SMN-390](https://lmn24.atlassian.net/browse/SMN-390) | Tachymètre semi-circulaire à aiguille |
| VIS-02 | [SMN-391](https://lmn24.atlassian.net/browse/SMN-391) | Histogramme horizontal d'un même indicateur |
| VIS-03 | [SMN-392](https://lmn24.atlassian.net/browse/SMN-392) | Pile de remplissage horizontale |
| VIS-04 | [SMN-393](https://lmn24.atlassian.net/browse/SMN-393) | Pile de remplissage verticale |
| VIS-05 | [SMN-394](https://lmn24.atlassian.net/browse/SMN-394) | Flèche positive, nulle ou négative |
| VIS-06 | [SMN-395](https://lmn24.atlassian.net/browse/SMN-395) | Cercle gradué épais |

**Transmission à Amelia :** réaliser chaque Story séparément en s'appuyant sur ce contrat, avec preuves de tests et de recette. Aucun code de ces six nouveaux modèles n'a été modifié par cette publication documentaire. Les six Stories demeurent « À faire » à leur création.
