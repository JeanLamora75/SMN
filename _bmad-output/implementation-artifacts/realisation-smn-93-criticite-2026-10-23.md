# SMN-93 — Criticité des risques 3×3 — 23/10/2026

Jira : https://lmn24.atlassian.net/browse/SMN-93

## Réalisation publiée sur main
- Calcul pur dans `src/lib/risk-criticality.ts` : probabilité/impact facultatifs 1–3 ; P×I ; 1–2 faible, 3–4 moyenne, 6–9 élevée ; si un champ est absent, score NULL et niveau non évalué.
- Persistance indépendante du ROAM dans `smn_risk_assessment` et audit `smn_risk_assessment_audit`, table créée uniquement lors d’une mutation admin.
- `GET/PATCH /api/admin/registries/[id]/assessment` : session, rôle, équipe et type risque vérifiés, version optimiste, écritures et audit atomiques, aucun changement de classification ROAM.
- Fiche Risque : deux sélecteurs facultatifs, calcul immédiat indiqué **provisoire** si différent des valeurs enregistrées, texte et symbole en plus de la couleur, bouton Enregistrer distinct.
- Traductions FR/EN ; tests exhaustifs des neuf combinaisons ajoutés dans `tests/smn-93-risk-criticality.test.ts`.

## Limites et recette
- AC1–AC5 implémentés dans le code ; test intégré PostgreSQL, recette lecteur/admin, build et test clavier non réalisés dans cette session.
- Les alertes cockpit / filtres avancés et instantanés de clôture ne consomment pas encore ce nouveau service : intégration à poursuivre avec les Stories dédiées. Les aperçus ne sont jamais sauvegardés par simple modification locale.
- Les anciennes éditions ROAM ne touchent pas ces deux champs ; aucune relation aux rapports PDF historiques ajoutée.
- Pas de GitHub Actions ; aucun état Jira modifié.

## Validation Windows
```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-93-risk-criticality.test.ts
pnpm i18n:check
pnpm build
```
