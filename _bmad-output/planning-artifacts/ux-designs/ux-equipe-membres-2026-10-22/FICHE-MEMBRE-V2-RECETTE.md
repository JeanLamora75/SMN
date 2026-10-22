# Recette UX — Fiche membre V2 (22/10/2026)

**Statut : critères d'acceptation approuvés pour la conception, non testés.** Contrat de référence [FICHE-MEMBRE-V2-UX-CONTRAT.md](FICHE-MEMBRE-V2-UX-CONTRAT.md). Ces critères **remplacent UX-FM-02 à UX-FM-10** lorsque ceux-ci décrivent l'ancienne fiche Profil/Affectation/Calendrier/Localisation/Historique. La recette de la page Équipe Cartes/Liste reste applicable.

| ID | Scénario vérifiable | Attendu obligatoire | Statut |
|---|---|---|---|
| V2-01 | Ouvrir fiche depuis carte/ligne Équipe | Bandeau unique sur largeur utile, deux zones horizontales desktop ; retour Équipe visible | Non testé |
| V2-02 | Contrôler la zone gauche | Silhouette asexuée, nom, fonction professionnelle, badge statut et 3 badges SM/PO/Dev (bleu si rôle exercé, gris sinon) | Non testé |
| V2-03 | Contrôler zone droite | E-mail et localisation avec pays/région/ville/fuseau si enregistrés ; pas de fausses valeurs | Non testé |
| V2-04 | Cliquer le SEUL crayon à côté du nom | Modale centrée et voile gris ; Nom, e-mail, Fonction, Pays, Région, Ville, fuseau IANA et date d'effet si localisation modifiée | Non testé |
| V2-05 | Changer seulement le nom | Enregistrement sans mutation de localisation ; en-tête et cartes/liste reflètent le changement | Non testé |
| V2-06 | Changer seulement la fonction | Fonction persiste après rafraîchissement et apparaît sur fiche, cartes et liste, distincte des rôles | Non testé |
| V2-07 | Changer seulement la localisation | Nouvelle version datée selon SMN-47 ; e-mail/nom/fonction inchangés ; provenance et fuseau cohérents | Non testé |
| V2-08 | Changer identité ET localisation, provoquer erreur sur l'un des traitements | Pas de succès trompeur ni de divergence silencieuse ; stratégie atomique ou gestion explicite d'échec validée | Non testé |
| V2-09 | Fermer sans modification et fermer avec brouillon modifié | Aucune écriture à l'ouverture/annulation ; confirmation avant abandon des changements ; restauration du focus | Non testé |
| V2-10 | Inspecter barre sous bandeau | Exactement **Affectation, Calendrier, Absences, Historique**, dans cet ordre ; pas de Profil ni Localisation ; Affectation actif initialement | Non testé |
| V2-11 | Ouvrir Affectation | Infos actuelles, parts Agile et historique de versions affichés directement | Non testé |
| V2-12 | Cliquer Modifier affectation | Modale compacte champs datés/parts/taux ; total parts = 100 %, règles métier ; aucune table des versions dans la modale | Non testé |
| V2-13 | Ouvrir Calendrier | Trame, exceptions et leurs versions enregistrées directement ; suggestions non enregistrées signalées | Non testé |
| V2-14 | Cliquer Modifier trame | **Modale seulement trame** + date d'effet, sans absences ni historique ni exceptions à créer | Non testé |
| V2-15 | Cliquer Ajouter exception | **Modale seulement exception**, dates, demi-journées et note, sans formulaire d'absence | Non testé |
| V2-16 | Ouvrir Absences | Liste, catégorie/période/statut/créneaux et historique disponible visibles sans édition | Non testé |
| V2-17 | Cliquer Nouvelle absence / Modifier absence | Modal dédiée aux champs d'absence uniquement, sans formulaire calendrier | Non testé |
| V2-18 | Ouvrir Historique global | Chronologie synthétique dès clic, lecture seule, sans crayon, ni simulation d'événements absents | Non testé |
| V2-19 | Essayer d'archiver ou réactiver | Workflow protégé selon SMN-45 ; jamais via modification libre de statut dans formulaire d'identité | Non testé |
| V2-20 | Vérifier un membre archivé/provisoire et rôle user | Données et actions limitées par permissions serveur ; historique lecture seule, aucune fuite | Non testé |
| V2-21 | Tester clavier, mobile, zoom 200 % | Modales focus trap/annulation, scroll interne, zones bandeau empilées au besoin, aucune action perdue | Non testé |
| V2-22 | Vérifier FR/EN, palettes et thème sombre | Libellés traduits, contrastes et couleurs sémantiques cohérents, pas de changement de rôles | Non testé |
| V2-23 | Capturer les écrans et comparer aux règles V2 | Captures 1 bandeau desktop, 4 onglets et 4 modales types, comparées au contrat ; approbation utilisateur | Non testé |

## Conditions de réalisation

1. Exécuter et consigner les vérifications de code disponibles (typecheck, lint, tests, build) ; séparer ces preuves d'une **vraie recette navigateur**.
2. Avant toute mise en production de la modification groupée, démontrer la cohérence des deux sources (profil/localisation) et la persistance du nouveau champ Fonction ; ne pas annoncer une transaction atomique si elle n'existe pas.
3. Pour la chronologie globale, documenter précisément les types et dates réellement disponibles dans les endpoints ; l'absence d'un type d'événement doit apparaître dans la couverture, pas être masquée.
4. Les historiques détaillés restent dans leur onglet (version d'affectation dans Affectation, trames/exceptions dans Calendrier, absences dans Absences), même si Historique montre aussi des résumés.
5. **Ne pas reproduire l'ancienne maquette SVG à cinq onglets pour la fiche.** Elle est conservée uniquement comme trace historique.
6. Ne pas présumer de l'exécution de GitHub Actions ou des validations locales ; signaler explicitement ce qui n'a pas été exécuté.

## Compte rendu à produire par Amelia

Pour chaque ID : « Validé / Échec / Non exécuté », date, contexte (OS, navigateur, zoom, taille viewport, données), preuve (capture / commande / résultat), anomalies et décision de recette utilisateur. La publication de la documentation seule ne valide aucun de ces tests.