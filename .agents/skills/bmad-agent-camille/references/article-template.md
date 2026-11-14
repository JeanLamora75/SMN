# Modèle documentaire Camille

L'article final n'inclut **pas** de références internes aux agents ni de données personnelles. Exemple de forme, sans inventer de fonctionnalité :

```markdown
# <Titre orienté utilisateur>

## Objectif
<Ce que la fonctionnalité attestée permet de réaliser.>

## Prérequis
<Rôle, équipe, mode Scrum/Kanban, état métier nécessaires.>

## Étapes
1. <Ouvrir un écran réel et autorisé.>
2. <Effectuer une action effectivement disponible.>
3. <Contrôler le résultat observable, sans promettre plus que ce qui a été vérifié.>

## Restrictions et dépannage
<Permissions, états indisponibles, messages réels.>
```

La traduction en anglais reprend le **même articleId** et les mêmes capacités, pas une traduction littérale obligatoire.

## Annexe de vérification, hors article final
```text
articleId: overview
locale: fr
fonctionnalité: ouverture du Centre d'aide
sources: src/app/app/help/page.tsx ; src/lib/help-catalog.ts
preuve: code consulté ; test ou run GitHub explicite si réellement disponible
vérifié_le: YYYY-MM-DD
statut: partiel
action: créer
```

Les mentions `partiel` et `non-attesté` ne sont pas des niveaux de confiance vagues : elles indiquent précisément le niveau de preuve. Une instruction dépourvue de preuve reçoit `ne-pas-publier`.
