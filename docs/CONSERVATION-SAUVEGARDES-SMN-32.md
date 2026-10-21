# SMN-32 — Conservation des sauvegardes

[Lien Jira](https://lmn24.atlassian.net/browse/SMN-32) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-32-conservation-sauvegardes.md)

## Fonctionnement

Dans **Administration → Sauvegardes** :

1. La politique affiche **30 jours** par défaut ; l'administrateur peut saisir de **1 à 3650 jours** et enregistrer une nouvelle durée. La modification est versionnée et journalisée en base de données.
2. Les sauvegardes intègres plus anciennes que la période deviennent **éligibles** ; changer le réglage ne supprime rien.
3. L'administrateur peut lancer un **nettoyage manuel contrôlé**. Après confirmation, le serveur vérifie de nouveau tous les paquets et compare la liste exacte aux identifiants proposés. En cas de divergence ou d'accès refusé, aucun nettoyage n'est lancé.
4. Les sauvegardes supprimées cessent d'apparaître dans l'inventaire ; leur suppression est enregistrée dans un audit PostgreSQL.

L'ancienneté est calculée en jours réels de 24 heures à partir de l'heure UTC de création présente dans le paquet vérifié. Une sauvegarde invalide ou sans clé de vérification n'est **pas** éligible à cette suppression automatisée.

**Aucune rétention des archives métier :** les PDF, TXT et snapshots Vn sont indépendants du système de sauvegardes. Seuls les répertoires UUID des paquets chiffrés de `SMN_BACKUP_DIR/packages` sont concernés.

**Copies externes :** SMN n'a aucun moyen de savoir si une copie a été exportée, déplacée vers une clé USB ou copiée ailleurs. SMN **ne peut ni surveiller ni supprimer** ces copies.

## Notes de sécurité et de qualification

Ne jamais tester une suppression destructive sur vos sauvegardes indispensables. Utiliser une base PostgreSQL de test et un `SMN_BACKUP_DIR` temporaire hors du dépôt.

Le contrôle d'intégrité n'atteste pas la réussite d'une restauration. Le nettoyage est délibérément **manuel** pour ce premier incrément ; aucune tâche planifiée n'est activée sans décision explicite.

En cas d'arrêt inattendu durant le nettoyage, des dossiers cachés `.retention-removing-UUID` peuvent subsister. Ils ne figurent pas dans les sauvegardes disponibles et doivent être examinés par un administrateur avant nettoyage manuel. Un échec après une suppression physique mais avant l'enregistrement de l'audit doit également être réconcilié.

Tests de recette : valeur initiale 30, mise à jour 45, révision obsolète (409), candidat antérieur au seuil, candidat juste au seuil, refus d'un utilisateur non administrateur, protection d'un fichier métier, sauvegarde exportée simulée hors de l'espace géré et conservation des traces d'audit.
