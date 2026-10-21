# SMN — Politique de validation sans GitHub Actions

**Décision de fonctionnement — 21 octobre 2026 — applicable immédiatement et jusqu'à nouvelle décision explicite.**

## Décision validée par le porteur du projet

**GitHub Actions est indisponible. À compter de cette date, SMN n'utilise plus les tests automatisés exécutés sur GitHub pour qualifier les développements.**

Cela concerne **tous les agents BMAD, toutes les Epics et User Stories, tous les prochains lots**, quelle que soit la branche utilisée. Les workflows historiques présents dans `.github/workflows/` ne constituent plus un passage obligé ni une preuve requise. **Ne pas demander d'attendre un résultat GitHub Actions, ne pas retenter/rechercher automatiquement ces runs, et ne pas interpréter leur échec d'infrastructure comme un échec du code.** Conserver ces fichiers historiques, sauf instruction explicite de les désactiver ou de les supprimer.

**GitHub reste la référence** pour le code, les Pull Requests, l'architecture et la documentation BMAD. **Jira reste la référence** pour les Stories et leur statut. La publication sur `main` reste possible sur autorisation de l'utilisateur ; elle **ne vaut jamais attestation de tests réussis**.

## Stratégie de qualification de remplacement

1. **Continuer à produire des tests automatisés** (unitaires, API, intégration, non-régression), petits et maintenables, avec la User Story, même si leur exécution n'est pas possible immédiatement. « Pas de tests sur GitHub » **ne signifie pas « pas de tests ».**
2. **Privilégier l'exécution locale sur Windows 11** lorsque l'utilisateur dispose de son PC : commandes PowerShell selon le projet (`pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`), puis recette fonctionnelle dans l'application.
3. **Pour les tests PostgreSQL/HTTP**, n'utiliser qu'une base pilote ou éphémère explicitement identifiée et indépendante des données de travail. Ne pas contourner les garde-fous des scripts historiquement limités au runner GitHub Actions ; adapter d'abord un dispositif de test local isolé et le faire valider si nécessaire. Ne jamais exécuter un script destructif sur la base personnelle.
4. **Conserver des preuves honnêtes** : commande réellement lancée, environnement/versions, sortie, date, résultats attendus/réels et limites. Les contrôles statiques ou tests seulement rédigés ne sont pas présentés comme exécutés.
5. **Suivi qualité** : si la compilation, les tests ou la recette ne sont pas réellement vérifiés, garder la Story **« En cours » dans Jira** et **`review` dans le suivi BMAD** après développement, même lorsque la PR est fusionnée. La clôture requiert des éléments de recette suffisants, pas la disponibilité de GitHub Actions.
6. **Rapports des agents** : remplacer la rubrique « état GitHub Actions » par « validation locale / manuelle et preuves disponibles ». Signaler les vérifications restantes sans réitérer à chaque Story l'indisponibilité des runners GitHub.

## Priorité documentaire

Cette décision **remplace les anciennes mentions** dans les guides, spécifications ou PR indiquant qu'un contrôle GitHub Actions est obligatoire. Les anciennes traces de CI sont historiques et restent consultables, mais ne constituent plus une obligation pour les nouveaux développements.

**Réactivation des tests GitHub Actions :** uniquement après nouvelle décision explicite du porteur du projet ; une remise à disposition supposée des runners ne suffit pas à modifier cette politique.

**Portée de cette mise à jour : documentation et processus uniquement.** Aucun workflow existant n'est techniquement désactivé ni supprimé par cette décision.
