# Catalogue cible et destinations

Décisions UX validées le 27/10/2026 : UX-01 onglets horizontaux, UX-02 fériés+fermetures, UX-03 maintenance sauvegardes+historique, UX-04 Cockpit compact, UX-05 pas de recherche globale, UX-06 édition des listes en modales, UX-07 sauvegarde par formulaire, UX-08 cartes indisponibles grisées « À venir ». Scope strictement UX, aucune règle métier nouvelle. Références : SMN-223 à 227 ; SMN-228 ; SMN-229 ; SMN-282 ; SMN-298 ; docs/UX-REFERENTIEL-BMAD.md.

| Famille | Carte | Destination existante à réutiliser / cible UX | Onglets |
|---|---|---|---|
| Application | Préférences | /app/admin/settings/general | Général, Langue, Apparence |
| Organisation Agile | Équipes | /app/admin/settings/teams | Liste; autres onglets seulement si implémentés |
| Organisation Agile | Cadence Agile | /app/admin/scrum-cadence ou /app/admin/kanban-cadence selon mode | Fonction actuelle |
| Organisation Agile | Cérémonies | /app/admin/settings/ceremonies | Modèles ; autres seulement si existants |
| Organisation Agile | Capacité | Aucune route de réglages confirmée dans le catalogue | À venir ou À compléter selon audit |
| Organisation Agile | Registres | /app/admin/settings/registries | Catégories automatiques, Alertes d'échéance |
| Calendriers et disponibilités | Horaires de travail | /app/admin/settings/working-days | Plages horaires, Pause déjeuner |
| Calendriers et disponibilités | Jours fériés et fermetures | conserver /app/admin/countries et /app/admin/company-closures ; route de regroupement à créer | Jours fériés, Fermetures d'entreprise |
| Calendriers et disponibilités | Absences | /app/admin/absence-categories | Catégories, autres seulement si existants |
| Administration | Utilisateurs | /app/admin/users | Fonctions réellement disponibles, V1 à respecter |
| Administration | Sécurité | /app/security | Fonctions réellement disponibles |
| Administration | Maintenance | conserver /app/admin/backups et /app/admin/audit ; route de regroupement à créer | Sauvegardes, Historique |

**Important :** chemins réunifiés = cibles UX, pas routes existantes attestées. Conserver les anciens favoris/URLs et les permissions distinctes. Les 16 entrées de catalogue actuelles deviennent 12 cartes, sans fusion des ressources, des contrôles ou des bases de données. Équipes doit respecter SMN-282, la cadence SMN-287/293, les modales SMN-298, les fériés SMN-270 à 281.
