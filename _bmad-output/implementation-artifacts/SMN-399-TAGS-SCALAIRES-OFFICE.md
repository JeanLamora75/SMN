# SMN-399 — Génération Office par tags scalaires

## Périmètre livré

Dans **Rapports > Modèles**, sélectionner un modèle Office déposé dans le répertoire validé par SMN-398, puis l'équipe et un sprint autorisés. L'utilisateur confirme ou modifie le nom suggéré (`nom du modèle - nom du sprint`) et choisit FR/EN. Le bouton **Générer et télécharger** produit une copie DOCX ou PPTX dans le navigateur ; le modèle source reste inchangé.

**Attention :** la sauvegarde sur disque SMN et la confirmation d'écrasement sont réservées à SMN-403. Ce premier incrément effectue un téléchargement et ne crée ni historique, ni révision, ni document en base. Les tableaux et graphiques dynamiques sont réservés à SMN-400/401/402.

## Tags simples exposés

| Tag | Source | Règle |
|---|---|---|
| `{{TEAM_NAME}}` | Nom d'équipe résolu par le serveur | Contexte d'équipe autorisé |
| `{{SPRINT_NAME}}` | Sprint sélectionné | Contexte d'équipe autorisé |
| `{{SPRINT_START}}` | Date début sprint | Format FR/EN choisi |
| `{{SPRINT_END}}` | Date fin sprint | Format FR/EN choisi |
| `{{SPRINT_STATUS}}` | Statut du sprint | Traduction des statuts connus, texte métier source sinon |
| `{{INDICATOR_<TAG>}}` | Indicateurs dynamiques actifs pour l'équipe | Tag construit à partir du tag catalogue ; zéro conservé, indisponible = `N/D` ; nombres localisés FR/EN avec deux décimales maximum |

Les tags reconnus ne demandent aucune configuration d'emplacement : ils peuvent être placés dans un paragraphe Word ou une zone texte PowerPoint compatible. Les tags peuvent être fragmentés entre plusieurs segments de texte **à l'intérieur du même paragraphe**. Les tags inconnus sont conservés ; les paramètres non pris en charge sur un tag reconnu produisent une erreur explicite.

Le moteur réutilise `readReportIndicatorProjection`, sans calcul métier parallèle. Seuls les indicateurs sélectionnés/actifs dans l'équipe sont exposés. Le moteur de projection existant limite actuellement une sélection explicite à 50 indicateurs ; cette limite est considérée **technique**, et une erreur explicite est renvoyée si elle est atteinte, sans troncature silencieuse.

## Contrôle serveur

- La route `POST /api/admin/reports/office-templates/generate` exige une session administrateur valide, une origine locale autorisée et un JSON validé.
- L'équipe est résolue côté serveur via `resolveAdminTeam` et le sprint est contrôlé avec `assertTeamReportCycle`, puis filtré en base par équipe.
- Le fichier source est sélectionné par identifiant de modèle et **revalidé** sur disque : pas de chemin fourni par le client, pas de lien symbolique, contrôle du package Open XML avant/après.
- Nom de fichier obligatoire, longueur limitée et caractères de chemin interdits ; l'extension réelle du modèle est conservée.
- Aucune écriture en base de rapports Office ni enregistrement d'un fichier généré côté serveur.
- Les erreurs ne révèlent aucun chemin interne ni donnée d'une équipe non autorisée.

## Essais exécutés et limites

- **7/7 tests du moteur réussis** avec Node.js 22 dans un environnement de test isolé : tags fragmentés, plusieurs tags dans un même paragraphe, zéro, `N/D`, inconnus, XML, refus des paramètres mal formés, comparaison des parties ZIP inchangées.
- **Fichiers DOCX/PPTX réels générés et rouverts** via `python-docx` et `python-pptx` dans l'environnement de test. Les textes et données attendus sont présents.
- **Localisation numérique :** les indicateurs numériques sont formatés dans la langue sélectionnée, avec au plus deux décimales ; les valeurs manquantes restent `N/D` et zéro reste `0`.
- **À vérifier dans la CI** : `pnpm exec tsx --test tests/smn-399-office-scalars.test.mjs`, `pnpm typecheck`, `pnpm lint`, `pnpm i18n:check`, recettes API avec PostgreSQL, navigateur et Windows 11 / Node 24.
- Le moteur réutilise le lecteur/éditeur ZIP démonstratif de SMN-397. Cette approche requiert une qualification de sécurité et de fidélité supplémentaire sur des modèles complexes (XML enrichi, formes groupées, ZIP64, notes, graphiques et tableaux).
- La génération d'une valeur simple ne démontre pas la fidélité universelle de tous les modèles Office.

## Sources

- Jira : https://lmn24.atlassian.net/browse/SMN-399
- Moteur : https://github.com/JeanLamora75/SMN/blob/main/scripts/smn-399-office-scalars.mjs
- Tests : https://github.com/JeanLamora75/SMN/blob/main/tests/smn-399-office-scalars.test.mjs
- API : https://github.com/JeanLamora75/SMN/blob/main/src/app/api/admin/reports/office-templates/generate/route.ts

**Statut : En cours.** Ne pas déclarer la Story terminée avant confirmation des contrôles d'intégration.

## Corrections de validation apportées lors de l'intégration

- Correction de la déclaration `ProcessEnv` dans le test de SMN-398 à la suite d'un échec TypeScript réel en CI.
- Correction d'un test de chemin pour qu'il soit compatible Windows/Linux, et tolérance au refus de création de liens symboliques sous Windows sans droits administrateur.
- Correction d'une apostrophe JSX dans `recommended-guide.tsx` après identification d'un échec ESLint indépendant de SMN-399.
- Les validations du **dernier commit** restent à confirmer avant de déclarer la Story terminée. Des runs précédents ont échoué sur les erreurs identifiées puis corrigées ; ils ne prouvent pas que la CI actuelle soit verte.
