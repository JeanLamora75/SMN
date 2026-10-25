# SMN-256 — Bibliothèque des modèles (incrément non validé)

## Réalisé
- Réutilisation de la table historique `smn_report_template` et du modèle système Standard via `listReportTemplates`.
- Dans l'onglet Modèles du Centre : cartes, aperçu **structurel** des rubriques et du nombre de métriques, duplication administrative par API historique.
- Modèles système en lecture seule ; le serveur refuse update/delete du Standard.
- Les comptes `user` ne voient pas la commande Dupliquer ; le POST historique reste protégé par `authorizeApi(write, settings)`.
- Suppression physique des modèles personnalisés déjà interdite dans `manageReportTemplate` : préservation des références d'archives.
- Libellés FR/EN ajoutés au JSON.

## Écarts Jira
- AC1 : prévu par protections existantes et duplication, non testé.
- AC2 : les modèles existants ne possèdent pas les champs langue, charte, partage, droits et blocs éditoriaux détaillés. Ne pas inventer de données ; migration/UX et contrat de permission nécessaires. Administration de ces champs NON réalisée.
- AC3 : protection backend existante, non testée en intégration.
- AC4 : suppression non prise en charge, sans rupture de référence. Communication des impacts à compléter dans l'UI.
- AC5 : modèles métier réutilisés sans duplication automatique.

## Risques
- Dépendances cumulées sur SMN-254 et SMN-255 (branches non fusionnées).
- L'aperçu est structurel, non le document A4 attendu à terme.
- Aucune traduction de noms de sections existants n'est forcée par le composant ; restituer les libellés métier avec le moteur i18n après validation du vocabulaire.
- Absence de tests d'exécution, de typecheck, de build et de base locale. GitHub Actions désactivées.

## État
Implémentation partielle. Ne pas fusionner sur main ni passer Jira Done sans recette et décision sur AC2.
