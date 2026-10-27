# SMN-297 — Formulaire de replanification des cérémonies

Le composant `scoped-ceremony-detail.tsx` comporte maintenant deux champs de date/heure locale, utilise les conversions de fuseaux de `calendar-local-time` et envoie la modification à l'API contextualisée `ceremonies/reschedule` avec `teamId`, `ceremonyId` et `revision`. Le service reste fermé par `MULTI_TEAM_CONTEXT_READY=false`.

**Reste à finaliser :** raccordement du callback de rafraîchissement du Calendrier après modification ; deux tentatives d'écriture GitHub sur le composant parent ont échoué. Le callback est temporairement facultatif afin de préserver la compilation. Test source ajouté mais non exécuté ; aucun test, build, migration ou activation.

## Complément — rafraîchissement raccordé

Le composant parent `team-calendar-view.tsx` transmet désormais `onSaved` à `ScopedCeremonyDetail` pour incrémenter `refreshToken` après modification. Le test source vérifie ce branchement. Le blocage de publication précédent est donc levé ; compilation et tests fonctionnels restent à effectuer sur le PC de développement. La disponibilité multiéquipes reste bloquée.
