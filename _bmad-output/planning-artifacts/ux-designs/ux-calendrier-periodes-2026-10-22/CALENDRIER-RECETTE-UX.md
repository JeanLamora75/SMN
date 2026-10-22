# Recette UX — Calendrier sprint/période en cartes (22/10/2026) — jours fériés rectifiés

**Statut : SPÉCIFICATION APPROUVÉE, TESTS NON EXÉCUTÉS**. Référence : [CALENDRIER-CONTRAT-UX.md](CALENDRIER-CONTRAT-UX.md). Tous les événements et dates des scénarios sont fictifs sauf données réelles d'environnement test.

| ID | Scénario | Résultat attendu | État |
|---|---|---|---|
| CAL-A01 | Aucune période définie, mois de 31 jours | 31 cartes de dates du 1 au 31, aucun jour supprimé, dernière rangée complétée par cases vides inertes | Non testé |
| CAL-A02 | Aucune période, février d'année bissextile | 29 jours, titre mois entier, entêtes à partir du premier jour du mois | Non testé |
| CAL-A03 | Sprint en cours et un sprint futur plus récent | **Sprint en cours prioritaire** même si futur déclaré | Non testé |
| CAL-A04 | Aucune période en cours, plusieurs passées | La plus récente passée affichée ; contexte visible | Non testé |
| CAL-A05 | Seulement périodes futures | Proposition : la plus proche à venir ; règle à confirmer avant code | À arbitrer |
| CAL-A06 | Sprint commençant mercredi | Entêtes Mercredi, Jeudi, Vendredi, Samedi, Dimanche, Lundi, Mardi ; case 1 = date du mercredi | Non testé |
| CAL-A07 | Sprint traversant deux mois | Abréviation correcte du mois dans chaque carte, y compris changement d'année | Non testé |
| CAL-A08 | Plusieurs rangées | **7 cartes par rangée** desktop ; hors période = seulement placeholders non interactifs | Non testé |
| CAL-A09 | Samedi et dimanche | Cartes grisées, réunion(s) existante(s) visibles, **aucun plus** | Non testé |
| CAL-A10 | Jour férié connu du lundi au vendredi | Carte grisée comme non ouvrée, indication fériée contextualisée, réunions visibles, **+ Réunion présent** si autorisé | Non testé |
| CAL-A11 | Jour férié en semaine tombe aujourd'hui | Fond gris ET bordure renforcée, **+ Réunion présent** si autorisé | Non testé |
| CAL-A12 | Jour ouvré tombe aujourd'hui | Contour nettement plus épais et/ou coloré, accessible au daltonisme | Non testé |
| CAL-A13 | 3 réunions commençant 15:00, 09:00 et 11:30 | Noms en ordre 09:00 → 11:30 → 15:00 | Non testé |
| CAL-A14 | Survol du nom d'une réunion | Tooltip **heure début + heure fin** dans fuseau approprié | Non testé |
| CAL-A15 | Focus clavier sur le lien réunion | Même information horaire accessible, sans cliquer ni modifier | Non testé |
| CAL-A16 | Clic/toucher sur le nom | Navigation vers **page de détail réelle** de la réunion, sans formulaire inline | Non testé |
| CAL-A17 | Clic sur + en bas d'un jour ouvré autorisé | Modale **centrée avec voile gris**, date de la carte préremplie, champs de réunion utiles | Non testé |
| CAL-A18 | Annuler modale / échec d'enregistrement | Aucun ajout ; brouillon protégé et erreur compréhensible | Non testé |
| CAL-A19 | Enregistrer la réunion valide | Modale fermée, réunion affichée dans la bonne carte au bon rang, page/scroll maintenu | Non testé |
| CAL-A20 | Utilisateur lecture seule, sprint fermé ou date interdite | Pas de commande trompeuse ; aucune écriture via API, droit serveur respecté | Non testé |
| CAL-A21 | Jour férié connu pour un membre, autre membre travaillant | Carte grisée et information nuancée « férié pour certains membres » ; le **+ reste accessible en semaine** selon les permissions, avertissement non bloquant recommandé | Non testé |
| CAL-A22 | Données de jours fériés indisponibles ou partielles | Ne pas affirmer faussement « non férié » ; **ne pas bloquer + du lundi au vendredi pour cette seule raison** ; couverture inconnue identifiable | Non testé |
| CAL-A23 | Clavier, mobile, zoom 200 %, thème sombre, FR/EN | Navigation date/réunion/+ utilisable, 7 colonnes desktop conservées ; responsive sans fonction cachée, tooltip accessible | Non testé |
| CAL-A24 | Ancien calendrier collectif / absences | Données et accès existants toujours présents ou repositionnement documenté, sans fuite de données | Non testé |
| CAL-A25 | Samedi/dimanche coïncidant avec un jour férié | Carte grise et **sans +**, même si férié ; la règle week-end prime sur l'exception fériée de semaine | Non testé |
| CAL-A26 | Clic sur + d'un férié de semaine | Modale de création ouverte avec date préremplie ; information de disponibilité non bloquante, sans faux message « toute l'équipe est absente » | Non testé |
| CAL-A27 | Jour férié en semaine avec nom et une réunion | **Nom du jour férié immédiatement sous JJ MMM**, aucun grand espace entre eux ; **première réunion séparée par un espace visible** ; + présent si droit | Non testé |
| CAL-A28 | Jour ordinaire avec une réunion | **Première réunion visiblement décollée de JJ MMM**, avec un espace comparable au jour férié ; aucun libellé férié vide | Non testé |
| CAL-A29 | Plusieurs jours fériés nationaux et nom long | Libellés connus près de la date, texte complet accessible ; aucune réunion collée ou masquée, carte lisible | Non testé |
| CAL-A30 | Aujourd'hui est férié en semaine | **Bordure renforcée + fond gris + nom de la fête collé à la date + espace avant réunions + Réunion si autorisé** | Non testé |

## Preuves à fournir

- Captures desktop : mois sans sprint ; sprint commençant mercredi ; jour férié en semaine et aujourd'hui ; carte à plusieurs réunions ; popup nouvelle réunion ; page de détail de réunion. **Ajouter une comparaison côte à côte entre carte avec nom de férié et carte sans férié pour contrôler les écarts verticaux : date/fête collées, première réunion espacée.**
- Relevé des dates réelles de début/fin des périodes, source de l'heure locale IANA, calendrier férié appliqué et éligibilité des droits.
- Preuve de l'absence de + le week-end ; **preuve de présence du + un jour férié en semaine autorisé**, y compris lorsqu'une réunion existe déjà ; cas de date actuelle fériée avec bordure et +.
- Résultats des tests métier réellement exécutés (typecheck/lint/build et tests de date, tri, timezone, accès API) ; ne pas revendiquer GitHub Actions si indisponible.
- Statut par critère « Validé / Échec / Non testé / À arbitrer », lien de preuve et validation utilisateur.

**Cette grille n'est pas une preuve de tests exécutés.**