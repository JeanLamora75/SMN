# Epic 9 — état de finalisation technique (25/10/2026)

## Références
- Jira : SMN-179 à SMN-199 (ordre réel des stories du backlog).
- GitHub : `main`.
- Périmètre : briefs TXT Scrum/Kanban, réponses IA manuelles, analyses humaines, journaux, insertion explicite dans rapports HTML/PDF.

## Réalisé dans cette passe
- SMN-199 : sélection volontaire des analyses dans les rapports **Kanban**, API administrateur, stockage des choix, projection dans la référence figée et affichage HTML servant à l'export PDF. Une sélection vide n'inclut rien.
- SMN-199 : correction de l'API Scrum de sélection afin d'utiliser une connexion autorisant l'écriture (la précédente connexion ouvrait `BEGIN READ ONLY`).
- SMN-185 : suppression côté serveur des textes libres automatiques `objectives`, `risks`, `dependencies`, `decisions` avant transmission au composant de brief ; ces champs peuvent contenir des noms ou informations personnelles non vérifiées.
- Ajout de tests ciblés SMN-199 Kanban.

## Traçabilité et limites
- Aucune analyse n'est transmise automatiquement à un prestataire IA.
- Le contrôle de confidentialité des textes saisis volontairement exige toujours une revue humaine explicite.
- Le stockage des références figées précède le rendu PDF et ne reconstruit pas les anciens documents.
- Le volet Scrum/Kanban de SMN-199 est codé, mais les tests PostgreSQL, compilation TypeScript et génération Chrome/PDF n'ont **pas** été exécutés dans cette session.
- Les tests existants des Stories SMN-179 à SMN-199 nécessitent une exécution complète, dont les cas anonymes, Utilisateur lecture seule, conflits et doublons.

## Critères de clôture de l'Epic
1. Sur poste de développement : `pnpm typecheck`, `pnpm build`, tous les `tests/smn-18*-*.test.ts` et `tests/smn-19*-*.test.ts` disponibles.
2. Parcours Scrum et Kanban : aperçu TXT, revue confidentialité, finalisation, téléchargement vérifié, duplication, analyse humaine, réponse IA, journal.
3. Rapport HTML puis PDF pour les deux modes : sélection explicite, attribution origine IA/humaine, retouche manuelle et immutabilité de l'ancien PDF après suppression.
4. Test d'accès direct API pour compte non autorisé et contrôle des fichiers privées.
5. Mise à jour des statuts Jira et clôture Epic uniquement après réception des résultats d'exécution et recette, sans transformer une validation de spécification en test réussi.

**Statut : implémentation avancée ; clôture de recette non attestée.**
