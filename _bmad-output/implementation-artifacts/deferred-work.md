# BMAD — Travail reporté hors périmètre de SMN-11

- source_spec: `_bmad-output/implementation-artifacts/spec-smn-11-demarrage-local-prerequis.md`
  summary: "Réévaluer le déclenchement automatique du rendu de skills BMAD après modification du framework (V18)."
  evidence: "L'activation officielle initiale était volontairement ponctuelle et a été exécutée avec succès. Le workflow d'activation ne suit que son propre fichier et pas les mises à jour de render_skill.py ; l'ajout de déclencheurs concerne la maintenance du moteur BMAD et non la sûreté du diagnostic SMN-11. Revoir si les skills/scripts de rendu sont modifiés à l'avenir."


- source_spec: `_bmad-output/implementation-artifacts/spec-smn-11-demarrage-local-prerequis.md`
  summary: "SMN-12 doit reconnaître uniquement les migrations réelles de son installateur, et refuser toute fausse installation initialisée."
  evidence: "La deuxième revue démontre qu'une table de migrations simulée et une migration arbitraire pouvaient être déclarées valides. SMN-11 échoue désormais en mode fermé avec installation-incomplete tant que le manifeste officiel Prisma (structure, noms et empreintes) n'est pas défini. Critère bloquant pour l'installation réelle SMN-12."
- source_spec: `_bmad-output/implementation-artifacts/spec-smn-11-demarrage-local-prerequis.md`
  summary: "Renforcer les tests de privilèges PostgreSQL, de réseau local, de concurrence et de gestion des processus après retour terrain."
  evidence: "R2 Verification Gap constate l'absence de tests SQL négatifs USAGE/SELECT sur PostgreSQL réel, de preuve OS du seul bind loopback et de test concurrent. Les routes métiers demeurent fermées et les tests actuels sont valides pour le parcours initial ; travaux planifiés pour l'intégration et l'exploitation."
- source_spec: `_bmad-output/implementation-artifacts/spec-smn-11-demarrage-local-prerequis.md`
  summary: "Qualifier le PostgreSQL réel sous Windows standard, puis compléter l'arrêt des serveurs et les limites de délais."
  evidence: "La CI Windows passe avec PostgreSQL désactivé et l'utilisateur a validé le démarrage visuel sur son poste. L'installateur SMN-12 apportera les premiers essais réels avec droits limités, contrôles de création et absence de modification des autres bases."
