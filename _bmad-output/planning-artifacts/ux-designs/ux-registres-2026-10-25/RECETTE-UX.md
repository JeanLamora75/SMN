# Recette UX — Refonte du registre global

**Date :** 25/10/2026. **Statut de tous les scénarios : NON TESTÉ.** Les validations fonctionnelles UX ne constituent pas une preuve de code/test.

| ID | Story | Vérification attendue | Statut |
|---|---|---|---|
| REG-T01 | 239 | Ouvrir registre : Tous les six types, portée équipe autorisée, sans cycle implicite | Non testé |
| REG-T02 | 239 | Filtrer cycle, type, statut ; application avant pagination ; dédoublonnage multi-cycle | Non testé |
| REG-T03 | 239 | « À suivre » / « États finaux » et tri choisi, sans inventer classification highlight.recorded | Non testé |
| REG-T04 | 240 | Liste desktop avec icône/type, titre, description 2 lignes, statut, échéance présente, propriétaire autorisé | Non testé |
| REG-T05 | 240 | Signal type ≠ statut ≠ attention ; risque non évalué sans fausse criticité | Non testé |
| REG-T06 | 241 | Passer Liste↔Cartes sans altérer dataset/filtres/page et enregistrer préférence isolée | Non testé |
| REG-T07 | 242 | Bandeau fermé : nombre réel visible ; ouvert : liens et raisons ; erreur ≠ zéro | Non testé |
| REG-T08 | 243 | Bandeau de fiche, onglets communs et spécifiques à chacun des six types | Non testé |
| REG-T09 | 243 | RBAC admin/user ; pas de crayon ou API write sur le rôle user | Non testé |
| REG-T10 | 244 | Synthèse 2/3 + 1/3 desktop ; 1 colonne mobile ; descriptions intégrales | Non testé |
| REG-T11 | 245 | Crayon description/info/statut ouvre la section exacte ; formulaire compact et annulable | Non testé |
| REG-T12 | 245 | Conflit 409 conserve brouillon et l'état métier ; pas d'écrasement silencieux | Non testé |
| REG-T13 | 246 | Nouvelle fiche 6 types en modale complète ; règles de champs type conservées | Non testé |
| REG-T14 | 246 | Succès ferme modale puis « Voir la fiche »/« Créer une autre » ; contexte origine conservé | Non testé |
| REG-T15 | 246 | Annulation modale modifiée avec confirmation ; erreur sans faux succès | Non testé |
| REG-T16 | 247 | Commentaires multiples persistés avec auteur/date/fidélité du texte | Non testé |
| REG-T17 | 247 | Correction versionnée, mention Modifié, retrait logique et anciennes valeurs protégées | Non testé |
| REG-T18 | 247 | Régression du champ comment legacy et des fiches existantes sans perte/migration implicite | Non testé |
| REG-T19 | 248 | Commentaire rapide ajouté au journal sans modale et sans toucher la description | Non testé |
| REG-T20 | 248 | Filtres du journal par types ; commentaire retiré traçable ; vide vs panne | Non testé |
| REG-T21 | 249 | Créer action, décision, fait lié depuis journal ; vraie fiche indépendante et lien atomique | Non testé |
| REG-T22 | 249 | Erreur/rollback : ni fiche orpheline ni faux lien ; réunions existantes non régressées | Non testé |
| REG-T23 | 250 | Relations groupées par catégorie, cycles à part ; recherche par titre sans UUID saisi | Non testé |
| REG-T24 | 250 | Toute dissociation confirme ; retire seulement lien ; cycles clos protégés | Non testé |
| REG-T25 | 251 | Historique descend par date, révisions Avant/Après limitées aux champs modifiés | Non testé |
| REG-T26 | 251 | Auteur inconnu explicite, droits de consultation actuels conservés avant arbitrage | Non testé |
| REG-T27 | 252 | Risque→Action→Décision→Risque : fil d'Ariane, retour fiche et liste avec filtres/page/tri | Non testé |
| REG-T28 | 252 | Entrée par URL directe, Précédent navigateur, saisie non enregistrée, fiche inaccessible | Non testé |
| REG-T29 | 253 | Largeurs 320/375/768/1024/1440 ; zoom 200 %, Liste/Cartes sur mobile sans scroll forcé | Non testé |
| REG-T30 | 253 | Focus, Escape, labels accessible, barre actions fixe, thèmes clair/sombre | Non testé |
| REG-T31 | 253 | i18n JSON FR/EN, aucune chaîne UI codée en dur, date métier sans heure fictive | Non testé |
| REG-T32 | 253 | Scrum/Kanban, admin/user, équipe, cycle clos snapshots Vn, dashboard et fiche Sprint sans régression | Non testé |
| REG-T33 | 253 | 0/1/5/>5/centaines de fiches, recherche et pagination, panne producteur et retry | Non testé |
| REG-T34 | 253 | `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, migrations et parcours navigateur : consigner sorties exactes | Non testé |

## Règles de preuve
Pour chaque scénario : date, environnement, commit, commande/action, résultat observé et preuve (capture/log/test). Tests automatiques ciblés + navigation réelle clavier/souris/mobile. Aucun « conforme WCAG » sans audit adapté ; aucune Story « terminée » sur simple publication GitHub. Les quatre arbitrages ouverts dans EXPERIENCE.md doivent être consignés explicitement avant travaux qui en dépendent.
