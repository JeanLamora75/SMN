# SMN-11 — Seconde revue indépendante BMAD après corrections

**Statut :** prompts préparés, aucune nouvelle revue indépendante encore exécutée. Date : 20 octobre 2026.

## Pourquoi ce second passage ?

La première revue a remonté **74 observations** sur le même instantané (20 Blind Hunter, 32 Edge Case Hunter, 18 Verification Gap, 4 remarques complémentaires). Le [rapport de triage](review-smn-11-triage.md) expose les **74 verdicts individualisés** ; la [spécification approuvée](spec-smn-11-demarrage-local-prerequis.md) en conserve la copie dans « Review Triage Log ». Les modifications dépassent les correctifs superficiels, ce qui provoque une boucle de revue du workflow officiel.

**Instantané de code à examiner :** `7f691688540330341fbf1260743d153521b2a66c`. Les commits postérieurs consacrés à préparer les prompts n'ont pas modifié les fichiers exécutables.

**Preuve de validation :** [CI Linux/PostgreSQL 18 : 30 tests sur 30 ; Windows : build et smoke `pnpm dev` réussis](https://github.com/JeanLamora75/SMN/actions/runs/39405279101). Le lancement et les refus d'accès ont également été observés sur le PC utilisateur sur le port 3003. Aucun traitement de données PostgreSQL utilisateur n'a été réalisé.

## Trois conversations distinctes (sans contexte de la première revue)

1. [Blind Hunter — deuxième revue](review-smn-11-r2-blind-hunter.md) : revoir les lacunes de code, tests et configuration sans ordre de priorité.
2. [Edge Case Hunter — deuxième revue](review-smn-11-r2-edge-case-hunter.md) : explorer les frontières et vérifier les claims à l'étape prescrite, sortie JSON.
3. [Verification Gap Reviewer — deuxième revue](review-smn-11-r2-verification-gap.md) : vérifier si les tests actuels échoueraient en cas de régression, sortie structurée.

**Instruction commune :** « Tu es le relecteur indépendant BMAD correspondant à ce fichier. Lis intégralement ce dossier GitHub dans la branche dev/bmad-i0-20261020. Réalise la revue conformément aux instructions qu'il contient. Ne modifie ni GitHub ni Jira. Restitue le rapport complet. »

Réunir les trois réponses et les fournir à la conversation de développement SMN-11, qui devra réévaluer chaque constat, corriger si nécessaire et relancer les vérifications. **Ni la fin de revue, ni le merge ni la clôture Jira ne sont attestés à cette date.**

## Périmètre et limites de l'adaptation

Les prompts v2 contiennent le diff unifié des fichiers applicatifs, tests et configuration (environ 56 k caractères). Les énormes blocs de lockfile et les anciennes conclusions de revue en sont exclus pour éviter une revue auto-référente et conserver l'indépendance. Les sources normatives originales restent dans le dépôt GitHub. La vérification de l'impact sur la base de l'utilisateur sera poursuivie avec l'installateur SMN-12 après confirmation et contrôle des droits.
