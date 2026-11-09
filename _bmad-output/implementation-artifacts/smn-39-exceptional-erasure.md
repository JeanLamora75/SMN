# SMN-39 — Effacement et anonymisation exceptionnels traçables

**Date :** 09/11/2026. **Statut : partiellement développé ; aucune exécution destructive disponible.**
- Jira : https://lmn24.atlassian.net/browse/SMN-39
- Epic : SMN-2
- Dépendances : SMN-38 (analyse d'impact), SMN-35/36/37 selon périmètre, SMN-40 (barrière de non-réintroduction), SMN-34 (restauration).
- Référence projet : `docs/PROJECT-CONTEXT.md`, ADR-I0-003, SMN-33/34/40.

## Livré dans ce lot

- `src/server/backup/exceptional-erasure-policy.ts` : contrat strict d'analyse des neuf familles d'impacts (fiches personnelles, associations, calendriers, historiques, textes libres, pièces privées, PDF/TXT archivés, indicateurs collectifs, sauvegardes gérées) et validation d'un plan de durée limitée et d'une confirmation distincte.
- Exigence d'une justification explicite pour les éléments touchés, protection des archives immuables, refus de déclarer une anonymisation si des possibilités de réidentification persistent, refus de conserver un indicateur collectif réidentifiable.
- `src/server/backup/erasure-evidence-format.ts` : format minimal d'événement d'effacement, sans identité, nom ou contenu individuel. Chaîne HMAC-SHA256 vérifiable en mémoire contre altération/reclassement des entrées ; **ce format seul ne prouve pas la complétude d'un registre** et aucun journal durable n'a encore été installé.
- `tests/exceptional-erasure-policy.test.ts` : tests ciblés rédigés, non exécutés sur le poste Windows.
- Aucune route d'exécution d'effacement, aucun `DELETE` SQL et aucune suppression/altération de PDF/TXT n'ont été ajoutés.

## Modèle d'exécution complet à construire

1. **SMN-38**, dossier de prévisualisation réellement relié aux producteurs de données : recenser objets, équipe, références historiques, pièces privées, textes libres, versions de rapports et métriques ; compter les impacts **côté serveur** et calculer une révision/snapshot du périmètre.
2. **Confirmation** : session Administrateur fraîche, confirmation distincte incluant l'identifiant du plan, révision inchangée, expiration courte, absence de demandes parallèles ; aucun plan fourni par le client ne doit être considéré comme une preuve. Une simple entrée `confirm:true` est insuffisante.
3. **Exécution** : verrouillage PostgreSQL et opérations atomiques sur chaque périmètre ; audit fiable de succès et d'échec, sans identifiant personnel en clair dans les journaux ; ne pas déclarer un succès global après un effet partiel. Les documents immuables doivent être révoqués par décision de contrôle d'accès ou remplacés par une **nouvelle** version expurgée, jamais réécrits silencieusement.
4. **Preuve pérenne hors base restaurable** : registre minimal append-only, stockage protégé et durable, coordination avec l'effacement de la base, relecture et réparation explicite des états interrompus ; ancre indépendante pour prouver qu'un registre n'a pas été tronqué. Un HMAC de chaîne seul n'empêche pas la troncature. Le registre doit aussi tracer la **couverture depuis l'origine**, sans inventer l'absence d'événements avant sa mise en place.
5. **SMN-40** : analyser tous les marqueurs depuis la date de la sauvegarde ; si un effacement a eu lieu après capture, garder la restauration bloquée, sauf reconstruction expurgée isolée avec preuves et garantie de non-réidentification.
6. **Requalification des copies** : les sauvegardes gérées et copies exportées sont signalées. SMN ne peut ni supprimer ni surveiller automatiquement les copies hors du dossier géré ; la politique de rétention des sauvegardes ne supprime pas les archives métier.

## Traçabilité AC1–AC5

| AC | État |
|---|---|
| AC1 | Politique de plan expirant + confirmation explicite conçue ; analyse exhaustive SMN-38 et moteur destructif absents |
| AC2 | Vérification théorique du risque de réidentification dans les plans ; analyse réelle des données absente |
| AC3 | Garde-fou sur archives PDF/TXT immuables ; révocation ou nouvelle version non implémentées |
| AC4 | Garde-fou sur indicateurs collectifs réidentifiables ; pas de requalification des valeurs en base |
| AC5 | Format minimal d'audit créé ; pas d'audit durable ni de reprise sur échec attestée |

## Tests et limites

Contrôle statique GitHub à réaliser ; `pnpm exec tsx --test tests/exceptional-erasure-policy.test.ts`, `pnpm i18n:check`, `pnpm typecheck`, `pnpm test` et recette Windows/PostgreSQL sur installation de test restent à exécuter. L'existence du code et des tests ne constitue pas une recette.

**Pour protéger les données de travail, aucune exécution d'effacement n'est exposée.** SMN-39 ne peut être terminée tant que SMN-38 et l'orchestration vérifiable ne sont pas disponibles. Les garanties nécessaires à SMN-40 ne sont pas levées par la seule création d'un format d'audit.

## Adaptation BMAD
Le script `uv` prévu par `.agents/skills/bmad-build/SKILL.md` n'est pas exécutable directement sur GitHub. Ce lot a utilisé les connecteurs GitHub et Jira ; aucune exécution de workflow `uv` ni de test automatisé n'est revendiquée.
