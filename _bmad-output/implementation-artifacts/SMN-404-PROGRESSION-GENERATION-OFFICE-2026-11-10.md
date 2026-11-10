# SMN-404 — Modale de progression de génération Word / PowerPoint

**Référence Jira :** [SMN-404 — Génération de rapports Office intégrée et accessible](https://lmn24.atlassian.net/browse/SMN-404)  
**Epic :** [SMN-6 — Rapports](https://lmn24.atlassian.net/browse/SMN-6)  
**Date :** 10 novembre 2026  
**Origine :** demande utilisateur d'afficher une fenêtre modale avec jauge lors de la génération depuis un modèle Word ou PowerPoint, avec fermeture automatique une fois le rapport généré.  
**Statut de preuve :** code publié sur `main` ; CI dédiée **non encore validée** au moment de la rédaction ; recette utilisateur et Microsoft Office non effectuée.

## 1. Besoin métier

En tant que Scrum Master ou RTE, lorsque je lance la génération ou l'enregistrement d'un rapport depuis **Rapports > Modèles**, je veux voir une fenêtre modale qui montre que SMN travaille, les étapes de l'opération et, lorsqu'il est mesurable, l'avancement du transfert du fichier. Je veux que cette fenêtre se ferme automatiquement à la fin, sans devoir effectuer une action supplémentaire.

### Critères d'acceptation complémentaires de SMN-404

- **CA-8.8 — Ouverture immédiate :** un clic sur **Générer** ouvre une modale Cockpit Agile présentant un titre, l'étape en cours et une jauge. Le parcours **Enregistrer dans SMN** présente également la progression, incluant la vérification et la sauvegarde.
- **CA-8.9 — Jauge véridique :** pendant les calculs serveur, afficher une jauge **indéterminée** (animation sans pourcentage inventé). Pendant la réception du DOCX/PPTX, afficher un pourcentage uniquement si une longueur de réponse fiable est connue ; sinon, conserver une jauge indéterminée.
- **CA-8.10 — Fin normale :** lorsque la réponse de génération est complètement reçue et que le téléchargement du navigateur a été déclenché, la modale se ferme automatiquement. Lorsque l'API confirme l'enregistrement, elle se ferme et le message de succès reste sur la page.
- **CA-8.11 — Erreurs :** HTTP non-2xx, exception réseau, incompatibilité de modèle ou échec de sauvegarde ferment la modale et affichent l'erreur sur le formulaire. Aucun faux succès.
- **CA-8.12 — Confirmation d'écrasement :** la modale de confirmation existante est préservée ; la vérification peut présenter la progression avant l'affichage de la confirmation ; la génération et l'écriture interviennent seulement après confirmation, sans écrasement silencieux.
- **CA-8.13 — Accessibilité / i18n :** modale nommée avec `role="dialog"`, `aria-modal`, suivi accessible du progrès, retour du focus au contrôle initial, traductions FR/EN via les catalogues JSON. Les actions concurrentes sont bloquées pendant le traitement.
- **CA-8.14 — Non-régression :** formats DOCX et PPTX et traitements existants (tags, tableaux, images, styles, permissions, contrôle de destination) inchangés ; tests Windows/Linux, TypeScript, ESLint et parité FR/EN à vérifier.

## 2. Architecture et fonctionnement livrés

| Élément | Chemin | Rôle |
|---|---|---|
| UI de progression | `src/app/app/reports/office-generation-progress.tsx` | Modale accessible, titre, libellés des phases, barre de progression indéterminée/déterminée |
| Orchestration UI | `src/app/app/reports/office-template-catalog.tsx` | Déclenche l'ouverture, suit `check`, `generate`, `save`, `download`, ferme et présente les erreurs |
| API génération | `src/app/api/admin/reports/office-templates/generate/route.ts` | Retourne la taille exacte `Content-Length` sur les réponses de téléchargement |
| Traductions | `src/i18n/fr.json`, `src/i18n/en.json` | `reportsCenter.officeProgress*`, clés FR/EN identiques |
| Tests ciblés | `tests/smn-office-generation-progress.test.ts` | Tests statiques de raccordement, phases, octets reçus, traduction, absence de timer de faux pourcentage |
| CI dédiée | `.github/workflows/smn-office-generation-progress.yml` | Matrice Windows/Linux ; tests, non-régressions Office, parité, typage, lint |

**Phases réellement codées :**

1. `check` : demande de vérification de la destination pour le parcours Enregistrer, jauge indéterminée.
2. `generate` : requête serveur qui prépare le DOCX/PPTX, jauge indéterminée car aucune progression interne n'est transmise.
3. `download` : lecture de `response.body.getReader()`, cumul des `value.byteLength` et pourcentage plafonné à 99 durant la réception lorsqu'un `Content-Length` valide est présent. Mise à jour UI seulement si le pourcentage change. Fermeture après création de la ressource Blob et déclenchement du téléchargement.
4. `save` : demande d'écriture sur disque après contrôle/conflit et confirmation éventuelle ; jauge indéterminée, fermeture en fin d'opération.

La propriété `Content-Length` correspond à `withCharts.byteLength`. Le client n'essaie pas de déduire la durée de traitement à partir du temps écoulé. Le navigateur garde ses propres règles de téléchargement : SMN peut confirmer le déclenchement du téléchargement et non l'écriture effective du fichier dans le dossier choisi par l'utilisateur.

## 3. Erreurs, sécurité et limites

- L'API conserve ses contrôles d'autorisation, équipe/sprint, format, modèle et emplacement, sans nouveau chemin de génération privilégié.
- Les erreurs métiers restent traitées dans `reportGenerationFailure` et les erreurs génériques dans la page.
- La confirmation avant remplacement d'un document existant reste distincte de la modale d'attente ; aucun remplacement automatique n'est introduit.
- **Pas de pourcentage de rendu serveur :** il faudrait ajouter un protocole de progression asynchrone côté serveur (jobs avec état, flux SSE ou équivalent) pour mesurer les opérations internes. Ce changement n'a pas été réalisé et n'est pas sous-entendu.
- **La jauge en pourcentage ne couvre que le transfert :** elle ne représente ni l'avancement des tags ni le rendu des graphiques.
- **Limite technique à qualifier :** les tests ajoutés sont principalement des tests de contrat/présence. Ils ne simulent pas un utilisateur réel dans un navigateur, n'ouvrent pas Word ou PowerPoint et ne mesurent pas une progression réseau lente. La fermeture automatique doit être vérifiée en recette de bout en bout.
- L'affichage est bloquant tant que l'opération est en cours. Le comportement clavier/focus doit être contrôlé avec lecteurs d'écran et navigateur réel.

## 4. Plan de validation et preuves

### Tests automatisés attendus
- `pnpm exec tsx --test tests/smn-office-generation-progress.test.ts`
- `pnpm exec tsx --test tests/smn-421-office-report-style.test.ts tests/smn-400-word-tables.test.mjs tests/smn-401-powerpoint-tables.test.mjs`
- `pnpm i18n:check`
- `pnpm typecheck`
- ESLint ciblé des fichiers UI / tests
- CI Windows et Linux : [workflow de progression](https://github.com/JeanLamora75/SMN/actions/workflows/smn-office-generation-progress.yml)

### Cas de recette fonctionnelle restant à exécuter

| Scénario | Résultat attendu |
|---|---|
| Génération Word courte | Modale puis fermeture automatique ; fichier DOCX valide |
| Génération PowerPoint avec graphiques | Jauge indéterminée pendant calcul ; téléchargement et fermeture ; PPTX valide |
| Téléchargement lent avec longueur connue | Progression croissante liée aux octets reçus ; jamais de pourcentage fictif |
| Enregistrer sans collision | Vérification puis sauvegarde et fermeture ; succès visible |
| Enregistrer sur destination existante | Confirmation conservée avant écriture, aucune écriture en cas d'annulation |
| Erreur de génération ou réseau | Fermeture de modale, erreur métier affichée, pas de succès mensonger |
| FR puis EN | Libellés et états localisés |
| Clavier et lecteurs d'écran | Focus accessible, état annoncé, absence de navigation accidentelle |
| Génération simultanée | Pas de seconde opération initiée depuis la page |
| Régression des tags Word/PPTX | Même document produit hors flux UX / en-tête HTTP |

### État de la CI au moment de la documentation

- Dernière exécution identifiée pour le commit `82ecd631751775e0d9dd9385e329f19375a58b07` : [GitHub Actions 42918451423](https://github.com/JeanLamora75/SMN/actions/runs/42918451423) — **queued** lors de la consultation.
- Les commits de l'UI ont été publiés, mais **aucune réussite de ce workflow n'est revendiquée** tant qu'elle n'a pas été observée.
- La Story SMN-404 ne doit pas être clôturée sur la seule base de ces changements.

## 5. Traçabilité et décisions

La fonctionnalité complète la Story **SMN-404** au lieu de créer une Story redondante. Elle s'articule avec **SMN-403** (sauvegarde et confirmation avant écrasement), **SMN-400** (Word), **SMN-401** (PowerPoint) et les moteurs graphiques Office existants.

Ce document est un **compte rendu d'implémentation** : il ne prétend ni exécuter BMAD via `uv` sur GitHub, ni remplacer une validation sur le poste Windows de l'utilisateur.
