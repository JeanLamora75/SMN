# SMN — Centre Paramètres (UX approuvée le 23/10/2026)

**Statut : VALIDÉ FONCTIONNELLEMENT ; non développé ni testé dans cette publication.** Sally UX Designer BMAD v6.12.4, transmission à Amelia.

À lire dans cet ordre :
1. [DESIGN.md](DESIGN.md) — composition, cartes/liste, responsive, tokens ;
2. [EXPERIENCE.md](EXPERIENCE.md) — 14 rubriques, comportements, états, droits ;
3. [CATALOGUE-ET-ROUTES.md](CATALOGUE-ET-ROUTES.md) — inventaire de l'existant et statut des 14 destinations ;
4. [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) — lots indépendants et impacts techniques ;
5. [RECETTE-UX.md](RECETTE-UX.md) — 22 critères de recette non exécutés ;
6. [DECOUPAGE-JIRA.md](DECOUPAGE-JIRA.md) — Epic [SMN-223](https://lmn24.atlassian.net/browse/SMN-223) et quatre Stories [SMN-224](https://lmn24.atlassian.net/browse/SMN-224) à [SMN-227](https://lmn24.atlassian.net/browse/SMN-227).

**Décisions centrales :** menu Paramètres dans sidebar rétractable gauche ; page d'accueil pleine largeur avec 14 rubriques regroupées en 4 familles ; deux vues mutuellement exclusives Cartes/Liste sélectionnées via deux icônes en haut à droite et préférence mémorisée ; quatre cartes par rangée sur desktop ; cartes/lignes ouvrant leur vrai écran ; rubriques incomplètes honnêtement signalées sans lien mort ; Intégrations/Notifications réservées à une version ultérieure et cachées.

**Important :** les réglages déjà existants ne doivent pas être dupliqués ni réécrits ; sécurité, droits et APIs demeurent en place. Le portail n'est **pas** une commande pour implémenter les moteurs de jours ouvrés, nouvelle politique de capacité ou console de sécurité/sessions ; ces sujets nécessitent leur cadrage métier.

**BMAD :** les skills GitHub bmad-agent-ux-designer et bmad-ux ont été consultés. Les scripts locaux uv, memlog, sous-agents et validations de workflow ne sont pas exécutés dans la présente session par connecteurs GitHub/Jira ; les deux documents contractuels sont produits manuellement selon leur structure officielle. Aucun résultat de tests n'est revendiqué.