# Transmission Sally → Amelia — UX SMN-287

**Statut :** brief de développement UX, basé sur les contrats définitifs [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md).
**Epic :** [SMN-287](https://lmn24.atlassian.net/browse/SMN-287).  
**Stories :** SMN-289, SMN-290, SMN-291, SMN-292 ; dépendances métier SMN-288, SMN-293, SMN-294, SMN-295, SMN-296 et recette SMN-297.

## Mission
Implémenter **sans refonte visuelle générale** le mode par équipe, l'archivage/réactivation et la navigation Scrum/Kanban sur le Cockpit Agile validé. Ne pas coder avant la qualification des migrations et des contrôles serveur nécessaires.

## Interventions
1. Dans `src/app/app/admin/settings/teams/teams-settings.tsx`, conserver **liste à gauche / formulaire à droite**. Ajouter mode obligatoire par radios sans présélection à la création ; mode existant à l'édition ; explication en lecture seule si cycle historique ; badges de mode et statut ; filtres Actives / Archivées / Toutes ; actions Archiver / Réactiver.
2. **UX-01 :** dans Paramètres > Équipes, l'administrateur autorisé peut **consulter l'historique** d'une équipe archivée en lecture seule, sans jamais la rendre active ; les données et le mode sont préservés.
3. **UX-02 :** après archivage, désactiver et surtout **refuser côté serveur** les écritures métier (cycles, cérémonies, capacité, KPI, registres, rapports, etc.). Réactiver est une action administrative explicite.
4. **UX-03 :** empêcher l'archivage de la **dernière équipe active**, par explication UX et invariant transactionnel côté serveur même en cas d'accès concurrents.
5. **UX-04 :** seule la page Paramètres > Équipes permet de modifier le mode. Dans la modale `src/app/app/admin/members/team-context-editor.tsx`, montrer le mode en **lecture seule**, avec lien vers Paramètres pour un administrateur autorisé ; conserver l'édition des données générales.
6. `src/app/app/active-team-selector.tsx`, `src/app/app/private-shell.tsx` : mode visible, seules équipes actives autorisées, cycle de **la nouvelle équipe** en cours > plus récent > aucun, repli et protection des brouillons.
7. `src/lib/private-navigation.ts` et `src/lib/team-navigation.ts` : menu **Sprints** pour Scrum, **Périodes** pour Kanban ; routes fonctionnelles et sûres ; maintien de la rubrique commune sans conserver un ID étranger.

## Points techniques indispensables
- Le contexte multiéquipes est soumis à des garde-fous : ne pas activer avant qualification de SMN-282 et migration versionnée.
- La modification de mode est irréversiblement verrouillée après tout premier cycle, même supprimé/archivé ; l'UX seule n'est pas un contrôle d'intégrité.
- Réutiliser les styles, traductions et composants existants. Ne pas écraser les champs facultatifs du produit lors d'une édition de contexte.
- N'inventer ni metrics Kanban, ni habilitations `user` reportées à V1.
- Les lectures d'archive ne confèrent aucun droit d'écriture.

## Recette
Appliquer [RECETTE-UX.md](RECETTE-UX.md) et la Story SMN-297. Tests sur Windows 11 (FR/EN, responsive, clair/sombre, clavier, deux modes et trois équipes). Consigner les résultats **réellement obtenus**. GitHub Actions non considéré comme preuve de recette Windows.

**Ce brief ne modifie ni code ni base et ne prétend pas que l'application a été testée.**
