# SMN — Étude technique de refonte des modèles de briefs IA

**Date :** 15 novembre 2026  
**Agent :** 🏗️ Winston — System Architect (BMAD v6.12.4)  
**Statut :** étude technique préliminaire ; conception fonctionnelle validée ; solution détaillée et migration à qualifier avant développement  
**Périmètre :** page de sprint → « Générer un brief IA » ; préparation et modèles ; générateur TXT ; archives et journal ; catalogue de tags Office.  
**Décision utilisateur :** remplacer le formulaire technique de création de modèles par un éditeur de prompt libre de type bloc-notes et une insertion de tags du système de rapports ; supprimer le code et les structures de base devenus inutiles, après sécurisation des données.  
**Hors périmètre de cette étude :** implémentation, migration effective, mise en place d'une API IA distante et publication de distribution.

## 1. Objectif et principes

- Un modèle de brief est essentiellement **un nom, une description éventuelle et un texte de prompt** contenant des tags SMN.
- Réemployer le catalogue et la syntaxe des tags du configurateur des rapports Office, sans créer un second référentiel de tags.
- Adapter la **résolution** des tags à un rendu textuel (TXT) ; la sérialisation d'un tag et son évaluation sont deux opérations distinctes.
- Préserver la prise en charge Scrum/Kanban, les droits d'accès, les données autorisées, le contrôle de confidentialité, l'intégrité des archives et l'absence de données inventées.
- Éviter les dépendances lourdes, les moteurs IA embarqués et toute installation supplémentaire sur les PC des utilisateurs.
- Supprimer effectivement les reliquats de l'ancien format **y compris en base**, mais seulement après migration, vérification et possibilité de restauration.

## 2. Inventaire confirmé par inspection statique de GitHub/main

| Élément | Chemin/code actuel | Constat |
|---|---|---|
| Bouton sprint | `src/app/app/admin/sprints/[sprintId]/page.tsx` | Lien vers `/app/admin/ai-briefs/prepare?mode=scrum&id=...`. |
| Préparation | `src/app/app/admin/ai-briefs/prepare/page.tsx` | Chargement du cycle, modèles actifs, faits et historique ; autorisation d'écriture ; contexte Scrum/Kanban. |
| Édition ponctuelle | `src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx` | Rubriques/questions/consignes/profondeur/données ; aperçu TXT, contrôle confidentialité, finalisation SHA-256 et copie manuelle. |
| Administration | `src/app/app/admin/ai-briefs/templates/page.tsx` et `template-editor.tsx` | Formulaire complexe, création et activation/désactivation. |
| Modèles natifs | `src/lib/ai-brief-templates.ts` | Trois modèles dans le code : Bilan du cycle, Tendances, Risques et dépendances. |
| Persistance modèles | `src/server/ai-briefs/templates.ts` | Modèles personnalisés dans `public.smn_ai_brief_template`, colonnes `sections`, `questions`, `instructions`, `data` en JSONB ; `depth`, `revision`, `active`. |
| API modèles | `src/app/api/admin/ai-briefs/templates/route.ts` | Accès et mutations transactionnelles, contrôle de révision. |
| Production TXT | `src/lib/ai-brief-txt.ts` | `composeBriefTxt` construit un texte depuis sections/questions/consignes, faits et historique ; adaptation requise. |
| Archives | `src/server/ai-briefs/library.ts`, `src/app/app/ai-briefs/archives/` | Archive TXT originale contrôlée par longueur et SHA-256, référence `template_id` et `template_revision`, réponses IA ajoutées manuellement. |
| Journal | `src/app/app/ai-briefs/journal/page.tsx` | Journal des analyses humaines et réponses IA. |
| Catalogue tags Office | `src/app/app/reports/office-tags.tsx` | Définitions des valeurs simples, indicateurs, tableaux et graphiques. |
| Configurateur de tags | `src/app/app/reports/office-tag-configurator.tsx` | Modal de recherche/choix de famille, gestion indicateurs et styles, actuellement copie vers presse-papiers. |
| Constructeur de tags | `src/lib/office-tag-builder.ts` | `serializeOfficeTag` indépendant de l'interface : scalar, indicator, row, chart. |
| Garde de schéma | `src/server/ai-briefs/schema-ready.ts` | Contrôle l'existence des tables ; n'applique pas de migration. |

**Limite :** cet inventaire résulte d'une revue statique ciblée. Il ne garantit pas l'exhaustivité des références dans les migrations, tests, export/import et moteurs Office. Aucun test, application ni migration n'a été exécuté.

## 3. Proposition d'architecture cible

### 3.1 Contrat de modèle

Proposer `id`, `title`, `description` (facultative), `prompt_text`, `revision`, `active`, `created_by`, `created_at`, `updated_at`, et conserver les autres colonnes techniques nécessaires après inventaire réel du schéma. Éviter de conserver les anciennes colonnes uniquement pour compatibilité interne une fois la migration finalisée.

Les modèles natifs seront transposés en prompts rédigés, chargés comme ressources versionnées et protégées, mais pourront être dupliqués. Les modèles personnalisés seront persistés en PostgreSQL. Éviter de distribuer des clés API ou des secrets avec les modèles.

### 3.2 Éditeur UX

- Nom, description facultative, **grande zone de texte** avec insertion de tags à la position du curseur.
- Catalogue de tags mutualisé et filtrable ; information sur le sens, les données et la disponibilité par contexte.
- Aperçu du prompt résolu, diagnostics de tags invalides ou non disponibles, validation explicite de confidentialité et finalisation.
- Modèles natifs préremplis, duplication et personnalisation simples.
- Le configurateur doit proposer une insertion au curseur et non seulement une copie vers le presse-papiers ; préserver son usage actuel côté rapports.

### 3.3 Résolution et rendu textuel

Réutiliser la définition et la validation des expressions Office, mais prévoir un **adaptateur de rendu texte**. Les tags scalaires sont candidats à un rendu direct ; les `ROW` nécessitent une représentation textuelle lisible (lignes/colonnes, limites et qualité/provenance). Les `CHART` produisent actuellement des artefacts graphiques : ne pas prétendre les résoudre en texte sans règle explicite ; définir une substitution par données textuelles, une représentation adaptée, ou les interdire dans les prompts avec un message explicite.

Exemples de syntaxe existante : `{{TEAM_NAME}}`, `{{SPRINT_NAME}}`, `{{ROW:RISKS}}`, `{{INDICATOR_<TAG>}}`, `{{CHART:TREND|TYPE=line|TAGS=...}}`. Les disponibilités et rendus doivent être validés par les producteurs métier, sans recopier arbitrairement toutes les données individuelles du moteur Office.

**Confidentialité :** les tags Office comportent notamment des listes de membres et des liens ; ne pas exposer automatiquement tout le catalogue comme « autorisé à envoyer à une IA ». Distinguer disponibilité technique, affichage, autorisation métier et partage externe. Relecture explicite du texte intégral avant transmission.

### 3.4 Flux et archives

Conserver le mécanisme de revue du TXT, le SHA-256, l'immutabilité, les références à la version du modèle, le téléchargement TXT et la séparation des analyses humaines et réponses IA. Vérifier que l'ajustement ponctuel du prompt ne modifie pas silencieusement un modèle sauvegardé. L'intégration d'une API IA gratuite constituera un lot distinct et devra garder les clés côté serveur.

## 4. Nettoyage et migration PostgreSQL — exigence obligatoire

Éléments candidats à supprimer **après conversion et vérification** :
- UI ancienne : `template-editor.tsx` (remplacé), anciennes parties de `brief-overrides.tsx`, formulaires de sélection des champs/profondeur/rubriques.
- Contrats et validations TypeScript de l'ancien format.
- Assembleur `composeBriefTxt` basé sur sections/questions/consignes, à remplacer ou restructurer.
- Colonnes `sections`, `questions`, `instructions`, `data`, `depth` de `public.smn_ai_brief_template`, **si** devenues sans consommateurs après migration.
- Tests purement dépendants du format historique, à remplacer par de vrais scénarios comportementaux.
- Index, contraintes, valeurs par défaut et fonctions SQL obsolètes **uniquement après inventaire précis**.

**Ne pas supprimer** sans analyse : tables d'archives (`smn_ai_brief_archive`), réponses IA, analyses humaines, journaux, liens d'audit, identifiants de modèles et numéros de révision existants.

### Séquence de migration recommandée

1. Inventorier le DDL réel, les migrations, les consommateurs directs/indirects et les données existantes (y compris installation multi-PC et sauvegardes).
2. Définir la règle déterministe de conversion pour chaque modèle natif/personnalisé ; y inclure rubriques, questions, instructions et données à l'aide de tags valides, sans perte silencieuse.
3. Préparer une migration PostgreSQL explicite (ajout `prompt_text` et backfill), journal de contrôle avant/après, sauvegarde restaurable et plan de retour arrière.
4. Adapter l'éditeur, les API et le moteur TXT ; conserver la lecture transitoire de l'ancien schéma seulement si nécessaire à un déploiement incrémental.
5. Tester conversion, aperçu, permissions, tags invalides, données absentes, archivage, export/import, sauvegarde/restauration et plusieurs versions de schéma.
6. Supprimer les colonnes, validations, code et artefacts devenus inutiles par une migration de nettoyage, après preuve de non-utilisation ; vérifier le schéma final.
7. Inclure les migrations dans les futures distributions SMN rebâties intégralement depuis les dernières sources.

**Point sensible :** un ancien modèle peut être référencé dans `smn_ai_brief_archive` via `template_id`/`template_revision`. Préserver l'interprétation et la traçabilité de ces archives même si le format courant est simplifié ; ne jamais réécrire leur contenu TXT immuable.

## 5. Questions ouvertes / validations avant développement

1. Règles précises d'évaluation textuelle des tags `ROW`, `CHART` et indicateurs dynamiques.
2. Politique de disponibilité des tags contenant des données personnelles, sensibles ou des URL.
3. Stratégie de conversion des modèles existants et résultats attendus ; présence éventuelle de données de production.
4. Inventaire exhaustif des migrations SQL et dépendances des colonnes obsolètes.
5. Multilingue : noms affichés et modèles natifs localisés sans inflation des fichiers i18n généraux.
6. Intégration au système de sauvegarde/restauration et aux distributions ZIP sur Windows.
7. Scénarios d'erreur et ergonomie de l'éditeur (perte de modifications, mauvais contexte de sprint, tags non résolus).

## 6. Préparation de la phase UX avec Sally

Demander à Sally un parcours simple conforme au référentiel `docs/UX-REFERENTIEL-BMAD.md` :
- administration du catalogue de modèles : liste lisible, création/duplication/modification/désactivation ;
- éditeur plein format « bloc-notes » et catalogue de tags en modal Cockpit Agile ;
- insertion au curseur, recherche, descriptions en langage métier, gestion du clavier ;
- aperçu avec données réelles, provenance, données absentes et erreurs lisibles ;
- revue de confidentialité et confirmation ciblée avant export ou transmission ;
- cohérence FR/EN et extensibilité 6–10 langues ;
- compatibilité des pages sprint, préparation, archives, journal ;
- possibilité de configurer plus tard une IA externe gratuite sans imposer une clé à ce stade.

Sally remettra des décisions UX, parcours, états, règles responsive et critères de recette, **sans modifier le code**. Le résultat sera validé fonctionnellement avant remise à Amelia.

## 7. Références de vérification

- [Éditeur actuel](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/ai-briefs/templates/template-editor.tsx)
- [Persistance actuelle](https://github.com/JeanLamora75/SMN/blob/main/src/server/ai-briefs/templates.ts)
- [Composeur TXT](https://github.com/JeanLamora75/SMN/blob/main/src/lib/ai-brief-txt.ts)
- [Catalogue de tags](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/reports/office-tags.tsx)
- [Configurateur Office](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/reports/office-tag-configurator.tsx)
- [Sérialiseur de tags](https://github.com/JeanLamora75/SMN/blob/main/src/lib/office-tag-builder.ts)
- [Bibliothèque d'archives](https://github.com/JeanLamora75/SMN/blob/main/src/server/ai-briefs/library.ts)
- [Référentiel UX SMN](https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md)

**Traçabilité :** étude rédigée à partir des validations exprimées dans la conversation du 15/11/2026 et de la lecture statique des fichiers ci-dessus. Aucun script `uv` exécuté ; aucun développement ni migration exécutés.
