---
project: SMN
date: 2026-10-23
language: fr
change: ux-dashboard-lot-4-presentational
branch: main
status: code-publie-relecture-statique-ok-recette-windows-attendue
linked_stories: [SMN-21, SMN-238]
epic5: source-qualitative-non-livree
---

# UX dashboard — Lot 4 : cartes qualitatives et repères de priorité

## Situation réelle et limites

À la reprise du 23 octobre 2026, les 24 Stories SMN-89 à SMN-112 de l'Epic 5 sont encore « À faire » dans Jira. Le lecteur actuel `src/server/dashboard/cycle-reader.ts` renvoie explicitement `collectionUnavailable("producer-not-ready")` pour les trois colonnes `obstacles`, `risks` et `notesAndAlerts`. Le dashboard ne peut donc **pas** montrer de vraies fiches de ces registres, ni prétendre que SMN-238 est terminée.

Le PO a approuvé le principe visuel d'une **pastille colorée liée à la priorité sur chaque carte** (obstacle, risque, note ou alerte) et d'une distinction explicite des types. Ce lot prépare l'interface sans modifier les calculs métier, les bases PostgreSQL, les tables qualitatives ou les instantanés de clôture.

## Réalisation sur `main`

| Fichier | Changement |
| --- | --- |
| `src/lib/dashboard-data-contract.ts` | `DashboardAttention.priority` facultatif : `low/medium/high/null` ; aucune inférence depuis titre, état, date ou type. |
| `src/app/app/operational-overview.tsx` | Composants `AttentionColumn`, `AttentionCard`, `PriorityMarker`. Une source réellement `available` permet l'affichage de cartes triées par la projection en amont, 5 maximum, compteur fourni par le producteur. Source `unavailable` → bloc indisponible inchangé. |
| `src/app/app/bootstrap-icon.tsx` | SVG officiels Bootstrap Icons locaux : `exclamation-octagon-fill` (obstacle), `exclamation-triangle-fill` (risque), `sticky-fill` (note), `bell-fill` (alerte). |
| `src/app/dashboard.css` | Cartes compactes, pastilles priorité : élevée=rouge, moyenne=ambre, faible=vert, non renseignée=neutre ; libellé texte visible et flex responsive. |
| `src/i18n/fr.json`, `src/i18n/en.json` | Libellés types, niveaux et compteur ; pas de textes codés en dur dans les fiches de synthèse. |
| `docs/third-party/bootstrap-icons-LICENSE.md` | Inventaire MIT complété. |
| `tests/dashboard-ux-priority-cards.test.ts` | Tests de la présentation : indisponibilité, niveaux 3+inconnu, cinq cartes, compteur, distinction note/alerte, source vide, anglais et absence d'actions factices. |

La couleur n'est pas seule à porter l'information. Un niveau inconnu est affiché « Non évaluée », sans faux `low`. Le statut métier reste distinct du niveau de priorité et le composant réutilise uniquement le libellé fourni. Les pictogrammes sont `aria-hidden` car un texte de type visible les accompagne.

Les colonnes continuent à montrer **Indisponible** en production tant que leurs producteurs manquent. « Voir tout » et « Ajouter » ne deviennent pas des boutons cliquables fictifs ; leur raccordement est différé aux vraies routes de registres et à la validation RBAC serveur. Le projet n'ajoute ni migration, ni objet de registre, ni écriture SQL, ni synchronisation Jira.

## Frontière avec SMN-238

**Ce qui reste impérativement à développer dans Epic 5 / SMN-238 :**
1. Sources fiables de fiches, associations au Sprint et droits des lecteurs collectifs (SMN-89/90/94/97).
2. Criticité du risque selon sa matrice enregistrée 3×3 (SMN-93) et mapping explicite vers `high/medium/low` ; une criticité inconnue reste `null`. Pour obstacles/notes/alertes, aucun niveau calculé sans une règle métier validée.
3. Filtres côté producteur : états ouverts, ROAM non Resolved, contexte `teamId/cycleId`, journal de notes et alertes, classification et tri selon le contrat UX. Les cartes respectent l'ordre fourni, sans créer un moteur métier bis.
4. Compteurs exhaustifs, vraies routes « Voir tout »/détail et « Ajouter » uniquement si implémentées et autorisées ; statuts exacts et traductions métier.
5. Clôtures qualitatives V1/V2 (SMN-111/112) et absence de reconstitution historique à partir du registre contemporain ; sources partielles indépendantes les unes des autres.

Il faudra couvrir dans SMN-238 l'absence de source, 0/1/>5, multi-cycles, retour du même identifiant, permissions user/admin, historique clôturé, filtres/tri, langue et modification d'une fiche depuis sa route réelle. L'interface seule ne satisfait pas ces AC.

## Vérification et recette

- Effectué : lecture du contrat UX de Sally, des stories Jira concernées et de `main` ; vérification statique des chemins et de l'équivalence des clés FR/EN, présence des SVG Bootstrap, contraintes de 5 cartes et distinction entre disponible et indisponible.
- **Non exécuté ici :** Node `pnpm typecheck`, tests React/Next.js, `pnpm build`, rendu réel Chrome, PostgreSQL Windows ; la validation de bout en bout est en attente.

Sur Windows 11 après synchronisation GitHub Desktop :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/dashboard-ux-priority-cards.test.ts tests/dashboard-operational-overview.test.ts tests/smn-237-dashboard-events.test.ts tests/dashboard-ux-lot4-accessibility.test.ts
pnpm build
pnpm dev
```

Recette visuelle : voir les trois colonnes Indisponible sans valeurs fictives en base non équipée, puis tester la présentation de cartes avec une projection simulée dans les tests. Quand les registres auront été livrés : vérifier étiquettes + pastilles des quatre niveaux, 5 fiches maximum, liens sécurisés, historiques Vn, FR/EN, zoom 200 %, thèmes clairs/sombres et grilles 4/2/1.

**État d'avancement :** tranche UX du lot 4 publiée ; raccordement SMN-238 explicitement bloqué par ses producteurs métier, tickets Jira non modifiés et non clôturés. Le lot 3 de personnalisation des icônes de cérémonies constitue un développement indépendant et n'est pas déclaré terminé par cette livraison.
