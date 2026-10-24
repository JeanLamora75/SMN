# SMN — Modifier les dates et heures d'une réunion depuis le calendrier

**Agent :** Amelia · **Date :** 24 octobre 2026 · **Branche :** `main`
**État :** code publié ; compilation, tests SQL et recette visuelle non exécutés depuis ChatGPT.

## Besoin et cause

Depuis une fiche modale du calendrier, un administrateur doit pouvoir décaler individuellement le début et la fin de **toute réunion** du sprint, notamment une Sprint Review issue d'un modèle récurrent. Avant correction, seuls les événements de type `ceremony` exposaient un champ Début modifiable, et Fin était non éditable.

## Contrat fonctionnel

- Champs `Début` et `Fin` : dates/heures locales éditables indépendamment, fuseau du sprint conservé.
- `Durée prévue (minutes)` : calculée automatiquement à partir des deux instants ; jamais saisie en contradiction avec eux.
- Modification **uniquement de l'occurrence choisie**, sans changement du modèle récurrent ni des autres occurrences.
- Les cérémonies Daily historiques de type `ceremony` conservent en plus leur option explicite « suivantes » via l'API déjà en place ; par défaut, une seule occurrence.
- Rôle `admin` seul habilité ; rôle `user` lecture seule ; sprint clôturé ou réunion annulée non modifiables.
- Durée positive, entière, ≤ 480 minutes (réunion récurrente/exceptionnelle) ou ≤ 600 (cérémonie), fin strictement après début, plage entièrement comprise dans le sprint, dates locales non inexistantes/ambiguës lors du changement d'heure.
- Détection des chevauchements avec les autres événements de l'équipe : avertissement non bloquant lorsque la modification est valide.
- Révision optimiste : rejet des modifications concurrentes, pas d'écrasement silencieux ; audit avant/après avec auteur et horodatage.
- Le statut de réunion, les durées réelles, les données de membres et le calendrier de sprint ne sont pas réécrits par ce changement.
- Après enregistrement, fiche et calendrier mis à jour sans quitter la page ; les deux vues Cartes / Agenda restent synchronisées.

## Implémentation

- `src/app/app/team-calendar/calendar-meeting-modal.tsx` : Début et Fin éditables + durée calculée, validation et messages localisés.
- `src/lib/calendar-local-time.ts` : `durationBetweenLocal` basée sur les instants réels.
- `src/app/api/team-calendar/meetings/[kind]/[id]/route.ts` : PATCH autorisé aux administrateurs.
- `src/server/sprints/calendar-meeting-reschedule.ts` : mutation unique dans une transaction, contrôle de révision, de sprint, de statut et historique.
- `src/server/sprints/calendar-meeting-detail.ts` : exposition de la révision aussi pour les occurrences des modèles et les réunions exceptionnelles.
- `src/i18n/fr.json`, `src/i18n/en.json` : messages FR/EN.
- `tests/calendar-meeting-reschedule.test.ts` : tests unitaires à exécuter (calcul, concurrence, limites, rôles via route, formats d'événements).

## Scénarios de recette

| N° | Scénario | Résultat attendu |
|---|---|---|
| 1 | Admin ouvre une Sprint Review de type modèle | Début et Fin éditables |
| 2 | Décaler seulement le début | Fin inchangée, durée recalculée |
| 3 | Décaler seulement la fin | Début inchangé, durée recalculée |
| 4 | Changer de jour ouvré dans le même sprint | Enregistrement et déplacement visuel de l'occurrence |
| 5 | Réouvrir l'événement, recharger la page | Valeurs sauvegardées persistantes |
| 6 | Enregistrer un chevauchement | Avertissement sans corruption de l'événement |
| 7 | Fin avant début ou heures DST ambiguës | Enregistrement refusé |
| 8 | Déplacer hors des limites du sprint | Réponse 400, sans mutation |
| 9 | Un autre utilisateur modifie entre lecture et sauvegarde | Conflit 409, sans écrasement |
| 10 | Compte `user`, réunion annulée ou sprint clôturé | Champs non modifiables et route protégée |
| 11 | Modifier Review (modèle) | Pas d'altération du modèle ni des autres occurrences |
| 12 | Réunion exceptionnelle et cérémonie standard | Modifications et historiques cohérents |
| 13 | FR/EN, thème clair/sombre, mobile et accès clavier | Modale utilisable sans perte du contexte |

## Validation Windows 11

Synchroniser `main`, puis exécuter :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm exec tsx --test tests/calendar-meeting-reschedule.test.ts tests/calendar-meeting-modal.test.ts tests/calendar-option-b-ux.test.ts
pnpm build
```

**À vérifier impérativement** : le statut, les conventions SQL PostgreSQL sur les différentes versions installées, la visibilité des modifications dans le calendrier, la restauration du focus et le cas concret de la Sprint Review décalée.

Jira inchangé. Tests automatisés GitHub Actions non utilisés.
