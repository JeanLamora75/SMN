# SMN-234 — D6 : Tendances de la fiche Sprint (G04–G07)

**Date :** 23 octobre 2026 · **Epic :** SMN-228 · **Branche :** `main` · **Statut :** implémentation publiée, noyaux de calcul testés isolément, recette complète non exécutée.

## 1. Réalisation fonctionnelle

L'onglet **Tendances** de `/app/admin/sprints/[sprintId]?tab=trends` montre **trois graphiques distincts**, sans saisie ni crayon :

| Graphique | Mesure | Source / formule |
|---|---|---|
| **G05** | Story Points terminés, en SP | `snapshot.storyPoints.done_sp` |
| **G06** | Taux de réalisation, en % | `done_sp/(initial_sp+added_sp−removed_sp)×100` si engagement final strictement positif |
| **G07** | Capacité réelle, en J/H | `snapshot.capacity.actual_jh` (snapshot de clôture), distincte de la présence D5 |

Le socle **G04** sélectionne **au plus cinq Sprints clôturés**, strictement de l'équipe du Sprint de référence, dont `start_at` n'est pas postérieur au début du Sprint consulté. Les Sprints éligibles doivent avoir une clôture enregistrée ; une fermeture sans snapshot n'est pas présentée avec des données inventées. La sélection SQL extrait, pour chaque Sprint, le **dernier snapshot Vn** puis trie chronologiquement **du plus ancien au plus récent**.

**Faits sans déformation :**
- Un zéro réellement enregistré reste `0`. Une mesure `null`, absente, illisible ou incohérente reste `null`.
- Le dénominateur de G06 est nul ou négatif : **non calculable**. Un taux supérieur à 100 % reste supérieur à 100 % (aucun plafonnement).
- La capacité G07 est **réelle telle qu'enregistrée** dans chaque snapshot de clôture, **jamais recalculée à partir de la présence estimée D5**.
- Les courbes SVG sont calculées avec une **échelle Y adaptée**, les points invalides sont exclus, les lacunes **interrompent** les segments ; les valeurs à 0 sont bien affichées.
- L'axe horizontal représente l'ordre chronologique (numéro 1…5) ; le **tableau accessible** sous les courbes contient le nom complet de chaque Sprint, sa version de clôture et les valeurs exactes SP/%/JH. Les noms renvoient aux fiches Sprint réelles ; aucune reconstitution des historiques antérieurs.
- Données disponibles : **trois SVG accessibles** avec titre et description, rendus dans une grille Bootstrap responsive (1 colonne mobile, 3 à largeur XL). Mesure entièrement absente : message spécifique à ce graphique au lieu d'une fausse courbe.
- Absence de clôture éligible : état vide documenté, sans graphiques mensongers.
- Les utilisateurs `user` et `admin` ont l'autorisation **read collective** existante ; aucun nom de membre, absence individuelle ou donnée confidentielle n'entre dans les séries.

## 2. Travail technique

- `src/server/sprints/trends.ts` : adaptation du service préexistant (SMN-86). **Suppression de l'appel `ensureClosureSchema`** qui effectuait des DDL lors de la lecture. La lecture utilise exclusivement **SELECT**, avec `to_regclass` pour une base sans table de clôtures, filtre par `teamId` optionnel imposé pour la fiche utilisateur et conservant la signature admin historique à deux arguments. Projection défensive des valeurs de snapshot, récupération de `version`.
- `src/lib/sprint-trend-geometry.ts` : **nouveau** moteur pur de calcul des échelles, points et segments, sans dépendance graphique.
- `src/app/app/admin/sprints/[sprintId]/sprint-trends-panel.tsx` : **nouveau** rendu graphique SVG des trois courbes, messages « non disponible », tableau accessible, liens vers les Sprints.
- `src/app/app/admin/sprints/[sprintId]/page.tsx` : connexion au vrai onglet `trends` à partir du Sprint sécurisé par la route ; `readSprintTrends(db,cycle.id,teamId)` uniquement lors de l'ouverture de cet onglet, dans `withDashboardRead`.
- `src/i18n/fr.json`, `src/i18n/en.json` : neuf libellés contextualisés FR/EN pour les graphiques, données manquantes et versions Vn.
- `tests/smn-234-sprint-trends-d6.test.ts` : **nouveaux tests à exécuter localement** : filtrage d'équipe, absence de source, maximum cinq clôtures, chronologie, %, JH, `null`, zéro, ruptures de courbe, trois SVG et tableau. Le lecteur de l'ancien endpoint `/api/admin/sprints/trends` reste consommable par le formulaire `review/trends.tsx`, sans mutation SQL pendant les GET.

Le travail ne modifie **ni les versions de clôture enregistrées**, ni les producteurs de capacité réelle. Les autres onglets D1–D5 sont conservés.

## 3. Vérifications réellement exécutées

**Contrôles GitHub :** 16/16 assertions statiques de cohérence : source SELECT-only, filtrage `team_id`, borne temporelle, limite à cinq, dernière version Vn, formule nulle/zero, trois séries, SVG/tableau, locale FR/EN, responsive et ancien endpoint.

**Noyau graphique isolé :** fichier `src/lib/sprint-trend-geometry.ts` recopié dans l'environnement d'exécution, **SHA Git `25039d0bdd0b271b0b5aa7d6713bb76b9048d636` égal au blob publié**. Compilé avec `tsc --strict --target es2022 --module commonjs --skipLibCheck` (**succès**), puis **14 assertions exécutées et réussies** sous Node.js 22 sur les séries vides/0/1/5, l'échelle des % >100, les lacunes et la position des segments.

**Lecteur historique isolé :** copie de `src/server/sprints/trends.ts`, **SHA Git `30ccbcfeaa29639d54b19268d78f0f14a5256076` égal au blob publié**. Compilation TypeScript stricte (**succès**, avec **déclaration locale minimale de `pg`** pour l'isolement du module), puis **28 assertions de lecture/projection exécutées et réussies** via un faux `Client.query` contrôlant les SELECT et leurs paramètres : refus hors équipe, source absente, cinq clôtures, tri, G05/G06/G07, 0/null, >100 %, instantané Vn. Cette vérification **ne se substitue pas à un PostgreSQL réel**.

**Non réalisés :** `pnpm typecheck` du dépôt entier, `pnpm exec tsx --test tests/smn-234-sprint-trends-d6.test.ts`, `pnpm i18n:check`, `pnpm build`, rendu React réel sous Next.js, base PostgreSQL, tests navigateur desktop/mobile/lecteur d'écran. L'environnement de contrôle dispose de Node 22 et tsc isolés mais pas du checkout/dépendances SMN configurés pour pnpm/Next 16 ; GitHub Actions reste indisponible. **D6 est codé et contrôlé partiellement mais pas recetté intégralement.**

## 4. Recette sur PC Windows 11

Mettre à jour `main` avec GitHub Desktop. Dans PowerShell, à la racine SMN :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-trends-d6.test.ts tests/smn-234-sprint-presence-d5.test.ts tests/smn-234-sprint-ceremonies-d4.test.ts tests/smn-234-sprint-indicators-d3.test.ts tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-detail-d1.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

En admin et en user, ouvrir **Sprints → nom d'un Sprint → Tendances**. Vérifier 0/1/5 et plus de cinq clôtures, liens des lignes vers leur Sprint, même équipe seulement, présentation chronologique, 3 graphiques avec unités correctes, alternative tableau lisible au clavier, FR/EN et zoom 200 %, mobile 320/375 px et desktop. Préparer une clôture avec `done_sp=0` et capacité `0` pour vérifier la présence d'un **vrai zéro**, un autre snapshot avec `done_sp=null` pour vérifier la lacune, un autre avec réalisation >100 % et un dernier sans capacité réelle. Changer ensuite des données courantes d'un ancien Sprint de **test** et confirmer que son graphique continue à lire le snapshot de clôture enregistré ; ne pas toucher aux Sprints de production.

## 5. Décisions et suite

**À valider en recette UX :** rendu des courbes et du tableau sur très petits écrans, noms très longs, cas sans mesure, nombre de points inférieur à deux. Aucun choix de bibliothèque graphique externe n'a été imposé : SVG natif et Bootstrap réutilisent le stack existant.

**Statut :** D0 documenté, D1–D6 développés sur `main`, toujours en attente de compilation/recette transverses. `SMN-234` reste ouverte.

**Étape suivante : D7 — Bilan**, les deux analyses humaines/IA indépendantes, persistées et historisées, sans prétendre générer de texte IA tant que l'Epic 9 n'existe pas.

## 6. Références

- Jira : https://lmn24.atlassian.net/browse/SMN-234
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
- [Audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
