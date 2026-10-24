# Refonte UX Dashboard — lot 5 : cartes opérationnelles (24 octobre 2026)

## Demande et portée
Aligner les colonnes **Obstacles, Risques, Événements, Notes / Alertes** sur la PJ2 approuvée, sans valeurs fictives ni perte des liens et modales existants. Contrats : SMN-21, SMN-237, SMN-238 et `docs/UX-REFERENTIEL-BMAD.md`.

## Modifications du code
- `src/app/app/operational-overview.tsx` : cartes denses, descriptions réelles sur deux lignes, métadonnées utiles, statuts traduits, liens de registres filtrés, icônes par cérémonie, date locale condensée, au plus cinq événements.
- `src/app/dashboard.css` : styles `smn-operational-compact` et indicateurs utilisant les couleurs existantes, sans modifier les media/container queries 4/2/1.
- `src/server/dashboard/attention-reader.ts`, `src/lib/dashboard-data-contract.ts` : projection en lecture seule des descriptions, responsables conditionnels, échéances et dates réellement persistées.
- `src/server/dashboard/cycle-reader.ts`, `src/app/app/page.tsx` : responsable personnel transmis uniquement avec rôle administrateur (protection serveur).
- `src/lib/dashboard-card-format.ts`, `src/app/app/bootstrap-icon.tsx` : classification prudente des types de cérémonie, icônes SVG Bootstrap intégrées, dates dans le fuseau du Sprint. Fiche historique non réécrite.
- `src/app/app/admin/registries/page.tsx`, `src/app/app/admin/registries/registry-list.tsx` : « Voir tout » filtre l'onglet du module existant.
- `tests/dashboard-ux-dense-operational-20261024.test.ts` : nouveaux tests de projection, 5 éléments, sécurité, configuration, dates FR/EN, icônes.

## Non-régression attendue
- Source absente : « Indisponible » sans inventer de zéro ; aucun changement des API de mutation ou de génération des cérémonies.
- Notes de Sprint : champ `body` unique en base ; affichage du contenu en titre, sans prétendre avoir un champ `description` distinct.
- Tâches de configuration : `todo` actif, `done` informatif, `ignored` absent.
- Aucun champ de participants/lieu ajouté : il n'est pas établi que ces champs existent dans la projection des trois producteurs d'événements.
- Les quatre boutons « + Ajouter » réutilisent les dialogs existants ; droits de création côté API inchangés.
- « Voir tout » Notes / Alertes reste sans cible de liste dédiée ; ne pas inventer de route.
- Les registres conservant un périmètre d'équipe sans association explicite portent le libellé « Équipe · sans Sprint ».

## Recette non exécutée dans le connecteur GitHub
Le code a été modifié via le connecteur ; **aucun `pnpm typecheck`, `pnpm build`, test Node/TSX, intégration PostgreSQL ni capture de rendu navigateur n'a été exécuté** dans ce contexte. GitHub Actions est désactivé. La conformité visuelle de la PJ2 reste à confirmer sur le poste Windows. L'agent BMAD développeur et son skill ont été consultés ; le moteur de workflow local `uv run` n'a pas été exécuté faute de checkout accessible.

### Commandes PowerShell
```powershell
git switch main
git pull origin main
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec tsx --test tests/dashboard-ux-dense-operational-20261024.test.ts tests/dashboard-ux-priority-cards.test.ts tests/smn-237-dashboard-events.test.ts tests/smn-238-dashboard-attention-recovery.test.ts tests/dashboard-operational-quick-add-20261024.test.ts tests/dashboard-operational-overview.test.ts
pnpm build
pnpm dev
```
Ouvrir `http://localhost:3003/app` avec une base de test et contrôler en grand écran/tablette/mobile, FR/EN, utilisateur/admin, événements traversant minuit et historiques. Les stories restent ouvertes jusqu'à la validation utilisateur et de la recette.
