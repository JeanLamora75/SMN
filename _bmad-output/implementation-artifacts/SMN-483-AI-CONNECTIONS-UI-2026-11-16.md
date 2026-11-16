# SMN-483 — Paramètres > Intelligence artificielle (Amelia)

Date : 16 novembre 2026. Epic SMN-479. Reprise de l'architecture de Winston et du parcours UX Sally.

## Livré dans cet incrément
- Entrée **Intelligence artificielle** dans le catalogue canonique Paramètres, visible uniquement pour l'administrateur.
- Écran plein format Cockpit Agile via `SettingsPageShell`, filtres distincts, liste dans un bloc séparé et bouton Ajouter en en-tête du contenu ; actions icônes, confirmations et modales avec gestion du focus/Échap.
- Création de plusieurs connexions y compris pour un même fournisseur, modification du nom/fournisseur/modèle, suppression, désactivation et retrait/remplacement de clé API via l'API admin existante.
- Saisie de clé masquée, jamais restituée au navigateur après enregistrement. État local contrôlable par une route spécifique qui déchiffre brièvement côté serveur et efface le tampon ; **ce n'est pas un appel API externe**.
- Sélecteur alimenté exclusivement par `freeCatalog.qualified`. Comme l'allowlist SMN-482 est vide faute d'essai réel, le sélecteur et le test distant sont désactivés avec explication, sans promesse trompeuse.
- Traductions FR/EN distinctes pour ne pas alourdir les fichiers historiques ; chargement par le catalogue existant et clés typées extensibles à d'autres langues.

## Contraintes et limites
- Sans la qualification SMN-482 et la passerelle SMN-484, aucun test distant de connexion ne peut être honnêtement déclaré réussi. L'action affiche un état indisponible, et la vérification de clé locale est explicitement différente.
- Pour un enregistrement modifiant les métadonnées d'une connexion qui détient une clé, la clé doit être ressaisie : les secrets SMN-481 sont liés par AAD à l'ID, au fournisseur et à la révision. Ce parcours évite d'effacer la clé sans prévenir. Une optimisation pour renommer sans ressaisie nécessitera une migration sûre du chiffrement.
- Les métadonnées importées d'un autre PC pourront afficher « clé à renseigner » via le contrôle du coffre ; la réconciliation permanente et le transfert ZIP complet restent prévus SMN-487.
- Les modèles gratuits ne sont jamais activés implicitement et les réponses ne sont jamais archivées automatiquement.
- Les tests de contrat valident accès, i18n, masquage, modales et absence d'appel fournisseur depuis la route de vérification locale. Tests comportementaux réels Chromium et validation sur PostgreSQL/Windows restent soumis à la CI.

## Sécurité et recette
- Rôles admin et origin same-host via `authorizeApi`. Aucun secret dans JSON GET, logs, stockage Web ni valeur de clé préremplie.
- Contrôle de révision au changement, modales de suppression avec confirmation, erreurs et états dans la langue active.
- Vérification de la CI sur le même commit ; ne clôturer Jira qu'après preuves techniques, UX et test API externe lorsque la dépendance sera disponible.
