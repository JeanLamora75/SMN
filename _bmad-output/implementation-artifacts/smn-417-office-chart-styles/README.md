# SMN-417 — Résolution des styles Office et tags STYLE

**BMAD :** Amelia · **Date :** 8 novembre 2026 · **Statut : implémentation publiée, non validée par exécution locale**  
**Jira :** [SMN-417](https://lmn24.atlassian.net/browse/SMN-417) · **Parent :** [SMN-6](https://lmn24.atlassian.net/browse/SMN-6)  
**Dépendance :** SMN-416, catalogue versionné et persistance des styles globaux.

## Périmètre strict de la Story

Cette étape implémente le **choix d'un style**, pas son application visuelle aux pixels SVG/PNG. Le rendu graphique Word historique et le rendu PowerPoint adaptatif restent inchangés. Les raccordements au moteur SVG et au formulaire d'export seront livrés dans SMN-418 et SMN-421.

## Contrat réalisé

1. Le parseur historique `scripts/smn-402-office-chart-tags.mjs` accepte facultativement `STYLE=<id>`, où `id` respecte `^[a-z][a-z0-9-]{2,63}$`. Les paramètres déjà supportés `TYPE`, `TAGS`, `LAST` et leurs défauts ne changent pas. **Important :** un tag sans `STYLE` conserve le même objet de paramètres qu'avant SMN-417 (aucun champ `style` supplémentaire), ce qui préserve les tests et les appels historiques.
2. `src/server/reports/office-chart-style-resolver.ts` expose un **résolveur pur** : `createOfficeChartStyleResolver(snapshot, reportStyleId?)`, appelé une fois par rapport. Sa fonction retournée `resolve(request)` ne fait aucun accès à la base, aucun calcul v33 et aucun rendu.
3. La priorité fonctionnelle est :
   - `STYLE` présent dans le tag.
   - Style facultatif défini pour le rapport au moment de l'export (entrée prévue en SMN-421).
   - Style global par défaut du type de graphique.
   - Mode historique de compatibilité, sans configuration spécifique.
4. Une référence explicite à un style absent, supprimé ou à identifiant invalide **échoue** et ne se rabat jamais sur un autre style. Les configurations JSON incohérentes sont refusées avant construction du snapshot. Ces erreurs possèdent des **codes stables** et des libellés localisés en FR/EN dans `src/i18n/*`.
5. `loadOfficeStyleSnapshot(db,actor)` effectue **un chargement du catalogue par génération** dans une transaction en lecture seule à isolation `REPEATABLE READ`. Les définitions et les défauts sont lus sous un snapshot PostgreSQL cohérent. `createOfficeStyleSnapshot` fait une copie défensive et fige profondément les objets. Une modification concurrente après chargement ne change pas les styles du rapport déjà en cours.
6. Le résolveur n'accède à aucune source d'indicateurs : il travaille exclusivement avec `type`, `style`, la sélection facultative et la configuration globale.

## Exemple

```text
{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=6|STYLE=corporate}}
```

Sans `STYLE`, le modèle Office reste valide ; si aucun choix de rapport n'est fourni, le résolveur sélectionne le style par défaut du type, ou le mode historique lorsqu'aucun défaut n'existe.

## Tests ajoutés

`tests/smn-417-office-chart-style-resolver.test.ts` couvre :
- Anciens tags inchangés et nouveau paramètre `STYLE` (inconnu, dupliqué, mal formé).
- Les six types graphiques et les quatre niveaux de priorité.
- Un style personnalisé, suppression ou absence d'un style et refus du repli silencieux.
- Configurations incohérentes et conflits de révision ; immuabilité face à une édition concurrente simulée.
- Découverte des tags dans les packages DOCX et PPTX synthétiques.
- Une lecture transactionnelle de catalogue suivie de 20 résolutions **sans requête SQL supplémentaire**.

Tests de non-régression existants à relancer : `tests/smn-402-office-trends.test.ts` et `tests/smn-411-chart-targets.test.mjs`.

## Vérification locale Windows 11

Depuis la racine de SMN, après synchronisation GitHub Desktop et installation des dépendances Node déjà présentes :

```powershell
pnpm test:smn-417
pnpm typecheck
pnpm lint
```

Cette intervention a utilisé **les connecteurs GitHub/Jira**, sans exécuter les scripts `uv` du skill BMAD. Le résultat des commandes ci-dessus n'est **pas** attesté par la publication de code. Un succès `pnpm test:smn-417` ne remplace pas les tests et la recette de génération Office des Stories SMN-418/SMN-421.

## Traçabilité des critères d'acceptation

| Critère | Mise en œuvre | Preuve nécessaire |
|---|---|---|
| AC-01 Syntaxe historique + STYLE | Parseur adapté, découverte DOCX/PPTX testée | Tests Node |
| AC-02 Priorités exactes | Résolveur pur et snapshots | Matrice de tests Node |
| AC-03 Erreur explicite | Codes typés, identifiants stricts, FR/EN | Tests erreurs et traduction |
| AC-04 Un chargement par export | Helper transactionnel, résolution sans I/O | Test faux client et intégration PG future |
| AC-05 Six types, conflits, compatibilité | Suite dédiée et tests historiques | Logs de tests locaux et typecheck |

**Aucune modification des valeurs v33, des modèles Office archivés ou du renderer de production.**  
**Pas d'autorisation implicite de passer SMN-417 au statut Terminé sans preuve d'exécution.**
