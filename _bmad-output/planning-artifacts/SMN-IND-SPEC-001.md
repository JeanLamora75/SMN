# SMN — Spécification fonctionnelle : indicateurs dynamiques Scrum et Kanban
Référence SMN-IND-SPEC-001 · Version 1.0 · 31/10/2026 · BMAD Product Manager John

## Vision et périmètre
Remplacer les indicateurs Scrum/Kanban prédéfinis par un catalogue global vide à l'installation, des définitions libres et un moteur de formules mathématiques. Chaque équipe sélectionne ses indicateurs et configure l'affichage, commun à ses utilisateurs. Détruire les anciennes définitions et valeurs sans migration. Préserver intégralement les moteurs calendaires, capacités, dates, autres données métier et snapshots historiques non exclusivement liés aux indicateurs.

## Décisions métier validées
- IND-01 : aucun indicateur préinstallé, catalogue libre.
- IND-02 : métadonnées tag, libellé, unité complète, unité abrégée, couleur, description, icône, type manuel ou calculé, formule si calculé.
- IND-03 : tags uniques globalement.
- IND-04 : sélection commune à l'équipe, pas par sprint/période.
- IND-05 : une valeur courante par indicateur et cycle ; pas d'historique de modifications.
- IND-06 : modifications permises même après clôture.
- IND-07 : définitions et formules modifiables ; suppression bloquée si utilisées par une équipe ou référencées dans une autre formule.
- IND-08 : administration globale par admin, sélection et saisie par membres habilités pour leur équipe.
- IND-09 : désactivation masque l'indicateur mais conserve ses valeurs ; réactivation les retrouve.
- IND-10 : visibilité, ordre et présentation configurables par écran.
- IND-11 : nombre, carte, jauge, courbe, histogramme selon compatibilité.
- IND-12 : préférences partagées par équipe et écran, non individuelles.
- IND-13 : source manquante/division par zéro => « — » explicatif, jamais zéro fictif ni résultat périmé.
- IND-14 : dépendances calculées en cascade, sans cycle.
- IND-15 : activation d'un calculé rend disponibles ses dépendances transitives et leurs saisies manuelles sans affichage forcé.
- IND-16 : formules : tags, constantes, + - * / et parenthèses, sans fonctions avancées ni code arbitraire.
- IND-17 : deux décimales affichées au maximum, sans arrondis intermédiaires.
- IND-18 : unités descriptives sans validation dimensionnelle ni conversion.
- IND-19 : tags immuables, format ^[A-Z][A-Z0-9_]*$, réservation des tags calendaires.
- IND-20 : initialisation à null, distinct de zéro, valeur effaçable.
- IND-21 : modale de saisie groupée Cockpit Agile, calculés en lecture seule, enregistrement atomique.
- IND-22 : aperçu immédiat des calculés pendant la saisie, persistance seulement au clic Enregistrer.
- IND-23 : après changement de formule globale confirmé, recalcul automatique de toutes équipes et cycles concernés, y compris clôturés, avec résultats cohérents.
- IND-24 : rapports basés sur la configuration commune, ajustement ponctuel sans modifier cette configuration.
- IND-25 : tendances sur tous les cycles quel que soit le statut, trous pour valeurs manquantes.
- IND-26 : résultats calendaires utilisés par tags réservés, moteur calendaire inchangé.
- IND-27 : démantèlement complet de l'ancien système avant reconstruction, sans reprise de données.
- IND-28 : retrait des anciens composants UI pendant la transition, sans écran de remplacement.
- IND-29 : valeurs d'indicateurs supprimées lors de la destruction définitive d'un cycle ; simple suppression logique à distinguer.
- IND-30 : replanification conserve les saisies et recalcule les dépendances calendaires ; archives figées protégées.

## Modèle et règles
Catalogue global géré par administrateur ; indicateurs de type saisi (valeur par cycle) ou calculé (expression en lecture seule). Tags syntaxiquement valides et uniques ; suppression interdite en cas de références. Sélection par équipe indépendante des cycles ; activation implicite des dépendances, désactivation sans effacement des valeurs. Moteur de calcul sûr, ordre topologique, vérification des dépendances, division par zéro et absence de source produisent une indisponibilité expliquée. Les unités sont des libellés uniquement. Les entrées groupées restent locales en prévisualisation jusqu'à la validation atomique. Conflits de modification signalés.

## Ecrans et exploitation
Configuration partagée par équipe et par écran : tableau de bord, liste et fiche Sprint/Kanban, tendances, rapports. Représentation sélectionnable selon le contexte. Les tendances incluent tous les statuts et n'interpolent pas les valeurs absentes. Un rapport peut changer momentanément l'ordre, la sélection des indicateurs activés et la présentation sans changer les préférences communes. Les documents explicitement archivés restent soumis à leur propre contrat de figement.

## Autorisations
Vérifier côté serveur installation, rôle, équipe autorisée, cycle et droits. Seuls les admins gèrent le catalogue ; utilisateurs habilités sélectionnent et saisissent pour leur équipe. Aucune exposition interéquipes.

## Calcul calendaire et états historiques
Isoler le moteur des indicateurs de ceux des capacités, absences, jours ouvrés et jours fériés. Un adaptateur en lecture seule doit exposer les résultats autorisés sous tags réservés ; après changement de dates, recalculer les indicateurs dépendants en conservant les saisies. Les snapshots calendaires et archives documentaires historiques ne sont pas écrasés. Ne pas appliquer aux nouveaux indicateurs le gel des valeurs des anciennes clôtures.

## Démantèlement
Phase 1 : inventorier et supprimer les définitions, valeurs, formules, API, interfaces et DDL des anciens indicateurs sans effacer de données métier ni moteurs de capacité ; supprimer les interfaces sans placeholder. Phase 2 : reconstruire catalogue, moteur, valeurs, sélection, présentation, rapports et adaptateur calendrier. Réviser les exigences BMAD et Jira devenues contradictoires en préservant l'historique de versions.
Fichiers sensibles repérés : src/lib/sprint-indicator-values.ts, src/server/sprints/indicators-read.ts, src/server/sprints/sprint-capacity-kpis.ts, src/server/kanban/metrics-block.ts, src/server/kanban/trends.ts, src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx, ainsi que les routes et rapports associés. Vérifier les dépendances SQL et migrations v32 avant suppression.

## Critères d'acceptation transversaux
AC01 Tags invalides/doublons/ref réservée refusés et tag immutable.
AC02 Valeur null distincte de 0, modifiable après clôture sans fuite entre équipes.
AC03 Formule arithmétique validée, calculs en cascade et détection de cycle ; « — » si impossible.
AC04 Dépendances implicites alimentables ; désactivation/réactivation conserve les valeurs.
AC05 Prévisualisation immédiate, annulation sans écriture, sauvegarde atomique et conflit explicite.
AC06 Changement global de formule recalcule toutes les équipes/cycles concernés de façon cohérente.
AC07 Tendances tous statuts, courbe interrompue pour données absentes.
AC08 Personnalisation des rapports ponctuelle sans affecter configuration partagée.
AC09 Replanification conserve les saisies et recalcule les dépendances calendaires.
AC10 Suppression définitive de cycle efface ses valeurs sans affecter catalogue ou autres cycles.
AC11 Ancien système retiré sans regression sur calendriers/capacités et fonctions non liées.
AC12 Sécurité serveur des opérations sur toutes les équipes et cycles.

## Questions ouvertes pour l'architecture Winston
Stockage/calcul à la demande versus matérialisation ; cohérence et échecs des recalculs globaux ; précision interne et arrondi ; changement manuel↔calculé ; limites numériques ; inventaire et namespace des tags calendaires ; suppression logique/définitive ; configuration des vues ; répercussions sur snapshots et archives ; périmètre Scrum/Kanban des indicateurs ; formules constantes ; audit complet des migrations, API, tests, traductions et documentation.

## Sources
- https://github.com/JeanLamora75/SMN
- https://lmn24.atlassian.net/browse/SMN-234
- https://lmn24.atlassian.net/browse/SMN-335
- https://lmn24.atlassian.net/browse/SMN-153

Cette spécification documente les décisions validées, mais ne valide pas une architecture ou des tests ; aucune suppression de code ni modification Jira n'est autorisée par sa seule publication.
