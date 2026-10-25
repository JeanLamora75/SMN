# Correctifs UX du Registre — 25/10/2026

## Demandes couvertes

1. **Fiche registre :** les crayons de l'entête (informations générales et statut) ouvrent le formulaire complet dans une modale. Le type reste non modifiable conformément à l'API existante. Les brouillons restent protégés.
2. **Sections métier :** les raccourcis Évaluation du risque, Classification ROAM et Relations entre fiches et objectifs ouvrent l'éditeur complet, qui réemploie les composants `RiskAssessment`, `RiskRoam` et `RegistryRelations` et leurs API vérifiées. Les autres éditeurs métier spécialisés restent accessibles.
3. **Création :** le bouton « Créer une fiche » ouvre le formulaire de création complet existant, dans un `<dialog>` porté au `document.body`. L'ouverture attend l'hydratation client et ne déclenche plus de fermeture lors du nettoyage des effets React Strict Mode.
4. **Filtres :** catégorie immédiate (existante), cycle/statut/cycle de vie/tri immédiats, recherche et propriétaire temporisés de 350 ms, « Filtrer » et « Réinitialiser » garantissent un nouveau chargement, même sans modification des valeurs.
5. **Menu ⋯ :** « Modifier la fiche » depuis Liste et Cartes ouvre la même modale complète que la fiche ; « Ouvrir la fiche » conserve la navigation.
6. **Dates :** affichage localisé des dates civiles (`2026-10-24` devient `24 oct. 2026` en FR) sans décalage de fuseau horaire ; la valeur ISO reste dans l'attribut HTML `dateTime` et les contrôles `type=date`.

## Compatibilité et garde-fous

- Aucune modification de schéma PostgreSQL ou des API serveur. Les transactions et révisions optimistes existantes sont conservées.
- Les champs liés aux évaluations, ROAM et relations utilisent leurs **sauvegardes métier indépendantes** ; aucun enregistrement atomique global fictif.
- Accès à l'édition réservé au rôle admin par les garde-fous UI existants, avec contrôles API côté serveur.
- Navigation contextualisée vers les fiches préservée.
- Les modales utilisent le top layer natif et le focus de l'élément déclencheur est restauré à la fermeture explicite.

## Vérifications réalisées

- **9 vérifications statiques ciblées réussies** sur les sources exactes de la branche GitHub.
- **5 assertions exécutées** sur `formatRegistryDate` compilé avec `tsc --strict` en isolation, sur Node 22.16.0 ; empreinte Git locale `987ca7629f1baa95e07c2623803241fe1152d0f8` identique au fichier GitHub.
- Test ajouté : `tests/registry-ux-functional-corrections.test.ts` ; anciennes assertions de `smn-243` et `smn-245` ajustées à la nouvelle modale.

**Limites :** pas de clone installable du dépôt privé dans cet environnement ; la suite réelle `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et la recette navigateur/PostgreSQL **n'ont pas été exécutées ici**. Les contrôles précédents ne constituent ni une validation end-to-end, ni une preuve d'une sauvegarde PostgreSQL.

## Recette manuelle demandée

- Admin : ouvrir « Créer une fiche », remplir une fiche risque avec probabilité/impact/ROAM ; vérifier la sauvegarde et sa présence dans la liste.
- Admin : depuis une fiche, cliquer sur les deux crayons de l'entête ; enregistrer une modification, puis ouvrir les sections Évaluation, ROAM et Relations ; vérifier les enregistrements réels.
- Admin : depuis une ligne et une carte, utiliser ⋯ → « Modifier la fiche », puis vérifier le formulaire complet.
- Liste : rechercher un titre, filtrer statut et catégorie, changer cycle de vie/tri, réinitialiser, tester le bouton Filtrer sans changement et la navigation arrière.
- Lecteur : s'assurer qu'aucune commande d'édition ou création n'est présentée.
- Vérifier les dates FR/EN en Liste/Cartes et dans le détail, formatage sans décalage d'un jour ; tester la fermeture ESC et les modifications non enregistrées.
