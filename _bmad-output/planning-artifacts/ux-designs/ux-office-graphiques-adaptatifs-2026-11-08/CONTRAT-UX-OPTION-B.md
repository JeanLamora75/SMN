# SMN — Graphiques adaptatifs Office : contrat UX Option B

**Statut : cadrage UX validé sur le principe (Option B, 08/11/2026) ; spécification destinée à Amelia/Winston — pas de développement dans cette livraison.**
**Auteur métier UX : Sally (BMAD v6.12.4).**
**Périmètre :** génération de graphiques via tags `{{CHART:TREND...}}` dans les modèles PowerPoint (PPTX) ; exigences réutilisables ensuite pour DOCX, sous réserve d'un cadrage d'implantation propre à Word.
**Sources :** `docs/UX-REFERENTIEL-BMAD.md`, `_bmad-output/implementation-artifacts/SMN-402-GRAPHIQUES-OFFICE.md`, `scripts/smn-402-trend-png.mjs`, `scripts/smn-402-office-chart-tags.mjs`, `scripts/smn-397-free-chart-poc.mjs`, `src/server/reports/office-indicator-charts.ts`.

## 1. Constat vérifié (08/11/2026)

Le renderer `renderOfficeTrendPng` construit des PNG **960 × 560 px fixes** à l'aide d'une police matricielle ASCII simplifiée (glyphes 5 × 7, caractères accentués décomposés puis forcés en capitales). Les positions de tracé, titres, légendes, axes et marges sont codées en coordonnées fixes.
L'insertion `pptDrawing` reprend le `a:xfrm` de la zone de texte remplacée, mais insère un `a:stretch` qui peut déformer un graphique dont le ratio d'origine diffère de la zone. Aucun profil de dimensions adapté à chaque forme n'est transmis au renderer. Dans PowerPoint, l'image peut donc sembler petite, peu lisible ou étirée. La capture du 08/11/2026 montre un graphique miniature sous un titre « Membres actifs », les trois autres cadres étant intentionnellement vides pour des essais : **ils ne font pas partie du besoin.**

## 2. Intention UX et principes validés

**Objectif :** le contenu remplit confortablement la zone PowerPoint voulue, reste net en affichage normal, projection et export PDF, sans modifier les éléments fixes de la maquette.

1. **Adapter la composition, pas seulement l'image.** Axes, typographie, espaces, orientation, densité, légendes et géométrie tiennent compte de la largeur/hauteur réelles de la zone.
2. **Respecter le modèle.** Ne changer que la forme porteuse du tag graphique. Préserver position, dimensions, rotation si prise en charge, z-order, images adjacentes, couleurs et arrière-plan. Ne pas étendre une image dans les autres encadrés.
3. **Intégrité métier.** Utiliser les données historiques v33 existantes, conserver les valeurs manquantes comme absentes, les zéros comme vrais zéros, et les correspondances de couleur série/indicateur.
4. **Aucune option obligatoire supplémentaire.** Les tags existants gardent leur syntaxe et continuent de fonctionner. L'adaptation est automatique.
5. **Compatibilité Microsoft Office.** PNG est conservé au premier incrément, avec pixels adaptés à la taille physique et insertion sans distorsion. La solution d'un rendu vectoriel n'est pas exigée pour cette story et nécessiterait validation Office dédiée.

## 3. Composition cible

### 3.1 Zone et marges

- Déterminer la taille intérieure utilisable du cadre porteur dans le PPTX à partir des unités Open XML (EMU), en tenant compte des éventuelles marges du conteneur, rotation, et transformations ; confirmer ces cas en architecture.
- Générer un PNG au **même ratio que la zone cible** ou un PNG de ratio conservé ajusté proportionnellement **sans aucune déformation**. La taille affichée de la zone demeure inchangée.
- Cible de densité : **au moins 90 % de la surface utile occupée par la composition complète** (axes + données + légende nécessaires), hors zones de sécurité ; cela ne signifie pas remplir 90 % avec des barres ou forcer de fausses données.
- Marge de sécurité initiale recommandée : **4 à 6 %** de chaque côté, ajustée selon labels. Ne jamais couper titres, graduations, axes, points, légendes ou étiquettes.

### 3.2 Typographie

- Retirer par défaut le titre interne redondant « Tendances des indicateurs » : le titre principal du modèle PowerPoint reste hors du graphique.
- Utiliser un rendu typographique anti-crénelé avec une police libre et compatible au déploiement SMN, correctement internationalisée (français/anglais, accents, caractères accentués, chiffres et unités).
- Critère à la taille réellement affichée dans une présentation standard : graduations, étiquettes d'axes et légendes **lisibles sans zoom** ; viser **10 pt minimum** pour les contenus essentiels dans les cadres ordinaires, et ne pas descendre silencieusement sous **9 pt**. Taille et seuil final à valider sur le vrai modèle PPTX.
- Utiliser des conventions numériques FR/EN et au plus deux décimales à l'affichage ; les données et calculs sous-jacents ne sont pas arrondis arbitrairement.

### 3.3 Axes, cycles et séries

- Afficher des graduations utiles (environ 3 à 5), échelle fidèle aux valeurs ; ne pas afficher des décimales inutiles.
- Libellés des cycles : affichage complet s'ils tiennent ; sinon abréviation déterministe (ex. `PI26 Q4.2 Sprint 103` → `S103`) et **inclinaison jusqu'à 45° si nécessaire**. Les cycles ne sont jamais réordonnés ou supprimés silencieusement.
- Pour plusieurs séries, légende lisible avec correspondance de couleur stable ; éviter les couleurs trop similaires et ne jamais reposer uniquement sur la couleur lorsque plusieurs courbes peuvent se confondre.
- Une seule série : légende optionnelle si le nom de la mesure est déjà identifiable sans ambiguïté par le contexte ; plusieurs séries : légende obligatoire.
- Les `null` sont des trous/éléments absents : pas de barre ni de point à zéro par substitution. L'échelle ne simule pas des résultats.
- Préserver la sémantique de chaque type : barres, courbes, aires, secteurs, anneaux et jauge (y compris les contraintes du moteur existant).

### 3.4 Formats particuliers

- **Cadre horizontal :** privilégier graphe et labels côte à côte si besoin, légende compacte sous le tracé ou à droite selon place.
- **Cadre carré :** adapter la hauteur utile et la légende ; pas de bande vide due à un ancien ratio 960 × 560.
- **Cadre étroit/vertical :** prioriser la lisibilité ; limiter la densité visible par un message clair si aucun rendu fidèle n'est possible. Ne pas déformer ni retrancher des données silencieusement.
- **Cadre trop petit ou dimensions impossibles :** erreur localisée (FR/EN) donnant la raison et l'emplacement du tag ; ne pas produire un graphique illisible ou corrompu. Recommandation UX : message « Espace insuffisant pour afficher ce graphique. Agrandissez la zone de texte dans le modèle. »
- **Cadre absent/invalide, formes groupées ou rotation complexe :** gérer les cas pris en charge par contrat, sinon refuser explicitement avant écriture plutôt que dégrader la maquette.

## 4. Résolution, qualité et performance

- Déduire la résolution de rasterisation des **dimensions physiques** du conteneur, avec une cible de **220–300 pixels/pouce** pour le rendu PNG, à confirmer avec les tests PowerPoint et le coût de rendu. Ne pas multiplier aveuglément 960 × 560 par 3.
- Préserver la qualité des lignes, courbes, contours et surtout de la typographie à la taille d'affichage ; pas de flou ou pixelisation visible à 100 % et lors d'une projection standard.
- L'image ne doit **jamais** être étirée non proportionnellement. Insertion avec dimensions congruentes et ratio garanti.
- Maintenir les budgets de génération, fichiers et mémoire actuels (PNG maximal 8 Mio dans l'insert de SMN-397) ; si un graphique dépasse un budget, produire une erreur explicite ou appliquer un ajustement de qualité **documenté et testé**, jamais une dégradation silencieuse.
- Une génération de rapport multi-graphique doit rester bornée et prévisible en mémoire/temps ; définir des plafonds techniques avec Winston avant implémentation.

## 5. Scénarios utilisateurs (parcours)

1. Dans PowerPoint, l'utilisateur place `{{CHART:TREND|TYPE=bar|LAST=6}}` seul dans une zone de texte d'un encadré existant.
2. Il choisit un modèle, une équipe et un sprint dans Centre Rapports.
3. SMN lit les dimensions effectives de la zone, rend le graphique et remplace uniquement la zone concernée.
4. L'utilisateur ouvre le fichier : graphique dimensionné au cadre, lisible et proportionné ; les autres cadres de son modèle restent inchangés.
5. En cas d'impossibilité, SMN explique l'erreur dans sa langue (FR/EN), sans générer d'archive cassée ni masquer le problème.

## 6. Critères d'acceptation vérifiables

| ID | Condition d'acceptation | Preuve |
|---|---|---|
| UX-CH-01 | Une zone PPTX large, carrée et étroite génère trois images dont les dimensions et compositions sont adaptées à chacun des conteneurs ; aucun rendu ne reste bloqué à 960 × 560. | Tests extraction EMU et rendu pixels + 3 captures PowerPoint |
| UX-CH-02 | Aucune image ne subit de distorsion non proportionnelle (écart de ratio toléré inférieur à 1 % hors arrondi de pixels). | Test géométrie Open XML + comparaison rendu |
| UX-CH-03 | Le graphique (avec ses axes et légende nécessaires) utilise au moins 90 % de la surface utile quand la zone le permet, sans recouvrir de formes voisines. | Captures comparatives avant/après du modèle réel |
| UX-CH-04 | Aucun titre interne « Tendances des indicateurs » n'est inséré par défaut si le modèle fournit déjà son propre titre. | Test raster/texte et recette PowerPoint |
| UX-CH-05 | Les textes FR/EN sont anti-crénelés, conservent accents et unités, et restent lisibles à 100 % sur le modèle de référence ; aucun label essentiel sous 9 pt sans erreur explicite. | Comparaison visuelle FR/EN |
| UX-CH-06 | Les labels des cycles n'entrent pas en collision, avec abréviation cohérente et inclinaison jusqu'à 45° si nécessaire, sans permutation ni suppression des cycles. | Cas 6 et 24 cycles, libellés longs |
| UX-CH-07 | Multi-séries (2–6) : séries et unités conservées, légende visible sans collision ; monosérie : aucune légende redondante obligatoire. | Jeux de données multi-séries et états denses |
| UX-CH-08 | Les données absentes restent absentes, un zéro existant reste zéro ; les valeurs des cycles clôturés proviennent du mécanisme historique v33 actuel. | Tests de non-régression |
| UX-CH-09 | Les six types `bar`, `line`, `area`, `pie`, `donut`, `gauge` restent exportables avec un rendu adapté et leurs règles métier conservées. | Matrice type × ratio et tests d'intégration |
| UX-CH-10 | Le tag existant fonctionne **sans paramètre supplémentaire** ni modification du modèle ; plusieurs graphiques sur une même diapositive restent indépendants. | PPTX avec 4 encadrés, 1 seul tag puis plusieurs tags |
| UX-CH-11 | Les objets fixes non ciblés (logos, photos, titres, bordures, autres cadres) conservent ordre, placement, contenu, taille et relations Open XML. | Diff structurel du PPTX et contrôle PowerPoint |
| UX-CH-12 | Une zone trop petite, invalide ou non supportée produit un message clair et traduit FR/EN ; aucun export incomplet ni contenu illisible n'est présenté comme réussi. | Tests erreurs API + UI |
| UX-CH-13 | Le PNG respecte la limite de 8 Mio, les plafonds de ressources et les budgets de génération ; comportement d'échec maîtrisé. | Tests des bornes et fichiers importants |
| UX-CH-14 | Les tests automatiques réussissent sur Windows/Linux, TypeScript et lint passent, puis recette visuelle sous Microsoft PowerPoint Windows 11 sur modèle réel. | Liens GitHub Actions + captures de recette |
| UX-CH-15 | La documentation des tags mentionne l'adaptation automatique, la compatibilité des zones, les limites et les messages d'erreur, en FR/EN. | Contrôle onglet Tags |

## 7. Hors périmètre immédiat

- Recomposition automatique des titres ou des quatre encadrés PowerPoint ; les trois autres encadrés restent vides si l'utilisateur n'y place aucun tag.
- Modification des sprints, des indicateurs ou de leurs valeurs.
- Édition native d'un graphique PowerPoint après export (l'image PNG reste une image).
- Intégration vectorielle EMF/SVG, nécessitant un cadrage distinct pour la compatibilité Microsoft Office.
- Adaptation approfondie des graphiques Word : réutiliser les choix de typographie et de rendu, mais traiter la géométrie du document Word dans une étape séparée si nécessaire.

## 8. Préconisations à Winston et Amelia, non assimilées à des décisions techniques validées

- Introduire un **contrat de cible graphique** (largeur/hauteur en EMU, orientation/ratio, locale et profil de rendu) transmis de l'extraction PPTX au moteur de rendu.
- Remplacer la police bitmap fixe par une bibliothèque de rendu typographique maîtrisée et distribuable dans la version portable Windows, en respectant l'absence de droits administrateur.
- Découpler l'analyse Open XML, la mise en page du graphique et sa rasterisation ; vérifier les limites du POC SMN-397 avant d'étendre à des zones complexes.
- Favoriser une architecture dont chaque graphique peut être testé indépendamment, puis validé en package PPTX sans régression des autres médias.
- Vérifier et fixer explicitement la stratégie pour rotation/groupes et la compatibilité Word ; ne pas inventer un support implicite.

## 9. Plan de recette UX

- **Lot A :** trois tailles de cadres PowerPoint (horizontal, carré, vertical) ; comparaison des dimensions, lisibilité et absence de distorsion.
- **Lot B :** 1/2/6 séries, 1/6/24 cycles, libellés longs FR/EN, valeurs négatives, null, zéro et séries mixtes, par type pris en charge.
- **Lot C :** zones étroites, erreurs de dimension, rotation et formes groupées ; vérifier le refus explicite.
- **Lot D :** modèle réel avec en-tête rouge, logo et photographie à droite, quatre cadres dont trois vides ; export et revue visuelle PowerPoint Windows à 100 % ainsi qu'une vérification en diaporama et PDF.
- **Lot E :** contrôles automatisés Windows et Linux, intégrité OPC (ZIP, relations, contenu images) et comparaison des parties XML hors graphique.

**Condition de clôture :** accord UX sur les images réelles et preuves automatiques, puis confirmation utilisateur ; ne pas déclarer la modification développée sur la seule base de ce document.

## 10. Traçabilité

- Story de référence : [SMN-402](https://lmn24.atlassian.net/browse/SMN-402) (graphiques Office existants).
- Ce document est un **cadrage UX soumis à transmission et découpage technique**. Aucune User Story Jira n'est créée ou modifiée dans cette étape, aucune implémentation n'est déclarée.
