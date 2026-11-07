# SMN-408 — Localisation et drapeau des membres dans les rapports Office

**Jira :** https://lmn24.atlassian.net/browse/SMN-408  
**Statut :** implémentation publiée sur main ; tests Windows/Linux et recette Office à vérifier.

## Besoin et contrat

Dans la section **3. Tableaux de données métier** de l'onglet Tags du Centre Rapports, la famille `{{ROW:MEMBERS}}` expose désormais sept tags :

| Tag | Valeur |
|---|---|
| `{{MEMBER_NAME}}` | Nom |
| `{{MEMBER_ROLE}}` | Fonction |
| `{{MEMBER_START}}` | Début d'affectation |
| `{{MEMBER_END}}` | Fin d'affectation |
| `{{MEMBER_CITY}}` | Ville |
| `{{MEMBER_COUNTRY}}` | Pays (libellé localisé selon la langue du rapport) |
| `{{MEMBER_FLAG}}` | Symbole drapeau Unicode issu du code ISO 3166-1 alpha-2 |

L'extraction est exclusivement côté serveur via `readOfficeWordMembers`, avec vérification équipe/sprint dans les mêmes jointures que les membres existants. La localisation provient de `smn_member_location` et de sa version effective avant la date de fin exclusive du sprint (`effective_from < end_at::date` dans son fuseau horaire). Une correction postérieure n'est pas automatiquement appliquée aux rapports historiques.

## Choix technique du drapeau

L'export produit le symbole drapeau Unicode (paire de **Regional Indicator Symbols**) : `FR` → 🇫🇷, `IN` → 🇮🇳. Ce choix fonctionne dans les cellules Word/PPTX et les paragraphes PowerPoint sans changer la structure Open XML et sans appels Internet. Le rendu couleur du drapeau dépend des polices Office : certaines versions afficheront les lettres régionales au lieu d'un pictogramme.

Les drapeaux PNG déjà présents dans `public/flags` ne sont **pas** encore incorporés dans le paquet DOCX/PPTX. Une demande de drapeau garanti sous forme d'image doit faire l'objet d'un développement d'insertion d'images et de relations OpenXML dédié. Ne pas présenter la variante Unicode comme une image PNG intégrée.

Les codes ou villes manquants sont remplacés par `N/D` par le moteur standard, sans inventer de localisation.

## Vérifications

- `tests/smn-408-office-member-location.test.ts` : ISO, FR/EN, localisation effective, périmètre d'équipe, Word/PPTX et documentation des tags.
- Suites de non-régression SMN-400, SMN-401 et SMN-406 ; typecheck / ESLint ciblé.
- Recette visuelle Word et PowerPoint sur Windows : confirmer le rendu du drapeau, tester une équipe multi-pays et une localisation révisée à une date ultérieure.

Aucune migration de schéma ni modification de modèle Office obligatoire. Les rapports déjà produits ne sont pas réécrits.
