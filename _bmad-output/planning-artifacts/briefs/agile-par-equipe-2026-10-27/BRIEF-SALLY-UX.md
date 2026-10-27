# Brief d'intervention — Sally, UX Designer BMAD v6.12.4

**Epic Jira :** [SMN-287](https://lmn24.atlassian.net/browse/SMN-287)
**Références :** [BRIEF-PRODUIT.md](./BRIEF-PRODUIT.md), `docs/UX-REFERENTIEL-BMAD.md`, [SMN-282](https://lmn24.atlassian.net/browse/SMN-282), contrats Cockpit Agile validés.
**Statut :** commande UX publiée ; **pas une maquette ni un DESIGN/EXPERIENCE validé par Sally**.

## Mission
Concevoir uniquement les adaptations visuelles et de parcours de la gestion Scrum/Kanban par équipe, sans réinventer les écrans existants.

### Écrans à traiter
1. **Paramètres > Équipes :** création et édition : mode Scrum/Kanban obligatoire à la création, sans sélection initiale. Afficher le mode existant en édition. Si premier cycle déjà créé, champ verrouillé, explication de la règle et aide non trompeuse.
2. **Liste des équipes :** badge Scrum/Kanban, état Active/Archivée, actions contextuelles Archiver/Réactiver réservées à l'admin, erreurs et confirmation accessible. Les équipes archivées demeurent consultables dans l'administration.
3. **En-tête global :** sélecteur filtré sur équipes actives autorisées, badge mode proche de l'équipe active, choix du cycle correspondant. Une équipe sans cycle reste une sélection valide.
4. **Navigation :** Sprints (Scrum) / Périodes (Kanban). Rester sur la même rubrique au changement d'équipe si pertinente ; sinon Tableau de bord. Les détails propres à l'ancienne équipe sont remplacés par une destination sûre.
5. **Cockpit Agile :** KPI et cérémonies réellement applicables au mode ; états « absent », « non renseigné », « indisponible » distincts des erreurs. Aucun contenu fictif.
6. **Protection des brouillons :** reprendre les dialogues et choix déjà spécifiés en SMN-282 lors du changement d'équipe.

### Contraintes
- Conserver le design Cockpit Agile, responsive 320/375/390/768/1024/1440, zoom 200 %, navigation clavier, focus et FR/EN.
- Ne pas refaire la fiche membre V2, le calendrier ou le Studio Rapports au-delà des modifications contextuelles nécessaires.
- Préserver toutes les permissions et les droits de l'acteur ; le masquage visuel ne suffit jamais à autoriser/refuser côté serveur.
- Éviter toute maquette donnant l'impression qu'un rapport Kanban complet non implémenté est déjà disponible.

## À arbitrer en une fois
**Recommandations à faire valider, non acquises :** (a) mode de consultation d'une équipe archivée par un administrateur, (b) refus des écritures opérationnelles sur équipe archivée, (c) dernière équipe active non archivable. Les 24 décisions D-AGILE sont déjà validées et ne nécessitent pas de nouvel atelier.

## Livrables UX attendus après intervention réelle de Sally
- `DESIGN.md` : tokens/règles de présentation, modales et responsive.
- `EXPERIENCE.md` : parcours, états, erreurs, confirmations et accessibilité.
- `MAQUETTES-REFERENCE.md` (ou visuels accessibles/archivables).
- `RECETTE-UX.md` et contrat de transmission à Amelia.
- Vérification des liens entre maquettes, nouveaux critères Jira et `docs/UX-REFERENTIEL-BMAD.md`.

**Ne pas coder ; ne pas annoncer les contrats UX comme validés sans arbitrages et vérifications.**
