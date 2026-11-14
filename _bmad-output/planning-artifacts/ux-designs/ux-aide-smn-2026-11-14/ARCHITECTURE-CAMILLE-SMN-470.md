# SMN-470 — Architecture du skill Camille, rédactrice documentaire BMAD

**Auteur :** Winston — System Architect  
**Date :** 14 novembre 2026  
**Statut :** conception technique proposée pour implémentation par Amelia ; aucune activation du nouveau skill, aucun pilote exécuté  
**Story :** [SMN-470](https://lmn24.atlassian.net/browse/SMN-470)  
**Sources lues :** `.agents/skills/bmad-agent-architect/SKILL.md`, `.agents/skills/bmad-agent-architect/customize.toml`, `_bmad/custom/config.toml`, `src/lib/help-catalog.ts`, `scripts/build-help-index.mjs`, `content/help/README.md`, `ARCHITECTURE-AIDE.md`, `DESIGN.md`, `tests/smn-467-help-guides.test.ts`.

## 1. Décision

**Créer un agent de rédaction sous forme de skill BMAD local, versionné dans GitHub, sans dépendance runtime ni commande `uv`.** Son nom stable recommandé est `bmad-agent-camille` ; son identité visible est **Camille — Rédaction et maintenance documentaire SMN**. Le skill utilise les fonctions natives d'examen des fichiers GitHub/Jira disponibles dans ChatGPT : elles remplacent, dans cet environnement, les scripts de résolution BMAD non exécutables.

Camille produit du **Markdown versionné** et éventuellement des notes de version en brouillon. Il ne met pas à jour l'application, ses routes, ses contrôles d'accès, ses schémas, les stories Jira ni les données PostgreSQL.

### Choix rejetés
- Intégrer un agent dynamique au serveur SMN : complexité inutile, exigences de sécurité et d'offline supplémentaires.
- Faire rédiger les articles par le navigateur au moment de l'ouverture : incompatible avec l'aide embarquée sans Internet.
- Stocker les guides en base ou dans `src/i18n/fr.json` et `en.json` : interdit par HELP-AD-01/03.
- Introduire une génération autonome sans sources ni validation : risque élevé d'instructions trompeuses.

## 2. Structure de fichiers proposée (nouveaux fichiers exclusivement)

```text
.agents/skills/bmad-agent-camille/
  SKILL.md                     # identité, activation, règles, menu
  customize.toml               # identité et menu par défaut
  references/
    editorial-policy.md        # preuve, confidentialité, accessibilité, langues
    workflows.md               # 5 modes et contrats d'entrée/sortie
    article-template.md        # structure logique et statut de vérification
_bmad/custom/
  bmad-agent-camille.toml       # surcharges d'équipe pérennes
_bmad-output/
  planning-artifacts/ux-designs/ux-aide-smn-2026-11-14/
    ARCHITECTURE-CAMILLE-SMN-470.md
  test-artifacts/camille/
    pilot-s mn-470.md           # nom exact à utiliser : pilot-smn-470.md
tests/
  smn-470-camille-skill.test.mjs
```

Les sous-fichiers `references/` sont lus **à la demande**, afin de ne pas grossir inutilement le contexte de l'agent. `SKILL.md` reste autonome pour les règles de sécurité et de preuve. Ne pas créer de fichier personnel `*.user.toml` dans GitHub.

Le skill doit suivre la forme des agents existants : frontmatter YAML `name`/`description`, section rôle, conventions de chemin, fusion de `customize.toml` avec `_bmad/custom/bmad-agent-camille.toml`, puis configuration `_bmad/config.toml` + `_bmad/custom/config.toml`. **Aucun besoin de modifier `_bmad/config.toml`**, régénérable par l'installateur. Une commande `uv` figurant dans des skills BMAD génériques doit être remplacée ici par la lecture et fusion manuelles des configurations, explicitement signalées comme adaptation ChatGPT.

## 3. Menu et missions

| Code | Mode | Entrée | Sortie attendue |
|---|---|---|---|
| **CR** | Créer un guide | Article ID, langues, comportement et code de référence | Fichiers Markdown FR/EN ou rapport de blocage |
| **MA** | Mettre à jour un guide | Article ID, changement identifié et état précédent | Diff ciblé et sources de chaque changement |
| **AU** | Auditer la couverture | Catalogue canonique, locales disponibles, index et parcours | Liste des manques/incohérences par ID et langue |
| **AC** | Préparer l'aide contextuelle | Article ID + contexte de l'écran et modale existante | Proposition de texte compatible avec la même source Markdown |
| **RV** | Préparer des notes de version | Commits/stories dont la livraison est prouvée | Notes de version factuelles, **non publiées automatiquement** |

Le menu de Camille ne doit pas revendiquer l'exécution du code, l'approbation UX, une QA verte ou l'autorisation de déployer. Si une story est « À faire » dans Jira mais que du code est présent, la contradiction est rapportée et l'agent s'appuie sur les preuves de code **et** de recette — jamais sur le statut seul.

## 4. Chaîne de confiance obligatoire

```text
Demande de documentation
  → repérer articleId dans src/lib/help-catalog.ts
  → lire route/capacités/permissions réelles dans le code
  → examiner tests/CI et story Jira comme éléments de contexte
  → classer chaque assertion : Vérifiée / Partiellement vérifiée / Non attestée
  → exclure les instructions non attestées, ou les signaler comme non livrées
  → rédiger ou modifier seulement les articles autorisés
  → vérifier par langue + routes + index + sécurité
  → soumettre le diff à validation avant publication sensible
```

Le code constitue la référence du **comportement présent** ; Jira représente le besoin à produire, pas la preuve d'une livraison. Des tests statiques prouvent une propriété limitée ; seule une exécution CI réussie prouve le test exécuté et un parcours réellement observé permet d'attester une action de l'interface. Lors d'une divergence, Camille produit une rubrique **« Écart documentaire »** plutôt qu'une instruction inventée.

**Format de traçabilité recommandé, conservé dans le rapport de travail (pas dans le Markdown utilisateur) :**
```text
articleId: tickets
locale: fr
fonctionnalité: import CSV
sources: src/lib/ticket-csv-contract.ts ; src/app/app/tickets/...
preuve: test X / run GitHub Y, ou code seul
vérifié_le: YYYY-MM-DD
statut: vérifié | partiel | non-attesté
action: créer | modifier | ne-pas-publier
```

La date indique quand l'agent **a consulté les sources**, pas un test exécuté par lui. Ne pas prétendre à une validation navigateur ou CI si elle n'existe pas.

## 5. Contrat documentaire et i18n

1. L'identifiant est pris **uniquement** dans `src/lib/help-catalog.ts` ; sa modification ou l'ajout d'un nouvel ID nécessite un arbitrage technique d'Amelia/Winston, pas une création tacite par Camille.
2. L'article localisé est `content/help/<locale>/<articleId>.md` : titre H1, objectif, prérequis, étapes, résultat/contrôle, restrictions, dépannage lorsque nécessaire. Le même ID garde le même sens dans chaque locale.
3. Les versions FR et EN doivent être cohérentes fonctionnellement, mais les formulations peuvent être idiomatiques ; jamais de traduction qui ajoute une fonctionnalité. Si une traduction manque, signaler explicitement le repli français, sans publier une « traduction complète » fictive.
4. Les 6–10 langues futures s'ajoutent par répertoires de locale et index correspondants, **pas** par duplication de composants. Ne pas présumer quelles langues seront retenues.
5. Les liens Markdown ne pointent qu'aux routes réellement présentes et autorisées par le contexte ; si un lien peut être interdit à certains rôles, l'article indique le prérequis plutôt que d'enseigner un contournement.
6. Aucune donnée utilisateur réelle, secret, identifiant de session, token, mot de passe ou capture non anonymisée.
7. Ne pas intégrer de contenu d'aide long dans `src/i18n/*.json`. Réutiliser les libellés UI courts existants ; demander à Amelia toute évolution du catalogue i18n.
8. Les articles et index sont immuables dans le runtime SMN ; la rédaction a lieu **dans le dépôt**, sous contrôle de version. L'aide ne déclenche pas de PostgreSQL ni de service en ligne.

## 6. Parcours pilote de SMN-470 — création puis modification

**Préparer un répertoire de test isolé**, jamais un article inventé dans `content/help` de production : `tmp/camille-pilot/fr/overview.md`, `en/overview.md`. Pour ce pilote, le comportement « première prise en main de SMN » est dérivé de `src/lib/help-catalog.ts` (article `overview`) et du code existant de `src/app/app/help/page.tsx`.

1. **Création :** Camille rédige les deux brouillons `overview.md` selon le même ID, sur la base des sources consultées, avec prérequis et liens réels.
2. **Contrôle initial :** confronter le contenu aux sources ; interdire une instruction non prouvée ; générer les index dans l'espace temporaire avec `buildHelpIndexes({base:temp})`.
3. **Mise à jour ciblée :** changer un seul comportement autorisé (par exemple préciser que la progression de checklist est locale), en préservant ID, liens et structure.
4. **Contrôle de régression :** avant régénération, `buildHelpIndexes({base:temp,check:true})` **doit échouer** sur index périmé ; après régénération, il **doit réussir**. Tester que la version EN a été mise à jour et que la version FR demeure sémantiquement cohérente.
5. **Preuves :** consigner les deux diffs, le code source consulté, les commandes réellement exécutées et les résultats dans `_bmad-output/test-artifacts/camille/pilot-smn-470.md`, sans donnée personnelle.

Le test peut être réalisé via Node/`tsx` et GitHub Actions. Ne pas écrire dans les répertoires du runtime ou en base. **L'exécution du pilote est confiée à Amelia et Murat, et n'est pas revendiquée dans cette conception.**

## 7. Critères de recette (à automatiser si possible)

| Story | Contrôle concret | Responsable |
|---|---|---|
| AC1 | Le dossier skill, frontmatter, customize et surcharge d'équipe sont lisibles ; aucune installation BMAD ni `uv` requis au parcours ChatGPT | Amelia / Murat |
| AC2 | Les cinq modes existent et leurs frontières avec Sally, Winston, Amelia et Murat sont documentées | Amelia / Murat |
| AC3 | Les articles contiennent uniquement des instructions sourcées ; registre de vérification avec date/statut et test de refus d'une action non livrée | Camille / Murat |
| AC4 | IDs canoniques, FR/EN, liens internes, sécurité, index à jour, aucune donnée personnelle/secret, pas d'écriture runtime | Amelia / Murat |
| AC5 | Pilote complet **création → vérification → modification → index périmé → régénération** avec preuves de run GitHub | Amelia / Murat |

### Contrôles à ajouter dans `tests/smn-470-camille-skill.test.mjs`
- Lire `SKILL.md` et confirmer nom stable/frontmatter/menu ; rejeter la duplication de modes.
- Fusionner les champs `agent` de `customize.toml` et de la surcharge d'équipe sans modifier les fichiers générés.
- Vérifier les cheminements et la localisation des artefacts (sans secrets, sans fichiers dans le runtime).
- Exécuter le pilote avec `mkdtemp` et `rm` systématique et `buildHelpIndexes` en mode normal puis `check:true`.
- Conserver un contrôle comportemental qui échoue si l'étape de mise à jour ne change réellement aucun contenu.
- Inclure ce test dans la CI existante et ne pas le rendre non bloquant.

## 8. Séparation des responsabilités

- **John** fixe le périmètre fonctionnel et autorise les changements de stories Jira.
- **Sally** valide l'expérience éditoriale, les intitulés et les captures.
- **Winston** fixe les invariants et approuve les changements d'architecture/catalogue.
- **Amelia** réalise le skill, les scripts autorisés, le raccordement aux contrôles de build et la publication technique.
- **Murat** évalue la qualité des preuves, les tests et la CI, et bloque la livraison si nécessaire.
- **Camille** maintient les contenus, vérifie les faits et signale les écarts. Elle ne déclare jamais seule une fonctionnalité livrée.

## 9. Impacts, dépendances et livrables

- **Impacts autorisés :** nouveau skill et configuration pérenne `_bmad/custom/`, documentation du workflow, tests, CI de vérification, brouillons localisés.
- **Impacts interdits sans story complémentaire :** migration DB, mutation du module Aide, nouvelle API, instrumentation IA externe, publication automatique de notes de version, changement de permission/route.
- **Dépendances :** catalogue et chargeurs Aide existants (SMN-459/460), disponibilité des fichiers FR/EN (SMN-466/467), tests index et CI (SMN-462/469). La conception n'assimile pas ces dépendances à des stories formellement clôturées.
- **Validation finale attendue :** skill activable dans ChatGPT sous la configuration locale BMAD ; pilote traçable ; contrôles automatiques verts ; aucun `uv`, aucune donnée sensible, aucune écriture PostgreSQL.

## 10. Adaptations explicites de l'environnement

L'activation BMAD générique décrit des scripts `uv run .../resolve_customization.py` et `resolve_config.py`. **Ils ne sont pas exécutables ici et n'ont pas été lancés.** En ChatGPT, lire les fichiers dans l'ordre base → équipe → utilisateur, appliquer les règles de fusion documentées et indiquer toute entrée absente. Les scripts locaux existants `node scripts/build-help-index.mjs` et les tests Node restent compatibles avec la CI GitHub, mais nécessitent une exécution réelle pour attester le résultat.

---

**Décision d'architecte :** concevoir un skill documentaire léger, déterministe dans ses chemins et ses contrôles, avec validation humaine des changements de périmètre. **Statut SMN-470 : prêt pour implémentation, non développé à ce stade.**
