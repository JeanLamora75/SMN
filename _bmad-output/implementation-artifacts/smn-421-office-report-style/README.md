# SMN-421 — Style graphique facultatif à l'export Office (M3, UX-03 B)

**Agent :** Amelia / adaptation BMAD · **Date :** 8 novembre 2026  
**Jira :** https://lmn24.atlassian.net/browse/SMN-421  
**Statut :** code et tests publiés sur `main` ; recette Windows / Word / PowerPoint à effectuer.

## Décision fonctionnelle appliquée

Dans **Rapports → Modèles**, lorsque le modèle et son sprint sont sélectionnés, un champ « Style graphique du rapport (facultatif) » apparaît sans ajouter d'étape. Sa valeur initiale est **« Styles par défaut »** ; l'utilisateur peut choisir un style prédéfini ou personnalisé global. Une valeur vide n'est **pas envoyée au serveur**, le parcours actuel est conservé.

Le choix de style est propre à la génération en cours. Il ne modifie **ni l'affectation des défauts par type**, ni un style PostgreSQL, ni le modèle Office, ni les rapports archivés. L'option suit les trois actions existantes : **Vérifier**, **Enregistrer**, **Télécharger**.

## Priorités et validation

Le générateur charge son snapshot de styles au plus une fois et invoque le résolveur de SMN-417 avec le `reportStyleId` facultatif :

1. Tag explicite `STYLE=<id>` — reste prioritaire.
2. Style facultatif de la requête d'export — appliqué aux graphiques sans tag `STYLE`.
3. Défaut global de chaque type de graphique.
4. Compatibilité historique si aucun catalogue n'est installé.

Les styles invalides ou supprimés sont rejetés de façon explicite ; la vérification avant sauvegarde évalue les tags et le style demandé **avant** la confirmation d'écrasement, sans écrire ou remplacer de fichier. La génération conserve les contrôles des droits d'équipe et de sprint et les erreurs de rendu/insertion déjà présentes.

`STYLE=legacy` reste un mécanisme interne de compatibilité dans les tags (SMN-418) ; il n'est pas proposé comme style configurable dans ce nouveau sélecteur.

## Fichiers

- `src/app/app/reports/office-template-catalog.tsx` — sélection non persistée, chargement des styles autorisés, libellés et erreur traduite, propagation de l'option sur les trois actions.
- `src/app/api/admin/reports/office-templates/generate/route.ts` — validation stricte `reportStyleId`, snapshot unique et résolution avant inspection ou génération.
- `src/i18n/fr.json`, `src/i18n/en.json` — champ facultatif, valeur par défaut, aide et erreurs.
- `tests/smn-421-office-report-style.test.ts` — six types, priorité du tag, styles absents, intégration multi-graphiques DOCX/PPTX, contrôle d'autorisation et absence de mutation globale.
- `.github/workflows/smn-421-office-report-style.yml` — tests, TypeScript, ESLint et i18n sur Linux/Windows.

## Validation Windows 11

Depuis SMN à jour de `main` :

```powershell
pnpm test:smn-421
pnpm typecheck
pnpm lint
pnpm i18n:check
```

CI dédiée : https://github.com/JeanLamora75/SMN/actions/workflows/smn-421-office-report-style.yml

### Recette métier à exécuter

- [ ] Dans **Rapports → Modèles**, choisir un DOCX puis un PPTX, et vérifier l'affichage du champ « Style graphique du rapport » initialisé à « Styles par défaut ».
- [ ] Générer sans choix spécifique : les défauts par type restent appliqués et les modèles historiques sont acceptés.
- [ ] Sélectionner Corporate sur un rapport contenant plusieurs graphiques ; vérifier que tous les graphiques sans `STYLE` utilisent Corporate.
- [ ] Dans le même modèle, insérer un graphique avec `STYLE=minimal` ; vérifier que lui seul utilise Minimal, les autres Corporate.
- [ ] Tester les trois actions **Télécharger**, **Vérifier avant enregistrement**, **Enregistrer**, y compris confirmation d'écrasement.
- [ ] Entre « Vérifier » et « Enregistrer », supprimer un style personnalisé sélectionné : la requête doit échouer sans remplacer un rapport.
- [ ] Vérifier les traductions FR/EN, la qualité des sorties Word/PPTX et les droits d'une équipe non autorisée.
- [ ] Confirmer que ni le catalogue global ni les modèles ni les archives précédentes ne sont changés.

**Limites :** tests automatisés ne prouvent pas l'ouverture Microsoft Office réelle ou le rendu visuel à 100 %. Aucun script `uv` exécuté sur GitHub. Ne pas clore Jira sans recette et preuve CI correspondante.
