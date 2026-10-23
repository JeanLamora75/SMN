# Recette UX — Refonte de Sprints

**Décisions approuvées le 23/10/2026. Aucun test exécuté.** Statut initial : Non testé. Contrats : [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md).

| ID | Résultat vérifiable | Statut |
|---|---|---|
| S01 | Page /app/admin/sprints : uniquement en-tête, filtres, liste et CTA ; aucun empilement d'éditeurs en permanence | Non testé |
| S02 | Pleine largeur du contenu après sidebar, sans plafond à 900px ; desktop 1880px testé | Non testé |
| S03 | Tous les sprints de l'équipe sont accessibles, y compris anciens/terminés/clôturés ; pagination si nécessaire | Non testé |
| S04 | Sprint en cours en tête et repérable par label et accent visuel ; aucun sprint en cours -> tri par début décroissant | Non testé |
| S05 | Recherche nom retrouve sprint ancien ; accentuations et accents traités conformément à recherche existante | Non testé |
| S06 | Filtre état Tous/À venir/En cours/Terminé/Clôturé fonctionne ; suspension non dissimulée | Non testé |
| S07 | Tri par dates décroissantes/ascendantes modifie la liste sans changer données ; choix explicite prime sur défaut | Non testé |
| S08 | Liste vide et filtre sans résultat : état compréhensible, CTA de génération uniquement si droit | Non testé |
| S09 | Une ligne comprend nom, période début/fin, état, actions Calendrier et ⋯ ; pas de 5 boutons visibles | Non testé |
| S10 | Nom du sprint sans faux lien avant fiche réelle ; après création de fiche, lien vers bon identifiant | Non testé |
| S11 | Ouverture menu ⋯ via souris/clavier ; fermeture et focus accessibles | Non testé |
| S12 | Sprint futur : renommer sans altérer dates/événements ; avertissement doublons et traçabilité | Non testé |
| S13 | Replanifier : ID prérempli, contrôle d'impact/prévisualisation avant sauvegarde, règles d'historique préservées | Non testé |
| S14 | Suppression seulement pour sprint jamais démarré, conséquences/confirmation, refus serveur pour autre état | Non testé |
| S15 | Sprint en cours/terminé/clôturé : actions proposées respectent état réel, permissions serveur et règles de réouverture | Non testé |
| S16 | Changement effectué met à jour la ligne et conserve recherche/filtre/tri sans double création | Non testé |
| S17 | Générer : CTA unique ouvre parcours 1 Configuration/2 Prévisualisation/3 Confirmation | Non testé |
| S18 | Assistant : générer un seul sprint avec dates calculées et nom proposé modifiable | Non testé |
| S19 | Assistant : générer lot 1 à 6, visualiser tous les intervalles et collisions, enregistrement groupé | Non testé |
| S20 | Options cérémonies appliquent modèles enregistrés sans réécrire anciens sprints | Non testé |
| S21 | Reprise historique : choix de génération cérémonies explicite, désactivé par défaut, aucune réunion prétendue tenue | Non testé |
| S22 | Fermer assistant sans validation n'écrit rien ; brouillons protégés ; erreur conserve contexte | Non testé |
| S23 | Accès Paramètres > Jours ouvrés aux horaires de travail et pause déjeuner, sans activer modification injustifiée des jours de semaine | Non testé |
| S24 | Accès Paramètres > Cérémonies et modèles aux modèles réutilisables ; occurrences ne sont pas confondues avec modèles | Non testé |
| S25 | Modification d'un paramètre général ne change pas les dates/horaires/capacités historiques | Non testé |
| S26 | Accès Calendrier d'un sprint ciblé : 7 cartes/jour selon contrat ; ID de sprint conservé, pas autre période | Non testé |
| S27 | Réunions et cérémonies consultables/modifiables via écran approprié, sans perte par retrait des formulaires Sprints | Non testé |
| S28 | Bilan/Review/Clôture existants demeurent accessibles ; pas de lien factice vers future fiche | Non testé |
| S29 | Les favoris/anciennes URLs utiles ne sont pas cassés, sans transfert dangereux de permissions | Non testé |
| S30 | Utilisateurs lecture seule et accès API direct refusés en mutation ; aucune donnée sensible divulguée | Non testé |
| S31 | FR/EN JSON, thème clair/sombre, palettes et zoom 200% ; labels et focus a11y | Non testé |
| S32 | Mobile/tablette : colonnes/actions accessibles, scroll maîtrisé, pas de bouton hors viewport | Non testé |
| S33 | Mode Kanban : aucune liste de Sprint Scrum ou cérémonie générée de façon artificielle | Non testé |
| S34 | Fiche Sprint future (Story différée) : bandeau objectif, onglets et données contextualisées ; lien nom uniquement après disponibilité | Non testé |

## Preuves attendues

Captures avant/après à largeur desktop, tablette et mobile ; liste de sprint contenant les cinq états, recherche/tri ; modales et assistant de génération ; Paramètres Jours ouvrés/Cérémonies ; Calendrier préfiltré ; parcours bilan ; refus d'action et erreurs ; FR/EN, contrastes, focus. Indiquer test, contexte, résultat et preuve pour chaque ID. Le scénario S34 est **différé** et ne bloque pas la recette de la liste tant que la fiche est hors du lot courant.

Aucune compilation, aucun test d'intégration ni recette utilisateur n'ont été effectués par la rédaction de ce document.
