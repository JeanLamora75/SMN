# SMN-53 — Story 3.12 — Absences individuelles centralisées

**Référence Jira :** https://lmn24.atlassian.net/browse/SMN-53 · Epic 3. **Dépendance fonctionnelle :** SMN-52 (catégories et couleurs) non développée au démarrage ; le minimum de données nécessaire est préchargé, sans réaliser l'interface de gestion des catégories de SMN-52.

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

La logique de **calcul consolidé de capacité** et l'affichage du **calendrier d'équipe** sont livrés par leurs propres Stories ultérieures ; cet incrément fournit les données centrales et la résolution par date, **sans prétendre recalculer la capacité**. La personnalisation des catégories et leur désactivation dans l'interface doivent être livrées lors de SMN-52.

## État de vérification

Contrôles statiques possibles à travers le connecteur GitHub et tests de contrat rédigés. Aucune exécution `pnpm`, PostgreSQL, HTTP ou recette Windows n'est attestée tant qu'elle n'a pas eu lieu. GitHub Actions indisponible conformément à `docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md`. Au terme du développement, conserver Jira **En cours** et suivi BMAD **review**. Le workflow BMAD n'est pas invoqué par `uv` depuis les seuls connecteurs ; son adaptation est manuelle, sans prétendre à une exécution du renderer.
