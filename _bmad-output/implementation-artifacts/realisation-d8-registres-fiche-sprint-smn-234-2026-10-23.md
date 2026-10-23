# SMN-234 — D8 : Socle d'intégration des six registres

**Date :** 23 octobre 2026 · **Branche :** `main` · **Epic de la fiche :** SMN-228 · **Dépendance :** SMN-5 (SMN-89 à SMN-112).

**Statut : D8 partiellement implémenté, BLOQUÉ pour les fiches réelles par l'Epic 5.** L'état actuel n'est **pas** une livraison complète d'AC8 ni une recette fonctionnelle des six registres.

## 1. Constat vérifié avant développement

- Sur Jira, les **24 Stories SMN-89 à SMN-112** sont toutes au statut **« À faire »**. Les descriptions sont validées fonctionnellement mais pas développées/recettées.
- L'arbre GitHub `main` comporte les documents de spécification des registres, dont `_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/registres-qualitatifs.md`, mais **aucun service d'enregistrement/consultation des six fiches centrales ni leurs routes de détail**.
- `SMN-89` (création), `SMN-90` (consultation), `SMN-91` (versionnement), `SMN-97` (multi-cycles), `SMN-106–110` (faits marquants), `SMN-111/112` (snapshots V1/V2) sont les principaux producteurs nécessaires à l'onglet demandé.
- **Décision d'exécution :** ne pas créer de nouvelles tables ou routes de registres isolées de l'Epic 5 et ne pas simuler des fiches ou des statuts. Construire uniquement le **socle de projection D8** et afficher un état d'indisponibilité explicite.

## 2. Réalisation effective sur main

1. **Contrat pur** `src/lib/sprint-registers.ts` : six types `risk`, `obstacle`, `dependency`, `decision`, `action`, `highlight`. Métadonnées de présentation uniquement si effectivement fournies : identifiant stable, titre, date métier, statut/priorité nullable, créneau de validité, associations de cycles et équipes, lien facultatif issu du producteur.
2. **Sélection temporelle** : pour risque, obstacle, dépendance et action, retenir un enregistrement dont la période d'ouverture intersecte le Sprint (y compris ouvert avant et résolu **durant**). Décisions et faits marquants : date métier dans `[startAt,endAt)`. Les dates techniques sont des instants ISO avec fuseau explicite : un fournisseur de dates métiers locales devra les convertir dans le fuseau IANA approprié. **Aucune attribution temporelle n'est inventée**.
3. **Périmètre d'équipe** : une fiche fournie est éligible seulement pour une équipe à laquelle elle est réellement associée. Les liens vers d'autres cycles ne dupliquent pas la fiche : identité `(kind,id)`, associations multi-cycles fusionnées. Deux copies de la même fiche avec des champs métier contradictoires provoquent une indisponibilité `invalid-data` et non un choix silencieux.
4. **Tri et pagination** : tri sur date métier ASC, type puis ID ; pagination de 25 fiches et borne du nombre de pages à la dernière page ; plus de 200 fiches prises en charge par le moteur de projection sans tronquer implicitement.
5. **Lecture collective** `src/server/sprints/registers-detail-read.ts` : requêtes **SELECT seulement**, contrôle du Sprint et de `team_id`; le port `RegistryReadProvider` pourra être fourni par l'Epic 5 après implémentation de son schéma et de ses règles de confidentialité. **Aucun adaptateur Epic 5 n'existe aujourd'hui**. En Sprint courant et sans producteur, la lecture répond `{state:"unavailable",reason:"producer-not-installed"}`, **pas** `total:0`.
6. **Clôtures historiques** : lecture strictement du dernier snapshot Vn si un jour une rubrique conforme `snapshot.qualitativeRegisters` est fournie par **SMN-111/112**. Cette forme JSON (`records`, `availableKinds`) est **un contrat provisoire d'interopérabilité D8 à confirmer avec les développeurs de l'Epic 5**, et **n'est pas écrite par D8**. Si le snapshot ne la contient pas, résultat `history-missing` ; jamais d'interrogation des valeurs courantes pour inventer l'état historique. Aucun changement de `src/server/sprints/closure.ts` à D8.
7. **Onglet réel** `src/app/app/admin/sprints/[sprintId]/sprint-registers-panel.tsx` et raccordement à `page.tsx` : six catégories lisibles avec icônes Bootstrap déjà installées, liste chronologique et pagination exploitables lorsqu'une source autorisée existe ; sous la version actuelle, **un message explicite « Registres indisponibles (Epic 5) »**. Pas de faux nombre de fiches ou de fausse « liste vide ». Les types absents d'un adaptateur partiel sont listés comme indisponibles.
8. **Liens** : aucune URL de détail de fiche n'est construite depuis une convention supposée ; seuls des chemins internes validés, **fournis par un futur producteur officiel**, seront présentés. Aucun bouton de modification factice ni droit admin nouveau à D8.
9. **FR/EN** : libellés des six types, états source/historique, listes, paginations et priorités intégrés aux catalogues centralisés.

## 3. Limites et décisions à respecter

- **D8 ≠ Epic 5 :** ne pas créer six modèles concurrents. La conception de l'Epic 5 définira ses tables, son lecteur collectif sécurisé, sa granularité temporelle et ses routes; il faudra ensuite **brancher explicitement** le `RegistryReadProvider` sur la page et confirmer/adapter `snapshot.qualitativeRegisters`.
- Le modèle de portée interéquipes et de confidentialité sera défini par les producteurs de l'Epic 5. Le filtrage D8 est une **défense complémentaire**, pas une substitution à leur autorisation serveur.
- Les faits automatiques n'ont pas de statut de workflow inventé ; `status=null` est licite. Une criticité ROAM ou une priorité ne se calcule pas dans D8 ; seule la donnée réellement produite est présentée.
- Les enregistrements sans provenance de date fiable sont rejetés, pas réaffectés arbitrairement au Sprint demandé.
- Pour les cycles clos historiques, **SMN-111 et SMN-112 sont bloquants** ; un nouveau snapshot complet n'est pas disponible tant que leur producteur n'est pas réalisé.
- Aucun accès aux fiches de registres depuis SMN ne peut être promis avant la création de leurs routes **réelles**. Les URLs provenant de sources externes ne deviennent pas des liens automatiquement.

## 4. Tests et contrôles

**Test publié, à exécuter dans SMN :** `tests/smn-234-sprint-registers-d8.test.ts`. Scénarios de six types, problème résolu pendant un Sprint, risque commencé avant le Sprint, faits ponctuels sur borne exacte, isolement d'équipe, multi-cycles sans copie, conflit de doublon, 205 fiches paginées, distinction vide vs indisponible, lien externe interdit, historique absent et snapshot Vn hypothétique.

**Contrôles effectués :** relecture statique des fichiers publiés, structure du contrat, permission d'équipe, séparation consultation/écriture, cohérence des libellés FR/EN et absence de créations de tables dans le lecteur.

**Non exécutés et à ne pas revendiquer :** `pnpm typecheck` sur le projet, tests `tsx --test` intégrés, build Next.js, PostgreSQL et navigateur. Le dépôt GitHub n'est pas clonable depuis l'environnement de contrôle (`github.com` non résolu), et `pnpm` n'y est pas disponible. Une vérification isolée éventuelle d'une fonction pure ne prouverait pas l'intégration à l'application.

## 5. Recette locale et critères de déblocage

Synchroniser `main` dans GitHub Desktop et lancer :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-registers-d8.test.ts tests/smn-234-sprint-review-d7.test.ts tests/smn-234-sprint-trends-d6.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

**Aujourd'hui :** ouvrir un Sprint de test → onglet **Registres** ; vérifier les six catégories, le message **indisponible** (pas « zéro fiche »), le comportement user/admin, les traductions FR/EN, écran 320 px, et l'absence de lien inventé.

**Après Epic 5 :** intégrer le port autorisé, tester 0/1/205+ fiches réellement sauvegardées, date d'ouverture avant Sprint et clôture pendant Sprint, plusieurs cycles vers la **même fiche centrale**, équipe hors périmètre inaccessible, ordre stable et pagination; nouveaux snapshots V1/V2 incluant les **six** registres, réouverture/reclôture, anciens snapshots indisponibles et liens de détail réellement accessibles. Ne pas qualifier D8 comme « terminé » avant ces tests réels.

## 6. Suite

**État réel :** D0 documenté, D1–D7 codés et non recettés globalement ; D8 **socle branché mais bloqué pour les fiches réelles**. SMN-234 reste ouverte. On peut **préparer la recette technique D9 des lots D1–D7** sans attendre l'Epic 5, mais **la validation finale D9 de tous les sept onglets** dépend de SMN-89–112 et des résultats de recette locale.

**Références :**
- [Story SMN-234](https://lmn24.atlassian.net/browse/SMN-234)
- [SMN-89](https://lmn24.atlassian.net/browse/SMN-89) · [SMN-90](https://lmn24.atlassian.net/browse/SMN-90) · [SMN-97](https://lmn24.atlassian.net/browse/SMN-97) · [SMN-111](https://lmn24.atlassian.net/browse/SMN-111) · [SMN-112](https://lmn24.atlassian.net/browse/SMN-112)
- [PRD des registres](../planning-artifacts/prds/prd-SMN-2026-10-18/registres-qualitatifs.md)
- [Contrat UX de la fiche](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
