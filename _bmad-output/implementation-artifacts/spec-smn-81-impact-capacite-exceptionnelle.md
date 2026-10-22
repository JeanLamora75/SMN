# SMN-81 — Déduction facultative des réunions exceptionnelles

Jira : https://lmn24.atlassian.net/browse/SMN-81

## Implémentation partielle
- Option `impacts_capacity` uniquement sur `smn_sprint_exceptional_meeting`, par défaut `false`, sans modification des cérémonies standards et récurrentes.
- Modification via API d'Administration sécurisée, avec historique auteur, ancienne et nouvelle valeurs ; périodes de Sprint clôturées protégées.
- Formulaire Administrateur FR/EN ; indication explicite qu'aucune déduction effective n'est encore réalisée.
- Fonction pure `proratedDeduction` pour la quotité Développeur et la conversion en JH : réunion de 120 min à 50 % avec 8 h/JH = 60 min, 0,125 JH.

## Bloqueurs avant de déclarer la Story conforme
- Les calendriers Développeur individuels et exceptions n'ont pas encore été reliés au calcul des chevauchements effectifs ; la proratisation n'est qu'une fonction isolée.
- La déduction doit être intégrée **une seule fois** au moteur de capacité réelle, avec plafonds, en tenant compte des rôles/quotités effectifs, indisponibilités et fenêtres de disponibilité.
- Les statuts Annulée/Non tenue/Tenue et la durée réelle (SMN-79/80) doivent piloter la déduction réversible. Aucune déduction sur des capacités initiales figées et aucune réécriture de capacités réelles manuelles.
- Aucune recette, compilation TypeScript, validation Prisma ou migration PostgreSQL exécutée. GitHub Actions indisponible.
- Ne pas merger ni considérer AC2–AC5 validés sans raccordement et tests.

## Recette indispensable
1. Toggle absent des cérémonies récurrentes et standards ; désactivé par défaut.
2. Cas Développeur 50 % : 120 minutes => 60 minutes => 0,125 JH.
3. Plages partiellement disponibles, absence, quotas et plafonds.
4. Annulée/Non tenue puis corrigée en Tenue, sans double déduction.
5. Sprint clôturé et édition API non autorisée refusés.
