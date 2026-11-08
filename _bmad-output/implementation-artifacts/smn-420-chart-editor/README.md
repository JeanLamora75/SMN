# SMN-420 — Éditeur graphique M2 (Option C Sally)

**Agent :** Amelia (BMAD, adapté au connecteur GitHub)  
**Jira :** https://lmn24.atlassian.net/browse/SMN-420  
**Date :** 8 novembre 2026  
**État :** développement publié sur `main`, recette réelle non effectuée.

## Conformité UX-02

- Fiche dédiée ouverte depuis **une carte M1**, `/app/admin/settings/reports/charts/[styleId]`.
- Colonne gauche : **accordéons** identité, options communes, réglages spécifiques au type sélectionné. Pas de mélange d'options barres / courbes / aires / secteurs / anneaux / jauges.
- Colonne droite : aperçu permanent, rendu uniquement au clic sur **Actualiser l'aperçu**. Changement de champ = brouillon non enregistré + ancien aperçu marqué obsolète. Aucun rendu déclenché par saisie ni par changement de type.
- Panneau d'actions avec **Enregistrer** et **Annuler**. Confirmation de sortie par navigation du lien ou fermeture/rechargement d'onglet avec modifications non sauvegardées.
- Les styles prédéfinis restent consultables mais **non éditables** : il faut les dupliquer depuis M1. Les styles personnalisés peuvent être modifiés par un administrateur.
- Les valeurs de démonstration sont clairement indiquées comme **fictives**.

## Architecture et sécurité

| Composant | Emplacement |
|---|---|
| Route protégée M2 | `src/app/app/admin/settings/reports/charts/[styleId]/page.tsx` |
| Éditeur React | `src/app/app/admin/settings/reports/charts/style-editor.tsx` |
| Aperçu HTTP | `src/app/api/admin/reports/chart-styles/preview/route.ts` |
| Accès depuis M1 | `src/app/app/admin/settings/reports/charts/style-gallery.tsx` |
| Styles responsives | `src/app/app/admin/settings/reports/charts/style-gallery.css` |
| Traductions | `src/i18n/fr.json`, `src/i18n/en.json` |
| Tests | `tests/smn-420-style-editor.test.ts` |

L'aperçu est un `POST` autorisé côté serveur (`collective/read`, contrôle d'origine de SMN), accepte un corps JSON borné à **12 000 octets**, un seul type parmi les six et uniquement une configuration validée par le contrat SMN-416. Le serveur utilise toujours le moteur partagé SMN-418 et un jeu de **six cycles fictifs / deux séries fictives** (une série pour la jauge), avec sortie PNG **960 × 560** limitée à 2 Mo. Aucun accès SQL, indicateur réel, cache partagé ou écriture d'archive. Les valeurs graphiques d'exemple sont statiques et non produites à partir des données utilisateur. Les libellés fictifs et le format des nombres respectent le paramètre de langue `fr` ou `en` envoyé au serveur ; l'API refuse toute autre langue.

L'éditeur crée un `Blob` local à partir de la réponse PNG et révoque l'ancienne URL d'image après une actualisation réussie, un rechargement de la fiche ou au démontage. L'échec de l'aperçu n'efface pas le brouillon. Les erreurs serveur sont présentées en conservant les valeurs saisies.

**Sauvegarde :** `POST /api/admin/reports/chart-styles` action `update` avec la révision originale, `name`, `description` et `config`. L'API SMN-416 vérifie les droits admin, les champs et les limites, ainsi que le verrouillage optimiste. Une réponse `conflict` n'écrase pas les choix en cours : l'utilisateur doit confirmer le rechargement.

## Recette Windows

Après synchronisation de `main` avec GitHub Desktop :

```powershell
pnpm test:smn-420
pnpm typecheck
pnpm lint
pnpm i18n:check
```

La CI `SMN-420 — Éditeur M2 et aperçu graphique` exécute les tests dédiés sur **Linux et Windows**, sans script `uv` :
https://github.com/JeanLamora75/SMN/actions/workflows/smn-420-chart-editor.yml

### Scénarios manuels à réaliser

- [ ] Dans Paramètres → Rapports → Graphiques, ouvrir une carte personnalisée via **Ouvrir** : fiche M2 en 2 colonnes, accordéons fonctionnels ; à largeur réduite, aperçu sous formulaire.
- [ ] Modifier une couleur, la légende et un paramètre spécifique ; vérifier **Non enregistré** et **Aperçu à actualiser**. Aucune requête `preview` ne part tant que le bouton n'est pas cliqué (réseau navigateur).
- [ ] Cliquer une fois **Actualiser l'aperçu** : exactement une requête HTTP, image PNG construite sur données fictives, aucun enregistrement du style.
- [ ] Tester les six types et les bornes des champs (pourcentages, jauge, décimales, couleurs, seuils). Vérifier que les paramètres non pertinents ne figurent pas dans la section spécifique.
- [ ] Tester l'échec HTTP/validation : brouillon conservé et erreur affichée.
- [ ] Enregistrer, revenir à M1, réouvrir : nom, valeurs et révision persistés. Vérifier conflits de révision sur deux onglets.
- [ ] Annuler avec et sans modifications, recharger/fermer avec modifications, tester clavier et disposition mobile.
- [ ] Ouvrir les trois prédéfinis : consultation uniquement ; dupliquer pour modifier.
- [ ] Tester les langues FR/EN et un utilisateur non administrateur.
- [ ] Confirmer qu'aucun rapport archivé, modèle Word/PowerPoint ou indicateur v33 n'a changé.

## Critères et état de preuve

| AC | Réalisation | Validation nécessaire |
|---|---|---|
| AC-01 | Fiche M2 dédiée + grille et accordéons | Revue Sally et responsive |
| AC-02 | Contrôles communs et spécifiques aux six familles | Test et recette de chaque type |
| AC-03 | Brouillon, dirty state et aperçu obsolète | Observation réseau manuel |
| AC-04 | Endpoint explicite, données fictives, limites et erreurs | Tests + essai PNG local |
| AC-05 | Enregistrer/Annuler, conflits, FR/EN, clavier | Test DB sur v33, recette Windows |
| AC-06 | Contrats tests et CI dédiée | Journal CI vérifié |

**Hors périmètre :** sélecteur temporaire du style à l'export (SMN-421), documentation finale (SMN-422), données graphiques personnelles dans l'aperçu. La réalisation n'est pas déclarée terminée sans recette.
