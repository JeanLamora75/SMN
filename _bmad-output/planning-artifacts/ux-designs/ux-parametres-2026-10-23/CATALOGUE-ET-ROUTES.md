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