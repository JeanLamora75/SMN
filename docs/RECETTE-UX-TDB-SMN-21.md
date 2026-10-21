# SMN-21 — Recette UX du tableau de bord (lots 1 à 4)

**Date de préparation :** 21 octobre 2026  
**Références contractuelles :** `_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md` et `EXPERIENCE.md` ; Jira [SMN-21](https://lmn24.atlassian.net/browse/SMN-21).  
**Périmètre observable :** coque privée, contexte monoéquipe réel, quatre KPI non simulés, quatre colonnes opérationnelles et états indisponibles. La sélection réelle d'un cycle, les KPI métier et les actions des registres relèvent de futures User Stories.

## Préparer le PC de recette

Sur Windows 11, récupérer `main` avec GitHub Desktop, puis, dans PowerShell à la racine du projet :

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Se connecter sur `http://localhost:3003/app` avec un compte habilité. Conserver dans Jira les sorties des commandes (code de retour, erreur éventuelle et date) : une commande listée dans un plan n'est **pas** considérée exécutée.

## Matrice visuelle et de navigation — **à exécuter**, pas encore attestée

| Taille / configuration | Vérification observable | Résultat |
|---|---|---|
| 320 px et 375 px | Pas de défilement horizontal utile ; Équipe, Sprint/Période et Recherche sur des lignes distinctes ; déconnexion atteignable ; une colonne opérationnelle | ☐ Non exécuté |
| 768 px | Header sur deux rangées, menu ouvrable au clavier ; panneaux et cartes KPI repliés sans coupe ; navigation restaurée après Échap | ☐ Non exécuté |
| 1024 px | Sidebar desktop ouverte puis repliée ; labels des icônes disponibles au survol/focus ; éléments même en bas de menu atteignables ; 2 ou 4 colonnes selon **largeur utile** | ☐ Non exécuté |
| 1440 px et 1920 px | Header sur toute la fenêtre ; sidebar sous le header ; quatre KPI et quatre panneaux selon largeur utile, sans `max-width` arbitraire | ☐ Non exécuté |
| Zoom 200 % | Aucun contrôle essentiel inaccessible ; reflow ; déconnexion et accès au menu ; pas de contenu tronqué | ☐ Non exécuté |
| Navigation clavier | Tab depuis le lien d'évitement ; focus visible ; bouton menu ouvrable ; première entrée focalisée ; Échap referme et restitue le focus ; navigation sans souris | ☐ Non exécuté |
| Apparence | `light` et `dark` × `ocean`, `forest`, `violet` (six variantes) ; surfaces, icônes, liens, focus, statut indisponible et avertissement lisibles | ☐ Non exécuté |
| Traductions | Même parcours en français et en anglais ; aucune clé brute, valeur de repli inadéquate, ou texte masqué | ☐ Non exécuté |
| Rôle admin et user | Réutilisation des gardes serveur ; menu Administration absent côté user ; pages privées refusées lorsqu'elles sont interdites | ☐ Non exécuté |
| Données sans cycle | « Aucun cycle créé », quatre KPI à `Non renseigné` ou `Non calculable`, quatre colonnes « Aucun éléments à ce jour » ; aucun `0` ou événement fictif | ☐ Non exécuté |
| Contrôles inactifs | Sélecteurs monoéquipe/cycle et recherche étiquetés comme indisponibles ; Voir tout/Ajouter textuels, pas de boutons sans destination | ☐ Non exécuté |
| Config/historique | Checklist de configuration seulement pour admin et après pilotage ; aucune alerte actuelle attribuée à un ancien cycle | ☐ Non exécuté |

**Critères hors périmètre de recette de ces lots :** UX-TDB-04 à UX-TDB-08, UX-TDB-10 à UX-TDB-13 et UX-TDB-16 nécessitent les données de cycles, registres, snapshots historiques et préférences de disposition qui n'existent pas encore.

## Tests automatisés préparés

- `tests/dashboard-shell-ux.test.ts` : structure header, sidebar, indisponibilités et libellés FR/EN.
- `tests/dashboard-cycle-overview.test.ts` et `tests/dashboard-cycle-overview-source.test.ts` : quatre KPI, engagement initial et présentation sans cycle.
- `tests/dashboard-operational-overview.test.ts` : quatre colonnes, rôles, note/alerte et absence de liens fictifs.
- `tests/dashboard-ux-lot4-accessibility.test.ts` : annonces de contrôles désactivés, clavier, responsive, couleurs dans six variantes et rôles.
- `tests/responsive-accessibility.test.ts` et `tests/appearance.test.ts` : règles transversales de clavier, focus, thèmes et formes responsive.

**Mesures déjà réellement effectuées sur les sources via connecteur GitHub :** 12 assertions de structure/permissions/i18n/format et calculs de contrastes WCAG de cinq couples texte/fond sur les six variantes. Minimum des rapports mesurés : **4,74:1** (accent actif thème dark/ocean). Ce résultat **ne remplace pas** les essais visuels sur navigateur, ni une certification WCAG 2.2 AA ; il ne couvre pas l'intégralité des composants Bootstrap ou des interactions.

**Blocage connu :** les précédents jobs GitHub Actions ont échoué avant attribution de runner (`steps=[]`), empêchant une preuve d'exécution de `pnpm test`, `lint`, `typecheck`, `build`, PostgreSQL/HTTP et Windows. Ne pas classer cette absence de runner comme succès ni comme échec logiciel sans preuve.

## Clôture de la recette

- Enregistrer le résultat de chaque ligne (`OK`, `KO`, `Non testé`) avec OS, navigateur, résolution effective/zoom, thème, langue, rôle, date et capture éventuelle.
- Pour tout écart, créer un bug lié à SMN-21 avec reproduction, résultat attendu, résultat obtenu et preuve ; ne pas étendre silencieusement les règles métier.
- Ne passer SMN-21 à `Terminé` qu'après vérification des exigences **réellement livrables** et arbitrage des AC dépendant de futures Stories.
