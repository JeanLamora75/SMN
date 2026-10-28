# Demande d'évolution BMAD — Commentaire des liens — 28 octobre 2026

## Contexte
Epic SMN-305 (Liens et ressources) ; dépendances SMN-306 (données du lien), SMN-311 (rapports) et SMN-313 (recette).
Demande validée fonctionnellement : pouvoir saisir un commentaire pour chaque lien, le visualiser dans l'application et l'inclure dans les rapports.

## Clarification métier
Un **commentaire de lien** est un texte facultatif propre à la ressource, distinct du titre, de l'URL et de la description éventuellement déjà prévue par SMN-306. Il accompagne le lien dans toutes les vues et dans les exports qui incluent cette ressource. Il ne s'agit pas d'un fil de discussion, ni d'un commentaire spécifique à un rapport.
Pour éviter de dupliquer les données, vérifier à l'implémentation si le champ description existant peut déjà satisfaire ce contrat ; si oui, conserver ce champ et adapter son libellé et ses usages plutôt que créer une colonne concurrente.

## User Story
En tant que Scrum Master ou RTE autorisé, je veux saisir et modifier un commentaire facultatif pour chaque lien afin de préciser son intérêt, et le retrouver dans la bibliothèque ainsi que dans les rapports utilisant ce lien.

## Critères d'acceptation
- AC01 : la modale unique de création/édition présente un champ « Commentaire » facultatif, multiligne ; pas de perte de données existantes, chaîne vide acceptée.
- AC02 : le commentaire est affiché sur les cartes et en vue Liste, sans perturber les actions Ouvrir/Modifier ni les filtres ; les contenus longs sont lisibles via un mécanisme accessible.
- AC03 : le détail du lien et la sélection de références du Studio montrent le commentaire en lecture seule, lorsqu'il est renseigné.
- AC04 : l'export PDF et Markdown incluent le commentaire sous le titre et l'URL de chaque référence sélectionnée, dans l'ordre choisi ; aucun bloc ajouté quand il est vide.
- AC05 : le PDF archivé capture la valeur exacte du commentaire à la publication dans l'instantané immuable ; les modifications/suppressions ultérieures du catalogue n'altèrent jamais un rapport archivé.
- AC06 : validation serveur, échappement HTML/Markdown, contrôle des droits multiéquipes, tests FR/EN, clavier et responsive ; aucun HTML actif ni protocole URL non autorisé.
- AC07 : non-régression des liens antérieurs sans commentaire, des exports existants et du mécanisme d'archivage.

## Règles d'implémentation proposées (à confirmer lors de l'analyse technique)
- Une seule valeur de commentaire par lien, pas d'historique conversationnel.
- Taille maximale proposée : 2 000 caractères ; préserver les retours à la ligne pour l'affichage, neutraliser toute injection en export.
- Évolution additive du contrat des API et des types ; lecture des anciennes données sans commentaire.
- Les autorisations de modification restent celles du lien ; aucune nouvelle permission.
- Mettre à jour les contrats UX DESIGN.md et EXPERIENCE.md à l'étape de conception/développement correspondante, sans revenir sur UX-01 à UX-07.

## Dépendances et recette
Implémenter après prise en compte du modèle SMN-306 et des sorties SMN-311 ; compléter la recette SMN-313.
Tests : création, édition, vide, textes longs, sécurité, isolation équipes A/B, Markdown, PDF, archive avant/après changement de commentaire, traductions.
Les tests sur le PC du commanditaire restent indispensables. Aucune validation d'exécution n'est affirmée dans ce document.

## Décision
Cadrage BMAD préparé avant tout développement de cette évolution. Les règles précises de longueur et de réutilisation du champ description restent des propositions techniques, sans changement de la demande utilisateur.
