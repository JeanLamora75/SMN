# SMN-31 — Inventaire et contrôle d'intégrité des sauvegardes

Depuis **Administration → Sauvegardes**, l'Administrateur consulte l'ensemble des paquets publiés dans le dossier privé \`%LOCALAPPDATA%\ScrumMasterNotebook\backups\packages\` (ou \`SMN_BACKUP_DIR\`). La consultation vérifie à nouveau les paquets présents, même s'ils ont déjà été vérifiés : le statut enregistré en cache ne suffit jamais.

Les résultats possibles sont :

| État | Signification | Consigne |
|---|---|---|
| **Intégrité vérifiée** | Manifeste, composants chiffrés, déchiffrement et liens vérifiés | Ne pas confondre avec une restauration testée |
| **Incomplète** | Fichier ou paquet référencé absent | Ne pas utiliser comme sauvegarde fiable |
| **Invalide** | Format, empreinte, lien ou authenticité invalide | Écarter le paquet et analyser l'origine |
| **Non vérifiable** | Clé locale manquante ou indisponible | Vérification à reprendre par le workflow de récupération approprié |

Le tableau donne l'heure UTC de capture (rendue localement), l'identifiant, la source de l'installation, la version applicative (pour les nouvelles captures), les versions du schéma et de PostgreSQL, le nombre de pièces privées ainsi que les fichiers **chiffrés** du paquet avec leurs tailles et SHA-256. Il n'affiche pas les noms originaux ni le contenu des documents, la clé, le mot de passe PostgreSQL ou la phrase de récupération.

Les traces \`backups/verification/<uuid>.json\` sont des attestations datées du dernier **contrôle d'intégrité**, sans résultat de restauration. Elles ne doivent pas être modifiées manuellement, et ne sont jamais relues comme preuve sur un appel ultérieur.

Pour diagnostiquer une sauvegarde incorrecte, ne travaillez que sur une copie. Le bouton « Revérifier les sauvegardes » relance le contrôle ; créer une nouvelle sauvegarde puis revérifier permet de disposer d'un nouveau jeu.

**Limitation explicite :** un contrôle SHA-256 et AES-GCM réussi ne démontre pas la restauration fonctionnelle sur une autre machine. Cette vérification fera l'objet d'une story distincte.

[Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-31-verification-inventaire.md) · [Story Jira](https://lmn24.atlassian.net/browse/SMN-31).
