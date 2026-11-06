# SMN-405 — Recette de fidélité et de sécurité des exports Office

**Jira :** https://lmn24.atlassian.net/browse/SMN-405  
**Statut :** En cours. **Décision de mise en production : NON AUTORISÉE** tant que les points bloquants ci-dessous ne sont pas couverts.

## 1. Éléments de preuve automatisés

- [Suite d'acceptation intégrée](../../tests/smn-405-office-acceptance.test.ts)
- [Workflow GitHub Actions Windows et Linux](../../.github/workflows/smn-405-office-acceptance.yml)
- [Exécutions CI](https://github.com/JeanLamora75/SMN/actions/workflows/smn-405-office-acceptance.yml)

Les jobs Windows et Linux utilisent Node.js 24 et publient, quand les scénarios ont abouti, deux **fixtures Office synthétiques** `sample.docx` et `sample.pptx` plus `manifest.json` dans les artifacts GitHub (rétention de 30 jours). Ce manifeste précise les empreintes SHA-256, les parties hors cible conservées, le nombre de lignes et les nouveaux médias.

La suite couvre, pour les deux formats :
- remplacement des tags simples et fragmentés, caractère `&` échappé correctement et tags inconnus préservés ;
- distinction entre `0` et `N/D` (pour les jeux sans donnée) ;
- génération des lignes d'un tableau avec style/fusion horizontale ;
- création d'une image PNG depuis un tag texte sans média préexistant ;
- conservation des parties hors cible (`docProps`, thèmes, styles, notes) et cohérence du ZIP ;
- rejet d'archives invalides, trop volumineuses, contenant des chemins traversants et à CRC falsifié ;
- sauvegarde dans un répertoire temporaire et refus d'écrasement après modification concurrente ;
- non-régression ciblée via tests historiques **PDF, archives et isolation des équipes**, et anciens contrats Office ;
- `pnpm typecheck` et ESLint du test de recette.

**Attention :** les fixtures sont des paquets Open XML synthétiques. Leur succès technique n'est **pas** une preuve de fidélité visuelle dans Word et PowerPoint ni de compatibilité de tous les modèles professionnels.

## 2. Correspondance avec les critères Jira

| Critère | Contrôle prévu | État de qualification |
|---|---|---|
| CA-9.1 | Docs étalons ZIP/DOM, 0/N, N/D, zéro, tableaux, images, hashes | Recette automatisée ; rendu réel Microsoft Office encore requis |
| CA-9.2 | Formats invalides, archives corrompues, taille excessive, traversal | Tests ciblés ; audit de sécurité approfondi du parseur ZIP/XML restant |
| CA-9.3 | Régressions PDF, archives, centre des rapports, isolation | Tests historiques ciblés, **pas** tous les scénarios PDF historiques |
| CA-9.4 | CI Windows/Linux Node 24, TypeScript, lint, checklist manuelle | CI dédiée, Windows 11 réel et vérification manuelle à compléter |
| CA-9.5 | Tags libres, nom/langue, 8 familles, 0/N, gardes techniques | **Non couvert intégralement** (détails ci-dessous) |

## 3. Écarts bloquants identifiés

1. **Huit familles du catalogue Office non livrées.** Les lignes dynamiques actuellement implémentées par SMN-400 et SMN-401 sont `MEMBERS` et `INDICATORS` uniquement. Les autres familles (cérémonies, registres, capacités, etc.) exigées au catalogue complet ne disposent pas toutes des tags/transformations attendus.
2. **SMN-404 non réalisée :** l'interface intégrée et la découvrabilité du catalogue complet restent à recetter puis à développer pour couvrir le périmètre approuvé.
3. **Moteur OOXML encore expérimental :** parseur ZIP/XML artisanal, certains éléments OOXML complexes non couverts ; pas de décision technique finale sur bibliothèque maintenue et sécurité complète. Les fusions verticales et tableaux imbriqués sont refusés.
4. **Fidélité visuelle :** aucune validation de rendu de modèles professionnels avec Microsoft Word et PowerPoint sur la machine Windows 11 du projet. Les dimensions des images Word sont fixes dans le prototype.
5. **Sauvegarde sous concurrence externe :** l'empreinte + le verrou coopératif SMN n'assurent pas une opération compare-and-swap OS atomique contre une modification effectuée entre le contrôle final et `rename`.
6. **Tests d'intégration réels :** la route HTTP de génération et sauvegarde n'a pas été testée de bout en bout avec une installation PostgreSQL v33 chargée et des utilisateurs de rôles différents ; les tests actuels se concentrent sur les moteurs et contrats.
7. **Éditions graphiques avancées :** les types pie, donut et gauge disponibles dans l'écran Tendances ne sont pas pris en charge dans le rendu Office actuel.

## 4. Procédure de recette Windows 11 / Microsoft Office à exécuter

1. Mettre à jour le dépôt `main` dans GitHub Desktop, lancer SMN et ouvrir **Rapports > Modèles**.
2. Déposer au moins un DOCX et un PPTX Office réels avec thèmes, en-têtes/pieds, notes, tableaux, styles, espaces, cellules fusionnées et tags fragmentés dans le dossier Office autorisé.
3. Générer les deux documents : vérifier les dates/locales FR et EN, `0`, `N/D`, plusieurs séries et légendes, le respect des dimensions et les éléments hors cible.
4. Comparer **visuellement** les modèles sources et les résultats dans Microsoft Word et PowerPoint, et produire captures/compte rendu signé. Tester les tableaux suffisamment longs pour dépasser la page/diapositive ; aucun ajustement automatique ni troncature silencieuse ne doit être fait par SMN.
5. Générer un fichier existant, choisir **Annuler** : vérifier son hash ; choisir **Remplacer** : vérifier le nouveau contenu ; modifier le fichier depuis un autre processus entre vérification et confirmation et contrôler le conflit.
6. Ouvrir le fichier de destination dans Word/PowerPoint en mode bloquant, réessayer la sauvegarde et vérifier l'intégrité de l'original et le message d'erreur.
7. Valider les autorisations sur deux équipes et deux profils, puis relancer les parcours PDF/archives historiques.
8. Consigner captures, version Office/Windows, exécution CI et résultats dans Jira. Aucune clôture sans éléments objectifs.

## 5. Adaptation BMAD

Le skill `.agents/skills/bmad-build/SKILL.md` a été lu sur le dépôt GitHub. Son workflow officiel demande la commande `uv run --no-cache .../_bmad/scripts/render_skill.py`, qui ne peut pas être lancée sur le dépôt Windows de l'utilisateur depuis l'environnement connecteur ; **aucune exécution de cette commande n'est revendiquée**. La recette autonome est réalisée et tracée via GitHub/Jira, selon le fonctionnement établi du projet.

La preuve finale de SMN-405 est **conditionnelle** aux résultats des CI et à la levée des écarts. Le rôle de la recette est de découvrir et formaliser les écarts, pas de déclarer conforme un périmètre inachevé.
