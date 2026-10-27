# SMN-296 — Indicateurs Sprint : isolation des capacités

Le lecteur des indicateurs vérifie désormais l'appartenance du Sprint à l'équipe avant la lecture des snapshots historiques ou clôturés. Les calculs réels et prévisionnels reçoivent le teamId. Le chemin d'écriture monoéquipe est explicitement bloqué à partir du schéma v28.

Le teamId transmis au service n'est pas une autorisation : les appelants doivent contrôler la session et l'équipe active. Aucun test, compilation ou migration effectué. SMN-296 reste en cours.
