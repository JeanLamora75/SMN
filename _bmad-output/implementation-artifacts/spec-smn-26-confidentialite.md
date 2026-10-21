# SMN-26 — Story 1.18 : confidentialité du socle

Références : Jira SMN-26, FR-66, FR-67, FR-58, D-PRD-136, SEC-02, AD-6/10/23/26/31, UX-DR02/04/09.

Décision I0 : le tableau de bord, la fiche d'équipe et le contrat de brief collectif partagent une projection explicite de cinq attributs. Aucun attribut individuel n'est admis et les données libres ne sont pas ajoutées avant une revue dans les Epics métier.

La nouvelle lecture de documents privés vérifie la session, le périmètre d'équipe, la permission enregistrée dans un manifeste côté serveur, l'intégrité et le format du contenu. Sans stockage configuré, aucun téléchargement n'est possible. Aucun document n'est généré dans I0.

Les refus d'accès ne permettent pas de distinguer un ID absent d'un ID hors du périmètre. Aucun contenu, nom de chemin privé ou donnée brute sensible n'est consigné dans les diagnostics.

Traçabilité et limitations : [documentation SMN-26](../../docs/CONFIDENTIALITE-SMN-26.md). Tests unitaires et assertions HTTP rédigés ; leur exécution en CI et sur Windows reste nécessaire. Pas de clôture Jira sans recette.
