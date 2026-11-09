# SMN-29 — Journal transversal des opérations sensibles (Epic 2, lot 1)

**Mise à jour :** 9 novembre 2026  
**Jira :** https://lmn24.atlassian.net/browse/SMN-29  
**Qualification ciblée du lot 1 :** réussie — https://github.com/JeanLamora75/SMN/actions/runs/42612519686

## Sources réellement interrogées
`src/server/audit/journal.ts` agrège en lecture seule les sources SQL suivantes :

| Origine | Événements projetés |
|---|---|
| `smn_account_audit` | Création/modification de compte |
| `smn_general_settings_audit` | Paramètres généraux |
| `smn_auth_audit` | Modification de mot de passe et récupération |
| `smn_backup_retention_audit` | Politique et suppressions de sauvegardes gérées |
| `smn_sprint_audit` | Changements de sprint |
| `smn_member_lifecycle_event` | Clôture d'affectation, archivage/réactivation |
| `smn_team_context_audit` | Contexte d'équipe |
| `smn_registry_item_audit` | Registres |
| `smn_report_pdf_archive` | Création d'une référence d'archive PDF |
| `smn_member_removal_audit` | Suppressions ordinaires, si la table additive existe |

Chaque entrée représente **une ligne persistée déjà présente** ; aucune opération n'est journalisée rétroactivement par supposition et aucune consultation ordinaire ne crée d'entrée.

## Protection des données
- `projectAuditEvent` n'accepte que les actions et couples action/type explicitement autorisés. Seuls ID de l'opération, ID technique de l'objet, date UTC, acteur et résultats de succès persistés sont exposés.
- Les modifications de rôle et préférences de langue/thème restent projetées par liste blanche ; les autres `before_values`, `after_values`, `details` et `manifest` sont **exclus**. Aucun texte de registre, mot de passe, e-mail ou identité supprimée n'est renvoyé.
- La route `GET /api/admin/audit` et l'écran sont protégés par `authorizeApi` et `canAccess` selon le rôle Administrateur.
- Les noms d'action et de type sont traduits FR/EN.
- Une suppression physique des paquets ne constitue pas une transaction SQL ; son succès complet nécessite toujours la réconciliation SMN-41 entre audit et inventaire réel, et non la seule présence d'une entrée de journal.

## Tests d'exécution
- `tests/audit-journal.test.ts` + `tests/epic2-lot1-audit-coverage.test.ts` : confidentialité, liste blanche, privilèges, journal optionnel de suppression, refus des faux succès, atomicité des comptes.
- `tests/epic2-lot1-postgres.test.ts` : événements réels en base jetable PG18, projection SQL transversale, audit de rétention et rollback d'une transaction métier si l'audit échoue.
- `tests/epic2-lot1-native-v33.test.ts` : table additive présente sur une vraie installation v33 et journal lisible.
- **CI attestée verte** sur Windows, Linux et PostgreSQL 18 : https://github.com/JeanLamora75/SMN/actions/runs/42612519686

## Limites non couvertes
Le journal est transversal **pour les événements ci-dessus**, sans prétendre surveiller toutes les écritures de SMN v33. Des sources et opérations récentes (moteur d'indicateurs, certains droits du Dashboard Builder, exports Office, gestion des liens transverses et autres tables métier) demandent un inventaire de routes et d'audits pour satisfaire l'ensemble de SMN-29. Ce travail doit être évalué indépendamment, sans augmenter les risques de divulgation.

**Statut recommandé :** couverture du lot 1 développée et qualifiée ; Jira SMN-29 peut rester « En cours » jusqu'à la revue exhaustive des critères de la Story.

## BMAD / contraintes d'exécution
Le skill `.agents/skills/bmad-build/SKILL.md` a été lu sur GitHub. Sa commande `uv run` n'a pas été exécutée dans cet environnement ; la réalisation a utilisé les connecteurs GitHub/Jira et les workflows GitHub Actions. Aucune installation locale de l'utilisateur n'a été modifiée.
