# SMN-298 — Grille de recette locale des modales Cockpit Agile
Statut : préparée, NON EXÉCUTÉE | Tests à effectuer sur le PC Windows 11 du commanditaire | Base : PR #205.
## Préconditions
- Ouvrir SMN avec la branche de la PR #205 ; sauvegarder les données utilisées pendant la recette.
- Vérifier le démarrage via le flux local du projet, sans s'appuyer sur GitHub Actions.
- Utiliser les langues FR puis EN et les thèmes réellement proposés dans Paramètres (au minimum clair et sombre).
- Pour chaque scénario : relever **OK / KO / Non testé**, capture, URL, navigateur, langue, thème, erreurs console utiles. Ne pas confondre publication avec validation.
## Matrice minimale des fenêtres
| Fenêtre | Parcours | Contrôles |
|---|---|---|
| Calendrier : réunion | ouvrir puis éditer horaires; annuler; sauvegarder | bannière, contenu scrollable, bouton fermer accessible, DST/fuseaux et validations inchangés |
| Registres : créer risque | ouvrir, renseigner champs, annuler, enregistrer | formulaire long, ROAM, calculs de criticité, autorisation, messages, fermeture |
| Registres : éditer une fiche/section | ouvrir depuis titre/crayon, modifier, annuler | fenêtre native, sauvegardes séparées, perte de modifications protégée, relations conservées |
| Équipe : informations générales | ouvrir, éditer nom/produit/vision/but | en-tête Cockpit, validation champs, sauvegarde et rafraîchissement |
| Sprint : renommer et replanifier | modifier nom puis dates | contrôle impact, aperçu, confirmation, dates verrouillées selon statut |
| Membre : identité | pays, fuseau, fonction et e-mail | listes lisibles et FR/EN, codes API non exposés, données sauvegardées |
| Membre : affectation | corriger historiques et répartition rôles | avertissements FR/EN, confirmation, pas de régression capacité/historisation |
| Membre : calendrier et exception | planning hebdo, date effet, exception | pied Annuler/Enregistrer, table accessible et scroll, protections |
| Membre : absence | créer / corriger une absence | catégories lisibles, règles des dates et messages |
| Membre : cycle de vie | consulter, archiver/réactiver si permis | protections des actions sensibles : aucune suppression non désirée |
## Scénarios transversaux AC
1. Thèmes : surfaces/texte/champs/bordures/boutons visibles en clair, sombre et autres palettes configurées ; pas d'en-tête aux couleurs codées en dur.
2. Écrans : desktop large, tablette, mobile étroit ; pas de débordement horizontal ; clavier mobile ne masque pas complètement l'action.
3. Accessibilité : Tab/Shift+Tab, Échap, premier focus, retour du focus au déclencheur, titre de dialogue lu, erreurs avec role="alert".
4. Validation : obligatoire absent, dates invalides, conflit de révision, erreur réseau simulée par arrêt du service si possible ; conserver saisie et afficher retour traduit.
5. I18n : aucune étiquette FR en mode EN, ni codes backend dans messages, options de pays, statut, fuseau, niveau de risque ; dates locales.
6. Autorisations : lecture seule pour données verrouillées, les actions interdites ne doivent pas pouvoir passer via API.
7. Protection des brouillons : Annuler, X, Échap, clic arrière-plan, changement de page ; refus de sortie si saisie modifiée selon règles existantes.
8. Consistance : ordre des actions, espaces, taille des champs et absence de régression d'enregistrement pour chaque formulaire.
## Contrôles techniques à exécuter sur PC (selon scripts disponibles)
- `pnpm i18n:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Vérifier les noms de scripts avec `pnpm run` avant exécution ; consigner précisément les commandes indisponibles.
## Critères de clôture
L'ensemble de l'inventaire doit être couvert ou les exceptions explicitement acceptées. Les défauts bloquants doivent être corrigés et la recette signée par l'utilisateur. Aucun résultat n'est présumé positif.
