# Centre Paramètres — catalogue de configuration et routes

**Référence d'inventaire au 23/10/2026 ; routes de destinations existantes vérifiées dans le dépôt mais disponibilité fonctionnelle à revalider par Amelia.**

| Groupe | Carte | Route existante ou proposition | Décision de destination et état |
|---|---|---|---|
| Application et personnalisation | Informations générales | /app/admin/settings (actuellement formulaire) | Après refonte, déplacer formulaire vers /app/admin/settings/general ou route dédiée ; lien actif |
| Application et personnalisation | Langues | Formulaire général | Section de formulaire existante ; accès direct au champ langue, lien actif seulement si section accessible |
| Application et personnalisation | Apparence | Formulaire général | Section thème/palette existante ; lien direct à la section lorsque prête |
| Organisation Agile | Cadence des sprints | /app/admin/scrum-cadence | Actif en Scrum, dépendant du mode |
| Organisation Agile | Cérémonies et modèles | /app/admin/sprints | Fonctions existantes dans écran mixte ; nouvelle destination dédiée à identifier, sinon partiel |
| Organisation Agile | Règles de capacité | /app/admin/development-capacity | Vue existante de consultation, **pas démonstration de réglages** ; « À compléter » |
| Calendriers et indisponibilités | Jours ouvrés | pas de route dédiée vérifiée | **À venir** sans lien ; préserver référence lundi–vendredi existante |
| Calendriers et indisponibilités | Pays et jours fériés | /app/admin/countries | Lien actif avec droits |
| Calendriers et indisponibilités | Fermetures d'entreprise | /app/admin/company-closures | Lien actif avec droits |
| Calendriers et indisponibilités | Catégories d'absences | /app/admin/absence-categories | Lien actif avec droits |
| Administration et maintenance | Utilisateurs et habilitations | /app/admin/users | Lien actif avec droits ; comptes ≠ membres |
| Administration et maintenance | Sécurité et sessions | /app/security | Fonctions partielles ; préserver réglages individuels du compte hors portail |
| Administration et maintenance | Sauvegardes | /app/admin/backups | Lien actif si droit de sauvegarde |
| Administration et maintenance | Journal d'audit | /app/admin/audit | Lien actif si droit audit |

**TOTAL : 14 cartes affichées dans 4 familles** (sous réserve de sécurité et mode installés). L'état planifié n'est **pas** un lien cliquable. Les destinations cibles proposées ne sont pas des routes constatées. Ne pas confondre accès de consultation et capacité d'administration.

**Non affichés avant livraison :** Intégrations externes (Jira/GitHub, etc.) et Notifications. Ne pas ouvrir de fonction sans véritable implémentation.

**Navigation :** un seul menu Paramètres dans la sidebar, regroupement des raccourcis administratifs sans rupture des URLs et sans déplacer Équipe/Calendrier/Sprints en exploitation.

## Avenant — raccordement Sprint / Paramètres (23/10/2026)

**SMN-228 / SMN-229 :** récupérer **plages de travail** et **pause déjeuner** de l'écran Sprints existant pour la rubrique **Jours ouvrés** (pas un moteur pour changer automatiquement lundi–vendredi). Réutiliser les API `work-slots` et `lunch`, et réévaluer l'état de la carte selon les fonctions réellement accessibles. Sous **Cérémonies et modèles**, installer le formulaire des **modèles réutilisables** `TemplateForm`, pas les occurrences de réunion. **Cadence des sprints** demeure inchangée ; Règles de capacité n'obtient pas une nouvelle fonction fictive.

Référence : [Matrice Sprints](../ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md) et [EXPERIENCE](../ux-sprints-pilotage-2026-10-23/EXPERIENCE.md). Les routes futures ci-dessus sont des cibles : Amelia doit vérifier leur existence avant d'activer une carte.

## Proposition supplémentaire — Paramètres > Équipes (SMN-282)

**26/10/2026 — ajout demandé, non développé et soumis à arbitrage :** la [Story SMN-282](https://lmn24.atlassian.net/browse/SMN-282) propose une entrée **« Équipes »** dans **Organisation Agile** du portail Paramètres, ouvrant une nouvelle page de création/modification.

| Groupe | Carte/entrée proposée | Route cible | Disponibilité |
| --- | --- | --- | --- |
| Organisation Agile | Équipes | `/app/admin/settings/teams` | **Proposition non active — arbitrage D-PRD-137 requis** |

Formulaire demandé : Nom de l'équipe **requis**, Nom du produit, Vision Produit, Product Goal **facultatifs** ; accès administrateur, préremplissage en édition, historique et protections de sauvegarde. Les **14 rubriques validées initialement** et leur état de livraison ne sont pas rétroactivement réécrits par cette proposition. La nouvelle entrée pourra être activée une fois la gestion multiéquipes réellement livrée ; ne pas créer de faux lien avant.

Références : [avenant équipes](../ux-equipe-membres-2026-10-22/AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md) ; [D-PRD-137](../../prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md). **À décider :** possibilité de plusieurs équipes dans le MVP Scrum/Kanban, modèle produit facultatif et portée de l'équipe active.
