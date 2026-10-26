# SMN-274 — Édition des jours fériés dans la grande modale

**Statut : implémentation publiée en branche, sans tests ni recette d'exécution.**

## Sources et filiation

- Jira : https://lmn24.atlassian.net/browse/SMN-274
- Branche : `feat/smn-274-holiday-editor`.
- Base de branche : `feat/smn-273-manual-national-holidays` (PR #193). Dépendance en chaîne : SMN-270 → SMN-271 → SMN-272 → SMN-273 → SMN-274.
- Skill officiel Amelia `.agents/skills/bmad-agent-dev/SKILL.md` et référentiel `docs/UX-REFERENTIEL-BMAD.md` consultés sur GitHub.
- Le workflow de rendu BMAD `uv` ne peut pas être exécuté au travers du seul connecteur GitHub : adaptation par lecture directe des contrats et modifications de fichiers. Aucun test externe revendiqué.

## Description

L'administrateur peut **ajouter**, **corriger** (nom et/ou date) ou **retirer** un jour férié national dans la grande modale. Les actions utilisent l'API transactionnelle et auditée publiée par SMN-273. Aucun nouvel écran modal n'est empilé ; tout reste dans le même panneau de consultation. Les profils non habilités ne voient aucun bouton d'édition et le serveur protège toujours les mutations.

### Implémentation selon critères d'acceptation

| Critère | Réalisation |
| --- | --- |
| **AC1 — Actions** | Dans `country-calendar-modal.tsx` : « Ajouter un jour férié », « Modifier » et « Retirer » sur les lignes du mode Liste, uniquement si `canManage`. Date et pays toujours nationaux. |
| **AC2 — Panneau intégré** | `country-holiday-editor-panel.tsx` : panneau inline prérempli pour correction/retrait, Annuler sans requête de mutation ; sélecteur d'année, changement de mode et fermeture désactivés pendant l'édition ; focus sur la date ou le motif à l'ouverture et retour à l'élément d'origine / bouton Ajouter. |
| **AC3 — Validation et erreurs** | Date civile ISO réelle, libellé 1–120 caractères, motif d'audit 1–500 caractères, recherche de doublons côté client puis contrôle définitif du serveur. Bouton désactivé pendant enregistrement ou vérification de l'année de destination, protection contre double soumission avec ref. Les erreurs 400/403/404/409/503 et réseau ne vident aucun champ. |
| **AC4 — Année administrativement validée** | Le GET annuel renvoie `administrativeValidated` calculé côté serveur par `administrative_validated_at IS NOT NULL AND validated_revision=revision`. Avertissement non bloquant avant écriture de toute année concernée, y compris année de destination. Le statut administratif est annulé par l'API de SMN-273 **seulement en cas de mutation réussie** ; les statuts visuels de l'année et du catalogue sont relus ensuite. |
| **AC5 — Retrait confirmé** | Panneau de confirmation **interne**, case à cocher obligatoire, motif requis, rappel de la date et du nom ; si dernière date, message explicite « Non configuré ». La suppression et le compteur affiché se relisent depuis le serveur après confirmation. Un déplacement de la dernière date hors de l'année est également signalé. |
| **AC6 — Accessibilité, responsive, FR/EN** | Libellés de boutons avec date, `role=alert` pour erreurs, avis de réussite `role=status`, `label` des champs et focus clavier. Le panneau reste à l'intérieur de la grande modale responsive (SMN-272). Traductions ajoutées dans les deux catalogues. |

## Contrats techniques

- `GET /api/admin/countries/calendar?country=FR&year=2026` expose `{country,year,holidays,revision,status,fingerprint,administrativeValidated}`. La validation administrative est **lue du serveur**, pas inférée du statut technique `configured` historique.
- `POST /api/admin/countries/FR/holidays` avec `action: create|update|delete`, motif et `expectedYears` issu de la ou des lectures annuelles, selon SMN-273.
- Pour un déplacement 2026 → 2027, le panneau lit séparément 2027 et fournit les **deux empreintes serveur**, avant la requête ; l'utilisateur voit l'éventuel avertissement de validation de l'année de destination. En cas de lecture en erreur, réessayer **la lecture seulement**.
- Le navigateur ne fabrique jamais d'empreinte et n'actualise jamais une date après échec ; il conserve le brouillon.
- Après réponse serveur positive, le formulaire disparaît, la même année est rechargée, et le catalogue est rafraîchi ; si le rafraîchissement du catalogue échoue, on avertit **sans refaire le POST**.
- Aucune nouvelle migration PostgreSQL propre à cette story : elle exploite le schéma additif de SMN-273.

## Modifications GitHub

- `src/app/app/admin/countries/country-calendar-modal.tsx`
- `src/app/app/admin/countries/country-holiday-editor-panel.tsx` (nouveau)
- `src/app/app/admin/countries/country-admin.tsx`
- `src/server/holidays/manual.ts` : propriété de validation administrative fiable dans la lecture annuelle.
- `src/server/countries/catalog.ts` : restitution du même statut dans la liste globale.
- `src/lib/countries/holiday-editor.ts` (nouveau) : lecture annuelle typée, contrôle de date, années touchées.
- `tests/country-holiday-editor.test.ts` (nouveau, **non exécuté**).
- `src/i18n/fr.json` et `src/i18n/en.json`.

## Contrôles réellement effectués

- Relecture statique du code GitHub et de la structure des appels ; pas de compilation.
- Catalogues FR et EN : **3 196 clés chacun**, aucun chemin absent parmi les composants de cette story et aucun désaccord d'interpolation.
- Contrôle statique de la protection administrateur, de l'empreinte annuelle, de la vérification des deux années, de la confirmation de retrait, de l'absence de fenêtre imbriquée et du comportement en cas d'erreur.
- **Aucun** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, test SQL/navigateur ou GitHub Actions exécuté pour cette story.

## Recette locale demandée à l'utilisateur (Windows 11)

1. Ouvrir `feat/smn-274-holiday-editor` dans GitHub Desktop. La branche contient aussi SMN-270 à 273. Sauvegarder d'abord la base PostgreSQL portable (des migrations additives viennent de SMN-273).
2. Aller à **Paramètres → Pays et jours fériés**, ouvrir un pays avec « Gérer ».
3. En mode Liste, créer une fête via **Ajouter** (date, nom, motif) ; vérifier la lecture mise à jour et l'absence de double insertion.
4. Modifier uniquement un nom, puis déplacer une date d'une année à une autre ; vérifier le pays, les deux années, les conflits de date et les historiques.
5. Tester date impossible, nom vide, motif manquant, collision avec fête existante ; le brouillon doit être conservé.
6. Retirer une fête : confirmation et motif obligatoires ; annuler sans modifier, puis confirmer ; retirer la dernière date et constater le statut **Non configuré** (et non « zéro jour férié validé »).
7. Vérifier depuis deux onglets la détection du conflit de révision et l'absence d'écrasement silencieux.
8. Après activation future de SMN-275, tester le cas **année validée** : avertissement avant mutation, passage à **À vérifier** seulement après succès, conservation lors d'annulation/erreur.
9. Vérifier FR/EN, clavier, zoom 200 %, mobile, thème sombre et droits d'un rôle non-admin.
10. Exécuter localement `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et transmettre les éventuelles erreurs.

**Ne pas fusionner ni classer la story Terminé avant recette locale.**
