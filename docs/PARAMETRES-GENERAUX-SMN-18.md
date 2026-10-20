# SMN-18 — Paramètres généraux

**Statut :** code livré pour revue après vérification automatisée, recette Windows 11 différée. La recette globale Windows 11 de l'utilisateur reste différée ; Jira doit rester **En cours** tant que la recette n'est pas confirmée.

## Administration

Depuis le tableau de bord, utiliser **Administration → Paramètres généraux**. Seul l'Administrateur connecté, actif et ayant changé son mot de passe initial peut lire ou modifier ces réglages. Le profil Utilisateur ne peut ni accéder au formulaire ni utiliser l'API `/api/admin/settings` (lecture ou écriture).

Les paramètres administrables du socle SMN sont :

| Réglage | Valeurs initiales et permises | Effet |
| --- | --- | --- |
| Langue préférée | Français (par défaut) ou Anglais | Stockée sur le serveur et récupérable pour les futurs modules. La traduction effective et le sélecteur global relèvent de la Story 1.14. |
| Thème préféré | Clair (par défaut) ou Sombre | Stocké sur le serveur pour réutilisation. L'application complète et la persistance de l'apparence relèvent de la Story 1.15. |
| Pays de référence | Non renseigné (par défaut), ou code pays à deux lettres en majuscules | Valeur de référence pour les futures fiches membres ; aucune localisation ni capacité antérieure n'est modifiée. Le formulaire propose les sept pays initiaux du PRD (FR, DE, GB, ES, PT, IT, CA). D'autres pays viendront avec le catalogue de membres. |

**Choix immuables :** le mode Scrum/Kanban et le produit de référence sont affichés en lecture seule. Le serveur refuse une requête qui tenterait de les passer dans le JSON, même en étant Administrateur. Modifier l'un de ces deux choix exige une installation distincte, jamais une réécriture des données courantes.

## Date et portée

La date de modification est sauvegardée (`updated_at`) et montrée en interface avec un numéro de révision. Les préférences d'affichage sont immédiatement consultables via l'API par l'Administrateur ; leur application générale dépend des Stories d'interface dédiées. Pour les paramètres qui influencent la création future de données, **seules les nouvelles données** pourront réutiliser les réglages courants. Pas de replanification ou recalcul implicite des cycles Scrum/Kanban, membres, capacités, registres, indicateurs, rapports ou archives.

## Cohérence et erreurs

La sauvegarde est une unique transaction PostgreSQL qui contient la mise à jour et un événement d'audit. Les valeurs de chaque révision précédente et nouvelle sont conservées en JSON sans secret dans `smn_general_settings_audit`. Chaque formulaire renvoie la révision lue ; un enregistrement obsolète reçoit HTTP **409** et n'efface jamais une version plus récente. Un formulaire invalide reçoit **400** ; une authentification insuffisante ou un utilisateur non-admin reçoit **403**. Toute erreur de persistance reçoit **503**, provoque un rollback, ne signale jamais de succès et écrit un code constant dans le journal serveur, sans informations confidentielles.

Un enregistrement sans modification reste idempotent : la révision n'augmente pas et aucun audit supplémentaire n'est créé.

## Migration et préservation

Migration additive `20261020_smn18_general_settings`, version de schéma **v4** : création des tables `smn_general_settings` et `smn_general_settings_audit`, initialisation du singleton (FR, clair, pays non renseigné), historique Prisma et contrôle des checksums. Les installations connues v1/v2/v3 sont migrées progressivement en transaction à l'authentification ; le diagnostic accepte v1 à v4 complets, et rejette schémas inconnus ou partiellement migrés.

Aucune réinstallation, suppression ou reconstruction des comptes, équipes ou produits. La commande de récupération Administrateur de SMN-17 accepte v3 et v4.

## Tests et limites

Vérifications exécutées en CI [Linux/PostgreSQL et Windows](https://github.com/JeanLamora75/SMN/actions/runs/39474997208) : validation stricte, contrôles de rôle côté serveur, schéma réel PostgreSQL 18, propriété fixe mode/produit, conflits de révision, audit transactionnel, rollback forcé par échec de trigger, compatibilité des parcours d'authentification et installation Windows autonome. [Paquet Windows autonome vérifié](https://github.com/JeanLamora75/SMN/actions/runs/39474997138) sur `77c913ef` (même révision applicative que la CI Linux/Windows), [artefact Windows](https://github.com/JeanLamora75/SMN/actions/runs/39474997138/artifacts/12289207076). Les modules de cycles et leur historique n'existent pas encore : leur intégrité est garantie par l'absence d'écriture métier dans ce module et doit être vérifiée dans leurs propres Stories.

- [Jira SMN-18](https://lmn24.atlassian.net/browse/SMN-18)
- [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-18-parametres-generaux.md)
