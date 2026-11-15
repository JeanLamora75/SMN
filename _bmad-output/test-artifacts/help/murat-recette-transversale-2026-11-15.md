# Murat — Recette transversale du module Aide SMN

**Date de revue :** 2026-11-15  
**Responsable :** Murat (QA), workflow BMAD `bmad-qa-generate-e2e-tests`, adapté à la disponibilité des connecteurs GitHub. Le dépôt ne fournit pas de skill `bmad-agent-murat` dédié. La configuration a été lue directement, sans exécuter de script `uv`.  
**Portée :** module Aide, 14 articles × FR/EN, recherche, aide contextuelle, checklist, autorisations Scrum/Kanban, intégrité des guides, packaging hors ligne, AU-01 → AU-07.

## Verdict de qualification

**Qualification automatisée : RÉUSSIE** sur [GitHub Actions — run 43692353553](https://github.com/JeanLamora75/SMN/actions/runs/43692353553), conclusion terminale **success** (contrats Aide, Chromium ×3, TypeScript, i18n et build).  
**Recette transversale complète sur installation réelle : NON ACQUISE.** Aucun test authentifié sous Next.js/PostgreSQL réel ni installation Windows ZIP hors connexion n'a été effectué au cours de cette intervention. Ne pas confondre les fixtures Chromium avec de vrais écrans métier.  
**Recommandation de sortie :** ne pas déclarer la recette utilisateur définitivement validée avant la levée des points bloquants RTE-01 à RTE-04 ci-dessous.

## Périmètre, couverture et preuves

| Contrôle | Niveau attesté | Sources ou tests | Résultat et limite |
|---|---|---|---|
| Accès `admin` / `user`, comptes inactifs et réinitialisation mot de passe | Contrat réel automatisé | `tests/help-au01-kanban-access.test.ts`, `tests/smn-459-help-catalog.test.ts` | Matrice de droits contrôlée sans session authentifiée réelle |
| Modes Scrum/Kanban, article cadence, filtres des guides | Contrat réel automatisé | `tests/help-au01-kanban-access.test.ts`, `tests/smn-469-help-contract.test.ts` | Kanban visible aux lecteurs autorisés ; création toujours administrative |
| Les 14 articles × deux langues, absence de fuites par liens | Contrat et fichiers réels | `tests/smn-467-help-guides.test.ts`, `tests/help-au03-role-safe-links.test.ts` | Routes et textes contrôlés ; pas de relecture linguistique humaine |
| FAQ vers `overview` et liens Markdown sûrs | Rendu React réel en Node | `tests/help-au06-au07-maintenance.test.ts` | Lien exact rendu et URL arbitraires rejetées ; navigation Next authentifiée non exécutée |
| Membres/Calendrier/Périodes Kanban : accès aux modales Aide | Composants réels **montés sur fixture navigateur**, pas les pages métier réelles | `tests/help-au02-context-entry.test.ts`, `tests/smn-464-help-browser.test.ts` renforcé | Vérifie mapping, GET, ouverture/fermeture et préservation des brouillons/filtres |
| Modale FR/EN, focus, Escape, mobile, sombre | Chromium réel sur fixture | `tests/smn-469-help-browser.test.ts`, `tests/smn-463-help-context-dialog.test.ts` | Chargement différé et absence de POST testés ; compatibilité du navigateur réel sur PC utilisateur non prouvée |
| Checklist, rechargement, réversibilité, isolement profil navigateur | Chromium réel sur fixture | `tests/smn-465-help-checklist-browser.test.ts` | `localStorage` testé, sans écriture PostgreSQL visible dans ce composant |
| Recherche FR/EN, index et filtrage des permissions | Fonctions et fichiers réels | `tests/smn-462-help-search.test.ts`, `tests/smn-469-help-contract.test.ts` | Index locaux vérifiés ; pas de test de charge sur données réelles |
| Packaging hors ligne et ressources embarquées | Test de copie Windows-*like* | `tests/smn-468-offline-help.test.mjs`, `scripts/windows/verify-offline-help.mjs` | Contrôle de structure et index ; **ni installation Windows ni lancement réel du ZIP** |
| Écritures métier et SQL pendant la consultation | Contrôle statique | `tests/smn-469-help-contract.test.ts` | Absence d'opérations d'écriture dans les sources Aide ; **aucune trace SQL sur PostgreSQL réel** |
| AU-04 → AU-07 : Registres/Rapports/Membres/Paramètres/FAQ | Contrats de code et contenu | `tests/help-au04-registry-documentation.test.ts`, `tests/help-au05-functional-guides.test.ts`, `tests/help-au06-au07-maintenance.test.ts` | La documentation reflète les éléments vérifiés du code, pas tous les parcours applicatifs |

### Renforcement effectué par Murat

`tests/smn-464-help-browser.test.ts` étend la matrice Chromium de deux routes à **cinq routes** :

- `/app/admin/settings` → `general-settings` (réponse d'aide indisponible simulée) ;
- `/app/tickets` → `tickets` ;
- `/app/admin/members` → `members` ;
- `/app/team-calendar` → `calendar` ;
- `/app/admin/kanban-periods` → `kanban-periods`.

Pour chaque route, le test monte le composant réel `HelpHeaderAction`, change un filtre et saisit un brouillon dans une **fixture de page**, ouvre l'aide, vérifie la requête `GET` vers le bon article, ferme avec Escape, puis contrôle la préservation des valeurs et le retour du focus. Les scénarios tournent trois fois dans la CI pour détecter les défauts intermittents. Les réponses HTTP sont simulées par un serveur local ; il ne s'agit pas d'un parcours en base.

## Recette authentifiée restante — critères de sortie

| ID | Environnement exigé | Exécution attendue | Condition de réussite |
|---|---|---|---|
| **RTE-01** | Instance SMN de recette + PostgreSQL isolé + comptes `admin`/`user` actifs et inactifs | Connexion réelle ; Centre Aide en FR/EN ; équipe Scrum puis Kanban ; articles réservés, recherche et checklist | Seuls les articles autorisés apparaissent ; absence de régression sur la création/gestion métier |
| **RTE-02** | Même instance avec données de formulaires non sensibles | Ouvrir l'aide depuis les pages réelles Membres, Calendrier et Périodes Kanban ; champs modifiés non enregistrés ; modale concurrente ; Escape, focus, clavier, mobile et zoom 200 % | Affichage correct, focus restauré, aucun brouillon/filtre effacé, pas de scroll horizontal ni perte de droits |
| **RTE-03** | PostgreSQL de recette avec journalisation des écritures ou compteur de changements | Capturer un état initial, visiter les guides, recherche, checklist et aide contextuelle puis comparer l'activité SQL et les tables métier | Aucune écriture imputable au module Aide (distinguer session/logs techniques) |
| **RTE-04** | ZIP de distribution installé sur un **autre PC Windows** sans Internet externe | Démarrer SMN et PostgreSQL portable, ouvrir les 14 articles FR/EN, rechercher, consulter la checklist et les trois aides contextuelles | Fonctionnement offline réel, chemins d'index corrects, absence de service réseau externe requis |

**Prérequis de recette :** utiliser des comptes et données fictifs ; isoler la base ; restaurer le jeu d'essai après les tests ; ne pas modifier les données de production. Une recette de suppression/restauration métier n'est pas incluse dans ce contrôle du module Aide.

## Décision QA

**Périmètre automatisé : renforcé.** Le test sur les routes AU-02 est désormais comportemental pour le bouton et la modale, mais reste une fixture.  
**Critères de sortie RTE-01 à RTE-04 : non exécutés, donc non validés.**  
**Statut recommandé :** **qualification partielle / recette réelle à réaliser** ; aucune clôture globale ni publication d'une attestation de recette Windows sur la base des seuls tests de CI.

## Preuves et liens

- [Dernier contrôle Aide après renforcement — run 43692353553](https://github.com/JeanLamora75/SMN/actions/runs/43692353553)
- [CI verte AU-06/AU-07 avant renforcement](https://github.com/JeanLamora75/SMN/actions/runs/43691262099)
- [Tests Chromium des cinq routes](https://github.com/JeanLamora75/SMN/blob/main/tests/smn-464-help-browser.test.ts)
- [Contrats de sécurité et d'absence de mutation](https://github.com/JeanLamora75/SMN/blob/main/tests/smn-469-help-contract.test.ts)

Aucun script `uv` exécuté ; aucun changement d'API, de permissions, de base de données ou de ticket Jira.
