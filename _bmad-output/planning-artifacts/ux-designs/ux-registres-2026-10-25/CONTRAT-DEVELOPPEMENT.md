# Contrat de développement Amelia — Refonte du registre global SMN

**Conception UX approuvée :** UX-REG-01 à UX-REG-21, 25/10/2026. **Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228). **Stories :** [SMN-239](https://lmn24.atlassian.net/browse/SMN-239) à [SMN-253](https://lmn24.atlassian.net/browse/SMN-253).

Lire impérativement [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [SYNTHESE-UX-REGISTRES.md](SYNTHESE-UX-REGISTRES.md) et [RECETTE-UX.md](RECETTE-UX.md), puis le référentiel `docs/UX-REFERENTIEL-BMAD.md`. **Ce contrat ne déclare aucun développement terminé.**

## Invariants
1. Base code et architecture `main` ; réutiliser `src/app/app/admin/registries`, les API et règles métier Epic 5 plutôt que créer un deuxième registre.
2. Six types conservés et statuts `src/lib/registry-types.ts` ; aucun statut `archived` nouveau. Le fait marquant `recorded` appelle une décision spécifique pour le filtre actif/final.
3. Équipe autorisée résolue serveur ; pas de cycle implicite dans le registre global ; profils MVP admin (écriture) et user (lecture collective), confidentialité des responsables déjà restreinte.
4. L'onglet Registres de la **fiche Sprint SMN-234** est un autre contexte. Garder son accord D8 (six types/faits automatiques, événements/snapshots figés Vn des cycles clos, lecture historique, liens, modales, pagination 25). Aucune substitution par des valeurs actuelles.
5. Aucune donnée fictive, risque non évalué ≠ risque faible, donnée indisponible ≠ zéro, date métier seule ≠ 00:00 ; affichage FR/EN centralisé.
6. Les créations de décisions/actions/faits depuis des réunions existantes continuent de fonctionner ; ne pas réécrire l'ancien `comment` comme faux fil multi-messages.
7. Les interactions affichent un succès après transaction réellement validée, jamais lors d'un appel échoué ; protection 409/concurrence.
8. Les exceptions de droit ou de suppression non décidées ne seront pas « résolues » silencieusement par Amelia.

## Lots recommandés et Stories
| Lot | Story | Livrable incrémental | Dépendance |
|---|---|---|---|
| R1 | [SMN-239](https://lmn24.atlassian.net/browse/SMN-239) | Tous les types par défaut, équipe, filtres, actifs/final, tri/pagination | SMN-90/97 |
| R2 | [SMN-240](https://lmn24.atlassian.net/browse/SMN-240) | Vue Liste enrichie et signalétique factuelle | R1, SMN-104 |
| R3 | [SMN-241](https://lmn24.atlassian.net/browse/SMN-241) | Vue Cartes exclusive + préférence propre au module | R1/R2 |
| R4 | [SMN-242](https://lmn24.atlassian.net/browse/SMN-242) | Bandeau points d'attention repliable | SMN-104 ; R1 |
| R5 | [SMN-243](https://lmn24.atlassian.net/browse/SMN-243) | Bandeau fiche, onglets communs/métier, consultation | SMN-89/90 |
| R6 | [SMN-244](https://lmn24.atlassian.net/browse/SMN-244) | Synthèse en 2 colonnes avec zones contextuelles | R5 |
| R7 | [SMN-245](https://lmn24.atlassian.net/browse/SMN-245) | Modales édition par section et protections | R5 |
| R8 | [SMN-246](https://lmn24.atlassian.net/browse/SMN-246) | Création complète en modale + retour contextuel | R1 ; SMN-89 |
| R9 | [SMN-247](https://lmn24.atlassian.net/browse/SMN-247) | Commentaires autonomes persistés, versionnés, retrait logique | SMN-89, audits |
| R10 | [SMN-248](https://lmn24.atlassian.net/browse/SMN-248) | Journal UI, commentaire rapide et filtres | R6/R9 |
| R11 | [SMN-249](https://lmn24.atlassian.net/browse/SMN-249) | Action/Décision/Fait liés créés depuis journal | R8/R9/R10, SMN-106 |
| R12 | [SMN-250](https://lmn24.atlassian.net/browse/SMN-250) | Relations groupées, recherche titre/type et confirmation | R5 ; SMN-97 |
| R13 | [SMN-251](https://lmn24.atlassian.net/browse/SMN-251) | Historique chronologique et détails de révisions | R5/R9 |
| R14 | [SMN-252](https://lmn24.atlassian.net/browse/SMN-252) | Navigation contexte initial et fil d'Ariane | R1/R5/R12 |
| R15 | [SMN-253](https://lmn24.atlassian.net/browse/SMN-253) | Responsive, a11y, i18n et recette transverse | Tous ; checks par lot dès R1 |

## Séquencement pratique
- **Incrément A (première valeur visible)** : R1 → R2 → R3 et R4, avec règles d'état vide / pagination / confidentialité testées.
- **Incrément B (consultation)** : R5 → R6 ; R7 et R8 selon APIs existantes.
- **Incrément C (persistance / audit)** : R9 (modèle et API), puis R10 → R11 ; migrations additives et reprise du commentaire legacy étudiée avant exécution.
- **Incrément D (navigation et restitution)** : R12, R13 et R14.
- **Incrément E (recette)** : R15 termine les contrôles de bout en bout ; la qualité/accessibilité/I18N se teste **dès chaque incrément**.

## Architecture et précautions concrètes
- Inventorier schéma PostgreSQL, API `/api/admin/registries`, `registry-create.tsx`, `registry-list.tsx`, `registry-relations.tsx`, `registry-history.tsx`, `attention-cockpit.tsx`, `registry-cycles.tsx`, ainsi que `decision-actions` et intégration réunions.
- Journal : modèle de commentaire **additif, append-only pour audit**, historique des corrections et retrait logique ; accès contrôlé en transaction, sans écraser `smn_registry_item.comment` historiquement. Étudier migration/lecture legacy séparément et proposer stratégie testable avant migration de données.
- Filtre actif/final : ne pas présumer `highlight.recorded`, documenter une décision métier avant branchement. Statuts métiers inchangés.
- Alertes : réemployer SMN-104, seuils existants, raison explicite, et ne pas synthétiser des scores arbitraires.
- Historique : l'UI ne peut pas étendre implicitement la lecture à `user` ; préserver permission actuelle jusqu'à validation métier.
- Relations : retrait de lien ≠ suppression d'enregistrement ; les cycles clos et snapshots Vn sont immuables selon contrats.
- Styles : Bootstrap, Bootstrap Icons et tokens SMN ; aucune nouvelle bibliothèque obligatoire ; FR/EN dans JSON centralisés.

## Definition of Done obligatoire pour chaque Story
Code vérifié sur branche de travail/commit ; tests ciblés exécutés et résultats tracés ; `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` lorsque exécutables ; migrations exécutées/vérifiées avant revendication ; preuves FR/EN, admin/user, Scrum/Kanban, thème clair/sombre, vue mobile/desktop et clavier. Sur PC Windows 11 sans droits admin : Node/pnpm/PowerShell/GitHub Desktop ; pas d'obligation IDE, Codex CLI ou Docker. GitHub Actions désactivées : ne pas prétendre à une CI réussie.

**Toute divergence contractuelle doit être remontée au commanditaire avant changement de règle métier.**
