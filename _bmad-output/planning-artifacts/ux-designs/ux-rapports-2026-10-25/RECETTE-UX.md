# SMN — Grille de recette UX du Studio de rapports

**Version :** proposition 2026-10-25 · **Statut :** scénarios non exécutés · **Source :** [DESIGN.md](DESIGN.md) / [EXPERIENCE.md](EXPERIENCE.md) et UX-R01 à UX-R21.

## Règle de recette

Chaque cas doit être exécuté **contre le code réellement développé** avec des données contrôlées, au minimum sur Windows 11/Chrome et une tablette/mobile de référence. Le HTML livré est une **maquette sans backend**, pas un outil de tests automatisés de SMN. Le résultat de tous les scénarios ci-dessous est donc `À tester`.

| ID | Précondition et action | Résultat attendu | Décisions |
|---|---|---|---|
| R-01 | Ouvrir le Centre depuis le menu principal | Onglets Rapports / Modèles / Archives, filtres utiles, zéro lien mort | R18 |
| R-02 | Depuis une **fiche Sprint existante**, ouvrir Rapports | Centre filtré sur ce Sprint ; même liste que l'accès global ; retour contextualisé si disponible | R18 |
| R-03 | Créer deux rapports pour un Sprint avec des modèles différents | Deux brouillons indépendants, contenus et configurations séparés | R03 R15 |
| R-04 | Générer un nouveau rapport avec données complètes | Rubriques, graphiques, indicateurs, commentaire et couverture hérités du modèle | R01 R02 R03 |
| R-05 | Générer un rapport où la capacité est absente | « Non renseigné / non calculable » et provenance ; **jamais `0` inventé** | R03 R05 |
| R-06 | Comparer SP initiaux, ajouts et SP terminés | Unités SP, valeur initiale inchangée, absence de substitution de l'engagement révisé | R05 R16 |
| R-07 | Mesurer capacité réelle disponible | Valeur en J/H, jamais présentée comme effort consommé | R05 R16 |
| R-08 | Choisir graphique, tableau, les deux | Les vues affichent les mêmes données/sources, axes et unités adaptés | R05 |
| R-09 | Insérer commentaire prédéfini, puis un bloc texte libre | Les deux se modifient dans le document sans formulaire vertical dédié | R06 |
| R-10 | Ouvrir le studio sans brief IA ; demander inclusion | Aucune génération IA dans le studio ; seule la sélection volontaire de briefs externes existe | R07 |
| R-11 | Insérer volontairement une analyse IA sélectionnée | Attribution et provenance visibles, distinction des faits mesurés | R07 |
| R-12 | Créer un modèle système puis tenter de l'éditer | Modification directe interdite ; duplication permise selon droit | R10 |
| R-13 | Mettre à jour un modèle partagé après création de rapport | Rapport reste épinglé à ancienne version ; proposition de mise à jour volontaire avec comparaison | R04 R10 |
| R-14 | Modes Composition / Rédaction / Aperçu, panneaux gauche/droit | Répartition d'espace modifiée sans mutation de structure ni perte de rédaction | R11 |
| R-15 | Modifier un commentaire puis fermer/réouvrir le rapport après ack serveur | Dernier brouillon confirmé retrouvé ; aucune demande de sauvegarde par section | R12 |
| R-16 | Interrompre la sauvegarde serveur | État « Échec » ; tentative de nouvel envoi ; export ne prétend pas inclure des modifications non enregistrées | R12 R17 |
| R-17 | Modifier deux onglets du même rapport | Dernier enregistrement serveur accepté gagne, sans fusion ni verrou ; comportement documenté | R20 |
| R-18 | Provoquer réponses réseau désordonnées **dans le même onglet** | Une requête plus ancienne n'écrase pas une édition plus récente de cette session | R12 R20 |
| R-19 | Comparer deux rapports du même Sprint après correction source | Chacun signale son propre état ; aucun chiffre actualisé en silence | R15 R16 |
| R-20 | Actualiser volontairement un rapport après comparaison | Seuls les chiffres/graphiques concernés changent ; commentaires et analyses IA conservés | R16 |
| R-21 | A4 portrait puis A4 paysage pour deux modèles | Chaque document reste en orientation unique de la couverture à la dernière page | R13 |
| R-22 | Masquer couverture et sommaire dans un rapport | Le modèle source reste inchangé ; pagination et sommaire se recalculent | R14 |
| R-23 | Créer 25 lignes de risques sur plusieurs pages | Aucun risque perdu ; en-têtes de table répétés, lisibilité intacte | R08 R21 |
| R-24 | Créer un graphique trop grand et un tableau trop large | Alerte et propositions ; aucun rognage/masquage automatique ; titre/légende associés | R08 R21 |
| R-25 | Exporter un brouillon **sans avertissement** | Génération PDF directe, pas de dialogue supplémentaire et pas d'archive créée | R09 R17 |
| R-26 | Exporter un brouillon avec avertissement non bloquant | Examiner/corriger ou exporter malgré l'avertissement, sans validation formelle obligatoire | R09 R17 |
| R-27 | Génération PDF impossible (ressource obligatoire) | Blocage justifié, brouillon intact, commande pour corriger/réessayer | R17 |
| R-28 | Exporter puis modifier et « Figer et archiver » | Export seul ne fige rien ; gel volontaire crée une version immuable ; suivante distincte | R09 |
| R-29 | En `user` lecture seule, ouvrir un modèle/rapport/une archive | Lecture autorisée suivant droits ; mutations refusées aussi côté API | R10 R18 |
| R-30 | Test tablette, environ 768–1000px de largeur utile | Édition complète et panneaux escamotables, commandes accessibles | R19 |
| R-31 | Test smartphone 390px de large | Lecture fluide, commentaires et petites corrections, export ; aperçu A4 à part ; pas de mise en page avancée | R19 |
| R-32 | Test thème sombre, forest, violet et FR/EN | Chrome hérité de SMN, papier lisible, aucun texte coupé ; unités et statuts présents | Transversal |
| R-33 | Test clavier seul, zoom 200 %, lecteur d'écran | Actions, focus, libellés, ordre de lecture, états et tableaux utilisables ; contrôle WCAG 2.2 AA à instruire | Transversal |

## Contrôles techniques préalables

- **Sources métier :** identifier l'état initial et révisé des SP, la capacité J/H, les données historiques, les sources IA et les corrections métier.
- **Données :** persister les rapports indépendamment, leurs blocs, versions de modèles, points de fraîcheur et archives sans réécriture a posteriori.
- **PDF :** tester explicitement `@page` portrait/paysage, sauts, tableaux multipages, titres/contenus insécables, sommaire et annexes ; comparer sortie réelle à l'aperçu écran.
- **Autorisations :** lecture, mutation de brouillon, mutation de modèle, archivage et export ; refus côté serveur.
- **Sécurité :** traiter HTML enrichi, images, liens et données externes ; éviter XSS et fuite d'informations.
- **Audit :** aucun test `pnpm`, migration, build, validation Windows ni téléchargement PDF réel n'est exécuté dans cette livraison.

## Conditions de validation avant transmission à Amelia

1. Contrats DESIGN et EXPERIENCE relus et approuvés par le propriétaire produit.
2. Inventaire du code actuel, routes, API, données et autorisations effectué par l'agent de développement ou l'architecte.
3. Découpage en petites User Stories indépendantes et testables, puis **accord explicite** avant toute création/modification Jira.
4. PR/implémentation et preuves de tests vérifiés séparément ; la présence de ces documents ne constitue pas une livraison applicative.