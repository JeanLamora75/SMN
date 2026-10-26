---
name: "SMN — Centre Rapports — Harmonisation Cockpit Agile Option A"
status: approved-design
updated: 2026-10-26
agent: "Sally — UX Designer BMAD v6.12.4"
scope: "Centre Rapports (/app/reports) : onglets, filtres, liste et création"
sources:
  - "DESIGN.md"
  - "EXPERIENCE.md"
  - "MAQUETTES-REFERENCE.md"
  - "https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md"
  - "https://lmn24.atlassian.net/browse/SMN-255"
---

# BMAD — Avenant UX approuvé : Centre Rapports, option A

**Décision utilisateur du 26/10/2026 : option A et maquette de Sally approuvées.** La cible est une **harmonisation graphique fidèle de la page Registres**, suivant le langage « Cockpit Agile ». L'accord ne porte pas sur une refonte des règles métier du Studio de rapports ni sur son développement. Ce document est un **avenant circonscrit au Centre Rapports** : il complète `DESIGN.md` (apparence) et `EXPERIENCE.md` (comportements), sans les remplacer pour les autres surfaces, ni invalider les 21 arbitrages UX-R01 à UX-R21.

## 1. Contexte vérifié et objectif

- Référence visuelle approuvée : capture de la page **Registres** déjà implémentée et maquettes **Centre Rapports — Option A** validées dans l'atelier Sally du 26/10/2026 (desktop, fenêtre de création, mobile). Les PNG et le prototype HTML sont joints à cette conversation ; **ils ne sont pas intégrés à ce commit**, donc ne pas inventer de lien GitHub vers ces fichiers.
- Implémentation actuelle : `src/app/app/reports/page.tsx` (onglets par `tab`, filtres GET `q`, `cycleId`, `status`, liste des brouillons, bibliothèque des modèles, archives) et `src/app/app/reports/new-report-form.tsx` (création admin, POST existant, idempotence de requête, traitement d'erreur, redirection vers le rapport).
- But : obtenir le même niveau de cohérence, lisibilité et hiérarchie visuelle que les Registres, tout en laissant davantage de place à la liste qu'à la création.

## 2. DESIGN.md — Composition visuelle approuvée

| Zone | Contrat graphique Option A |
| --- | --- |
| Cadre | Pleine largeur utile, marges et arrondis comparables à Registres, sans nouveau `max-width` contraignant ; sidebar et header global inchangés. |
| Bandeau | Large bandeau bleu/contraste du thème actuel, avec titre **Centre Rapports** et sous-titre court ; dégradé/palette et dimensionnement calqués sur le registre Cockpit Agile. |
| Navigation | Les trois entrées **Rapports / Modèles / Archives** forment des pastilles/boutons dans le bandeau, état sélectionné net, focus clavier ; une seule vue visible à la fois. |
| CTA principal | **+ Nouveau rapport** en haut à droite du bandeau, visible uniquement pour un rôle habilité à créer. Sur petits écrans, libellé adapté sans masquer le nom accessible. |
| Filtres | Panneau blanc arrondi indépendant du bandeau, intitulé « Filtres et recherche » ; recherche, Sprint/période et statut (quand applicable), bouton **Filtrer**, réinitialisation si elle opère réellement. |
| Contexte | Petits indicateurs discrets facultatifs uniquement lorsque les données réelles sont disponibles (ex. nombre de rapports). Jamais de compteur ou d'équipe simulés. |
| Liste | Tableau dans un panneau blanc arrondi, en-tête subtil, lignes séparées et aérées ; colonnes existantes : Titre, Sprint, Modèle/version, Statut, Dernière modification, Actions. |
| Statut | Badge compact avec libellé explicite (ex. Brouillon) ; la couleur seule ne transmet jamais la sémantique. |
| Dates | Format local lisible FR/EN, adapté au fuseau applicatif, pas de timestamp ISO brut affiché. Conserver la précision serveur sous-jacente. |
| Actions | Commande explicite « Consulter » ou action `…` accessible par ligne ; **ne pas ajouter** des actions sans destination/API existante. |
| Création | **Supprimer le grand formulaire permanent de l'index**. Le CTA ouvre une **modale centrée**, sobre et compacte, avec exactement les quatre champs métier existants : **Sprint**, **Modèle** (et version affichée), **Titre**, **Langue**, plus **Annuler / Créer le rapport**. |
| Modèles/Archives | Harmoniser bandeau, onglets et panneaux avec le Centre ; **ne pas réinventer** le fonctionnement ou le catalogue des modèles, ni l'archivage. |

La fidélité signifie : mêmes principes de bandeau, marges, bordures, hauteurs de boutons, badges, densité et responsive que l'écran Registres. Ne pas dupliquer son vocabulaire métier (risques, obstacles, points d'attention) sur la page Rapports.

### Tokens et systèmes graphiques

- Réutiliser Bootstrap 5, les variables du projet `src/app/appearance.css` et les tokens `--smn-*`, y compris palettes **ocean/forest/violet** et modes **clair/sombre**. Pas de couleur bleue codée en dur en contradiction avec une palette sélectionnée.
- Prendre pour référence les règles du registre dans `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md` et ses classes existantes ; préférer un habillage propre à `/app/reports` sans régression des autres pages.
- Icônes du jeu déjà utilisé par SMN, avec libellés accessibles et focus visible. FR/EN dans les catalogues i18n existants ; respecter les longueurs anglaises.

## 3. EXPERIENCE.md — Interactions et invariants

### Navigation et filtre

1. À l'entrée `/app/reports`, la vue **Rapports** reste la vue par défaut ; **Modèles** et **Archives** demeurent accessibles via les paramètres d'URL et les contrôles existants.
2. Conserver les liens profonds et les paramètres effectifs `tab`, `q`, `cycleId`, `status`. Ne pas perdre le filtre Sprint prérempli par une navigation contextuelle. Conserver le filtre lors du changement d'onglet dans la mesure des usages actuels.
3. La recherche ne doit pas afficher des résultats fictifs ; états vides, erreurs de lecture et réessai réels restent visibles et distincts.
4. Ne pas ajouter de bascule Liste/Cartes : **la cible validée est une liste**, contrairement à la page Registres.

### Création modale

1. L'admin active « + Nouveau rapport » ; la modale s'ouvre au centre et prend le focus. `user` reste en lecture seule ; toute écriture demeure protégée côté serveur.
2. Valeur de Sprint par défaut issue du contexte `cycleId` valide ou du comportement existant ; options limitées aux cycles et modèles réellement renvoyés. Afficher la version du modèle sans prétendre créer un nouveau mécanisme de versionnage.
3. Titre obligatoire, langue FR/EN, validation existante, bouton désactivé durant la requête, message d'erreur accessible si le POST échoue. **Réutiliser l'API** `POST /api/admin/reports/sprints/{sprintId}/documents`, son `requestId` d'idempotence et son contrôle de droits.
4. Succès : redirection vers le nouveau rapport et rafraîchissement, comme aujourd'hui. Échec : conserver les quatre saisies, afficher l'erreur, permettre la reprise sans doublon involontaire.
5. Fermeture par Annuler, bouton X et Escape (hors traitement de requête en cours) ; restitution du focus au bouton déclencheur. Masquer/inertiser l'arrière-plan et bloquer les interactions extérieures. Aucun rapport n'est créé par la fermeture de la modale.

### Non-objectifs

- Aucun changement des contrats des blocs, du Studio de composition/rédaction/aperçu, de la génération PDF, de la qualité d'export, des snapshots, ni des archives.
- Aucune nouvelle API, migration PostgreSQL, statut, rôle, métrique, permission ou fonctionnalité fictive.
- Aucun changement arbitraire des choix déjà approuvés en UX-R01 à UX-R21.
- Pas de lien vers une destination non réalisée ni d'action de suppression/modification inventée dans le tableau.

## 4. Responsive, accessibilité et validation

- **Desktop** : bandeau 100 % disponible, onglets à gauche, action principale à droite ; filtres en grille compacte ; tableau entier lisible.
- **Tablette** : boutons et filtres retournent à la ligne ; pas de troncature sans alternative accessible.
- **Smartphone** : bandeau moins haut, onglets accessibles (navigation horizontale ou regroupement explicite selon largeur réelle), recherche visible, filtres secondaires repliables au besoin ; table transformée en lignes compactes si nécessaire, en conservant titre/Sprint/statut/action. Modale adaptée à la hauteur écran, scroll interne seulement si besoin.
- Tester **320, 375, 390, 768, 1024, 1440 px**, zoom **200 %**, clavier, lecteur d'écran, langues **FR/EN**, thèmes **clair/sombre** et trois palettes ; cible **WCAG 2.2 AA** à vérifier, non présumée.
- Afficher les dates selon la locale et le fuseau choisi, sans altérer l'instant persisté.

## 5. Correspondance des composants et impacts techniques

| Éléments existants | Travail attendu d'Amelia |
| --- | --- |
| `src/app/app/reports/page.tsx` | Composer bandeau Cockpit, navigation, panneau filtres, liste et points d'entrée sans changer les données filtrées ni les routes. |
| `src/app/app/reports/new-report-form.tsx` | Faire apparaître les quatre champs dans une modale déclenchée depuis le bandeau ; préserver la requête, l'idempotence, la validation et la redirection. |
| `src/app/app/reports/template-library.tsx` / archives | Adapter uniquement leur présentation périphérique si nécessaire ; préserver les actions disponibles. |
| Styles SMN / registre | Réemployer tokens/patterns existants ; isoler les classes spécifiques à Rapports, sans effet de bord sur les autres modules. |
| `src/i18n/fr.json` et `src/i18n/en.json` | Ajouter/adapter les seuls libellés nécessaires, sans texte utilisateur codé en dur. |
| Tests | Ajouter des tests ciblés pour modal, permissions, filtres, URLs, listes et absence de régression ; exécuter réellement avant toute affirmation de livraison. |

## 6. Critères de recette UX — Définition de fini

- **AC1** : En ouvrant Centre Rapports, je retrouve le bandeau contrasté et le style de Registres, ainsi que les 3 pastilles d'onglets et le CTA en haut à droite (admin uniquement).
- **AC2** : Les recherches/filtres en panneau distinct fonctionnent sur les données réelles et conservent le contexte de Sprint/onglet dans les URL applicables ; aucun bouton inerte ou compteur fictif.
- **AC3** : Le grand formulaire de création n'apparaît plus sur la page ; le CTA ouvre la modale centrée, quatre champs existants, validations, Annuler/X/Escape et gestion du focus.
- **AC4** : Créer conserve strictement l'API/idempotence/droits existants ; succès = nouveau brouillon navigable, échec = données saisies et message conservés.
- **AC5** : La liste présente les colonnes, badges, dates lisibles et actions réelles ; Modèles et Archives restent accessibles et fonctionnels.
- **AC6** : Les droits `admin` / `user` restent conformes, côté interface ET API ; pas de régression sur Studio, export, archives et autres pages.
- **AC7** : Contrôles réalisés sur desktop/tablette/mobile, FR/EN, thème clair/sombre, palettes, clavier/focus/lecteur d'écran et zoom 200 % ; journaliser tout écart et sa correction.
- **AC8** : Exécuter localement (et consigner les résultats, sans supposition) `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, puis recette visuelle comparative Registres ↔ Rapports avant de déclarer le lot terminé.

## 7. Traçabilité, dépendances, diffusion

- **Epic transverse UX** : [SMN-228](https://lmn24.atlassian.net/browse/SMN-228).
- **Centre fonctionnel existant** : [SMN-255](https://lmn24.atlassian.net/browse/SMN-255). La présente Story d'harmonisation est complémentaire, pas un remplacement.
- **Contrats reports** : [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [RECETTE-UX.md](RECETTE-UX.md) et [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md).
- **Référence commune Cockpit Agile** : [avenant Registres](../ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md).
- **Visuels validés** : `SMN_Centre_Rapports_Maquette_Option_A.png`, `SMN_Centre_Rapports_Creation_Modale.png`, `SMN_Centre_Rapports_Mobile_Option_A.png`, et prototype `SMN_Centre_Rapports_Maquette_Option_A.html`, présents dans la conversation du 26/10/2026, **non versionnés dans ce commit**.

### Adaptations de workflow BMAD

Skill `.agents/skills/bmad-agent-ux-designer/SKILL.md`, workflow `.agents/skills/bmad-ux/SKILL.md`, personnalisation et référentiel UX consultés via GitHub ; extraction/écriture manuelles au moyen du connecteur. Les scripts `uv`, `resolve_customization.py`, `resolve_config.py`, `memlog.py` et outils de validation locaux **n'ont pas été exécutés**. L'accord UX ne signifie pas build, implémentation ou recette.

**Instruction pour Amelia :** reproduire cette composition sur l'application réelle, avec les données, droits, API et comportements déjà présents ; documenter les écarts en cas de contrainte technique. Ne pas étendre cette Story au Studio.
