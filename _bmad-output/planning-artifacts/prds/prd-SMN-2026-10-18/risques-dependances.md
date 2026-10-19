# SMN — Exigences risques et dépendances
Statut : draft. Complément au [PRD](prd.md), section 4.14 / FR-25.

## D-PRD-121 — Registre indépendant et rattachement à plusieurs cycles (validée le 19/10/2026)

**Besoin.** Un risque ou une dépendance peut exister indépendamment d'un Sprint Scrum, d'une période Kanban ou d'un PI SAFe. Une même fiche peut être pertinente pour plusieurs cycles successifs ou concomitants, sans être dupliquée. Le registre est **commun à l'équipe** en modes Scrum et Kanban (MVP) et **à l'ART** pour les objets au niveau train en SAFe (v1.0). Les détails de partage entre équipes d'un ART restent à préciser.

### Règles et critères d'acceptation
- Le Scrum Master ou RTE peut créer une **fiche de risque ou dépendance sans aucun cycle associé**, dans le registre de l'équipe ou de l'ART concerné.
- Il peut **associer cette même fiche à un ou plusieurs cycles** pertinents, y compris successifs ; les associations portent sur l'**identifiant stable** de la fiche. La pluralité des cycles n'entraîne aucune duplication des données métier.
- **Statut, responsable, description, échéances, liens et informations métier principales** sont partagés entre toutes les vues de cette même fiche. Une modification volontaire de la fiche se répercute sur ses vues dynamiques dans les cycles associés, sans écraser les traces historiques ni les PDF précédemment générés.
- Depuis la fiche d'un cycle, le responsable peut **retrouver les risques et dépendances qui lui sont associés** et accéder à leur fiche centrale, sans devoir recréer l'objet pour chaque période.
- Il est possible **d'ajouter ou de retirer une association cycle–fiche** sans supprimer la fiche centrale, ses autres associations ni son historique. La création, la modification et le retrait d'un lien sont traçables, et les protections des cycles clôturés restent applicables lorsqu'une modification de lien affecte leurs données métier.
- Les **reportings d'un cycle** peuvent restituer les risques et dépendances qui lui sont associés, avec leurs informations pertinentes. Un PDF antérieurement produit demeure figé. Le traitement exact de la photographie des états et de l'historique de reporting reste à spécifier séparément.
- En cas de **replanification**, les associations et la fiche centrale ne sont pas modifiées implicitement ; SMN applique les protections de **D-PRD-120**, affiche les échéances potentiellement incohérentes et conserve l'historique de D-PRD-119.

### Hors périmètre de cette décision
Cette validation ne définit pas encore le détail des champs de création, les statuts du registre, les règles de priorité/criticité, le partage transverse entre équipes, la politique exacte de correction des liens historiques, ni le choix entre état courant et état à date dans les nouveaux reportings historiques. Aucun partage automatique entre installations différentes n'est prévu par cette décision.

**Périmètre :** Scrum/Kanban dans le MVP ; SAFe/ART en version 1.0. **Traçabilité :** D-PRD-120 (protection des données liées), D-PRD-118 (replanification atomique), D-PRD-119 (audit) et FR-25 du PRD principal.
