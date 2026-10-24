# SMN — Correction architecturale des cérémonies ancrées début/fin de Sprint

**Date :** 23 octobre 2026 — correctif proposé et implémenté sur branche dédiée.  
**Origine :** recette de l'utilisateur sur le calendrier central : Sprint clos un dimanche, Review/Rétrospective générées le dimanche au lieu du dernier jour ouvré.

## Constat vérifié

`src/server/sprints/template-occurrences.ts` utilisait le jour civil local de `sprint.endAt` pour un modèle `frequency=sprint,position=end`. Si le Sprint terminait un dimanche, ce jour était considéré comme la date de la cérémonie. Même erreur possible pour un Sprint commençant un samedi/dimanche.

## Décision MVP (sans enrichir les modèles)

- `position=start` : **premier jour ouvré disponible compris dans les bornes temporelles du Sprint**.
- `position=end` : **dernier jour ouvré disponible compris dans ces mêmes bornes**.
- Jours ouvrés : lundi à vendredi, à l'exclusion des fermetures d'équipe actives et des jours fériés connus du pays de référence de l'installation. **Aucune déduction depuis les absences individuelles** des membres.
- Horaires : conserver `local_time` et `duration_minutes` du modèle lorsqu'ils rentrent dans les créneaux de travail configurés ; si nécessaire, repositionner au début (start) ou à la fin (end) d'un segment ouvré pouvant accueillir la durée. Les dates et heures restent dans le Sprint, sans déborder sur le weekend.
- Une équipe sans créneaux configurés conserve l'heure explicitement définie dans chaque modèle, et profite néanmoins de la correction des dates ouvrées. **Aucun horaire implicite n'est inventé**. Pour garantir le respect des heures ouvrables, l'administrateur doit configurer les créneaux de l'équipe.
- En cas de décalage entre fuseaux du Sprint et des créneaux, ou d'absence totale de jours ouvrés pour les modèles ancrés, ne pas fabriquer de réunion : produire une erreur explicite.
- Les modèles `daily` ne créent plus d'occurrences pendant les jours non ouvrés (fériés, fermetures, weekends). Les modèles `weekly` gardent le jour de semaine explicitement choisi par l'administrateur, y compris le dimanche si celui-ci le souhaite.
- Les quatre modèles standard (Planning, Daily, Review, Rétrospective) restent des modèles ordinaires configurables et activables/désactivables. Aucun champ supplémentaire ni moteur de règles de placement n'est introduit.

## Exemple de recette

Pour un Sprint **du lundi 9 novembre au dimanche 22 novembre 2026 inclus**, dans le fuseau `Europe/Paris`, avec travail **09:00–12:00 / 13:00–18:00** :

| Modèle actif | Horaire enregistré | Nouvelle occurrence attendue |
| --- | --- | --- |
| Sprint Planning (start) | 09:30, 120 min | Lundi 9 novembre, 09:30–11:30 |
| Sprint Review (end) | 15:00, 60 min | Vendredi 20 novembre, 15:00–16:00 |
| Sprint Retrospective (end) | 16:30, 60 min | Vendredi 20 novembre, 16:30–17:30 |
| Daily (daily) | 09:00, 15 min | Jours ouvrés, sans 11 novembre si férié du pays de référence |

Si le **20 novembre est une fermeture d'équipe**, Review et Retro sont générées sur le jeudi 19 novembre. Si le 19 est aussi une fermeture, elles sont reportées au mercredi 18.

## Modifications et non-régressions

- Moteur `planTemplateOccurrences` : planning pur, testable, fondé sur les jours civils locaux, les instants UTC et les intervalles `[start,end)`.
- `saveTemplateOccurrences` : consultation des fermetures, jours fériés et plages de travail de l'équipe ; aucune requête d'écriture ajoutée aux anciens Sprints.
- Assistant `wizard.ts` : empreinte d'aperçu désormais liée aux créneaux, jours fériés et fermetures. Si ces données changent entre aperçu et confirmation, le jeton est refusé comme périmé.
- Pas de migration PostgreSQL, pas de changement de tables, pas de modification des modèles.
- **Important : les occurrences déjà générées restent inchangées**. Pour observer le correctif dans le calendrier, générer un **nouveau** Sprint de test, sans préjuger d'une migration rétroactive.
- Cas limites : durée ne rentrant dans aucun segment ouvré ; absence de jour ouvré ; fuseaux non cohérents ; DST ; Sprint débutant ou terminant en cours de journée.

## État des vérifications

- Code et tests ciblés `tests/smn-233-working-day-template-anchors.test.ts` publiés sur branche.
- Vérifications de contenu GitHub possibles sans exécution de Node/PostgreSQL.
- `pnpm typecheck`, `pnpm test`, `pnpm build` et tests du calendrier réel sur PC utilisateur **non exécutés** ici.
- Aucune migration automatique des données existantes, aucun changement Jira, aucune fusion sur `main` dans ce correctif sans demande spécifique.
