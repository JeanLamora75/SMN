# SMN — Contrôle final de cohérence architecturale BMAD

> **Lecture historique — consolidation du 19/10/2026.** Les constats ci-dessous décrivent leur revue d'origine. A7/A8/A10/A11 ont depuis été validés ; D-PRD-136 fixe **deux rôles MVP : Administrateur et Utilisateur**. Les hypothèses à trois rôles et blocages métier correspondants sont supplantés par [les arbitrages validés](../../prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les réserves techniques et l'absence de lint/Reviewer Gate officiel attesté restent applicables.

**Date :** 19 octobre 2026. **Type :** contrôle documentaire spécifique à la session, associé à une revue critique interne. **Statut du livrable :** `ARCHITECTURE-SPINE.md` finalisée comme contrat documentaire **avec réserves tracées**. **Ce document n'est PAS un rapport de succès du Reviewer Gate officiel** (script et sous-agents non exécutés).

## 1. Base des contrôles

- [ARCHITECTURE-SPINE.md](ARCHITECTURE-SPINE.md) et [journal](.memlog.md), conservant AD-1 à AD-13 et leurs validations historiques, AD-14 à AD-30 et AD-31 de rapprochement des rôles.
- [PRD et annexes](../../prds/prd-SMN-2026-10-18/prd.md), décisions D-PRD-130/131, [handoff](../../prds/prd-SMN-2026-10-18/handoff-architecture-winston.md).
- [Annexe de conception](DESIGN-TECHNIQUE.md), [sécurité/exploitation](SECURITE-EXPLOITATION.md), [revue/traçabilité](REVUE-COHERENCE-TRACABILITE.md), [arbitrages finaux](ARBITRAGES-FINAUX.md).
- Skill BMAD `bmad-architecture`, template `spine-template.md` et `references/reviewer-gate.md`, consultés via GitHub.

## 2. Contrôle structurel automatisé spécifique à la session

Exécuté sur les contenus récupérés du dépôt via le connecteur, par analyse des chaînes Markdown/YAML avec JavaScript (et **non** par `lint_spine.py` officiel).

| Contrôle | Résultat |
| --- | --- |
| Continuité des titres `AD-n` | **31 AD, AD-1 à AD-31 ; aucun trou ni doublon** |
| `Binds`, `Prevents`, `Rule` pour chaque AD | **Présents sur les 31 blocs** |
| Tag `[ADOPTED]` | Présent sur les 31 AD |
| En-tête YAML, `status: final` | Présents, statut documentaire final |
| Design Paradigm, Invariants, Conventions, Stack, Seed, Map, Deferred | Toutes les rubriques attendues présentes |
| Liens relatifs locaux entre les documents déjà publiés | Pas de cible manquante dans l'ensemble vérifié au moment du contrôle |
| Fermeture des blocs de code Markdown | Délimiteurs équilibrés sur les documents lus |
| Indications A7/A8/A10/A11, PostgreSQL, Scrum/Kanban/SAFe | Présentes |
| Substitution involontaire de secrets dans les documents | **Non auditée par un outil de détection dédié** ; aucune valeur de secret n'a été volontairement ajoutée |

**Limites :** le contrôle ne parse pas un YAML complet, ne vérifie pas toutes les références de PRD et ne valide pas la syntaxe Mermaid via un moteur Mermaid. Il ne remplace ni l'exécution du `lint_spine.py`, ni une inspection indépendante.

## 3. Revue critique interne par trois angles

### 3.1 Adversaire de cohérence des modules

| Attaque plausible | Protection prévue | Reste à éprouver |
| --- | --- | --- |
| Le calcul du bilan et le PDF utilisent deux versions différentes des sources | AD-6/22 : données préparées et paquet de rendu unique | mutation entre aperçu et export |
| Deux requêtes reclôturent en même temps et tentent V2 | AD-3/20/25 : transaction, verrou, contrainte version | concurrence PostgreSQL |
| Une replanification sauve les dates mais pas les événements ou l'audit | AD-3/18 : un cas d'usage et une transaction | injection d'échec |
| Un import modifie des métriques après une prévisualisation périmée | AD-21 : revalidation et concurrence optimiste | conflit inter-utilisateur |
| La capacité à l'ouverture est recomputée avec des absences saisies après | AD-11/12/16 : état connu à l'instant d'effet ou indisponible | app arrêtée plusieurs jours |
| Un utilisateur récupère par URL directe le TXT d'une autre équipe | AD-7/26/31 : autorisation serveur sur téléchargement | tests négatifs IDOR |

**Verdict :** pas de trou critique silencieux établi au niveau architectural. Les mécanismes d'isolation transactionnelle précis et les scénarios de panne restent à tester ; absence de test ne signifie pas réussite.

### 3.2 Sécurité, confidentialité et archivage

| Attaque plausible | Couverture documentaire | Décision/mesure restante |
| --- | --- | --- |
| Un lecteur obtient une absence nominative par URL | AD-8/26/31, filtrage serveur | test de droits ; aucun accès individuel du Lecteur |
| L'Opérateur obtient plus de permissions sensibles qu'approuvées | AD-31, absence de privilège sensible par défaut | matrice métier détaillée avant Stories d'habilitation |
| Une copie en sauvegarde conserve une donnée personnelle effacée | AD-10/27/29, A11 | stratégie suppression/anonymisation et rétention à arbitrer |
| Un rendu PDF suit un lien vers un fichier secret du PC | AD-26/27 + annexe sécurité | sandbox/ressources du moteur PDF à éprouver |
| L'installateur réactive le parcours anonyme après redémarrage | AD-7/9, installation atomique | test course/réinitialisation/accès direct |
| Des textes libres nominaux passent dans un brief IA | AD-23, interdiction structurelle + revue humaine | tests avec commentaires sensibles ; aucune détection parfaite garantie |

**Verdict :** garanties de conception identifiées ; A11 et permissions sensibles de l'Opérateur restent un **point de décision bloquant pour leurs Stories**, non un fait supposé résolu.

### 3.3 Technologies et environnement

| Dépendance structurante | Source de vérification | État |
| --- | --- | --- |
| TypeScript / Bootstrap 5 / PostgreSQL | Accord utilisateur | **Décidés**, versions non épinglées |
| Node.js / pnpm / PostgreSQL local | Déclaration utilisateur et contexte de projet | Disponibilité **déclarée**, non vérifiée depuis cette session |
| React / Next.js | Proposition architecturale acceptée comme candidate sous réserve | Compatibilité/starter **non vérifiés** |
| ORM et bibliothèques de calcul du temps / PDF | Non fixés | Sélection différée au POC I0 |
| PostgreSQL, migrations, restauration, rendu PDF local | Aucun essai sur PC | À démontrer pendant I0 |
| Versions et état de sécurité des dépendances | Aucune recherche web avancée autorisée | À contrôler avant verrouillage de la stack |

**Verdict :** aucun numéro de version non vérifié n'est présenté comme garanti. La colonne Stack de la spine marque les choix fermes et les candidats séparément.

## 4. Verdict de clôture documentaire

**FAVORABLE SOUS RÉSERVES POUR LE CONTRAT D'ARCHITECTURE.**

L'architecture possède des règles explicites pour les divergences entre modules, une séparation des sources de vérité, PostgreSQL dès le MVP, des préconditions d'installation, des règles de traçabilité et de confidentialité, ainsi qu'un registre de portes de sortie qui empêche de transformer des hypothèses en Story implémentable.

**Non établi :** passage complet du Reviewer Gate officiel, validation indépendante, lint officiel, mesures NFR, recette Windows/PostgreSQL/PDF, restauration réussie ou aptitude au pilote.

### Actions conditionnelles avant construction et pilote

1. **Avant les Stories sensibles** : A7, A8, A10, A11 et droits individuels de l'Opérateur doivent obtenir la validation métier correspondante.
2. **Avant choix irréversibles de librairies/packaging** : vérifier versions, starter et compatibilité du POC Windows/PostgreSQL/PDF ; ne pas supposer Docker ou accès administrateur.
3. **Avant acceptation technique** : réaliser le lint officiel et la revue indépendante BMAD si environnement disponible ; corriger les constats, avec traçabilité.
4. **Avant pilote** : démontrer les cinq critères cumulatifs du PRD, restauration, sécurité, compatibilité et accessibilité, avec signature humaine explicite.

**Journalisation :** toute modification future de règle, une fois la spine finale publiée, doit passer par amendement versionné et journal BMAD, sans renuméroter ou supprimer silencieusement les AD déjà transmises.
