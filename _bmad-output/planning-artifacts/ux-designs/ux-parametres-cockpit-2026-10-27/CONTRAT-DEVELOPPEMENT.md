# Contrat de développement — Amelia

Décisions UX validées le 27/10/2026 : UX-01 onglets horizontaux, UX-02 fériés+fermetures, UX-03 maintenance sauvegardes+historique, UX-04 Cockpit compact, UX-05 pas de recherche globale, UX-06 édition des listes en modales, UX-07 sauvegarde par formulaire, UX-08 cartes indisponibles grisées « À venir ». Scope strictement UX, aucune règle métier nouvelle. Références : SMN-223 à 227 ; SMN-228 ; SMN-229 ; SMN-282 ; SMN-298 ; docs/UX-REFERENTIEL-BMAD.md.

1. Consulter le code réel sur main, le workflow .agents/skills/bmad-agent-dev/SKILL.md et les contrats UX précédents. Produire matrice exhaustive « carte actuelle → route → formulaire → droits → carte cible ». Résoudre tout conflit de contrats avant de coder.
2. Refondre le catalogue vers les 12 cartes ; cartes indisponibles grisées non actionnables ; aucune recherche globale ; conserver Cartes/Liste et droits/modes.
3. Structurer les pages en panneaux compacts et onglets horizontaux ; regrouper les contenus de fériés/fermetures et sauvegardes/audit par navigation, sans fusionner leurs permissions ou sauvegardes.
4. Uniformiser les formulaires existants, traduction FR/EN, boutons propres à chaque formulaire, modales des listes conformes à SMN-298. Corriger les libellés codés en dur sans changer les API ou la logique métier.
5. Conserver ou rediriger toutes les routes/ancres existantes, y compris liens depuis d’autres modules ; prendre en compte les modes d’équipe et permissions.
6. Tester i18n, lint, typecheck, tests, build lorsque disponibles ; relever les résultats et préparer la recette utilisateur PC. Ne pas déclarer de succès sans exécution. Aucun changement de moteur métier, schéma, rôles ou données sans approbation.

## Ordre recommandé
Lot 1 catalogue+compatibilité; lot 2 pages réunifiées; lot 3 formulaires/i18n/modales; lot 4 non-régression et recette.
