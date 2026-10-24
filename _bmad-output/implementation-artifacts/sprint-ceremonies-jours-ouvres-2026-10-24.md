# SMN — Cérémonies automatiques aux bornes ouvrées des sprints

**Date :** 24 octobre 2026. **Agent :** Amelia. **État :** implémentation publiée sur `main`, tests locaux et validation visuelle à effectuer.

## Défaut et règle confirmée

Le générateur des modèles `frequency="sprint"` calculait une occurrence `position="end"` sur le **dernier jour civil** du sprint. Si le sprint finissait un dimanche, la Review et la Rétrospective étaient créées le dimanche. Même anomalie possible au début, si le premier jour était non ouvré.

**Règle métier demandée :**
- **Début de sprint :** premier jour ouvré inclus dans l'intervalle, au premier créneau ouvré (les horaires définis dans la première heure sont conservés, par exemple Planning à 09:30 pour une journée ouverte à 09:00) ;
- **Fin de sprint :** dernier jour ouvré inclus dans l'intervalle ; plusieurs événements de fin sont positionnés sans chevauchement entre eux et **terminent au plus tard avant le début de la dernière heure ouvrée** (si l'équipe finit à 18:00, borne 17:00) ;
- les jours samedi/dimanche, les fermetures d'entreprise actives, et les jours fériés observés par tous les membres affectés sont exclus pour les événements **début/fin** ;
- les jours fériés individuels d'un sous-ensemble de l'équipe ne rendent pas le jour entier non ouvré pour l'équipe ;
- le paramétrage effectif des tranches de travail de l'équipe prévaut ; en absence de tranches enregistrées, 09:00–12:00 / 13:00–18:00 est utilisé, dans le fuseau du sprint ;
- la durée configurée et l'ordre chronologique des événements sont conservés tant qu'un emplacement conforme existe. Sinon, génération impossible (pas d'événement tronqué ni de report hors sprint).
- les récurrences `daily` et `weekly` gardent leurs jours/heures configurés et ne sont pas déplacées par la correction des modèles début/fin.
- les dates du sprint, son statut, les règles d'historisation et les autorisations ne changent pas.

## Exemple — capture du défaut

Sprint du lundi 9 novembre au dimanche 22 novembre 2026, fuseau Europe/Paris, travail 09:00–12:00 et 13:00–18:00, modèles Review 15:00–16:00 et Retro 16:30–17:30.

**Attendu pour toute nouvelle génération :**
- Sprint Planning : lundi 9 novembre à 09:30 si ce jour n'est pas une fermeture collective ;
- Sprint Review : vendredi 20 novembre, 15:00–16:00 ;
- Sprint Retrospective : vendredi 20 novembre, 16:00–17:00 ;
- fin administrative du sprint : dimanche 22 novembre, inchangée.

Si le vendredi 20 novembre est une fermeture collective, les deux événements de fin se placent le **jeudi 19 novembre**.

## Points d'implémentation

- `src/server/sprints/template-working-boundaries.ts` — calcul pur, déterministe, des occurrences selon les dates, créneaux de travail et jours interdits.
- `src/server/sprints/template-occurrences.ts` — lecture des tranches d'équipe, fermetures et jours fériés collectifs, utilisation du calcul ci-dessus.
- `src/server/sprints/ceremonies.ts` — point d'entrée existant `saveGeneratedCeremonies`, utilisé par `creation.ts`, `batch-confirm.ts` et `wizard.ts`, préservé.
- `tests/sprint-templates-working-boundaries.test.ts` — cas de bornes non ouvrées, fermeture, jour férié collectif, fuseau/DST, créneaux personnalisés, plusieurs sprints et récurrences préservées.
- `tests/smn-232-template-only.test.ts` — non-régression du principe « seuls les modèles actifs ».

## Important pour les sprints déjà créés

**La correction n'est pas rétroactive.** Elle s'applique aux **nouvelles** générations. Les cérémonies déjà écrites le dimanche ne sont pas modifiées automatiquement : leur historique et d'éventuelles qualifications doivent être préservés. Un rattrapage dédié, validé par l'utilisateur, serait nécessaire pour les deux sprints existants. Pas de mutation SQL des événements historiques dans ce correctif.

## Recette locale demandée

```powershell
pnpm typecheck
pnpm lint
pnpm exec tsx --test tests/sprint-templates-working-boundaries.test.ts tests/smn-232-template-only.test.ts tests/smn-231-sprint-wizard.test.ts
pnpm build
```

**Aucun succès de test applicatif n'est revendiqué :** les contrôles réalisés depuis ChatGPT sont uniquement structurels, sur les sources publiées. GitHub Actions reste indisponible.
