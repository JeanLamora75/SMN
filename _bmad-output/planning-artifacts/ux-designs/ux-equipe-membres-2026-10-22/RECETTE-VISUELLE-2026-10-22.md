# Grille de recette visuelle — Équipe et Fiche membre

**Critères pour Amelia, à exécuter après correction. Statut actuel : NON TESTÉ.** Références : [avenant](AVENANT-UX-CORRECTIF-2026-10-22.md), [DESIGN](DESIGN.md), [EXPERIENCE](EXPERIENCE.md), [3 maquettes SVG](references-visuelles/cible-equipe-cartes.svg).

## Préparation

Fenêtre desktop proche de **1 880 × 850 px** et zoom 100 %. Mesurer la largeur effective après sidebar. Jeux de démonstration séparés avec **0 / 3 / 8 / 11 / 12 / 13 membres actifs**, un membre **SM + Dev**, et des informations de profil connues et inconnues. Ne pas injecter d'exemples fictifs dans la base réelle.

## Test des écrans

| Test | Attendu précis | Statut initial |
|---|---|---|
| UX-C01 | Équipe sur **toute largeur utile**, sans limite 870/1 000 px ; titre « Équipe » et contexte équipe distincts | Non testé |
| UX-C02 | 3 actifs = **3 cartes + 1 Ajouter avec libellé + 8 cases vides** dans **6 × 2** | Non testé |
| UX-C03 | 8 actifs = **8 cartes + 1 Ajouter + 3 cases vides** en 6 × 2 | Non testé |
| UX-C04 | Nom, silhouette neutre, **SM/PO/Dev sur une seule ligne**, fonction sous badges lisible sur 1–2 lignes | Non testé |
| UX-C05 | Tous rôles exercés **bleus**, non exercés **gris** ; multi-rôle = plusieurs bleus | Non testé |
| UX-C06 | Tuile Ajouter porte **+ et « Ajouter un membre »** ; cases vides inertes ; carte entière ouvre fiche | Non testé |
| UX-C07 | À 11, 12, 13 actifs, commande Ajouter toujours accessible, aucun membre caché | Non testé |
| UX-L01 | Bascule exclusive : **soit Carte, soit Liste**, jamais les deux ; préférence mémorisée | Non testé |
| UX-L02 | Liste : nom + avatar, **trois badges colorés/gris**, fonction, statut, action d'ouverture, ligne Ajouter | Non testé |
| UX-L03 | Un clic sur ligne ou carte ouvre **le même membre et son ID** | Non testé |
| UX-F01 | Fiche sur toute largeur utile, **bandeau complet** avatar/nom/statut/3 badges/fonction | Non testé |
| UX-F02 | **Cinq onglets** ordonnés Profil, Affectation, Calendrier, Localisation, Historique ; Profil initial | Non testé |
| UX-F03 | Profil = deux colonnes : gauche Général + Affectation ; droite Rôles + Calendrier + Localisation | Non testé |
| UX-F04 | **Crayon adjacent** à Nom/Fonction/E-mail lorsque modifiables ; édition ciblée, Annuler/Enregistrer | Non testé |
| UX-F05 | Cycle de vie sous workflow protégé, pas de champ booléen « Actif » ; historique conservé | Non testé |
| UX-F06 | Calendrier/localisation : valeurs réelles ou inconnues explicites, pas seulement « Voir et ajuster » | Non testé |
| UX-T01 | FR/EN, thèmes clair/sombre, palettes, clavier, zoom 200 %, responsive sans action perdue | Non testé |
| UX-T02 | Permissions côté serveur, dates d'effet, versions, brouillons non écrasés | Non testé |

## Preuves obligatoires

- Captures Équipe Cartes (3 et 8 membres), Équipe Liste, fiche Profil et au moins un autre onglet, prises dans une résolution comparable aux captures utilisateur initiales.
- Relevé de la largeur effective du contenu et règle CSS finale utilisée ; ne pas confondre déclaration de classe et largeur visuelle.
- Pour chaque ligne de test, indiquer **Validé / Échec / Non testé**, date et preuve.
- Vérifications réellement exécutées localement (typecheck, lint, tests, build si disponibles) ; **aucun test GitHub Actions présumé**.
- Présentation au commanditaire et validation fonctionnelle **distincte du merge**. Ne pas déclarer conformité sur un simple résultat de compilation.

## Rappel

Une revue de documentation **n'est pas** une validation de la livraison d'Amelia. Les illustrations du dossier sont des SVG reconstitués, pas les captures PNG originales.