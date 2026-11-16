# Membres : construisez une équipe et une capacité fiables

Un membre n'est pas simplement un nom dans une liste. **Son profil, son affectation, ses horaires, son pays et ses absences** donnent à SMN les informations nécessaires pour représenter la disponibilité de votre équipe. Quelques minutes de vérification ici évitent de tirer de mauvaises conclusions sur la capacité d'un sprint.

> **Le bon réflexe :** commencez par les membres déjà présents dans SMN. Personnalisez leurs fiches plutôt que de recréer des personnes et des affectations en double.

## 1. Retrouvez les membres de la bonne équipe

1. Ouvrez [Équipe / Membres](/app/admin/members) et vérifiez le contexte d'équipe affiché.
2. Choisissez la vue **Cartes** pour parcourir les profils, ou **Liste** pour comparer rapidement plusieurs personnes.
3. Utilisez la **recherche** par nom et les filtres **rôle**, **fonction** et **statut**, puis appliquez-les avec **Filtrer**.
4. Examinez les sections **Actifs** et **Inactifs**. Une personne qui a quitté l'équipe peut rester dans l'historique sans devoir être supprimée.
5. Cliquez sur un membre pour ouvrir sa fiche et contrôler ses données.

Le mode Cartes/Liste est une préférence d'affichage conservée dans le navigateur ; il ne modifie pas les données de l'équipe.

## 2. Complétez la fiche : chaque champ a son utilité

### Identité et fonction professionnelle

**Nom affiché** — Il permet de reconnaître la personne dans l'équipe et ses historiques. Utilisez un nom cohérent avec vos pratiques habituelles.

**Adresse e-mail** — Information de contact facultative, si elle est pertinente pour votre organisation. Elle ne remplace pas l'affectation à une équipe.

**Fonction professionnelle** — Décrit le métier ou la spécialité de la personne. Elle ne doit pas être confondue avec son **rôle Agile** : une personne peut exercer une fonction professionnelle tout en répartissant son activité entre développement, Scrum Master et Product Owner.

### Localisation : un champ décisif pour le calendrier

Depuis la fiche du membre, ouvrez **Localisation** et vérifiez les champs suivants :

- **Pays (code ISO à deux lettres)** — Sert à identifier le pays du membre, notamment pour retrouver ses jours fériés nationaux dans le calendrier.
- **Région** — Précise le contexte géographique lorsque nécessaire.
- **Ville** — Permet d'identifier le lieu de travail habituel.
- **Fuseau horaire (IANA)** — Indique la référence horaire de la personne lorsqu'elle travaille dans un autre fuseau.
- **Date d'effet** — Précise à partir de quand cette version de localisation s'applique.

**Les jours fériés sont-ils à saisir manuellement ?** Non pour les jours fériés nationaux déjà référencés par SMN : le calendrier recherche automatiquement les jours fériés correspondant au **pays enregistré dans la localisation du membre**. Le pays de l'installation ou celui d'un autre membre n'est pas utilisé à sa place.

> **Exemple :** si une équipe réunit une personne en France et une autre en Inde, chaque calendrier doit refléter les jours fériés nationaux correspondant au pays de son membre, lorsque les dates sont présentes dans le référentiel de SMN. Vérifiez donc le **pays**, et pas seulement la ville ou le fuseau horaire.

**Point de vigilance :** la couverture dépend des jours fériés présents dans le référentiel national de SMN. Ne supposez pas qu'une fête locale ou régionale soit automatiquement prise en charge. Vérifiez le calendrier lorsqu'une journée chômée particulière est importante pour la planification.

## 3. Renseignez l'affectation : qui contribue, quand et dans quel rôle ?

Ouvrez **Affectation** dans la fiche du membre. La période d'affectation définit à partir de quelle date la personne fait partie de l'équipe et, le cas échéant, jusqu'à quand. Elle est indispensable pour interpréter correctement une capacité sur un sprint passé, en cours ou futur.

### Comprendre les pourcentages

**Taux contractuel** — Représente la quotité de travail de référence du membre.

**Taux d'affectation** — Indique la part de cette activité affectée à l'équipe. Le formulaire vérifie notamment que le taux d'affectation ne dépasse pas le taux contractuel.

**Taux de contribution** — Permet de préciser la contribution retenue dans les informations de planification.

**Répartition des rôles** — Indique la part attribuée à **Scrum Master**, **Product Owner** et **Développeur**. Les trois pourcentages doivent totaliser **100 %** dans le formulaire.

**Date d'effet** — Indique quand une modification de ces valeurs prend effet. Les changements datés permettent de suivre l'évolution des responsabilités plutôt que de remplacer silencieusement l'historique.

> **Exemple pédagogique :** une personne travaille à temps partiel, n'est affectée qu'une partie de son temps à l'équipe et partage son activité entre développement et Scrum Master. Son nom seul ne permet pas d'évaluer la capacité de développement : SMN doit aussi connaître les taux, les rôles, les dates et le calendrier de travail.

### Arrivée, départ et historique

1. Vérifiez la **date de début d'affectation**.
2. Si la personne quitte l'équipe, renseignez la **date de fin** et, si utile, la raison.
3. Pour un changement de responsabilités, créez une **nouvelle version datée** plutôt que de modifier sans raison une ancienne situation.
4. Utilisez la correction d'une révision historique uniquement lorsque vous devez rectifier une erreur passée.

Un membre sorti de l'équipe peut rester consultable dans l'historique. **Fin d'affectation** et **suppression de la personne** ne sont pas synonymes.

## 4. Définissez les jours et demi-journées travaillés

Ouvrez **Calendrier** depuis la fiche du membre, puis **Modifier le calendrier de travail**.

Vous trouverez une grille du lundi au dimanche, avec deux cases pour chaque jour :

- **Matin travaillé** — Cochez si la personne travaille habituellement le matin.
- **Après-midi travaillé** — Cochez si elle travaille habituellement l'après-midi.
- **Date d'effet** — Indique à partir de quelle date cette semaine type doit être utilisée.

**Pourquoi des demi-journées ?** Elles permettent notamment de représenter un mercredi après-midi non travaillé ou une organisation à temps partiel, au lieu de considérer automatiquement chaque jour comme entièrement disponible.

Si aucune semaine de travail n'a encore été enregistrée, SMN peut présenter une **semaine suggérée**, du lundi au vendredi avec les deux demi-journées travaillées. **Une suggestion n'est pas une configuration validée** : adaptez-la et enregistrez-la pour refléter la réalité de la personne.

> **Conseil de planification :** ne copiez pas les horaires d'un membre sur tous les autres sans vérification. Deux développeurs à taux contractuel identique peuvent avoir des calendriers différents.

## 5. Enregistrez les absences et les exceptions

Depuis la fiche, consultez le calendrier et les informations d'absence. Une absence se renseigne avec ses **dates**, ses **demi-journées de début et de fin**, une **catégorie**, un **motif** et son caractère **prévu ou imprévu**, selon le formulaire proposé.

Les exceptions de calendrier servent à décrire des journées qui ne suivent pas la semaine habituelle. Les jours fériés nationaux référencés sont recherchés automatiquement grâce au pays : il n'est pas nécessaire de créer une absence manuelle pour chaque fête nationale connue de SMN.

Vérifiez qu'une absence n'est pas saisie deux fois et qu'elle concerne une période pendant laquelle la personne appartient bien à l'équipe. Les corrections historiques doivent être réalisées avec attention, surtout si elles touchent un sprint déjà clôturé.

## 6. Le lien essentiel : comment ces informations contribuent à la capacité

La capacité de l'équipe ne correspond pas au simple **nombre de membres multiplié par les jours du sprint**. Pour obtenir un résultat exploitable, il faut tenir compte de plusieurs informations complémentaires :

1. **Période d'affectation** — Le membre fait-il partie de l'équipe pendant les dates concernées ?
2. **Contrat, allocation et contribution** — Quelle part de son activité doit être considérée ?
3. **Rôles Agile** — Quelle part est associée au développement, au Scrum Master ou au Product Owner ?
4. **Calendrier personnel** — Quelles journées ou demi-journées sont réellement travaillées ?
5. **Localisation et jours fériés** — Quels jours fériés nationaux correspondent à son pays ?
6. **Absences et exceptions** — Quelles indisponibilités ou modifications ponctuelles réduisent ou modifient le temps disponible ?

Ces éléments alimentent les informations de disponibilité, de jours travaillés et de capacité utilisées par SMN. Le résultat exact dépend de l'indicateur choisi et de sa définition : une **capacité totale en J/H** et une **capacité de développement** n'ont pas nécessairement le même périmètre.

> **Exemple :** un sprint comporte dix jours habituellement travaillés. Une personne n'est affectée qu'à partir de la deuxième semaine, une autre ne travaille pas le mercredi après-midi et une troisième a un jour férié dans son pays. Compter simplement trois personnes sur dix jours surestimerait la disponibilité. C'est précisément pour éviter cette erreur que les fiches et les calendriers doivent être renseignés avec soin.

## 7. Que vérifier lorsqu'une capacité paraît anormale ?

- **Capacité trop élevée :** recherchez une affectation prolongée à tort, une semaine type entièrement cochée malgré un temps partiel, ou une absence manquante.
- **Capacité trop faible :** vérifiez les dates d'affectation, les demi-journées décochées, les taux et les absences enregistrées.
- **Jour férié absent :** contrôlez le code pays du membre et l'existence de cette date dans le référentiel national.
- **Jour férié d'un autre pays :** ouvrez **Localisation** et corrigez le pays du membre ; ne modifiez pas le pays global pour résoudre un problème individuel.
- **Données anciennes incohérentes :** contrôlez les versions datées et les périodes historiques. Des indicateurs de sprints clôturés peuvent nécessiter une nouvelle clôture après correction, selon la fonction concernée.

## Votre vérification finale

Avant de considérer la fiche comme prête, posez-vous ces questions : **le membre est-il affecté aux bonnes dates ? Ses taux et ses rôles correspondent-ils à la réalité ? Sa semaine de travail est-elle correcte ? Son pays et ses jours fériés sont-ils cohérents ? Ses absences ont-elles été contrôlées ?**

Si ces points sont vérifiés, vous disposez d'une base bien plus fiable pour préparer vos sprints, lire les jours travaillés et analyser la capacité de l'équipe.
