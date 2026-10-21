# SMN-21 — Tableau de bord pilote

**Statut :** première itération ergonomique disponible sur `main`. **Périmètre :** Story [SMN-21](https://lmn24.atlassian.net/browse/SMN-21), producteur métier des données de cycles/indicateurs non livré. SMN-15 reste traité séparément et n'est pas clôturé à cause de ce changement de priorité.

## Accès et parcours

Se connecter à `http://localhost:3003` ; après validation du mot de passe initial, le chemin `/app` est **le tableau de bord par défaut**. L'en-tête contient le logo, l'identité de session et le bouton de déconnexion. La navigation responsive regroupe Pilotage, Cycles et bilans, Calendrier Agile, Points d'attention et Reportings ; la rubrique Administration des utilisateurs n'est visible que pour le rôle `admin`.

L'en-tête de contexte affiche uniquement les **noms de produit et d'équipe** et le mode de travail issus de `smn_installation`, `smn_product` et `smn_team`. Les données sont préparées sur le serveur par `src/server/dashboard/read.ts` : aucune requête de comptes ou données individuelles, aucun chargement de données métier depuis le navigateur.

Le tableau de bord affiche le premier cycle absent comme un **état vide utile**. Il ne calcule pas automatiquement de Sprint ou période Kanban, ni des KPI à 0. Les objectifs, métriques, événements, points d'attention et rapports apparaissent comme non renseignés ou non disponibles, car leurs interfaces de lecture métier ne sont pas encore développées. Les rubriques sont des ancres vers des sections de la page, **pas des liens trompeurs** vers des écrans inexistants.

## Décisions de cette itération

- Utiliser Bootstrap 5, complété par `src/app/dashboard.css`, pour une disposition lisible sur PC et mobile.
- Conserver **le même tableau de bord pour Administrateur et Utilisateur**. Les seules différences sont les accès à l'administration, autorisés côté serveur et protégés dans les routes dédiées.
- Ne pas ajouter de table, migration, cycle fictif, objectif factice, alerte calculée ou générateur de rapport prématuré.
- Rester conforme à la séparation des risques et des bilans : aucune action du tableau de bord ne modifie une fiche métier.

## Critères d'acceptation et limites

| Critère | État |
|---|---|
| AC1 : produit et équipe réels, état vide honnête | Réalisé pour une installation sans cycle. L'action de création à la demande demeure à relier à l'US de gestion des cycles. |
| AC2 : distinguer cycles en cours et bilans non clôturés | Contrat prévu ; impossible à vérifier de bout en bout tant que le stockage des cycles n'existe pas. |
| AC3 : objectifs, KPI, réunions réellement disponibles | Affichage non renseigné réalisé. Les futurs producteurs se raccorderont au contrat de lecture. |
| AC4 : alerte sans mutation | Aucun message n'est présenté comme une véritable alerte. Le tableau de bord ne déclenche aucune mutation métier. |
| AC5 : données collectives seulement pour Utilisateur | Lecture serveur limitée aux tables installation/produit/équipe ; les tests de sécurité vérifient l'absence de données individuelles et de lien admin. |

**Validation utilisateur attendue :** lisibilité du menu, hiérarchie du contexte produit/équipe, densité des cartes, comportement sur mobile. Aucun point de métier dépendant des cycles n'est déclaré terminé sur la seule base de cette itération.

## Tests et références

- `tests/dashboard-read.test.ts` : structure du contrat collectif, modes Scrum/Kanban, absence de KPI fictif, comportement en cas de contexte invalide.
- `scripts/verify-http-ci.mjs` : contrôles HTTP sur base PostgreSQL CI ; vérification de l'en-tête contextuel, absence d'e-mails individuels et accès utilisateur non administrateur.
- [Vérification I0](https://github.com/JeanLamora75/SMN/actions/workflows/verify-i0.yml) : s'appuyer sur une **exécution terminée et réussie** avant toute affirmation de couverture complète.

Architecture de référence : `_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/parcours-utilisateur-ergonomie.md`.


## Contrats UX du tableau de bord — validés le 21 octobre 2026

**Référence obligatoire pour les agents BMAD (PM, Analyst, UX, Architect, Dev, QA) et pour les futures User Stories :** [DESIGN.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) · [EXPERIENCE.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) · [Synthèse UXD-01 à UXD-27](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) · [Sommaire et maquette décrite](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/README.md).

**Décisions validées :** écran pleine largeur, sidebar rétractable, sélecteurs équipe/cycle dans le header, cartes J/H prévu/réel, SP et tickets **initialement engagés**/réalisés, compteur en jours ouvrés **du lundi au vendredi**, pas de carte « Avancement global » sans règle validée, quatre colonnes (obstacles, risques, événements, notes/alertes), 5 éléments actifs maximum par colonne, tri automatique, actions rapides contrôlées, historique fidèle ou message exact **« Aucun éléments à ce jour »**, personnalisation des métriques/colonnes, responsive 4/2/1.

**Statut :** contrats UX approuvés et publiés, **pas** de nouvelle fonctionnalité ou de recette attestée. Les producteurs de données, règles d'historisation, droits et catalogues FR/EN restent à vérifier avant implémentation.

**Implication spécifique :** La maquette UX remplace la disposition du pilote SMN-21 **en tant que cible approuvée**, mais ne signifie pas que les données métier, les actions ou les indicateurs soient codés. Préserver l'état vide honnête et les tests avant livraison.
