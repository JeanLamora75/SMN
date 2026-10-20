# ADR-I0-003 — Sauvegarde et récupération des clés de chiffrement

**Date :** 19 octobre 2026 à 22:36 (Europe/Paris).
**Statut :** principe et parcours utilisateur explicitement validés ; mécanismes cryptographiques et essais non réalisés.
**Complète :** [ADR-I0-002](ADR-I0-002-MIGRATIONS-SECRETS.md) et [sécurité/exploitation](SECURITE-EXPLOITATION.md).

## Règles validées

| Situation | Fonctionnement |
| --- | --- |
| Usage quotidien | Clé conservée dans le dossier privé de l'installation ; pas de saisie de phrase de récupération à chaque connexion |
| Sauvegarde complète | Copie de récupération de la clé incluse, protégée par une phrase secrète distincte du mot de passe administrateur |
| Premier usage | Phrase choisie lors de la première sauvegarde complète ; conservation dans un gestionnaire de mots de passe recommandée, pas d'intégration à un gestionnaire imposée |
| Restauration sur un autre PC | Phrase demandée pour récupérer la clé nécessaire à la lecture des données chiffrées |
| Vérification | Restauration réelle à tester avant d'annoncer la récupérabilité des données chiffrées |

La clé locale et sa copie de récupération ne sont pas des mots de passe de compte. Réinitialiser l'Administrateur selon D-PRD-139 ne récupère pas une clé perdue et ne remplace pas la phrase de récupération.

Si la clé locale et la phrase de récupération sont toutes deux perdues, la récupération des données chiffrées n'est pas garantie. L'interface doit expliquer ce point lors du choix de la phrase, sans prétendre qu'un support ou un second compte peut déchiffrer les données à sa place.

## Contrat de sauvegarde à préciser techniquement

- Protéger la copie récupérable de la clé ; ne pas placer la clé locale en clair à côté d'elle dans l'archive exportable.
- Ne pas inclure la phrase secrète en clair dans la sauvegarde, les journaux, les arguments de commande ou les exemples publiés.
- Identifier les clés et versions effectivement nécessaires aux données sauvegardées pour éviter une restauration avec une clé incorrecte. Cette exigence n'impose pas de rotation automatique supplémentaire au MVP.
- L'emplacement privé, ses permissions Windows, le format du paquet, la dérivation à partir de la phrase et les algorithmes restent à qualifier ; aucun choix cryptographique précis n'est réputé validé par cet accord.
- Le principe protège la copie de récupération des clés. La protection des autres composants de la sauvegarde doit respecter les règles existantes de confidentialité ; ne pas affirmer que toute l'archive est chiffrée sans mécanisme défini et testé.
- Les sauvegardes automatiques ne sont pas ajoutées au périmètre par cette décision. La rétention gérée de 30 jours par défaut demeure indépendante.

## Critères de vérification, non exécutés

| Cas | Résultat attendu |
| --- | --- |
| Première sauvegarde complète | Phrase distincte demandée pour protéger la copie récupérable de la clé, sans secret publié |
| Usage quotidien | Accès autorisé possible avec la clé locale sans nouvelle phrase à chaque connexion |
| Transfert d'une sauvegarde sur autre PC | La bonne phrase permet de récupérer la bonne clé et de relire les données chiffrées attendues |
| Phrase incorrecte ou clé manquante | Refus/diagnostic explicite, aucun succès de restauration déchiffrable fictif |
| Vérification du paquet | Aucune copie de clé non protégée ni phrase en clair ; références de clés cohérentes |
| Récupération du compte administrateur | Aucun déchiffrement supposé possible si la clé nécessaire est perdue |
| Essai de restauration | Jeu de données connu comparé après restauration isolée ; le manifeste seul ne prouve pas la récupérabilité |

**Traçabilité :** FR-67/68/71/72 ; AD-10/25/27/29 ; sauvegarde, restauration et configuration privée. La bibliothèque choisie pour l'identité ne remplace pas la gestion des clés de données.

**Aucun mot de passe ou clé réelle manipulé, aucune sauvegarde ni restauration exécutée.** Les mécanismes et les preuves I0 restent ouverts ; CONCERNS maintenu. Cette approbation ne vaut ni développement ni fusion.
