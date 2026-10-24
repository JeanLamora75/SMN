# SMN — UX Calendrier Option B (24 octobre 2026)

**Statut : décision UX approuvée pour cette évolution ; implémentation et recette non réalisées.**
**Autorité :** nouveaux `DESIGN.md` (présentation) et `EXPERIENCE.md` (comportement) pour les ajouts spécifiques à l'option B ; les contrats du 22/10/2026 restent applicables à toute règle non remplacée. En cas de contradiction, la décision explicite du 24/10/2026 prime **uniquement** pour le périmètre qu'elle modifie. La maquette HTML est la référence de disposition illustrative ; ses dates/données et sa simulation sur 14 jours ne sont pas des règles fonctionnelles.

## Livrables

- [`DESIGN.md`](DESIGN.md) : composition, densité, pictogrammes, hiérarchie, états et thèmes.
- [`EXPERIENCE.md`](EXPERIENCE.md) : navigation, calendrier, filtres, rôles, calcul des absences, comportements et parcours.
- [`RECETTE-UX.md`](RECETTE-UX.md) : critères vérifiables, jeux de test et preuves à fournir.
- [`MAQUETTE-CALENDRIER-OPTION-B.html`](MAQUETTE-CALENDRIER-OPTION-B.html) : prototype HTML interactif, données fictives, sans intégration SMN.
- [`PROMPT-AMELIA.md`](PROMPT-AMELIA.md) : consigne prête à transmettre à l'agent développeur BMAD.

## Choix approuvés

1. **Option B :** vue **Cartes** par défaut + vue **Agenda** complémentaire, accessibles depuis la barre d'outils du calendrier.
2. **Absences :** pour chaque date comptant au moins un membre réellement absent, afficher **une et une seule ligne** `Absences (N)` (libellé FR de référence) **en toute première position**, avant cérémonies et autres événements, **sans nom ni motif**, dans **les deux vues**. `N` désigne le nombre de **membres distincts** de l'équipe pour lesquels une absence enregistrée recouvre cette date, et non le nombre d'enregistrements, ni le nombre de personnes indisponibles pour d'autres raisons.
3. Conserver les règles existantes du calendrier (7 cartes/rangée depuis la première date de la période, période entière, dates inclusives, jours fériés/week-ends, aujourd'hui, deux actions de création en pied, droits, modales, FR/EN, thèmes).

## Source du référentiel et du code (lecture GitHub du 24/10/2026)

- [Skill Sally](https://github.com/JeanLamora75/SMN/blob/main/.agents/skills/bmad-agent-ux-designer/SKILL.md)
- [Workflow UX BMAD](https://github.com/JeanLamora75/SMN/blob/main/.agents/skills/bmad-ux/SKILL.md)
- [Référentiel UX](https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md)
- [Contrat calendrier 22/10](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md)
- [Recette calendrier 22/10](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-RECETTE-UX.md)
- [Vue existante](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/team-calendar/team-calendar-view.tsx)
- [Projection collective](https://github.com/JeanLamora75/SMN/blob/main/src/server/members/central-calendar.ts)
- [Lecture d'équipe](https://github.com/JeanLamora75/SMN/blob/main/src/server/members/team-calendar.ts)

**Publication :** ces fichiers constituent un paquet documentaire local, **non publié sur GitHub ni sur Jira**. Emplacement cible suggéré une fois autorisé : `_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/`.

## Suivi d'implémentation (Amelia — 24 octobre 2026)

Les contrats ci-dessus restent la référence approuvée et décrivent l'état du transfert UX au moment de leur création. **Le code de l'option B a ensuite été publié sur `main`**, mais l'exécution des tests d'intégration, les captures d'écran de l'application et la validation visuelle utilisateur restent à réaliser.

État réel, vérifications et matrice UXB-01 à UXB-30 : [Rapport d'implémentation Amelia](../../../implementation-artifacts/uxb-calendrier-option-b-avancement-2026-10-24.md).
