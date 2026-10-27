# SMN-282 — Implémentation du rendu Sprint figé (27 octobre 2026)

## Code publié

- Nouvelle page `src/app/app/admin/sprints/[id]/report/preview/page.tsx`, dont le rendu dépend uniquement de la référence figée vérifiée.
- Vérification de la session, du rôle et des permissions de lecture ; contrôle serveur du Sprint et de l'équipe via `assertTeamReportCycle` en v28 ; `readFrozenReportReference` vérifie l'empreinte de la charge utile.
- Le générateur `frozen-pdf.ts` autorise le paramètre `teamId` uniquement s'il ressemble à un UUID valide.
- L'API d'export PDF Sprint n'applique plus le blocage artificiel `team-pdf-preview-pending` : le PDF multiéquipes utilise la même prévisualisation isolée.

## À valider impérativement avant clôture

1. Vérification statique/TypeScript et rendu des propriétés du rapport.
2. Tests Windows v27 : prévisualisation et export PDF conservés.
3. Tests Windows v28 : Sprint A/B, référence A/B, session expirée, utilisateur non administrateur, altération de référence et absence de fuite.
4. Rendu Chrome/Puppeteer : HTTP 200, sélecteur `.smn-report-printable article`, taille/empreinte PDF, insertion d'archive et idempotence d'une relance.
5. Validation de l'ergonomie et du contenu PDF : le premier rendu suit une présentation simple issue de la référence figée ; sa fidélité au modèle de rapport doit être vérifiée.

## Statut

Implémentation publiée sur PR #189 mais **non testée et non qualifiée**. Aucun build, aucune migration v28, aucune fusion vers main.
