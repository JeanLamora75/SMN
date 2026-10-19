# SMN — Consolidation fonctionnelle des arbitrages finaux

**19 octobre 2026 — Validé fonctionnellement ; aucun code ni test d'implémentation attesté.**
**Sources :** [PRD](prd.md) ; [registres](registres-qualitatifs.md) ; [rapports](reportings-html-pdf.md) ; [sécurité](securite-exploitation.md) ; [architecture](../../architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md).

Les validations successives portent sur A7-01 à A7-07, A8-01 à A8-08, A10-01 à A10-08 et A11-01 à A11-09, avec les critères A7-AC01..10, A8-AC01..14, A10-AC01..16, A11-AC01..18. Elles sont suivies de la **validation corrective** d'AD-31 à **deux profils MVP**. Les références ci-dessous numérotent les nouvelles décisions **D-PRD-132 à D-PRD-136**, sans réécrire l'historique D-PRD-001 à 131 ni renuméroter AD-1 à 31. Elles prévalent sur les hypothèses et questions ouvertes antérieures portant sur ces cinq domaines.

## D-PRD-132 — A7 : criticité des risques (FR-36/39/41)

Probabilité et impact sont deux valeurs indépendantes facultatives : **Faible=1, Moyen=2, Élevé=3**. La criticité est une classification indicative (score ordinal P × I, jamais probabilité statistique) : **1–2 Faible, 3–4 Moyenne, 6–9 Élevée**.

| Probabilité \ Impact | Faible | Moyen | Élevé |
| --- | --- | --- | --- |
| Faible | Faible (1) | Faible (2) | Moyenne (3) |
| Moyen | Faible (2) | Moyenne (4) | Élevée (6) |
| Élevé | Moyenne (3) | Élevée (6) | Élevée (9) |

Matrice **fixe, non paramétrable au MVP**. Si un champ est absent : **Non évaluée**, jamais « Faible » par défaut. Texte et icône accompagnent toute couleur. Prévisualisation immédiate mais pas de sauvegarde implicite. ROAM est strictement indépendant. Le cockpit attire l'attention sur les risques **élevés non Resolved**, sans bloquer ni modifier le statut. Un risque Resolved n'émet pas d'alerte active de criticité élevée. Seuils d'échéance des actions/dépendances (3 jours par défaut) inchangés. Historique des éditions et état des clôtures Vn préservés.

## D-PRD-133 — A8 : faits marquants automatiques (FR-40/41)

Six catégories initiales fondées sur des événements **réellement enregistrés** :

| Catégorie | Événement déclencheur | Défaut MVP |
| --- | --- | --- |
| Risque critique | Création ou transition vers criticité Élevée, hors ROAM Resolved | Activée |
| Dépendance à risque | Passage explicite à « À risque » | Activée |
| Obstacle résolu | Passage à « Résolu » | Activée |
| Objectif atteint | Atteinte explicitement enregistrée | Activée |
| Décision enregistrée | Nouvelle décision Active | Activée |
| Dépendance satisfaite | Passage à « Satisfaite » | Désactivée |

Ni toutes les actions terminées, ni toutes les cérémonies, ni les simples mises à jour de métriques ne produisent des faits automatiques. Le journal unique distingue **faits manuels** et **faits automatiques**, avec identité stable de l'événement source, date d'effet et date d'enregistrement. Déclenchement à la **confirmation de l'écriture métier** : pas de fait sur aperçu ou échec. Déduplication/idempotence pour retries et multiples associations aux cycles ; une nouvelle transition réelle reste un événement distinct. Erreur corrigée : fait invalidable sans effacement de l'audit ; évolution réelle : conserver le fait historiquement exact. Les faits sont masquables/promouvables sans changer la source. Catégories activables pour les événements futurs, sans réécriture du passé. Faits éligibles proposés/présélectionnés dans les sections de rapport actives puis **validation globale du rendu**, pas de validation individuelle obligatoire ; masqués/invalidés exclus. Clôtures Vn et anciens PDF intacts ; aucune reconstruction fictive d'événements historiques.

## D-PRD-134 — A10 : archives PDF (FR-26–33, FR-68–71)

Chaque **export PDF demandé et réellement réussi** crée automatiquement une **archive privée** du PDF final exact : un aperçu HTML ne crée pas d'archive. Identifiant unique, modèle, langue, date/heure, auteur, équipe, cycle, statut, version Vn pertinente, manifeste et empreinte d'intégrité ; plusieurs PDF par cycle ou Vn sans écrasement. Bibliothèque « Rapports archivés » avec recherche/filtres et accès depuis le cycle. Aucun nettoyage automatique par ancienneté des PDF au MVP. L'Administrateur peut masquer une archive ou la supprimer exceptionnellement avec confirmation, **sans supprimer le cycle, les métriques, les clôtures ou les autres PDF**. Consultation/téléchargement par les comptes authentifiés autorisés, y compris Utilisateur lecteur des documents autorisés. Les sauvegardes couvrent PDF, métadonnées et liens ; restauration vérifiée, fichiers absents signalés. Échec/retry ne crée pas de fichier final incomplet. **Exception justifiée A11** : retirer le document contenant des données personnelles à effacer et, si pertinent, en produire un nouveau expurgé ; ne jamais réécrire silencieusement un ancien PDF.

## D-PRD-135 — A11 : données personnelles (FR-4, FR-66–71)

Distinguer **fin d'affectation** datée, **archivage réversible** d'un membre, **suppression ordinaire** seulement sans historique à préserver (règle FR-4), et **effacement/anonymisation exceptionnel** autorisé, précédé d'une analyse des impacts. Les comptes SMN sont indépendants des fiches membres Agile. Départ et archivage ne déclenchent **aucune anonymisation automatique** et ne modifient pas rétroactivement les KPI/capacités collectifs ; autres affectations et affectations futures examinées. Revue annuelle recommandée des données archivées sans purge automatique des cycles. Minimisation des e-mails, coordonnées, motifs et autres données devenues inutiles ; la pseudonymisation ne garantit pas l'anonymat si une réidentification reste possible.

Le traitement d'effacement exceptionnel porte sur fiches, associations, calendriers, historique, textes libres et **PDF/TXT conservés** lorsque pertinents, avec aperçu, confirmation Administrateur, résultats vérifiables et audit minimal sans recopier les informations effacées. Un ancien PDF conservé reste immuable ; un PDF concerné par l'effacement peut être **retiré**, avec nouvelle version expurgée distincte si justifiée. Les données collectives ne sont maintenues que lorsqu'elles peuvent licitement l'être sans identification indue. **Sauvegardes gérées par SMN : 30 jours par défaut, paramétrables** (cela ne fixe pas la rétention des PDF). La restauration doit empêcher une réintroduction silencieuse des données effacées ; copies exportées hors du contrôle de SMN explicitement signalées. La conformité juridique/RGPD, bases de conservation et exceptions nécessitent vérification sécurité/juridique avant pilote ou diffusion.

## D-PRD-136 — AD-31 correctif : matrice MVP à deux profils

L'utilisateur a **explicitement rejeté** la proposition architecturale intermédiaire à trois profils et approuvé **Administrateur et Utilisateur uniquement pour le MVP**. **Le Scrum Master est l'Administrateur de sa propre installation**. Il peut gérer les membres, leurs données individuelles, calendriers/absences/capacités, équipes, cycles, indicateurs, risques, rapports, briefs, archives, comptes, configuration, sauvegardes et effacements autorisés.

| Action | Administrateur | Utilisateur |
| --- | --- | --- |
| Connexion et consultation tableaux de bord collectifs | Oui | Oui |
| Gérer équipes/membres, calendriers et absences | Oui | Non |
| Créer, corriger, clôturer cycles et saisir les données métier | Oui | Non |
| Lire métriques et registres **collectifs** | Oui | Oui |
| Générer de nouveaux rapports PDF / briefs TXT | Oui | Non |
| Consulter et télécharger PDF/TXT **autorisés** | Oui | Oui |
| Lire les données individuelles sensibles (absences, capacités, coordonnées) | Oui | Non |
| Administrer comptes, paramètres, sauvegardes et effacements | Oui | Non |

Le formulaire d'administration crée les comptes utilisateurs dès le MVP. Authentification requise après la première installation vierge ; les membres Agile ne reçoivent pas automatiquement de compte. **Utilisateur = lecture seule**, sauf téléchargement explicite des documents autorisés. Aucun rôle séparé Opérateur/SM-RTE ou Lecteur, aucune permission par équipe ni droits renforcés personnalisables au MVP. Toutes les consultations, mutations et téléchargements doivent respecter la session, les droits et la confidentialité des données **côté serveur**. La matrice avancée pour le futur web et les différents Scrum Masters/RTE constitue une **évolution future, non développée au MVP**. Les textes historiques Winston à trois rôles sont conservés comme historique, mais **ne doivent jamais guider une Story MVP**.

## Critères d'acceptation validés

- **A7-AC01** — Probabilité et impact acceptent Faible, Moyen, Élevé ou non renseigné.
- **A7-AC02** — Neuf cases classées exactement selon la matrice.
- **A7-AC03** — L'aperçu change avant sauvegarde, sans persistance.
- **A7-AC04** — Valeur manquante = Non évaluée, jamais zéro fictif.
- **A7-AC05** — ROAM et criticité indépendants.
- **A7-AC06** — Risques élevés non Resolved dans le cockpit, sans transition automatique.
- **A7-AC07** — Resolved n'émet aucune alerte élevée active.
- **A7-AC08** — Filtres par niveau ou non-évaluation.
- **A7-AC09** — Traçabilité de chaque modification enregistrée.
- **A7-AC10** — Clôture lit Vn ; anciens PDF inchangés.

- **A8-AC01** — Six catégories disponibles avec activations par défaut.
- **A8-AC02** — Un événement source enregistré éligible produit un fait.
- **A8-AC03** — Échec/annulation = aucun fait automatique.
- **A8-AC04** — Retries et sauvegardes identiques sans doublon.
- **A8-AC05** — Une nouvelle transition réelle peut créer un nouveau fait.
- **A8-AC06** — Identifiant et provenance de l'événement source conservés.
- **A8-AC07** — Correction d'erreur invalide un fait courant sans supprimer l'audit.
- **A8-AC08** — Journal commun distingue Manuelle / Automatique.
- **A8-AC09** — Masquer/promouvoir sans modifier l'objet source.
- **A8-AC10** — Catégorie désactivée : pas de nouveaux faits, sans réécrire le passé.
- **A8-AC11** — Faits éligibles présélectionnés avec validation globale du rapport.
- **A8-AC12** — Fait masqué ou invalidé non présélectionné.
- **A8-AC13** — Dates et provenance réelles des événements historiques.
- **A8-AC14** — Reclôture Vn+1 sans écraser Vn ou anciens PDF.

- **A10-AC01** — Export PDF réussi archive automatiquement le PDF exact.
- **A10-AC02** — Aperçu HTML seul ne crée pas d'archive définitive.
- **A10-AC03** — PDF conservé sans modification.
- **A10-AC04** — Identifiant et métadonnées de provenance.
- **A10-AC05** — Plusieurs rapports/Vn d'un cycle coexistent.
- **A10-AC06** — Réouverture ou reclôture n'écrasent aucun PDF.
- **A10-AC07** — Bibliothèque avec recherche et filtres.
- **A10-AC08** — Rapports retrouvables depuis la fiche du cycle.
- **A10-AC09** — Consultation et téléchargement authentifiés/autorisés.
- **A10-AC10** — Utilisateur en lecture seule télécharge les PDF autorisés.
- **A10-AC11** — Aucune purge automatique par ancienneté.
- **A10-AC12** — Suppression administrateur confirmée sans perte des sources métier.
- **A10-AC13** — Archives et métadonnées incluses dans sauvegardes/restaurations.
- **A10-AC14** — Archive absente ou corrompue non annoncée comme téléchargeable.
- **A10-AC15** — Échecs/retries sans archives partielles ni doublons.
- **A10-AC16** — Suppression et anomalies significatives tracées.

- **A11-AC01** — Fin d'affectation, archivage, suppression ordinaire et effacement distincts.
- **A11-AC02** — Fin d'affectation conserve autres affectations.
- **A11-AC03** — Archivage réversible conserve l'historique justifié.
- **A11-AC04** — Suppression ordinaire bloquée si historique à préserver.
- **A11-AC05** — Départ ne recalcule pas arbitrairement KPI et capacités historiques.
- **A11-AC06** — Aperçu des impacts avant effacement exceptionnel.
- **A11-AC07** — Traitement des données personnelles liées, au-delà du seul nom.
- **A11-AC08** — Pseudonymisation non affirmée comme anonymisation complète.
- **A11-AC09** — Conservation des seuls agrégats réellement non identifiants et justifiés.
- **A11-AC10** — Traitement exceptionnel des données de snapshots sans falsifier l'historique.
- **A11-AC11** — PDF personnels concernés identifiés, traités sans remplacement silencieux.
- **A11-AC12** — TXT contenant des données personnelles concernées examiné.
- **A11-AC13** — Durée de sauvegarde gérée et restauration empêchant la réintroduction silencieuse.
- **A11-AC14** — Effacement exceptionnel par Administrateur avec confirmation.
- **A11-AC15** — Échec ou traitement partiel jamais qualifié de succès total.
- **A11-AC16** — Audit minimal sans reconstituer la personne effacée.
- **A11-AC17** — API/URL/documents privés non accessibles aux non-habilités.
- **A11-AC18** — Revue des membres archivés possible sans purge automatique historique.

## Tests complémentaires dérivés de la matrice AD-31

Vérifier : exactement deux choix de rôles dans la création de comptes ; Administrateur peut effectuer l'ensemble des tâches prévues ; Utilisateur peut lire les collectifs et télécharger PDF/TXT autorisés ; Utilisateur ne peut accéder aux fiches de membres, absences, calendriers individuels, capacités individuelles ni aux mutations ou à la génération ; les URL/API directes ne contournent pas les droits ; les contenus individuels structurés restent exclus des briefs IA ; le changement de rôle est sous contrôle administrateur. Ces vérifications **découlent de la matrice validée**, elles ne créent pas un nouveau profil.

## Traçabilité et réserves techniques

| Arbitrage | Exigences | Références architecturales | Périmètre |
| --- | --- | --- | --- |
| A7 | FR-25, 36, 39, 41 | Module registres ; AD-19/20 | Scrum/Kanban MVP |
| A8 | FR-35, 40, 41 | Registres, événements source, snapshots, restitution | Scrum/Kanban MVP |
| A10 | FR-26–33, 68–71 | AD-22/26/27/29 ; archives et backups | Scrum/Kanban MVP |
| A11 | FR-4, 8–14, 41, 53–54, 66–71 | AD-10/19/20/27/29 ; contrôle/effacement | dès I0 |
| AD-31 | FR-1–7, 26–33, 50–57, 66–73 | AD-8/9/26/31 | deux rôles dès I0 |

Préserver le **séquencement I0 à I6** déjà accepté, le MVP Scrum/Kanban, PostgreSQL obligatoire, la préparation de SAFe v1.0 et les décisions historiques D-PRD-001–131/AD-1–31. A5 (seuils NFR à mesurer), A9 (création historique Kanban non engagée), A12 (tests de cohérence temporelle), packaging Windows, PDF local, restauration et contrôles de sécurité restent à éprouver. Aucune performance, conformité RGPD ni readiness pilote n'est attestée par la seule rédaction.


## D-PRD-137 — Équipe unique MVP et rattachement du contexte Agile

**19 octobre 2026 — décision explicitement validée par l'utilisateur, puis mise à jour de Jira et de la documentation autorisée.**

| Règle | Scrum / Kanban — MVP | SAFe — v1.0 |
| --- | --- | --- |
| Équipes par installation | Exactement une équipe | Plusieurs équipes dans le train |
| Vision et Product Goal | Rattachés à l'équipe | Rattachés au train (ART) |
| DoD et DoR | Rattachées à l'équipe | Rattachées au train (ART), communes aux équipes |

Le produit reste unique et fixe pour la durée de l'installation. Le MVP n'expose aucun ajout de seconde équipe interne, aucune affectation multiéquipes interne et aucun écran ART. Le serveur doit refuser ces opérations même par API. Les dépendances vers des équipes externes restent permises par nom libre, sans créer d'équipe interne ni de compte. Les règles multiéquipes antérieures sont réservées à SAFe v1.0 ; elles ne constituent plus des critères MVP.

Vision et Product Goal restent distincts et facultatifs, saisissables/modifiables par l'Administrateur, avec versions datées conservées. DoD et DoR restent facultatives, sous forme de texte interne ou de lien externe ; les révisions enregistrées restent identifiables. Un historique d'URL ne garantit ni l'archivage ni l'historicité du contenu distant. Ces contenus ne changent pas le produit fixe, les KPI ou les objectifs de cycle et ne réécrivent pas les anciens PDF. L'Utilisateur n'a aucun droit de modification ; sa consultation collective autorisée conserve les protections de D-PRD-136.

**Découpage explicite :** Story 3.24 / [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) (vision/Product Goal) et Story 3.25 / [SMN-222](https://lmn24.atlassian.net/browse/SMN-222) (DoD/DoR), sous Epic 3, I1–I2 ; Story 6.9 / SMN-120 consomme ces données et leurs versions. Les contrats peuvent prévoir le propriétaire ART futur, sans implémentation SAFe au MVP.

Cet amendement complète les FR existantes (notamment FR-1/5/7/27/28/61/66/70/71) et les décisions F-26–34/F-58–63/F-116–124, sans renumérotation ni annulation de l'historique. Il prévaut sur les passages antérieurs incompatibles et clôt les ambiguïtés métier C1/C2 du contrôle de préparation, une fois la correspondance Jira vérifiée. Les réserves techniques C3/C4 et le séquencement I0–I6 demeurent. Aucun développement ni test applicatif effectué.

