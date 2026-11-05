# SMN — Dashboard Builder : dossier UX BMAD complet
**Version :** 1.0 · **Date :** 1er novembre 2026 · **Agent :** Sally — UX Designer (BMAD v6.12.4)
**Statut :** cadrage UX validé en conversation : UX-DB-01 à UX-DB-33 et MAQ-DB-01 à MAQ-DB-10 ; **non développé, non recetté**.
**Portée :** Dashboard personnel par utilisateur habilité et équipe Scrum/Kanban. Langue de référence : français.

## Références et primauté
- [Spécification fonctionnelle D-DB-01 à D-DB-31](dashboard-builder-specification-fonctionnelle-v1.md)
- [Architecture BMAD A-DB-01 à A-DB-18](../architecture/dashboard-builder/ARCHITECTURE-DASHBOARD-BUILDER.md)
- [Référentiel UX général SMN](../../../docs/UX-REFERENTIEL-BMAD.md)
- Le présent document spécifie **l'expérience Dashboard Builder** ; les règles métier relèvent de la spécification fonctionnelle et des sources v33, les contraintes de persistance/sécurité de l'architecture. En cas de divergence, signaler et arbitrer, jamais altérer tacitement la source d'autorité.
- Les illustrations conversationnelles utilisaient des valeurs fictives et des comportements simulés : **ne pas les implémenter comme source métier**. Les validations MAQ concernent les choix UX, pas des captures pixels approuvées.

## 1. Objectifs et invariants
1. Consultation sans configuration nécessaire via une disposition initiale Scrum/Kanban.
2. Composition : **Dashboard → lignes → blocs → emplacements** ; modèle M01–M06 sur chaque bloc ; source et visualisation configurées indépendamment pour chaque emplacement.
3. Une configuration par couple **compte / équipe** ; choix de l'équipe dans le contexte global SMN, **jamais par emplacement**.
4. Une personnalisation est un **brouillon** distinct de la configuration sauvegardée ; sauvegarde explicite et atomique, annulation possible.
5. Le Dashboard **lit** les données métier, sans les éditer, copier ni recalculer ; historique et snapshots v33 respectés.
6. Consultation et personnalisation différenciées ; droits équipe et droits d'édition vérifiés côté serveur.
7. Responsive, clavier, tactile, contrastes, annonces d'état, sans tutoriel imposé.

## 2. Registre exhaustif des décisions UX
| ID | Décision validée |
|---|---|
| UX-DB-01 | Personnalisation intégrée à la page Dashboard via mode Personnalisation. |
| UX-DB-02 | Galerie centrale des modèles ; six cartes maximum par page, pagination si catalogue étendu. |
| UX-DB-03 | Choisir un modèle crée immédiatement un bloc **vide** avec + pour chaque emplacement ; assistant déclenché uniquement au clic +, en deux étapes. |
| UX-DB-04 | Étape 1 : catalogue de sources avec recherche code/nom et filtres catégories. |
| UX-DB-05 | Étape 2 : miniatures illustrées des visualisations compatibles, avec aperçu. |
| UX-DB-06 | Confirmer un emplacement ferme l'assistant et montre la configuration dans le brouillon, sans sauvegarde Dashboard automatique. |
| UX-DB-07 | Crayon Modifier sur chaque emplacement configuré en personnalisation ; réouverture avec choix existants. |
| UX-DB-08 | Action « Vider cet emplacement » dans l'assistant, avec confirmation ; ne touche ni au bloc ni aux données métier. |
| UX-DB-09 | Poignées distinctes de déplacement lignes/blocs ; alternatives clavier et tactile. |
| UX-DB-10 | Redimensionnement par poignée bas-droite et réglages précis largeur logique/hauteur auto ou fixe. |
| UX-DB-11 | Bouton « + Ajouter une ligne » **uniquement à la fin** du Dashboard ; la ligne est créée vide. |
| UX-DB-12 | Menu « … » propre à chaque bloc (Dupliquer, Supprimer, actions de bloc) ; « Ajouter un bloc » en fin de chaque ligne. |
| UX-DB-13 | Confirmation uniquement si suppression d'une ligne ou d'un bloc contenant des emplacements configurés ; blocs structuraux de l'en-tête non supprimables. |
| UX-DB-14 | Barre fixe basse : statut du brouillon, Annuler, Enregistrer ; Enregistrer désactivé sans changement. |
| UX-DB-15 | Sortie avec brouillon modifié : « Enregistrer et quitter / Quitter sans enregistrer / Continuer la personnalisation ». |
| UX-DB-16 | Conflit de révision : message d'erreur simple, pas de fusion/écrasement ; rechargement soumis à confirmation avant perte du brouillon. |
| UX-DB-17 | États chargement, valeur zéro, aucun résultat, indisponibilité et erreur **par emplacement**. |
| UX-DB-18 | Consultation : cacher les emplacements non configurés et redistribuer l'espace libre ; conserver proportions relatives si modèle asymétrique. |
| UX-DB-19 | En-tête identifié, avec **deux zones dynamiques** configurables séparément, structure non supprimable. |
| UX-DB-20 | En-tête mixte : informations métier fixes et deux zones dynamiques ; répartition visuelle adaptable, détails fixes affinés en recette. |
| UX-DB-21 | Triangles avant/après nom du Sprint/période : précédent/suivant ; mettre à jour nom, dates, informations fixes. |
| UX-DB-22 | Changement de cycle : chargement indépendant des seuls emplacements concernés, sans montrer ancienne valeur sous nouveau cycle. |
| UX-DB-23 | Paramètres avancés de visualisation facultatifs, repliés par défaut, valeurs initiales pertinentes. |
| UX-DB-24 | Mobile/tablette : commandes alternatives explicites (monter/descendre, dimensions) ; disposition desktop enregistrée préservée. |
| UX-DB-25 | Réinitialisation confirmée, appliquée **au brouillon seulement** avant Enregistrer ; Annuler restaure. |
| UX-DB-26 | Copie vers équipe autorisée : sélection et aperçu avant confirmation ; avertir avant remplacement. |
| UX-DB-27 | Source incompatible après copie : emplacement/config conservés avec avertissement et possibilité Modifier ; aucune valeur de l'équipe source. |
| UX-DB-28 | **Toutes les commandes générales dans un menu unique** « Actions du Dashboard », selon droits et mode. |
| UX-DB-29 | Succès : notification discrète temporaire ; erreur : message persistant ; une action de brouillon ne doit jamais sembler enregistrée. |
| UX-DB-30 | Erreur de chargement : bouton « Réessayer » **dans l'emplacement** ; reprise locale. |
| UX-DB-31 | Interface autonome, **sans guide, visite interactive ou aide de première utilisation** ; composants explicites et accessibles. |
| UX-DB-32 | **Navigation précédent/suivant désactivée en Personnalisation** ; cycle fixé jusqu'au retour en consultation. |
| UX-DB-33 | Copie interéquipes : **dernière disposition enregistrée seulement**, jamais le brouillon ; avertissement si brouillon existant. |

## 3. Registre des choix de maquettes
| ID | Choix validé | Contrat visuel |
|---|---|---|
| MAQ-DB-01 | B — Densité équilibrée | Marges modérées, lisibilité Cockpit Agile. |
| MAQ-DB-02 | B — Commandes essentielles visibles | Poignées, menus et crayons visibles ; dimensions avancées à la sélection. |
| MAQ-DB-03 | B — Grande modale centrée | Configuration en deux étapes ; catalogue/choix et aperçu côte à côte desktop, empilés mobile. |
| MAQ-DB-04 | B — Actions mobiles dans menu bloc | Monter, Descendre et Dimensions via « … » ; actions ligne séparées. |
| MAQ-DB-05 | B — Cartes modèles illustrées | Code, nom, mini-géométrie et nombre d'emplacements. |
| MAQ-DB-06 | B — Panneau dimensions flottant | Positionné près du bloc, ne déplace pas la grille ; mobile panneau pleine largeur adapté. |
| MAQ-DB-07 | B — Poignée et menu de ligne | Menu de ligne distinct des menus de blocs et des commandes d'emplacements. |
| MAQ-DB-08 | B — Confirmations contextualisées | Élément ciblé, configurations affectées, conséquence et actions claires. |
| MAQ-DB-09 | B — Modale copie deux colonnes | Gauche : destination + alertes ; droite : aperçu ; empilement mobile. |
| MAQ-DB-10 | B — Barre fixe contextualisée | Statut + icône + Enregistrer/Annuler ; détails additionnels seulement si erreur. |

## 4. Vues, structure et gabarits

### 4.1 Consultation desktop (MAQ-DB-01)
- Densité équilibrée et largeur alignée sur le Cockpit Agile.
- En-tête : informations **fixes** du Sprint/période (au minimum nom et dates ; statut et autres données à affiner en recette), triangles accessibles et **deux zones dynamiques**, sans modifier les informations fixes par le Builder.
- Le menu unique « Actions du Dashboard » donne accès à Actualiser et, si permission, Personnaliser ; autres actions selon mode.
- Sous l'en-tête, lignes et blocs configurés ; aucun +, crayon, poignée ou réglage structurel visible.
- Masquer les emplacements et blocs **non configurés** ; distribuer l'espace vacant entre emplacements configurés à l'intérieur du bloc sans modifier le modèle enregistré. Une source configurée sans valeur ou incompatible **reste visible**.

### 4.2 Personnalisation desktop (MAQ-DB-02 et 07)
- En-tête et structure conservés ; triangles précédent/suivant **désactivés**, avec libellés explicatifs accessibles.
- Deux zones dynamiques structurales configurables, **non supprimables**. Un slot vide reçoit + ; un slot configuré reçoit son crayon.
- Ligne : poignée + menu de ligne (Monter/Descendre/Supprimer) ; bloc : poignée + menu de bloc (Dupliquer/Supprimer/Changer de modèle, dimensions via sélection). Emplacement : + ou crayon.
- « Ajouter un bloc » uniquement en fin de ligne ; « + Ajouter une ligne » uniquement en bas du Dashboard.
- Choix du modèle → affichage immédiat d'un **bloc vide** correspondant, puis configuration facultative de chaque emplacement.
- Sélection d'un bloc : panneau flottant Dimensions (largeur logique, hauteur auto/fixe) ; poignée bas-droite. Ne pas masquer des données par rognage silencieux : si hauteur fixe insuffisante, proposer un débordement consultable ou rétablissement auto selon spécification.
- La barre **fixe** Enregistrer/Annuler est distincte du menu global.

### 4.3 Galerie des modèles (MAQ-DB-05)
| Modèle | Géométrie | Nombre |
|---|---|---:|
| M01 Simple | Un seul emplacement | 1 |
| M02 Duo | Deux égaux | 2 |
| M03 Trio | Trois égaux | 3 |
| M04 Quatuor | Quatre égaux | 4 |
| M05 Asymétrique | Un large et un étroit | 2 |
| M06 Composé | **Un large + deux petits** en composition asymétrique (pas trois colonnes identiques) | 3 |
- Six cartes illustrées maximum par page. La galerie est une modale centrale avec navigation de pages lorsque nécessaire.
- Modèle = géométrie uniquement ; jamais un indicateur ou graphique imposé.
- Changement volontaire vers un modèle plus petit : premiers emplacements conservés dans l'ordre, liste exacte des configurations excédentaires et confirmation explicite avant retrait dans le brouillon. Les migrations automatiques de modèles n'effacent pas silencieusement les configurations.

### 4.4 Assistant d'emplacement (MAQ-DB-03)
- Accessible par + (slot vide) ou crayon (slot configuré) et **pas** au simple ajout de modèle.
- Étape 1 : sources autorisées ; catalogue filtrable par catégories et recherche code/nom ; états liste vide et indisponibilité.
- Étape 2 : cartes illustrées des seules visualisations compatibles ; aperçu réactif ; paramètres avancés repliés par défaut (cycle spécifique de **même équipe**, filtres, tri, colonnes, nombre selon source).
- Grande modale à deux panneaux sur desktop, empilée sur mobile ; Retour / Confirmer ; fermeture de l'assistant en conservant le brouillon Dashboard.
- « Vider cet emplacement » depuis la modification, avec confirmation ; slot revient à + en personnalisation.
- Les types et permissions viennent des catalogues typés et adaptateurs, aucune valeur/compatibilité fictive.

### 4.5 Mobile / tablette (MAQ-DB-04)
- Réorganisation visuelle en colonne, **sans modifier la configuration desktop**.
- Navigation par triangles accessible en consultation, désactivée en édition.
- Actions bloc (Monter/Descendre/Dimensions) regroupées dans « … » ; actions ligne séparées ; commandes indisponibles aux extrémités désactivées.
- Les commandes explicites ne dépendent pas du survol ; cibles tactiles confortables, focus visible, menus correctement repositionnés, modales/panneaux adaptés.
- Barre de sauvegarde accessible en bas sans masquer la zone éditée, y compris clavier virtuel mobile.

## 5. Parcours sensibles

### 5.1 Sauvegarde et sortie (MAQ-DB-08 et 10)
1. Entrer en édition → charger version enregistrée en brouillon (aucun effet métier).
2. Toute modification structurelle/slot/dimension s'applique au brouillon ; statut « Modifications non enregistrées ».
3. Enregistrer : désactivé si aucun changement ; état Enregistrement… sans double soumission ; si succès revenir en consultation et notifier brièvement.
4. Annuler : restaurer version enregistrée ; si sortie avec brouillon modifié, modal à **trois actions obligatoires** : Enregistrer et quitter, Quitter sans enregistrer, Continuer la personnalisation.
5. Erreur réseau : brouillon conservé, message persistant et Réessayer.
6. Conflit de révision 409 : message simple ; **ne jamais écraser** la version concurrente ; recharge seulement après confirmation de la perte du brouillon. Pas de comparateur de versions requis.
7. Les notifications de Duplication/Réinitialisation indiquent « non enregistré » ; jamais « Enregistré » avant succès serveur.

### 5.2 Suppression / modification de modèle (MAQ-DB-08)
- Un bloc ou une ligne entièrement non configuré se supprime directement **du brouillon**.
- Si au moins un emplacement est configuré, modal contextualisée : identification de l'élément, nombre de slots concernés et action destructrice.
- En-tête : deux blocs structurels non supprimables.
- Dupliquer : modèle, dimensions, sources, filtres et exceptions de cycle copiés, **pas les données métier**, avec nouvel identifiant logique.

### 5.3 Réinitialisation
- Depuis le menu d'édition, confirmation contextualisée, puis remplacement **provisoire** de toute la disposition (en-tête dynamique compris) par le modèle initial de l'équipe ; Annuler restaure.
- Les informations fixes du header ne sont jamais supprimées.

### 5.4 Copie vers une autre équipe (MAQ-DB-09)
- Accessible uniquement si droit de lecture et droit de personnalisation adaptés.
- Toujours copier **la dernière version enregistrée** de la source ; avertir si brouillon actif, sans modifier ni sauvegarder ce brouillon.
- Modale deux colonnes : destination et avertissements à gauche, aperçu de la configuration réellement enregistrée à droite. Sur mobile : pile verticale.
- Une disposition déjà existante dans l'équipe cible nécessite confirmation explicite de remplacement.
- Côté serveur : vérifier autorisations, cohérence de révision, isolement des équipes et compatibilité.
- Copier modèle, géométrie, sources et représentations compatibles, **jamais valeurs, snapshots, historiques ou données métier** ; réévaluer les sources dans le contexte de l'équipe cible.
- Référence de Sprint/période de l'équipe source : ne jamais traverser l'isolement ; neutraliser l'exception de cycle étrangère et informer de la nécessité d'adapter le paramétrage.
- Source non compatible : garder emplacement/configuration pertinente avec état « Source incompatible » et bouton Modifier ; jamais valeur artificielle.

## 6. Chargement et états (UX-DB-17/22/29/30)
| État | Restitution | Action |
|---|---|---|
| Non configuré | + en édition, caché en consultation | Configurer |
| Chargement | Squelette local / libellé accessible | Aucun blocage global |
| Valeur valide égale à 0 | Afficher **0** avec unité applicable | Aucune |
| Aucun résultat | Message « Aucun résultat » lié à la source, **pas 0** | Voir filtres si autorisé |
| Source incompatible | Avertissement persistant, configuration préservée | Modifier en édition |
| Source indisponible/inaccessible | Message contextualisé non trompeur | Vérifier accès/configuration |
| Erreur de récupération | Message persistant propre au slot | **Réessayer** dans le slot |
| Réussite d'opération | Notification discrète temporaire | Aucune |
- Changement de Sprint en consultation : mettre immédiatement à jour les informations fixes fiables ; invalider visuellement les anciennes valeurs des slots dépendants, puis relire **indépendamment**. Les slots indépendants du cycle restent utilisables ; exception de cycle enregistrée conservée.
- Changement de cycle **interdit pendant l'édition** (triangles désactivés). Changement d'équipe relève du contexte global et des confirmations de brouillon.
- Actualiser global depuis le menu unique ; actualisation périodique adaptative, sans changement de disposition.
- Données historiques : définitions, calculs et snapshots existants ; ne jamais substituer des valeurs actuelles à un cycle clos.

## 7. Accessibilité, responsive, performance
- Tous les menus, modales, confirmations, étapes, sélecteurs, poignées et actions ont une alternative clavier, des noms accessibles et un focus visible.
- Pour les triangles : « Sprint précédent » / « Sprint suivant » ou « Période précédente » / « Période suivante » ; états disabled annoncés, avec motif compréhensible pendant l'édition.
- Pas de signification fondée sur la seule couleur ; annoncer les erreurs et succès aux technologies d'assistance. Préserver le focus lors des retours de modales.
- Les boutons déplacent des blocs/lignes même sans drag & drop ; opération discrète, prédictible et réversible.
- L'affichage responsive ne persiste pas des dimensions altérées par le mobile.
- Chargement progressif, priorité visible, erreurs isolées, déduplication en lecture selon l'architecture ; des données réelles fiables avant toute animation décorative.
- Interface autonome : pas de tutoriel, de visite guidée ni d'aide intrusive de première utilisation ; libellés et messages suffisants.

## 8. Contrats de maquettes et limites
- MAQ-DB-01 à MAQ-DB-10 sont des **choix de composition/interaction approuvés**, pas des captures normatives pixel-perfect.
- Les prototypes conversationnels parfois simplifiés (emplacements traités comme blocs, M06 montré en trois colonnes identiques, suppression sans toutes les confirmations, action mobile fictive, sauvegarde simulée) **ne prévalent pas** sur les décisions du présent dossier.
- La géométrie M06 doit rendre un emplacement principal et deux secondaires ; prévoir vérification des ratios exacts M05/M06.
- Les contenus fixes de l'en-tête (nom, dates, statut, autres) et les deux zones dynamiques seront ajustés visuellement pendant les **tests utilisateur locaux**, sans abandonner leur distinction structurelle.
- Aucune recherche d'images, capture GitHub ou exécution de test n'est revendiquée pour ce dossier.

## 9. Critères de recette UX testables
| ID | Scénario et résultat attendu |
|---|---|
| RX-01 | En consultation, bloc non configuré absent ; slot configuré égal à 0 visible ; « Aucun résultat » distinct. |
| RX-02 | En Personnalisation, ajout ligne → ligne vide ; ajout bloc M01–M06 → autant de + que d'emplacements, sans assistant automatique. |
| RX-03 | Clic + → modal étape 1, recherche/filtre ; étape 2 affiche uniquement les visualisations compatibles et aperçu. |
| RX-04 | Confirmer un slot ferme modal et affiche le résultat provisoire ; Annuler le Dashboard restaure source et visualisation initiales. |
| RX-05 | Modifier/crayon réouvre les choix ; Vider confirme puis rend le + sans supprimer la donnée métier. |
| RX-06 | Ligne et bloc ont menus/poignées distincts ; bloc dupliqué conserve configuration et obtient identité indépendante. |
| RX-07 | Suppression vide sans confirmation ; suppression configurée avec confirmation contextualisée ; en-tête structurel non supprimable. |
| RX-08 | Changer M03→M01 signale les slots configurés perdus, conserve le premier seulement après confirmation, Annuler restaure tout. |
| RX-09 | M05/M06 conservent hiérarchie asymétrique ; en consultation, redistribution d'espace n'altère pas la géométrie enregistrée. |
| RX-10 | En édition, triangles du cycle visibles mais désactivés ; en consultation, précédent/suivant modifie nom/dates et recharge les slots concernés seulement. |
| RX-11 | Un slot en erreur affiche Réessayer ; les autres continuent à fonctionner ; aucune ancienne valeur déguisée en nouvelle. |
| RX-12 | Menu « Actions du Dashboard » unique ; barre Enregistrer/Annuler fixe, séparée, active seulement si brouillon modifié. |
| RX-13 | Sortie avec brouillon sale : trois choix ; échec Enregistrer conserve tout ; conflit ne déclenche aucun écrasement. |
| RX-14 | Réinitialiser confirme et reste provisoire ; Annuler restaure l'intégralité de l'ancienne disposition. |
| RX-15 | Copier avec brouillon sale utilise uniquement la dernière version sauvée et avertit ; aperçu = configuration effectivement copiée. |
| RX-16 | Copie vers équipe avec Dashboard existant confirme remplacement ; source incompatible conservée avec avertissement ; aucune donnée ou référence de cycle étrangère. |
| RX-17 | Mobile : bloc et ligne déplaçables via actions explicites, menus sans survol, modales adaptées ; configuration desktop non altérée. |
| RX-18 | Navigation clavier intégrale, focus visible/restauré, cibles tactiles, annonces accessibles, états hors de la seule couleur. |
| RX-19 | Hauteur auto/fixe et largeur contrôlables ; débordement visible/consultable, pas de troncature silencieuse. |
| RX-20 | Droits insuffisants : édition et copie inaccessibles côté UI **et** API ; aucun accès interéquipes. |
| RX-21 | Les états historiques reflètent les valeurs et snapshots métiers applicables, jamais des chiffres factices. |
| RX-22 | En-tête : nom/dates fixes, deux zones configurables, réglage détaillé en recette sans supprimer les zones structurelles. |

## 10. Suivi de recette et responsabilités
| Domaine | Responsable de référence | Preuve attendue |
|---|---|---|
| Règles métier, indicateurs v33, sources autorisées | Product Owner / services métier | Définitions, compatibilités et historiques vérifiés |
| Composants et règles UX | Sally | Comparaison aux MAQ/UX-DB, captures de tests, grille RX |
| Architecture, permissions, migrations JSONB | Winston | Contrats, tests serveur et non-régression |
| Implémentation | Amelia | Code, tests unitaires/intégration, démonstration |
| Validation finale | Utilisateur sur Windows 11 | Scénarios RX exécutés, écarts consignés |

**Points volontairement ouverts pour recette :** ordre/densité détaillée des informations fixes de l'en-tête ; rendu réel des deux zones dynamiques ; ratios visuels M05/M06 ; débordement hauteur fixe ; ergonomie tactile, palette clair/sombre, dimensions précises. Ces ouvertures n'autorisent pas un changement implicite des décisions validées.

## 11. Statut de livraison
- **Validé en conversation :** 33 décisions UX, 10 décisions de maquettes, format de dossier **Option B — complet**.
- **Livré dans ce fichier :** contrats UX consolidés et critères de recette.
- **Non revendiqué :** implémentation, intégration dans l'application locale, migration PostgreSQL, exécution de tests, validation visuelle finale, modification Jira.


## 12. Avenant graphique validé — Modales Cockpit Agile (04/11/2026)

**Décision UX complémentaire aux MAQ-DB-01 à 10** : une nouvelle planche de référence des fenêtres de personnalisation du Dashboard Builder a été validée. [Contrat détaillé des modales](../ux-designs/ux-dashboard-builder-2026-11-04/MODALES-PARAMETRAGE-REFERENCE-VALIDEE.md) · [Planche vectorielle reconstituée](../ux-designs/ux-dashboard-builder-2026-11-04/modales-parametrage-reference.svg).

Six familles visuelles : galerie M01–M06, choix de source (étape 1/2), visualisations et options (étape 2/2), dimensions, copie interéquipes, confirmations et sorties. Les libellés métier, aperçus visuels, choix illustrés, messages contextualisés, accessibilité, responsive et thèmes Bootstrap sont obligatoires sans changement des règles de données, habilitations, brouillon et stockage. Le shell SMN conserve son en-tête global clair, son unique sélecteur d'équipe et le menu gauche existant. La planche présente six exemples simultanément à des fins pédagogiques, non l'état d'une application.

**Jira** : [SMN-381](https://lmn24.atlassian.net/browse/SMN-381) (modales) et [SMN-380](https://lmn24.atlassian.net/browse/SMN-380) (restitution), rattachées à l'Epic [SMN-353](https://lmn24.atlassian.net/browse/SMN-353). Le PNG original est stocké dans la Bibliothèque ChatGPT et non sur GitHub ; le SVG dans le dépôt est une reconstitution. Publication documentaire uniquement, sans revendication de recette.

## 13. Avenant UX-DB — Visualisations avec icône en filigrane (05/11/2026 — VALIDÉ)

**Décision validée par l'utilisateur le 05/11/2026.** Ajouter exactement deux types de visualisation aux sept existants, sans changer le catalogue des géométries M01–M06 :
- **Carte KPI — Filigrane** : variante distincte de la carte KPI classique.
- **Liste — Filigrane** : variante distincte de la liste métier classique.

**Contrat visuel :** utiliser l'icône et la couleur sélectionnées pour l'emplacement ; icône centrée horizontalement et verticalement dans la zone de contenu, hauteur cible égale à **90 % de la hauteur disponible**, largeur automatique sans déformation, **opacité fixe de 10 %**. Elle apparaît exclusivement à l'arrière-plan (aucune capture de clic ou de focus), sans perturber la valeur, les titres, unités, statuts, lignes, liens et actions. Empêcher tout débordement ; rendre lisibles les états vides, en chargement et en erreur. Sur petits blocs, conserver la lisibilité prioritaire ; adapter le filigrane sans déplacer le contenu métier.

**Contrat fonctionnel :** l'assistant affiche deux choix supplémentaires avec miniatures et libellés traduits FR/EN ; seuls les types compatibles avec la source sont proposés. Paramétrage en brouillon, application explicite puis sauvegarde globale ; les sept choix actuels et les dashboards enregistrés restent inchangés. Le catalogue doit totaliser neuf visualisations (six pour indicateurs, deux pour listes, une pour texte), sous réserve du typage effectif des sources. Aucun recalcul ou stockage de données métier par la vue. Les icônes/couleurs sont celles de la configuration existante : vérifier leur chaîne de persistance et la disponibilité des métadonnées avant l'implémentation ; ne pas inventer de valeurs par défaut métier.

**Recette UX :** comparer classique/filigrane sur M01–M06 ; cartes KPI à valeur nulle, nulle métier zéro, valeur longue, unité et titre long ; listes vides, longues, avec badges et bouton Ajouter ; dimensions S/M/L, clair/sombre, responsive, accessibilité clavier/lecteur d'écran, contraste, styles de couleur personnalisés, droits lecture seule, annulation du brouillon, sauvegarde/rechargement et compatibilité anciens layouts. L'icône décorative ne doit pas être annoncée comme une information redondante.

**Traçabilité :** Epic Jira [SMN-353](https://lmn24.atlassian.net/browse/SMN-353). Implémentation confiée à Amelia seulement après création de la Story correspondante. **Statut : décision UX, non preuve d'implémentation ni de test.**
