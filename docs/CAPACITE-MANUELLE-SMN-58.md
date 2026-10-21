# SMN-58 — Choisir la capacité retenue

[Story Jira SMN-58](https://lmn24.atlassian.net/browse/SMN-58) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-58-capacite-manuelle.md) · [Calcul SMN-57](CAPACITE-DEVELOPPEMENT-SMN-57.md)

Une [replanification capacitaire SMN-62](REPLANIFICATION-CAPACITE-SMN-62.md) peut être simulée et confirmée sans écraser ni déplacer la saisie manuelle de cette période, y compris le zéro explicite.

La [politique de préremplissage SMN-63](PREFILL-FORMULAIRES-SMN-63.md) conserve les choix enregistrés et demande confirmation avant l'abandon d'une saisie manuelle non enregistrée.

## Parcours Administrateur

Depuis **Calendrier d'équipe → Calculer la capacité en JH**, choisir la fenêtre de dates puis cliquer sur **Calculer la capacité**. La page affiche trois informations distinctes :

- **Capacité retenue** : valeur utilisée pour l'arbitrage métier.
- **Référence calculée** : JH produits par les disponibilités et affectations SMN-57.
- **Provenance** : `Saisie` si l'Administrateur a enregistré une valeur manuelle, `Calcul` si seule la référence calculée est utilisée, `Non calculable` si aucune des deux n'est disponible.

Pour fixer une capacité prioritaire, saisir un nombre positif ou **0** puis cliquer sur **Enregistrer la saisie**. Exemple : référence 30 JH, saisie 32 JH : **retenue 32 JH**, référence 30 JH conservée. Si une nouvelle absence fait descendre la référence à 28 JH, **retenue 32 JH** tant que la saisie reste active.

**Zéro est une vraie valeur** : saisir `0` donne 0 JH de capacité retenue, même si le moteur propose davantage. Le champ vide n'est pas considéré comme un zéro. Pour enlever la priorité manuelle, cliquer sur **Effacer la saisie** : la modification est historisée et la référence calculée redevient retenue lorsque ses sources sont complètes.

Chaque modification est conservée par période exacte (équipe, première date, dernière date) : avant/après, auteur, date et révision. Si les dates sélectionnées changent, une nouvelle période est consultée ; l'ancien arbitrage reste attaché à ses dates initiales.

La [saisie manuelle du réalisé SMN-60](CAPACITE-REELLE-SMN-60.md) est distincte de la surcharge prévisionnelle décrite ici. Une clôture effective conserve son cliché séparé et active la protection de la période.

## Périodes protégées — frontière avec les futures Stories

L'API refuse les modifications d'une période portant un marqueur `frozen_at` ou `closed_at` (423). Aucun contournement par ce formulaire, même pour `0` ou une action Effacer. **SMN-59 crée désormais le marqueur `frozen_at` sur cette même période lors de l'ouverture effective, même sans saisie manuelle, et conserve le cliché initial à part.** La création du marqueur `closed_at` et les procédures de réouverture ou d'ajustement historique restent dépendantes des futures Stories. [Guide SMN-59](CAPACITE-INITIALE-SMN-59.md). Le fait que la protection soit codée ne prouve pas encore qu'une période fermée dans un écran futur sera automatiquement reconnue : le raccordement est explicitement à vérifier.

La surcharge manuelle ne modifie ni une capacité initiale figée ni un ancien PDF. Aucun indicateur de Sprint ou de Kanban n'est créé.

## Recette Windows à effectuer

Synchroniser `main` puis sauvegarder une **base pilote PostgreSQL 18.6**, lancer la migration **v21 → v22** et les commandes disponibles :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier ces scénarios : référence 30 puis saisie 32 ; référence recalculée à 28 après une absence, retenue toujours 32 ; saisie explicite 0 ; effacement ramenant au calcul ; effacement quand la référence est « Non calculable » ; historisation des opérations ; refus d'une date/période invalide ; conflit d'édition depuis deux fenêtres ; refus 403 pour un Utilisateur ; réponse 423 si `frozen_at` ou `closed_at` sont présents ; conservation des snapshots/PDF existants.

**Non attestés** : exécution des tests locaux, migration réelle et recette navigateur. GitHub Actions reste exclu ; Jira En cours, BMAD review en attendant preuves.
