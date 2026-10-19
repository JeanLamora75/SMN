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
- Les **reportings d'un cycle** peuvent restituer les risques et dépendances qui lui sont associés, avec leurs informations pertinentes. Un PDF antérieurement produit demeure figé. Les états historiques des risques et dépendances à la clôture sont régis par **D-PRD-122** ci-dessous ; les détails de réouverture/reclôture restent à spécifier.
- En cas de **replanification**, les associations et la fiche centrale ne sont pas modifiées implicitement ; SMN applique les protections de **D-PRD-120**, affiche les échéances potentiellement incohérentes et conserve l'historique de D-PRD-119.

### Hors périmètre de cette décision
Cette validation ne définit pas encore le détail des champs de création, les statuts du registre, les règles de priorité/criticité, le partage transverse entre équipes, la politique exacte de correction des liens historiques, ni les modalités fines de snapshot lors d'une réouverture/reclôture ou d'une reprise rétrospective. Aucun partage automatique entre installations différentes n'est prévu par cette décision.

**Périmètre :** Scrum/Kanban dans le MVP ; SAFe/ART en version 1.0. **Traçabilité :** D-PRD-120 (protection des données liées), D-PRD-118 (replanification atomique), D-PRD-119 (audit) et FR-25 du PRD principal.

## D-PRD-122 — Instantané des risques et dépendances à la clôture (validée le 19/10/2026)

**Objectif :** un bilan historique de Sprint, période Kanban ou PI restitue l'état des risques et dépendances **tel qu'il était à la clôture de ce cycle**, même si leur fiche centrale évolue par la suite.

### Critères d'acceptation
- **À la clôture effective de chaque cycle**, SMN enregistre automatiquement un **instantané horodaté** des risques et dépendances **associés à ce cycle à cet instant**, comprenant leurs identités, liens au cycle, descriptions, statuts, responsables, échéances et autres informations utilisées dans les bilans.
- Pour un **cycle non clôturé**, le bilan utilise les **données courantes du registre**, sans simuler d'instantané figé.
- Pour un **cycle clôturé**, le bilan historique et les nouveaux reportings portant sur ce cycle utilisent son **instantané de clôture**, et non les valeurs actuelles de la fiche centrale. Les reportings peuvent permettre un accès explicite à la fiche actuelle, mais ne doivent pas faire passer son statut présent pour son ancien statut.
- Une modification ultérieure de la **fiche centrale unique** (D-PRD-121) ne modifie pas les instantanés des clôtures passées. Les nouveaux cycles continuent de voir l'état courant de cette fiche tant qu'ils ne sont pas clôturés.
- Les **PDF et reportings déjà générés** restent inchangés. Une correction historique volontaire suit les protections de clôture, de réouverture et de traçabilité existantes : **aucune réécriture silencieuse** de l'instantané.
- **Scrum/Kanban au MVP** ; **SAFe/ART en v1.0**, avec le même principe pour les PI et les objets associés, sans préjuger du détail du schéma SAFe.

**Précision métier D-PRD-130/A3 :** chaque clôture crée **V1/V2/V3…** de l'instantané, **sans écraser les versions antérieures**. Une réouverture conserve V1 et consulte l'état courant tant que le cycle est non clôturé ; après reclôture, le nouveau bilan lit la dernière version, V1 restant accessible et les PDF existants figés. Une reprise historique ne peut attribuer à la date ancienne un statut actuel non prouvé. **[Règles et scénarios approuvés](clarifications-d-prd-130.md)**.

**Restent à préciser en conception :** stockage technique/versionnement, vues de comparaison des versions, traitement des données historiques authentifiées mais incomplètes et modalités des corrections volontaires, sous réserve des règles déjà actées.

**Références :** FR-25, FR-41, D-PRD-130/A3, D-PRD-120 (conservation à la replanification), D-PRD-121 (fiche centrale multi-cycles), F-91/F-93/F-96 (clôture et corrections), D-PRD-077/D-PRD-078 (tendances sur cycles clôturés).
