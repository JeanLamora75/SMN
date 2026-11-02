# SMN-375 — Recette et preuves de validation du Dashboard Builder

**État : PRÉPARÉ — NON EXÉCUTÉ — NON VALIDÉ.** Publication de tests ≠ résultat de test.

## Références et traçabilité
- UX-DB-01 à UX-DB-33 et MAQ-DB-01 à MAQ-DB-10 : [matrice versionnée](../../src/lib/dashboard-builder/acceptance-traceability.ts).
- RX-01 à RX-22 : dossier UX BMAD, § 9.
- Vérification de complétude automatisée : `pnpm test:smn-375`.

## Recette locale Windows 11
Dans PowerShell, depuis le dépôt à jour :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smn-375-windows-validation.ps1 -IncludeDatabase -IncludeFullSuite
```

Le script collecte les codes de retour, versions Node/pnpm, commit Git et journaux sous `_bmad-output/implementation-artifacts/smn-375-evidence/<date>/`. Ce répertoire contient des **preuves uniquement après exécution sur le poste de recette**. Ne pas déposer de secrets, données personnelles ou fichiers d'environnement dans GitHub.

## Registre manuel de recette RX
Pour chacun des 22 scénarios du dossier UX, relever : **statut** (Non exécuté / Conforme / Écart / Bloqué), **équipe et mode** (Scrum/Kanban), **jeu de données fictif**, **navigateur**, **date/heure**, **preuve locale** (capture ou journal expurgé), **issue de défaut Jira**.

| Série | Parcours | Supports obligatoires |
|---|---|---|
| RX-01 à RX-05 | Structure, création, assistant, modifications | Chrome/Edge, FR |
| RX-06 à RX-09 | Réorganisation, suppression, modèles, géométries | Desktop et tactile |
| RX-10 à RX-13 | Cycle, réseau, brouillon, conflits | Deux équipes, deux sessions |
| RX-14 à RX-16 | Réinitialiser et copier | Cible vide/existante, permissions |
| RX-17 à RX-19 | Responsive, clavier, focus, tailles | Mobile, lecteur d'écran, zoom 200 % |
| RX-20 à RX-22 | Isolation, historiques, en-tête | Scrum/Kanban, cycles clos et actifs |

Pour RX-18 : parcourir par Tab/Shift+Tab, Entrée, Espace, Escape ; vérifier focus initial/restitué des dialogues, libellés accessibles et contrastes clair/sombre, palettes existantes. Pour RX-21 : comparer valeurs des snapshots de cycles clos au système de référence v33.

## Garde-fous de lancement
Interdire `SMN_DASHBOARD_BUILDER_CUTOVER=enabled` avant :
1. Résultats `typecheck`, `lint`, suite unitaires et intégration PostgreSQL réellement verts.
2. Exécution et preuve des RX-01 à RX-22 (FR/EN, responsive, thèmes).
3. Adaptateurs historiques incomplets corrigés (capacités, objectifs, liens, calendrier, snapshots) ; remplacement SMN-374 vérifié.
4. Approbation fonctionnelle utilisateur inscrite dans Jira.

**Absence de preuve = critère non validé.** Les écarts bloquants identifiés doivent être corrigés avant clôture de SMN-375.
