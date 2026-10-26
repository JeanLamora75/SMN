# Brief BMAD — Équipe : harmonisation Cockpit Agile (Option A)

**Statut : conception graphique explicitement validée le 26 octobre 2026.**  
**Agent : Sally — UX Designer, BMAD v6.12.4.**  
**Écran :** `/app/admin/members` ; **référence :** page Registres / Cockpit Agile.  
**Périmètre :** index Équipe (Cartes et Liste) ; **fiche membre V2 exclue**.  
**Epic Jira UX transverse :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228).  
**Maquette approuvée :** image générée et validée dans la conversation Sally du 26/10/2026, *Vision Produit* et *But du produit* inclus dans l'en-tête bleu côte à côte. Le PNG d'origine n'est pas versionné sur GitHub ; [MAQUETTE-REFERENCE.md](MAQUETTE-REFERENCE.md) en fixe la composition sans prétendre reproduire ses pixels.

## 1. Objectif / User Story
En tant que Scrum Master ou RTE, je souhaite que la page **Équipe** possède la même identité visuelle que la page **Registres**, afin de reconnaître immédiatement les informations et actions essentielles d'un écran à l'autre, avec moins de bruit et moins d'espace perdu.

## 2. Faits vérifiés dans `main` le 26/10
- `src/app/app/admin/members/page.tsx` rend `TeamOverview` dans `smn-page smn-team-page`.
- `src/app/app/admin/members/team-overview.tsx` contient déjà : nom de l'équipe, nom du produit, vision, but produit, icônes, bascule Cartes/Liste mémorisée, grille six colonnes et douze emplacements, drapeaux, silhouette neutre, badges SM/PO/Dev, fonction, création individuelle et modale.
- Les données viennent des endpoints existants `/api/admin/members` et `/api/admin/team-context`. Les actions de création passent par les permissions serveur existantes.
- `src/app/app/admin/registries/registry-cockpit.css` est la référence graphique à **consulter** et non à modifier.
- `src/app/globals.css` contient `.smn-page { max-width: 870px; }` ; tout ajustement de largeur doit être **ciblé** à la page Équipe.
- L'Epic métier [SMN-3](https://lmn24.atlassian.net/browse/SMN-3) et la Story [SMN-282](https://lmn24.atlassian.net/browse/SMN-282) font évoluer le périmètre multiéquipes : ne pas imposer l'ancienne règle monoéquipe ni présumer SMN-282 déjà entièrement livré.

## 3. Direction graphique approuvée
1. **Bandeau « hero » bleu marine**, arrondi, pleine largeur utile, dans l'esprit du Registre. À gauche, grand titre **« Équipe »** (pas « Team Koala » comme titre principal).
2. **À la place du sous-titre explicatif**, deux sections **côte à côte à largeur desktop**, avec icônes, textes provenant des données réelles :
   - **Vision Produit** : `teamContext.vision` ;
   - **But du produit** : `teamContext.productGoal`.
   Ces deux sections se trouvent **dans le même bandeau bleu**, séparées sobrement ; elles ne figurent **plus dans un panneau distinct**.
3. **À droite du bandeau**, boutons **Liste** / **Cartes** (Cartes actif sur la maquette, mais conserver la préférence utilisateur existante), et **+ Ajouter un membre** uniquement selon les droits. Le bouton et la tuile Ajouter ouvrent **la même modale existante**.
4. **Panneau blanc « Filtres et recherche »** sous le bandeau, comme sur Registres. Pastilles contextuelles alimentées par les données : équipe active, vue, nombre réel de membres affichés/actifs (libellé non ambigu). Recherche nom/fonction ; filtres Rôle Agile, Fonction et Statut utilisant seulement les attributs réellement disponibles. Les filtres sont fonctionnels et identiques en Cartes/Liste. Ne pas implémenter une fausse recherche de « compétence » sans données correspondantes.
5. **Panneau blanc principal** avec cartes six par ligne sur grand desktop : drapeau, nom, silhouette commune, badges SM/PO/Dev (bleu si part de rôle > 0, sinon gris), fonction enregistrée ou « Non renseignée ».
6. **Tuile Ajouter** en première position libre, pointillés bleus et libellé complet ; emplacements réservés restants très discrets et peu hauts (seconde rangée de la maquette), sans clic ou clavier.
7. **Mode Liste** même bandeau, mêmes données et filtres ; la table remplace les cartes, sans afficher les deux modes en parallèle.
8. **Responsive** : sections Vision/But empilées quand la largeur manque, actions refluant sans chevauchement, cartes en 3/2/1 colonnes selon largeur utile ; texte intégral accessible même si long.

## 4. Limites fonctionnelles et dépendances
- Aucun changement demandé à la fiche membre V2, à l'édition Vision/But, aux contrats API, au modèle Prisma, aux permissions, à l'historisation, aux règles d'affectation/calendriers, ni à la page Registres.
- **Conserver l'accès à l'éditeur existant du nom / contexte d'équipe** `TeamContextEditor` : son icône actuelle près du titre peut être déplacée dans les actions/contextes sans le rendre inaccessible.
- **Préserver** chargement, erreur, champs facultatifs absents, équipe non initialisée, archive, membres provisoires, création individuelle, réessayage, navigation fiche.
- Les nouveaux contrôles de filtre doivent réellement filtrer les données déjà autorisées en mémoire, sans nouvelles écritures. Si la source ne renvoie pas les archivés, ne pas inventer un filtre Archivés opérationnel ; exposer les seules options vraies et signaler toute limitation en recette.
- **Multiéquipes SMN-282** : afficher strictement le contexte courant fourni par l'application ; pas de sélecteur d'équipe redondant ou de changement de teamId non autorisé. Conserver l'isolation des données. Aucune migration implicite.
- i18n FR/EN dans les JSON centralisés, thèmes clair/sombre et palettes existantes, accessibilité WCAG 2.2 AA visée.

## 5. Références normatives et impacts
- [DESIGN.md](DESIGN.md) — composition et identité visuelle **approuvées**.
- [EXPERIENCE.md](EXPERIENCE.md) — comportements existants conservés, filtrage léger.
- [MAQUETTE-REFERENCE.md](MAQUETTE-REFERENCE.md) — transcription vérifiable de la maquette.
- [RECETTE-UX.md](RECETTE-UX.md) — critères d'acceptation et preuves.
- [Référentiel UX central](https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md).
- [Avenant Registres Option C / Cockpit Agile](../ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md).
- [Contrat Équipe d'origine](../ux-equipe-membres-2026-10-22/DESIGN.md) ; **la présente évolution supplante uniquement la présentation de la page index Équipe**, notamment l'emplacement des sections Vision/But et la hauteur des cases vides. La fiche membre V2 demeure gouvernée par son contrat dédié.
- Code probable : `src/app/app/admin/members/team-overview.tsx`, `page.tsx`, styles `smn-team-* `, `src/i18n/fr.json`, `src/i18n/en.json` et tests ciblés.

**Statut de livraison : spécification uniquement.** Aucun développement, build, test, publication d'image sur GitHub ni recette visuelle réalisés dans ce brief.

## 6. Handoff développement (Jira)

Story créée : **[SMN-285 — Refonte UX Équipe Cockpit Agile Option A](https://lmn24.atlassian.net/browse/SMN-285)**, enfant de l'Epic SMN-228 ; voir le [prompt de transmission à Amelia](PROMPT-AMELIA.md). Les critères Jira et [RECETTE-UX.md](RECETTE-UX.md) sont alignés.
