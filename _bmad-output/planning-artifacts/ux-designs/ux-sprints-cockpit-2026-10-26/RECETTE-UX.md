# Recette UX — Sprints Cockpit Agile, option A

**Objet :** contrôle visuel et de non-régression **à exécuter par Amelia**, non exécuté par Sally.  
**Périmètre :** `/app/admin/sprints`, uniquement harmonisation graphique avec l'index Registres.

| ID | Vérification attendue |
| --- | --- |
| UX-SPC-01 | Hero bleu contrasté, titre/sous-titre et boutons admin disposés comme le cockpit Registres, sur largeur utile. |
| UX-SPC-02 | Boutons historiques/génération conservent leurs destinations, masqués aux comptes sans droit. |
| UX-SPC-03 | Pastilles état et filtre existant sont synchronisés ; Tous, En cours, À venir, Terminé, Clôturé, Suspendu et statuts réellement reçus restent atteignables. |
| UX-SPC-04 | Recherche, tri et Actualiser conservent valeur, requêtes, ordre, pagination, compteurs et absence de mutations. |
| UX-SPC-05 | Panneau filtre blanc indépendant ; compteur, contexte d'équipe et statut de chargement sont exacts. |
| UX-SPC-06 | Tableau quatre colonnes, en-tête gris clair, lignes compactes, dates localisées et libellés inchangés. |
| UX-SPC-07 | Sprint actif prioritaire sous tri par défaut, badge texte + accent discret ; plusieurs actifs et état non vérifié correctement signalés. |
| UX-SPC-08 | Icône Calendrier provisoire conserve **son avis actuel** ; menu ⋯ conserve **les outils legacy** ; nom conserve lien existant. Pas de faux lien fonctionnel. |
| UX-SPC-09 | 0 sprint, zéro résultat filtre, chargement, API indisponible, retry et pagination ne régressent pas. |
| UX-SPC-10 | Responsive sur 320, 375, 390, 768, 1024, 1440 px ; pas de débordement involontaire, actions visibles, filtres utilisables. |
| UX-SPC-11 | Zoom 200 %, Tab/Entrée, focus, labels accessibles, contraste WCAG à mesurer ; aucune information portée seulement par couleur. |
| UX-SPC-12 | FR/EN, thèmes clair/sombre et palettes SMN préservés ; aucun changement visuel indésirable au Registre. |
| UX-SPC-13 | Régression admin/user, historique, statuts spéciaux, absence de droits, multiéquipes si livré, sécurité inchangée. |
| UX-SPC-14 | Diff limité index Sprints, CSS isolé et traductions/tests utiles ; ni DB, ni API, ni migrations, ni permission, ni logique métier modifiés. |
| UX-SPC-15 | Captures comparatives Registres/Sprints desktop & mobile présentées et validation graphique utilisateur demandée avant clôture. |

## Vérifications techniques attendues

Sur checkout complet SMN : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, si disponibles, avec résultats datés, écarts et limites. Vérification navigateur manuelle avec captures aux tailles ci-dessus et focus clavier. Ne pas annoncer « testé » ni « terminé » si non exécuté.

**Definition of Done :** critères UX-SPC-01 à 15 contrôlés, aucune régression déclarée sans preuve, documentation/Story Jira mise à jour par l'agent de développement selon ses autorisations et accord sur la publication, résultat présenté au PO.
