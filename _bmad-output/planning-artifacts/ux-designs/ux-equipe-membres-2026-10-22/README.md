# UX approuvée — Équipe et membres SMN (22 octobre 2026)

**Statut : choix visuels et parcours principaux validés par le commanditaire le 22/10/2026.** Cette publication est une **spécification UX**, pas une livraison logicielle ni une recette. Agent : Sally, UX Designer BMAD v6.12.4.

## Contrats à lire par Amelia avant toute modification

1. [DESIGN.md](DESIGN.md) : composition visuelle des deux vues, des cartes et de la fiche membre ; design tokens hérités de SMN.
2. [EXPERIENCE.md](EXPERIENCE.md) : comportement des interactions, navigation, droits, éditions, fenêtres modales, états et scénarios de recette.
3. [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md) : schémas lisibles et description très précise des trois surfaces approuvées.
4. [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) : écarts techniques, lots de développement et traçabilité SMN-3 / SMN-42 à 47 / SMN-63.

## Portée de la validation

**Validé** : entrée principale « Équipe » ; alternance exclusive Cartes/Liste via deux icônes en haut à droite ; carte active cliquable ouvrant la fiche ; 6 cartes/ligne × 2 lignes initiales ; rôle SM/PO/Dev présent = coloré, absent = grisé ; fonction séparée sous les rôles ; icône neutre et asexuée commune à tous ; carte « + » après les membres actifs ouvrant une pop-up de création ; emplacements non utilisés gris et pointillés ; liste équivalente ; fiche membre validée avec retour, bloc identité, onglets et icônes crayon près des champs modifiables ; images sélectionnables reportées à la v1.

**Hors validation / à arbitrer** : comportement si >11 membres actifs et nécessité de dépasser les 12 cases initiales ; affichage par défaut lors de la toute première visite ; champs exacts et validations du formulaire d'ajout ; nomenclature exacte du nouveau champ « Fonction » ; persistance de la préférence par compte ou installation. Ces points n'autorisent pas à inventer des règles métier silencieusement.

## Sources

- Epic : https://lmn24.atlassian.net/browse/SMN-3
- Stories : https://lmn24.atlassian.net/browse/SMN-42 à https://lmn24.atlassian.net/browse/SMN-47 ; https://lmn24.atlassian.net/browse/SMN-63
- Référentiel UX transverse : ../../../../docs/UX-REFERENTIEL-BMAD.md
- Dashboard, style approuvé : ../ux-SMN-2026-10-21/DESIGN.md et ../ux-SMN-2026-10-21/EXPERIENCE.md

Les **visuels originaux validés en conversation** ne sont pas enregistrés comme fichiers images dans GitHub : [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md) documente leurs structures, proportions et règles sans prétendre être leur pixel-perfect. Les contrats DESIGN et EXPERIENCE prévalent sur les valeurs fictives du rendu.