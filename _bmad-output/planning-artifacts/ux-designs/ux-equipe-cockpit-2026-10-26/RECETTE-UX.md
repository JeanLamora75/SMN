# Recette UX — Équipe Cockpit Agile / Option A

**Statut : critères préparés, aucun test exécuté par Sally.** À renseigner par Amelia avec captures navigateur, résultats des commandes et écarts.

## Critères d'acceptation (Gherkin simplifié)
- **AC-01 Hero** — Quand la page Équipe s'ouvre, alors le bandeau bleu marine de type Registres affiche « Équipe » en h1 et occupe la largeur utile.
- **AC-02 Vision/But** — Sur grand écran, Vision Produit et But du produit apparaissent **côte à côte DANS le hero**, remplacent l'ancien sous-titre et ne sont répétés dans aucun panneau blanc de contexte ; les valeurs proviennent exclusivement de l'équipe active.
- **AC-03 Données honnêtes** — Vision/But absents, chargement, erreur, contenus très longs, produit facultatif : états clairs, sans exemples injectés et sans texte définitivement inaccessible.
- **AC-04 Actions** — Liste, Cartes, Ajouter sont alignés à droite si place ; mode actif lisible ; préférence de vue conservée ; ajout hero et tuile conduisent à la **même** modale selon permissions ; l'édition existante de l'équipe/contexte demeure accessible.
- **AC-05 Filtres** — Panneau distinct de recherche et filtres Nom/Fonction, Rôle, Fonction et Statut. Chaque option affichée opère réellement sur les données déjà accessibles, fonctionne en Cartes/Liste, permet réinitialisation et état « aucun résultat ». Ne pas annoncer recherche compétences sans source.
- **AC-06 Contexte** — Pastilles équipe/vues/effectifs issues des données réelles, non confondues avec la sélection globale du header ; aucune équipe étrangère affichée après changement de contexte.
- **AC-07 Cartes** — Six colonnes à large viewport ; pays si renseigné, nom, silhouette commune, SM/PO/Dev lisibles sur une ligne, actif selon part > 0, fonction réelle ou « Non renseignée » ; lien fiche inchangé.
- **AC-08 Réserves** — 12 positions initiales (sauf besoin de lignes supplémentaires) ; après les membres, tuile Ajouter si autorisée et cases vides courtes, très pâles, non focusables ; aucun membre caché au-delà de 11 actifs.
- **AC-09 Liste** — Une seule vue visible à la fois ; tableau lisible avec identité, rôles, fonction, statut et ouverture fiche ; mêmes filtres/périmètre que les cartes.
- **AC-10 Non-régression** — Ajouter un membre, édition du contexte, archives/provisoires, modal/validation et erreurs, liens vers fiches, lecture seule RBAC, historique conservés ; aucun changement d'API/BDD/permissions.
- **AC-11 Responsive** — Contrôler largeur 320, 375, 390, 768, 1024, 1440 et ~1880 px ; zoom 200 % ; sections Vision/But s'empilent correctement, aucun chevauchement ou débordement horizontal global.
- **AC-12 i18n / thèmes / clavier** — JSON FR/EN, toutes palettes SMN et clair/sombre ; contraste, focus visible, tabulation, lecteurs d'écran, labels explicites, tests des chaînes longues.
- **AC-13 Isolation** — Diff ciblé sur page Équipe, styles isolés et traductions/tests nécessaires ; **aucun** changement du CSS Registres ni de la fiche membre V2 ou du processus multiéquipes SMN-282.
- **AC-14 Preuves** — Comparaison capture réelle à la maquette approuvée, tests réels des scénarios (admin/user, vide, 5 membres, 12+ membres, contexte absent, filtre vide, Cartes/Liste) et résultats non inventés des commandes disponibles.

## Definition of Done
- [ ] AC-01 à AC-14 démontrés, écarts documentés et acceptation visuelle du commanditaire sollicitée.
- [ ] Les éditions/créations restent couvertes par le serveur ; aucun filtre n'autorise des données externes.
- [ ] Exécuter, selon disponibilité réelle : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Inscrire succès/échec/non exécuté avec raisons.
- [ ] Captures desktop et mobile avant/après ; tests FR/EN, clair/sombre et clavier.
- [ ] Conserver le travail dans une branche dédiée/PR sauf nouvelle autorisation explicite de publication directe sur `main`.

**La validation de la maquette ne vaut ni exécution des tests ni validation du développement.**