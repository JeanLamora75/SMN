# SMN — Recette UX de l'option B (24/10/2026)

**Statut : critères de validation rédigés ; aucun test exécuté.** Ils s'ajoutent, sans remplacer les vérifications du [22/10/2026](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-RECETTE-UX.md). État de chaque test à renseigner par Amelia : `À faire` / `Validé` / `Échec` / `Non applicable`, avec preuve et date.

| ID | Scénario vérifiable | Attendu impératif |
|---|---|---|
| UXB-01 | Premier accès au calendrier | Vue **Cartes** visible ; bascule explicite `Cartes / Agenda` |
| UXB-02 | Cliquer `Agenda`, puis `Cartes` | Deux vues exclusives, même équipe, même cycle, même plage de dates, aucune mutation |
| UXB-03 | Un membre absent toute la journée | Une seule ligne **`Absences (1)`** en tête de jour dans les deux vues |
| UXB-04 | Deux membres absents sur une même date | Une seule ligne **`Absences (2)`**, pas deux fiches distinctes |
| UXB-05 | Même membre absent matin et après-midi via deux records | **`Absences (1)`**, déduplication par membre et par jour |
| UXB-06 | A a deux records, B a un record | **`Absences (2)`**, exemple critique de non-double-comptage |
| UXB-07 | Uniquement jour férié national (sans absence déclarée) | Aucun `Absences (N)` ; férié signalé selon contrat précédent |
| UXB-08 | Uniquement fermeture entreprise (sans absence déclarée) | Aucun `Absences (N)` ; fermeture distincte |
| UXB-09 | Férié + absence réelle d'un membre | `Absences (1)` + jour férié distinct, sans faux `Absences (tous)` |
| UXB-10 | Absence + réunion à 08:00 | **Absences toujours PREMIÈRES**, les réunions suivantes triées chronologiquement |
| UXB-11 | Aucune absence | Pas de ligne `Absences (0)` ni de bloc vide réservé |
| UXB-12 | Plusieurs événements et absence | Ligne absence **unique, sans seconde ligne d'horaires, sans motif ou nom**, titres de réunions lisibles |
| UXB-13 | Filtre `Absences` désactivé | Bande d'absences disparaît dans Cartes **et** Agenda ; données inchangées |
| UXB-14 | Basculer de vue avec filtres actifs | Préservation de filtres, période et contenus ; pas de nouvelle requête de mutation |
| UXB-15 | Connexion `user` en lecture seule | `Absences (N)` affiché, aucun `memberId`, nom, motif ou catégorie individuelle dans JSON API et dans DOM/tooltip |
| UXB-16 | Connexion `admin` | Agrégat cohérent, actions visibles seulement selon permission ; détails privés non développés dans le bandeau collectif |
| UXB-17 | Période Scrum de 3–4 semaines / Kanban d'un mois | **Toute la période incluse**, pas de troncature à 14 jours ; grille 7/rangée desktop |
| UXB-18 | Pas de période définie | Mois civil complet 28/29/30/31 jours, premières et dernières dates présentes |
| UXB-19 | Sprint commençant mercredi | Première case et en-têtes à partir du mercredi, sept jours par rangée, pas de trous avant le Sprint |
| UXB-20 | Changement de mois/année, heure d'été/hiver | Dates des absences exactes selon dates métier et fuseau équipe ; aucune erreur J−1 |
| UXB-21 | Samedi et dimanche | Jours grisés, événements visibles, **aucun +** |
| UXB-22 | Jour férié en semaine et admin autorisé | Fond grisé, libellé proche de la date, boutons `+ Réunion`/`+ Absence` en pied |
| UXB-23 | Créer réunion puis absence autorisées | Modales centrées distinctes et dates préremplies ; rafraîchissement après succès ; aucun doublon |
| UXB-24 | Compteur inconnu ou API en erreur | État explicite ; ne pas convertir en `0` ni afficher des informations périmées comme courantes |
| UXB-25 | Dark mode et palettes SMN | Types, textes, focus, jours spéciaux, états lisibles sans valeurs hardcodées inappropriées |
| UXB-26 | FR / EN et clavier / zoom 200% / mobile 320px | Libellés localisés, bascule exploitable, focus visible, lecture complète des contenus, Agenda sans horizontal obligatoire |
| UXB-27 | Icônes des cérémonies | **Bootstrap Icons** correspondant aux types identifiés, icône générique en repli, pas de dépendance à un emoji seul |
| UXB-28 | Comparaison maquette et écran réel | Capture côte à côte : header, toolbar, 7 cartes, ordre absence-réunions, hauteur compacte, pied actions ; écarts justifiés |
| UXB-29 | Vérification des agrégats côté serveur | `reportedUnavailable` (inclut congé/férié/fermeture) **n'est pas** employé comme nombre de déclarations d'absence ; N distinct |
| UXB-30 | Absence supprimée logiquement ou corrigée | Compteur mis à jour à la relecture ; aucun record supprimé pris en compte et aucune réécriture d'historique figé |

## Preuves à remettre pour revue métier

1. Captures : **Cartes et Agenda** sur une **même** période, avec une journée `Absences (2)` en première ligne ; capture sans absence ; férié semaine ; week-end ; thème sombre ; mobile.
2. Test de données A/A/B = `Absences (2)` démontré, non seulement simulé dans le prototype.
3. Exemple JSON d'un compte `user` épuré et contrôle serveur de droits ; vérifier absence d'IDs de membre, de catégories et motifs.
4. Résultats locaux des commandes effectivement disponibles (`pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, tests ciblés puis `pnpm build`) et vérification manuelle navigateur. **GitHub Actions est indisponible**, ne pas annoncer de CI.
5. Comparatif des écarts résiduels au prototype, preuves de respect du contrat du 22/10 et liste des éventuels blocages fonctionnels à faire arbitrer.

**Critère de clôture :** pas de déclaration « conforme à la maquette » tant que toutes les exigences bloquantes sont vérifiées et que l'utilisateur n'a pas validé visuellement le résultat.