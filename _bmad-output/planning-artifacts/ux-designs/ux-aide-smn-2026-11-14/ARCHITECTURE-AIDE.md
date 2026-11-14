# ADR — Module Aide SMN : documentation embarquée, internationalisation et progression locale

**Responsable :** Winston — System Architect BMAD v6.12.4  
**Date :** 14 novembre 2026  
**Statut :** invariants fonctionnels validés ; choix d'implémentation proposés pour réalisation  
**Sources :** [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [RECETTE-UX.md](RECETTE-UX.md), [référentiel UX](../../../../docs/UX-REFERENTIEL-BMAD.md) ; décisions explicites de l'utilisateur du 14/11/2026.

## Paradigme

**Aide statique embarquée, chargée à la demande, et préférences locales sans stockage métier.** Le contenu appartient au dépôt et à la distribution de SMN ; la progression de première configuration appartient au **profil navigateur local**, et non à PostgreSQL.

## Invariants d'architecture

**HELP-AD-01 — Aucune écriture métier.** Consulter ou rechercher l'aide, ouvrir/fermer une modale, suivre la checklist et enregistrer sa progression ne doivent appeler aucune API d'écriture ni exécuter de SQL `INSERT/UPDATE/DELETE` sur une base SMN. Aucune nouvelle table dédiée, aucune migration PostgreSQL, aucune écriture d'audit provoquée artificiellement par le module Aide. Les actions métier lancées à partir d'un lien « Ouvrir l'écran » continuent, elles, à suivre les règles normales de SMN.

**HELP-AD-02 — Progression locale (option LOCAL validée).** Persistance via `window.localStorage`, avec une clé dédiée, namespacée et versionnée, p. ex. `smn.help.setup.v1` (nom à fixer à l'implémentation). États explicites `todo/in_progress/done`, séparés des identifiants d'étapes stables, validation de forme à la lecture. Les étapes ne sont jamais terminées automatiquement parce qu'un écran a été consulté. La progression n'est ni synchronisée avec PostgreSQL, ni incluse dans la sauvegarde SMN, ni transférée par défaut entre PC/navigateurs. Ne pas y stocker de secrets, comptes, noms de membres, équipes, identifiants sensibles ni données métier. Afficher une information claire sur cette limite. Si `localStorage` est indisponible, ne pas annoncer une sauvegarde réussie : poursuivre en lecture avec avertissement ; une éventuelle session temporaire ne doit pas se présenter comme persistante.

**HELP-AD-03 — Catalogue documentaire séparé des traductions UI.** Les articles longs sont des ressources indépendantes par locale et identifiant documentaire stable, p. ex. `content/help/fr/teams.md`, `content/help/en/teams.md` ; catalogues FR/EN existants réservés aux libellés UI courts (Bouton Aide, états, notifications, accessibilité). La cible est **6 à 10 langues**, sans imposer dès maintenant leur liste. Aucun article long n'est importé dans `src/i18n/fr.json` ou `src/i18n/en.json`.

**HELP-AD-04 — Chargement différé par langue et article.** Au chargement initial de SMN, ne pas embarquer toutes les pages ni toutes les locales dans le bundle navigateur. Le Centre d'aide charge l'index **de la langue active**, puis les articles consultés ; une modale métier charge **uniquement son article cible**. Le moteur de recherche exploite un index de cette locale, préparé pendant la construction du package, sans SQL, ni téléchargement distant. `dynamic import`, chargement serveur ciblé ou fichiers statiques locaux sont des techniques candidates : leurs effets réels sur le bundle, la sécurité et le packaging seront mesurés en implémentation.

**HELP-AD-05 — Disponibilité sans Internet externe.** Les ressources nécessaires aux langues livrées sont incluses dans **SMN-Distribution-Windows-x64** et accessibles depuis le serveur SMN local, même sans Internet. « Hors ligne » signifie **sans accès Internet externe**, pas nécessairement application utilisable si le serveur local SMN est arrêté. Les liens vers l'aide ne doivent dépendre ni de GitHub, ni d'un CDN, ni d'un fournisseur IA. Les scripts de packaging doivent copier les contenus et leurs index ; la recette validera la distribution réelle, et pas seulement `pnpm dev`.

**HELP-AD-06 — Identifiants canoniques et couverture.** Un catalogue de métadonnées associe `articleId`, catégorie, modes Scrum/Kanban, prérequis et routes de contexte autorisées. Ces identifiants sont indépendants des locales et ne changent pas lorsqu'une traduction est modifiée. Le Centre d'aide et la modale partagent ce catalogue et cette source de contenu. À l'ajout d'une langue, les fichiers localisés sont ajoutés sans modifier les composants d'affichage ; un contrôle de build détecte identifiants manquants, liens non résolus, traductions et index incohérents. Les libellés système utilisent toujours le mécanisme i18n général de SMN ; celui-ci devra évoluer indépendamment pour accueillir 6–10 locales.

**HELP-AD-07 — Repli documentaire explicite.** Si une traduction manque, un repli peut afficher la version française (locale canonique proposée) **en signalant que l'article n'existe pas encore dans la langue choisie**. Interdire le repli silencieux qui donnerait l'illusion d'une traduction complète. Les langues supportées et le repli devront être définis avec la stratégie globale d'internationalisation de SMN.

**HELP-AD-08 — Autorisation et inertie.** L'aide est lisible par les comptes habilités à utiliser le shell privé. Les liens vers des écrans sensibles sont filtrés selon les permissions déjà validées ; les articles ne contiennent jamais d'informations privées propres à une équipe. L'aide **ne constitue pas** une couche d'autorisation : les routes et APIs métier conservent tous leurs contrôles serveur. La modale respecte le focus, les brouillons, les filtres et l'interdiction de double modale du contrat UX.

## Frontières et flux

```text
Application Next.js SMN (shell existant)
 ├─ Libellés de contrôle (catalogue src/i18n, courts et globalement disponibles)
 ├─ Menu Aide / Centre d'aide
 │   ├─ catalogue neutre articleId ↔ catégories ↔ contextes
 │   ├─ index documentaire chargé selon locale (à l'ouverture)
 │   └─ article ciblé chargé à la demande
 ├─ Bouton Aide de l'écran → modale Cockpit → article ciblé
 └─ Checklist → localStorage versionné du navigateur
     └─ AUCUN appel d'écriture vers PostgreSQL

Distribution Windows SMN
 └─ contenu/help/<locale>/<article>.md + index locaux
```

## Semences techniques vérifiées (non contractuelles)

- SMN est sous Next.js et emploie `src/i18n/catalog.ts` pour les catalogues FR/EN actuellement importés au démarrage ; isoler les contenus longs évite de grossir cette partie.
- `src/lib/private-navigation.ts` définit la sidebar ; `src/app/app/private-navigation.tsx` la rend.
- `src/app/app/dashboard-builder/modal-focus.ts` contient un mécanisme partagé de focus pour modales.
- Emplacements documentaires proposés : `content/help/<locale>/<articleId>.md`, index par locale construit statiquement, métadonnées d'article séparées. **Aucun de ces emplacements n'est créé par cet ADR.**

## Décisions hors périmètre ou reportées

- Export PDF et Word, outils de rédaction de Camille, génération des captures : travaux ultérieurs alimentés par les mêmes articles.
- Choix des 6–10 langues cibles, stratégie d'examen humain des traductions et éventuelles locales régionales.
- Gestion du support avant la première authentification, politique de remise à zéro, stockage local par origine navigateur quand plusieurs installations sont servies sur une origine identique.
- Granularité du catalogue, mécanisme précis de rendu Markdown sécurisé, et mode de fabrication d'index : Winston/Amelia les vérifieront sur le code et la distribution existants.
- La progression étant locale, une nouvelle installation/restauration de SMN sur un autre PC ne récupère pas les coches. Aucun export/import n'est prévu en option LOCAL.

## Conditions d'acceptation d'architecture

1. Sans interaction avec un écran métier, parcours Aide et checklist ne produisent aucune requête d'écriture serveur ou mutation SQL.
2. Une modification de checklist survit au rechargement du même navigateur/origine, disparaît dans un nouveau profil navigateur et n'est pas présentée comme synchronisée.
3. Chargement initial mesuré : aucune importation des corps Markdown des autres articles/locales ; une modale charge son article seulement.
4. Ajouter une troisième locale documentaire n'impose aucune duplication des composants et les fichiers JSON UI ne grossissent que des libellés courts.
5. Tests de traduction et couverture documentaire par langue, identifiants et liens ; repli visible.
6. ZIP Windows vérifié hors Internet : Centre d'aide, modale et recherche fonctionnent depuis l'installation locale.
7. Aucune nouvelle table, migration ou paramétrage PostgreSQL pour la seule fonctionnalité Aide.

**État :** architecture documentaire proposée et publiée ; aucune implémentation ni recette exécutée, aucune modification Jira ou base de données.
