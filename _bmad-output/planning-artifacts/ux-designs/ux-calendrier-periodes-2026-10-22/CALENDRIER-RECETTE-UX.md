# Recette UX — Calendrier sprint/période en cartes (22/10/2026)

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
| CAL-A10 | Jour férié applicable en semaine | Carte grisée, nom férié facultatif, réunions existantes visibles, **aucun plus** | Non testé |
| CAL-A11 | Jour férié tombe aujourd'hui | Gris ET bordure visible aujourd'hui, **aucun plus** | Non testé |
| CAL-A12 | Jour ouvré tombe aujourd'hui | Contour nettement plus épais et/ou coloré, accessible au daltonisme | Non testé |
| CAL-A13 | 3 réunions commençant 15:00, 09:00 et 11:30 | Noms en ordre 09:00 → 11:30 → 15:00 | Non testé |
| CAL-A14 | Survol du nom d'une réunion | Tooltip **heure début + heure fin** dans fuseau approprié | Non testé |
| CAL-A15 | Focus clavier sur le lien réunion | Même information horaire accessible, sans cliquer ni modifier | Non testé |
| CAL-A16 | Clic/toucher sur le nom | Navigation vers **page de détail réelle** de la réunion, sans formulaire inline | Non testé |
| CAL-A17 | Clic sur + en bas d'un jour ouvré autorisé | Modale **centrée avec voile gris**, date de la carte préremplie, champs de réunion utiles | Non testé |
| CAL-A18 | Annuler modale / échec d'enregistrement | Aucun ajout ; brouillon protégé et erreur compréhensible | Non testé |
| CAL-A19 | Enregistrer la réunion valide | Modale fermée, réunion affichée dans la bonne carte au bon rang, page/scroll maintenu | Non testé |
| CAL-A20 | Utilisateur lecture seule, sprint fermé ou date interdite | Pas de commande trompeuse ; aucune écriture via API, droit serveur respecté | Non testé |
| CAL-A21 | Jour férié d'un membre mais pas d'un autre pays | Référence d'équipe explicite, aucune politique arbitraire cachée ; cas **à arbitrer** | À arbitrer |
| CAL-A22 | Données fériées manquantes | État de couverture signalé, règle de création documentée (pas d'inférence silencieuse) | À arbitrer |
| CAL-A23 | Clavier, mobile, zoom 200 %, thème sombre, FR/EN | Navigation date/réunion/+ utilisable, 7 colonnes desktop conservées ; responsive sans fonction cachée, tooltip accessible | Non testé |
| CAL-A24 | Ancien calendrier collectif / absences | Données et accès existants toujours présents ou repositionnement documenté, sans fuite de données | Non testé |

## Preuves à fournir

- Captures desktop : mois sans sprint ; sprint commençant mercredi ; jour férié ouvré et aujourd'hui ; carte à plusieurs réunions ; popup nouvelle réunion ; page de détail de réunion.
- Relevé des dates réelles de début/fin des périodes, source de l'heure locale IANA, calendrier férié appliqué et éligibilité des droits.
- Trace de l'absence de + pour week-ends et jours fériés, y compris lorsqu'une réunion existe déjà.
- Résultats des tests métier réellement exécutés (typecheck/lint/build et tests de date, tri, timezone, accès API) ; ne pas revendiquer GitHub Actions si indisponible.
- Statut par critère « Validé / Échec / Non testé / À arbitrer », lien de preuve et validation utilisateur.

**Cette grille n'est pas une preuve de tests exécutés.**