# SMN-61 — Qualifier les capacités historiques

[Story SMN-61 dans Jira](https://lmn24.atlassian.net/browse/SMN-61) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-61-fiabilite-historique.md)

## Règles métier

Depuis **Calendrier d'équipe → Calculer la capacité en JH**, sélectionner une période **entièrement terminée**. Un panneau « Fiabilité des capacités historiques » donne la qualité de la **capacité prévue historique**, séparément de l'engagement initial SMN-59 et du réalisé SMN-60.

| Qualité | Valeur JH | Preuve attendue |
| --- | --- | --- |
| **Non renseignée** | Aucune valeur : pas même zéro | Justification si une correction est enregistrée |
| **Connue** | Valeur 0 ou positive | Référence identifiable (document, import ou autre source tracée) et justification |
| **Estimée** | Valeur 0 ou positive | Méthode et source identifiées, souvent une reconstitution partielle |

**Exemple :** une période historique ne comporte aucune capacité initiale enregistrée. Le réalisé constaté est 27 JH. La capacité prévue demeure **Non renseignée**, et aucun écart numérique n'est affiché : 27 JH réels ne prouvent pas que la capacité prévue était 0.

Si un document signé indique **30 JH** de prévision, l'Administrateur peut saisir 30 JH et « Connue », avec sa référence. Un écart **rétrospectif et clairement sourcé** de `27 − 30 = −3 JH` peut alors être affiché lorsque le réalisé est connu et la période terminée ou clôturée. Cette comparaison n'altère pas le cliché initial figé. Si les 30 JH sont simplement reconstitués à partir d'indices incomplets, sélectionner **Estimée** : aucune comparaison numérique présentée comme certaine.

## Corrections et traçabilité

Chaque enregistrement ajoute une révision avec l'avant et l'après, la source, le motif, la date et l'acteur. Une estimation corrigée de 35 à 31 JH conserve les deux versions, avec leurs sources respectives. Pour retirer une qualification, sélectionner **Non renseignée** et justifier : il ne s'agit pas d'une suppression d'historique.

Il est impossible de sélectionner « Connue » avec la source « Reconstitution partielle ». La simple lecture d'une période passée ne crée aucune valeur. Les corrections sont réservées à l'Administrateur et aux périodes entièrement terminées.

Les captures et PDF déjà produits, les clichés d'ouverture SMN-59 et les clichés de clôture SMN-60 ne sont jamais recalculés ou réécrits par ce panneau.

## Recette Windows / PostgreSQL 18.6 — à effectuer

Sur une base pilote sauvegardée, synchroniser `main`, puis valider la migration **v24 → v25**.

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Contrôler : historique absent = Non renseignée/null ; Connue avec document original référencé ; Estimée et données partielles conservées en tant qu'estimation ; valeur 0 explicitement sourcée ; réel 27 JH indépendamment d'une capacité prévue inconnue et **sans faux écart** ; édition 35 → 31 JH et historique des deux références ; refus d'éditer une période encore en cours ; conflit 409 ; accès Utilisateur interdit ; maintien byte à byte des archives PDF existantes et des snapshots SMN-59/60.

**À ce stade :** tests rédigés, vérifications statiques uniquement ; aucune exécution de migration ou de recette locale attestée. GitHub Actions exclu selon la décision projet. Statuts Jira En cours / BMAD review.
