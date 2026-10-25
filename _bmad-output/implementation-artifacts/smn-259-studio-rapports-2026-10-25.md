# SMN-259 — Studio de rapports : incrément de structure

Branche : `feat/smn-259-report-studio` issue de SMN-258, dépendances #146–#150.

## Implémenté
- Composant client `src/app/app/reports/report-studio.tsx` accessible depuis la fiche d'un brouillon persisté.
- Modes Composition, Rédaction et Aperçu partageant le même état du document.
- Disposition desktop à trois zones : plan repliable (244px indicative), canevas central, propriétés repliables (276px indicative).
- Sélection de rubrique et propriété de visibilité contextuelle. Mode rédaction : notes humaines indépendantes par rubrique dans `content.userNotes`.
- Zoom d'interface sans mutation des données ni prétention d'une pagination fidèle.
- Sauvegarde explicite par la route PATCH avec révision contrôlée et statut confirmé après réponse HTTP.
- Compte `user` en lecture seule ; protection API d'écriture déjà présente, à tester.
- Libellés FR/EN dans `src/i18n/*.json`, styles Bootstrap du thème.

## Écarts et risques
- AC1 : proportions indicatives desktop ; tablette/mobile, vrais panneaux temporaires et A4 fidèle à compléter.
- AC2 : état local conservé pendant changements de mode ; sauvegarde manuelle, départ de page avec modifications non sauvegardées non bloqué.
- AC3 : propriétés contextuelles limitées à visibilité de rubrique, pas aux types de blocs métier (bloc éditorial pas encore implémenté).
- AC4 : la sélection reste stable entre modes ; restauration réelle du défilement et zoom par rubrique non implémentée.
- AC5 : UI sans mutations pour user, contrôle API existant ; tests droits non exécutés.
- Les tests PostgreSQL, typecheck, build et recette responsive ne sont pas exécutés ; publication en brouillon uniquement.
- L'aperçu est une lecture HTML conceptuelle, et non un aperçu A4/pagination fidèle à un PDF. Ne pas déclarer conformité PDF.
- Concurrence : la route PATCH utilise actuellement une révision optimiste (409), à rapprocher du choix UX « dernier enregistrement accepté ».
- Les anciennes routes, brouillons legacy et archives PDF restent inchangés.

## Prochaine étape
Compléter la gestion de blocs typés, raccourcis, responsive, pagination d'aperçu, avertissement de départ, recette fonctionnelle et clarification de la politique de concurrence. Ne pas clôturer Jira.
