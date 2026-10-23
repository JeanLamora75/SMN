# SMN-234 — D5 : Capacité du Sprint et J/H de présence des membres

**Date :** 23 octobre 2026 · **Epic :** SMN-228 · **Branche :** `main` · **Statut :** code publié et contrôlé partiellement, recette intégrée à effectuer.

## 1. Périmètre métier réalisé

L'onglet **Capacité** de `/app/admin/sprints/[sprintId]?tab=capacity` présente, pour l'administrateur :
- les **membres affectés pendant au moins une journée** de la période du Sprint (y compris arrivée/départ en cours de Sprint et membres sans activité « développeur ») ;
- leurs **J/H de présence** mis en valeur, indépendamment des J/H de développement affichés en colonne secondaire ;
- une qualité de données par membre : nombre de jours non calculables, avec valeur `null` plutôt qu'un zéro fallacieux ;
- le **total des J/H de présence** uniquement si tous les membres sont calculables ; le nombre réel de membres ;
- un lien vers la **gestion des membres** déjà protégée.

**Source d'information :** moteur existant `src/server/capacity/engine.ts`, réutilisé sans le modifier. Pour chaque jour où le membre est affecté à l'équipe, le moteur combine calendrier hebdomadaire et exceptions, absences, jours fériés nationaux (avec statut de couverture), fermetures d'entreprise et versions d'affectations.

### Définition D5 — estimation de présence

```text
Présence J/H du membre = Σ (demi-journées disponibles / 2)
                         pour les jours où le membre est affecté au Sprint
```

**Une demi-journée disponible = 0,5 J/H**, selon la convention de l'application (8 h/J/H par défaut) ; le moteur fournit `availableHalfDays` après les indisponibilités. **Ni `developerPercent`, ni `allocationPercent`, ni `contributionPercent` ne multiplient cette présence**. Ainsi, un Scrum Master ou Product Owner ayant 0 J/H de développement peut conserver de la présence ; un membre ayant cinq matinées de travail planifiées sur une semaine apporte 2,5 J/H de présence.

**Temps partiel :** le **calendrier individuel doit refléter les jours ou demi-journées réellement programmés**. Le pourcentage contractuel n'est pas appliqué une deuxième fois aux demi-journées, afin d'éviter un double abattement lorsque le calendrier configure déjà le temps partiel. **Point d'attention métier à valider avec l'utilisateur :** comment signaler/corriger les cas où le `contractPercent` et le calendrier des demi-journées ne correspondent pas ; aucune inférence artificielle n'est appliquée.

**Ce n'est pas un pointage réel :** les J/H représentent **une estimation de présence à partir des calendriers et des absences saisies**, y compris une projection future. Ils ne prouvent pas la présence physique passée. Cette distinction est **écrite dans l'interface FR/EN**, et les colonnes J/H de développement sont explicitement séparées.

### Révisions, dates et historique

- Fenêtre du Sprint : début local IANA **inclus**, fin instantanée **exclusive** convertie avec `endAt - 1 ms`, respect des transitions été/hiver Europe/Paris.
- Chaque journée impossible à calculer (`work-calendar`, absence de couverture nationale, ambiguïté d'affectation/version, etc.) donne un **membre partiellement inconnu** et des J/H de présence globaux **non calculables**. Les autres membres calculables restent visibles ; un jour férié ou un jour sans disponibilité **connu** compte 0 J/H.
- **Lecture actuelle :** `readSprintMemberPresence` utilise `readDevelopmentCapacity` avec `externalTransaction:true` et `includeExceptionalImpact:false` dans la transaction existante ; les réunions ne diminuent pas la **présence**, même lorsqu'elles diminueraient la capacité de développement. Aucun DDL ni modification métier lors de la consultation ; disponibilité des tables contrôlée avant l'appel, point de sauvegarde transactionnel pour traiter un échec de schéma ancien sans casser la lecture de la fiche.
- **Sprints clôturés :** le workflow de clôture `src/server/sprints/closure.ts` ajoute un champ `memberPresence` à **chaque nouveau snapshot de clôture Vn**, à partir du calcul présent au moment de clôturer. Il reste figé si les calendriers évoluent ensuite. Si un ancien snapshot Vn n'a pas ce champ, la fiche **n'affiche pas de données reconstituées avec le calendrier d'aujourd'hui** : `history-missing`.
- Le snapshot peut conserver `state:"unavailable"` si les sources manquent lors de la clôture ; la fonctionnalité **n'invente pas** alors un tableau nominatif pour cet historique.

### Confidentialité et droits

La gestion des membres (identités, présence individuelle et disponibilité) est la ressource **`members`**. Le contrat MVP du fichier `src/server/access-policy.ts` autorise sa **lecture seulement à l'administrateur**. Par conséquent :
- La fiche Sprint reste accessible en lecture collective au rôle `user`, mais **ne lance pas de requête nominative** lorsque `canAccess(account,"read",{type:"members",...})` refuse.
- Le composant `SprintCapacityPanel` reçoit `data=null` pour le rôle user, même s'il était monté ; son écran signale clairement la restriction.
- Aucune API de détail des membres non protégée n'a été créée ; aucun crayon inerte n'a été ajouté dans la fiche.

Cette décision est une **application conservatrice du contrôle d'accès existant**, à revalider fonctionnellement si l'utilisateur veut à l'avenir autoriser l'affichage nominatif en lecture collective.

## 2. Fichiers livrés

| Fichier | Modification |
|---|---|
| `src/lib/sprint-presence.ts` | **Nouveau** contrat et calcul pur des J/H de présence, validation stricte des snapshots, bornes IANA |
| `src/server/sprints/presence-detail-read.ts` | **Nouveau** lecteur de l'équipe, contrôle du schéma, moteur existant, snapshot de clôture |
| `src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx` | **Nouveau** tableau admin de présence et développement, totaux, badges de fiabilité, accès Membres |
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Raccordement de l'onglet Capacité avec contrôle nominatif admin **avant la lecture** |
| `src/server/sprints/closure.ts` | Ajout des valeurs `memberPresence` lors des **nouvelles** clôtures Vn |
| `src/i18n/fr.json`, `src/i18n/en.json` | Libellés FR/EN des estimations, des statuts et de la confidentialité |
| `tests/smn-234-sprint-presence-d5.test.ts` | Tests ciblés calcul, temps partiel, inconnues, snapshots, contrôle d'équipe et droits |

La route et les données des onglets D1 à D4 sont conservées ; le dashboard n'a pas été modifié. **Aucune création de nouvelle table SQL** n'est nécessaire à ce lot : les nouvelles valeurs historiques sont ajoutées au JSONB existant de clôture.

## 3. Vérifications réelles — sans exagération

- **Relecture des sources GitHub publiées** : 22/22 contrôles statiques de cohérence positifs (différence des J/H, droits serveur, équipe, sources, snapshots, absence de DDL, traduction FR/EN, non-calculable).
- **Exécution isolée du module pur** : copie locale de `src/lib/sprint-presence.ts`, **SHA Git `a8fbdd8be09f556d81befc8167b566f7868e37a3` identique au blob GitHub** ; compilation TypeScript stricte du module isolé : **succès**, sur Node 22 et le `tsc` disponible ; **9/9 assertions locales exécutées et réussies** : J/H présence ≠ développement, absences, inconnues, total, snapshots, borne IANA.
- **Non exécutés :** `pnpm typecheck` de SMN, `pnpm exec tsx --test tests/smn-234-sprint-presence-d5.test.ts`, `pnpm i18n:check`, `pnpm build`, requêtes contre PostgreSQL réel, interactions Next.js/navigateur, tests des migrations. Le projet complet et ses dépendances ne sont pas disponibles comme checkout exécutable dans cet environnement, et GitHub Actions est indisponible. Les **9 assertions isolées ne remplacent pas les tests complets D5**.

## 4. Recette Windows 11 attendue

Synchroniser GitHub Desktop `main`, puis depuis PowerShell à la racine SMN :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-presence-d5.test.ts tests/development-capacity.test.ts tests/smn-234-sprint-ceremonies-d4.test.ts tests/smn-234-sprint-indicators-d3.test.ts tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-detail-d1.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

Scénarios UI à tester sur un **Sprint de démonstration** : équipe vide, 1–50 membres, membre 100 % PO/SM et 0 % Dev, temps partiel avec cinq matinées, arrivée/départ pendant le Sprint, jour d'absence complète / demi-journée, jour férié national, fermeture, couverture manquante et membre sans calendrier. Vérifier que l'inconnu n'est pas un zéro, que le total n'est pas produit si un membre est inconnu, et qu'aucune information nominative n'est visible/chargée en rôle `user`. Tester la transition de clôture : nouveau snapshot Vn avec les présences et ancien Sprint clos sans `memberPresence` (état indisponible, **aucun recalcul rétroactif**). Tester les changements d'heure et la frontière de fin exclusive.

**Suite :** D6 — Tendances G04/G05/G06/G07. Les résultats d'exécution des commandes locales doivent être ajoutés au suivi Jira et BMAD avant de qualifier D5 comme recetté. **SMN-234 reste ouverte.**

## 5. Liens
- Jira : https://lmn24.atlassian.net/browse/SMN-234
- [Audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
