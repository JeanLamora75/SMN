# SMN-53 — Story 3.12 — Absences individuelles centralisées

**Référence Jira :** https://lmn24.atlassian.net/browse/SMN-53 · Epic 3. **Dépendance fonctionnelle :** SMN-52 était indisponible au démarrage de SMN-53 ; ses quatre catégories de base étaient préchargées. L'interface complète est désormais livrée séparément dans [SMN-52](spec-smn-52-categories-absences.md).

## Contrat métier livré

| Critère | Réalisation |
|---|---|
| **AC1** | Dans **Administration → Membres → Calendrier individuel**, un nouveau formulaire crée une unique ligne `smn_member_absence` par intervalle et membre, indépendante des équipes et affectations. Données : date de début et de fin inclusives, créneau du début (matin/après-midi), créneau de fin, catégorie, booléen prévu/imprévu et nom/motif non vide. Pour une journée complète : début matin et fin après-midi. |
| **AC2** | Le parseur côté serveur `parseAbsenceChange` refuse motif vide (`reason-required`) et catégorie manquante (`category-required`) quelle que soit la date, ainsi que date impossible, borne incohérente et créneau invalide. Le formulaire signale l'erreur lisiblement. |
| **AC3** | L'absence n'a **aucune colonne `team_id` ni `assignment_id`** ; elle référence `smn_member.id`. `absenceOnDate` résout les deux créneaux pour une date donnée et peut être réutilisée dans chaque affectation et futur calendrier d'équipe. Les chevauchements sont interdits pour le même membre au même créneau ; deux demi-journées distinctes restent permises. |
| **AC4** | En sélectionnant « Corriger » sur la fiche membre, tous les attributs de l'absence sont chargés et modifiables, et le calendrier affiche les données actualisées. Une pastille de couleur **accompagne toujours le nom textuel** de la catégorie et le motif reste visible. Les catégories désactivées restent lisibles. |
| **AC5** | La saisie rétroactive et la modification historique sont autorisées. Chaque création/correction est atomique et enregistrée dans `smn_member_absence_history` avec révision, instant, acteur et valeurs avant/après. **Aucune requête ne modifie les capacités initiales figées, les PDF anciens, le Daily ou les alertes collectives**. |

## Modèle et responsabilités

- Migration **v18 → v19** : `smn_absence_category` (catégorie durable avec nom/couleur/activation), `smn_member_absence` (absences centrales, contrôle d'intervalle) et `smn_member_absence_history` (traçabilité sans suppression destructive). Références `ON DELETE RESTRICT` vers membres/absences/catégories.
- Préchargement strictement technique de quatre catégories : **Congés, Formation, Maladie et Autre**, avec une couleur chacune. Pas de formulaire d'administration des catégories : il est réservé à SMN-52. Le catalogue existe en table distincte pour éviter l'introduction d'une liste codée en dur dans l'interface d'absence.
- `src/server/members/absence.ts` : validation et contrôles d'intervalles, protection des accès par identité de membre, verrouillage de sa ligne `FOR UPDATE OF m` lors d'écritures, contrôle optimiste de révision. Pas de double écriture par équipe.
- `src/app/api/admin/members/[id]/absences/route.ts` : GET/POST protégés avec `authorizeApi` et CSRF/origine ; écriture seulement Administrateur, lecture selon stratégie membres du projet ; erreurs 400, 403, 404 ou 409 explicites.
- `src/app/app/admin/members/member-absence-editor.tsx`, `member-calendar-editor.tsx` : formulaire imbriqué dans la fiche/calendrier membre, aperçu des absences enregistrées, correction et protection des modifications non enregistrées.
- `src/i18n/fr.json` et `en.json` : libellés centralisés.
- `tests/member-absence.test.ts` : validations métier, dates passées, demi-journées, conflits, audit et non-effets de bord.

## Limites explicites

La logique de **calcul consolidé de capacité** et l'affichage du **calendrier d'équipe** sont livrés par leurs propres Stories ultérieures ; cet incrément fournit les données centrales et la résolution par date, **sans prétendre recalculer la capacité**. La personnalisation des catégories et leur désactivation dans l'interface sont réalisées séparément par [SMN-52](spec-smn-52-categories-absences.md).

## État de vérification

Contrôles statiques possibles à travers le connecteur GitHub et tests de contrat rédigés. Aucune exécution `pnpm`, PostgreSQL, HTTP ou recette Windows n'est attestée tant qu'elle n'a pas eu lieu. GitHub Actions indisponible conformément à `docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md`. Au terme du développement, conserver Jira **En cours** et suivi BMAD **review**. Le workflow BMAD n'est pas invoqué par `uv` depuis les seuls connecteurs ; son adaptation est manuelle, sans prétendre à une exécution du renderer.


## Avenant fonctionnel — 03/11/2026 — « Absences cette année » (fiche membre)

**Règle validée :** le compteur annuel sur la fiche du membre dans une équipe dénombre les **demi-journées d'absence planifiées ET imprévues** qui sont enregistrées, non supprimées, situées dans l'année civile de référence **et comprises dans une période d'affectation à l'équipe consultée**. Le compteur exclut impérativement **tous les samedis et dimanches**, ainsi que **les jours fériés nationaux inscrits dans le référentiel SMN pour le pays actuellement renseigné dans la localisation du membre**. La règle de pays est la même que sur le calendrier individuel, quel que soit le mois affiché. Si aucun pays n'est renseigné ou si le référentiel n'a aucune fête à cette date, ne pas inventer de fête. Les jours fériés tombant le week-end ne sont exclus qu'une fois. Une absence d'une demi-journée compte pour 1, une journée complète pour 2, avec dédoublonnage par date et créneau. Ne pas limiter aux absences « prévues » : `is_planned` peut être vrai ou faux. Les limites de dates d'entrée et de sortie sont **inclusives** ; les autres équipes ne doivent pas intervenir. Les tombstones sont ignorées. Aucun changement des snapshots déjà figés.

**AC-AN1 :** une absence le samedi/dimanche = 0 demi-journée, quel que soit son statut de planification et même si elle couvre plusieurs dates.

**AC-AN2 :** une absence située un jour férié du pays actuel du membre = 0 demi-journée, même si le jour férié est en semaine ; plusieurs fêtes la même date n'entraînent aucun double retrait.

**AC-AN3 :** sur les jours ouvrables non fériés, matin seul = 1, après-midi seul = 1, les deux = 2, prévu et imprévu inclus ; seuls les jours couverts par l'affectation à l'équipe et par l'année sont comptés.

**AC-AN4 :** le périmètre équipe, le filtrage des absences supprimées et l'isolation des membres sont conservés ; la valeur est une lecture dynamique, non une modification d'historique.

**Code cible :** `src/server/members/team-annual-absence.ts` et tests associés. **Référence complémentaire Jira :** [SMN-55](https://lmn24.atlassian.net/browse/SMN-55). Statut de recette à qualifier : pas d'exécution locale/PostgreSQL attestée.


## Avenant — 03/11/2026 : gérer les absences depuis la fiche membre

**Besoin validé :** la modale « Ajouter une absence » devient une interface à deux onglets, **Ajouter une absence** et **Gérer les absences**. Le deuxième onglet liste les absences du membre (planifiées et imprévues), avec dates, créneaux, catégorie, motif, état prévu/imprévu, et actions **Modifier** et **Supprimer**.

**AC6 :** l'ouverture de l'onglet Gérer affiche les absences non supprimées, triées de la plus récente à la plus ancienne ; les absences historiques restent consultables pour un membre sorti de l'équipe, uniquement dans le périmètre autorisé.
**AC7 :** Modifier précharge l'absence sélectionnée et permet une correction complète avec contrôle de révision, de chevauchement, de catégorie, de motif et de dates. Les modifications ne réécrivent pas les snapshots figés.
**AC8 :** Supprimer demande une confirmation explicite et réalise un *soft delete* historisé, sans suppression physique. Toute annulation met à jour le calendrier et le compteur annuel ; les écritures sont limitées à l'équipe autorisée, y compris pour l'historique.
**AC9 :** le formulaire Ajouter existant reste fonctionnel. États vide/chargement/erreur et traductions FR/EN ; les motifs personnels ne doivent jamais être divulgués hors du périmètre membre autorisé. Tests des parcours et de la concurrence.

**Impacts :** `member-absence-editor.tsx`, `member-team-read-only.tsx`, routes `team-absence`, service `absence.ts`, tests UI et PostgreSQL. Ne pas confondre « annuler le congé » et supprimer les données de l'audit. Publication ≠ validation par exécution locale.


## Avenant — 03/11/2026 : indicateur « Jours travaillés » dans la fiche et la liste d'équipe

**Règle de restitution retenue :** sur l'année civile de référence, le nombre de jours travaillés équivalents est la somme des demi-journées ouvrables non absentes divisée par 2. Un jour éligible est un lundi-vendredi inclus dans une affectation à l'équipe, hors jour férié national configuré pour le **pays actuel du membre**. Une demi-journée d'absence planifiée ou imprévue retire 0,5 jour ; une journée entière retire 1 jour. Week-ends et jours fériés n'apportent aucun jour travaillé et ne sont pas déduits une seconde fois. Les absences supprimées logiquement sont exclues. Plusieurs périodes d'affectation dans la même équipe sont réunies sans double-compter un jour.

**Périmètre temporel :** année civile complète, y compris les absences futures déjà planifiées ; il s'agit d'un **équivalent annuel calculé**, et non d'un pointage des jours effectivement réalisés à la date du jour. La mesure est exprimée en jours (entiers ou ,5), sans multiplication par le pourcentage d'allocation ni le coefficient de contribution ; les métriques de capacité restent distinctes.

**AC-JT1 :** un jour ouvrable sans absence = 1 jour travaillé ; une demi-journée d'absence = 0,5 ; deux demi-journées d'absence = 0.
**AC-JT2 :** jours fériés et week-ends = 0, y compris s'ils portent une absence ; dates hors affectation = 0 ; départ inclus jusqu'au dernier jour.
**AC-JT3 :** nouvelle tuile « Jours travaillés » immédiatement après Allocation et avant Absences cette année ; colonne « Jours travaillés » en vue Liste (sections actifs et inactifs), années cohérentes entre les deux écrans.
**AC-JT4 :** utilisation d'une même requête d'éligibilité pour les deux métriques, lecture groupée de l'équipe pour éviter les requêtes N+1, contrôles d'accès et tests de cohérence des demi-journées.
**État :** code publié sur main ; tests unitaires, TypeScript, PostgreSQL et recette écran non exécutés depuis ChatGPT.
