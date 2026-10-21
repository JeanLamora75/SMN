# SMN-57 — Guide de recette du calcul des JH

[Jira SMN-57](https://lmn24.atlassian.net/browse/SMN-57) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-57-capacite-jh.md)

## Utilisation

Ouvrir **Calendrier d'équipe → Calculer la capacité en JH** comme Administrateur. Sélectionner une période de **1 à 93 jours** et cliquer sur **Calculer la capacité**. Le résultat affiche la contribution de chaque membre, le total et le détail journalier.

Le paramètre **heures/JH** vaut **8 par défaut** et peut être réglé entre 1 et 24, avec deux décimales. Chaque modification du paramètre est historisée.

**Calcul :** créneaux disponibles (en demi-journées) × heures/JH ÷ 2 × affectation × part Développeur × contribution ÷ heures/JH, avec des taux exprimés en fractions. Le taux contractuel est déjà pris en compte dans la borne d'affectation : ne pas le multiplier à nouveau. Le paramètre heures/JH change les heures calculées mais pas les JH si les seules sources sont des demi-journées.

**Exemples :** journée complète à 100 % des trois facteurs = 1 JH ; journée complète à 50 % de chaque facteur = 0,125 JH ; demi-journée pleine = 0,5 JH ; Product Owner **ou Scrum Master** à 100 % sans part Développeur = **0 JH** si les autres données sont complètes. Si une source obligatoire manque, le résultat demeure **Non calculable** (AC4), et non zéro fictif.

Les jours fériés, fermetures et absences ne sont déduits qu'une fois par créneau. Un changement de taux s'applique à partir de sa date d'effet.

En l'absence de trame, de version historique, de pays, de couverture nationale ou d'affectation non ambiguë, le total affiche **Non calculable / Non renseigné**, accompagné de la date, du membre et de la source manquante : jamais zéro par défaut.

Le moteur ne crée ni Sprint ni indicateur Kanban ; il ne convertit aucun Story Point et ne modifie ni ancien PDF ni capacité figée.

**SMN-58** permet maintenant de [saisir une capacité manuelle prioritaire](CAPACITE-MANUELLE-SMN-58.md) pour la période : la référence calculée reste visible, la saisie 0 JH est distincte du champ vide et l'effacement volontaire rétablit le calcul en conservant l'historique. Le verrouillage effectif des périodes dépend des futurs mécanismes de figement/clôture.

## Recette Windows à réaliser

Après synchronisation de `main` et sauvegarde d'une base PostgreSQL 18.6 pilote, appliquer la migration **v20 → v21**, puis :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier : 8 heures initiales, modification à 7,5 et audit, PO **et Scrum Master** sans développement, une demi-journée, un changement daté, chevauchement férié/fermeture/absence, un historique absent, période invalide, refus des Utilisateurs (403) et absence de modification des clichés/PDF existants.

**État :** tests écrits mais non exécutés. GitHub Actions ne sera pas utilisé. Jira En cours / BMAD review jusqu'à la recette.
