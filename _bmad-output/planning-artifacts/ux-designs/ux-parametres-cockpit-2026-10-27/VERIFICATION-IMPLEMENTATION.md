# Vérification technique — Refondre Centre Paramètres

Statut : **à exécuter par l'utilisateur sur Windows 11 ; aucun test attesté dans cette session**.
Branche de développement : `feature/smn-299-304-parametres-cockpit` ; PR #206.

## Préparation

Dans GitHub Desktop : basculer sur la branche de la PR et vérifier que le répertoire local SMN est à jour. Ouvrir PowerShell dans le répertoire SMN (aucun droit administrateur requis).

## Contrôles

Exécuter successivement, et conserver la sortie de chaque commande :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Si une commande échoue, arrêter la qualification de livraison, copier le message d'erreur et ouvrir une anomalie ou corriger le code avant fusion. Ne pas masquer les erreurs de compilation par un résultat de test partiel.

## Recette navigateur — http://127.0.0.1:3003

- Administrateur Scrum : 12 cartes, 4 groupes, Cartes/Liste ; pas de recherche générale.
- Cadence Scrum ; vérifier le mode Kanban sur une installation appropriée et l'absence de fausses options.
- Préférences : onglets Général/Langue/Apparence, liens `#settings-language` et `#settings-appearance`, sauvegarde et avertissement de brouillon.
- Registres : deux onglets ; modification et erreur sans perte de saisie.
- Horaires : plages et déjeuner, annulation/navigations avec champs modifiés, succès et erreur.
- Jours fériés/Fermetures : conservation des imports, autorisations, modales et destinations historiques.
- Maintenance : sauvegardes et Audit ; vérifier détails avant/après, dates, ID, droits séparés et liens directs.
- FR/EN, palettes Océan/Forêt/Violet, modes clair/sombre, largeur 320 à 1440 px et zoom 200 %.
- Navigation clavier Tab / flèches / Entrée, focus après annulation, messages d'erreur.

## Reporting

Pour chaque contrôle : commande/scénario, date, environnement, résultat OK/KO/non exécuté, capture ou extrait d'erreur, anomalie Jira liée. La PR #206 doit rester brouillon jusqu'à obtention de résultats favorables et validation utilisateur.
