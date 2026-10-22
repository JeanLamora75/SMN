# Découpage Jira — Centre Paramètres

**Validation utilisateur : 23/10/2026.** Cette nouvelle Epic transversale UX vient **en complément**, sans remplacer SMN-1 (configuration existante), SMN-2 (sauvegardes), SMN-3 (calendriers/membres) et SMN-4 (cérémonies/sprints).

| Ticket | Objectif de la Story | Livrable observable | Dépendances |
|---|---|---|---|
| [SMN-223](https://lmn24.atlassian.net/browse/SMN-223) | Epic — Centre Paramètres | 14 rubriques / 4 familles, deux vues exclusives | Plusieurs Epics métier |
| [SMN-224](https://lmn24.atlassian.net/browse/SMN-224) | Menu Paramètres + portail | Accès sidebar, portail sécurisé, formulaire général maintenu sur route propre | SMN-18 et navigation |
| [SMN-225](https://lmn24.atlassian.net/browse/SMN-225) | Registre et représentation de 14 rubriques | Catalogue de destinations et états honnêtes, 4 familles, masquage de deux rubriques futures | SMN-224 ; routes métier existantes |
| [SMN-226](https://lmn24.atlassian.net/browse/SMN-226) | Cartes/Liste, préférence et responsive | Bascule exclusive, mode enregistré, 4/2/1 colonnes, clavier et thèmes | SMN-225 ; UX Équipe |
| [SMN-227](https://lmn24.atlassian.net/browse/SMN-227) | Raccordement des pages/droits | Liens fonctionnels, retours Paramètres, absence de 404 et non-régression, API inchangées | SMN-224/225 ; SMN-15, SMN-18, SMN-32, SMN-65 |

## Règles de réalisation

- **Un ticket = un incrément petit et vérifiable**, sans ajout implicite de fonctionnalité métier dans les modules propriétaires.
- Les 14 rubriques sont approuvées comme **catalogue de navigation**. **Jours ouvrés**, **Règles de capacité** et **Sécurité/sessions** ne doivent pas être déclarées complètement paramétrables sans fonctionnalités réellement disponibles ; créer des Stories métier séparées si la suite du projet exige d'enrichir les paramètres.
- **Cérémonies et modèles** : les composants de sprints existent, mais Amelia doit proposer une destination de configuration adaptée sans dupliquer la logique du sprint.
- **Intégrations externes** et **Notifications** ne sont pas livrées ni affichées dans le centre MVP.
- Les Stories ne couvrent **aucun redesign métier d'API, aucune migration PostgreSQL**, ni les tests de recette non encore exécutés.

## Références contractuelles

- [DESIGN.md](DESIGN.md)
- [EXPERIENCE.md](EXPERIENCE.md)
- [CATALOGUE-ET-ROUTES.md](CATALOGUE-ET-ROUTES.md)
- [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md)
- [RECETTE-UX.md](RECETTE-UX.md)

**Statut : tickets Jira créés et liés, documentation BMAD créée. L'implémentation, les validations de compilation et la recette visuelle ne sont pas réalisées ici.**