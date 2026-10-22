# SMN-65 — Cadence Scrum par équipe

## Périmètre
- Paramétrage Administrateur des Sprints futurs : durée (1–4 semaines), jour/heure de début et de fin, fuseau IANA.
- Valeurs initiales : 2 semaines ; lundi 09:00 à vendredi 18:00 de la dernière semaine ; `Europe/Paris` comme fuseau initial, modifiable.
- Chaque édition comporte une révision optimiste, un horodatage serveur et une ligne d'audit.
- Les jours utilisent la convention ISO (lundi=1, dimanche=7). Les paramètres décrivent une semaine type ; l'algorithme de création de Sprint doit appliquer l'heure de fin à la dernière semaine et résoudre le fuseau IANA au moment de création.

## Intégration
- `GET/PATCH /api/admin/scrum-cadence` : autorisation du rôle Administrateur vérifiée côté serveur.
- `/app/admin/scrum-cadence` : formulaire traduit FR/EN.
- Modèle et SQL : `prisma/schema.prisma`, `prisma/migrations/20261021_smn65_scrum_cadence/migration.sql`.
- Les tables sont créées idempotemment si absentes par le service. Appliquer la migration SQL lors de la mise à jour locale avant utilisation.
- Aucun Sprint ou événement existant n'est modifié par cette fonctionnalité. La future création de Sprint devra lire les valeurs à la création et stocker définitivement les bornes calculées : ne pas recalculer les Sprints existants.

## Vérifications manuelles attendues
1. En mode Scrum, administrateur : valeurs par défaut 2 semaines, lundi 09:00, vendredi 18:00.
2. Refus des durées 0 et 5, fuseaux IANA invalides, horaires inversés.
3. Modifier la cadence puis recharger ; vérifier révision, date et audit PostgreSQL.
4. En rôle Utilisateur, GET et PATCH doivent retourner 403.
5. Deux onglets : la modification avec une révision périmée doit retourner 409.
6. Vérifier la non-modification des Sprints et événements déjà enregistrés lorsque ces entités seront implémentées.

## Limites de recette
- Aucun lancement de GitHub Actions.
- L'intégration à un créateur de Sprints relève de Stories ultérieures. La non-rétroactivité est assurée ici par l'absence de toute écriture sur les cycles ou événements.
