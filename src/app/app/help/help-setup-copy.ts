import type {HelpSetupStepId} from "@/lib/help-setup";

type Copy={title:string;purpose:string;prerequisite:string};
type LocaleCopy={
 statuses:{todo:string;in_progress:string;done:string};
 count:(done:number,total:number)=>string;
 localNotice:string;storageError:string;loading:string;start:string;finish:string;resume:string;
 guide:string;openScreen:string;prerequisite:string;notice:string;
 steps:Record<HelpSetupStepId,Copy>;
};
export const helpSetupCopy:Record<"fr"|"en",LocaleCopy>={
 fr:{
  statuses:{todo:"À faire",in_progress:"En cours",done:"Terminé (déclaré)"},
  count:(done,total)=>`${done} étapes déclarées terminées sur ${total} applicables`,
  localNotice:"Votre progression reste dans ce navigateur. Elle n'est ni transférée vers un autre ordinateur ni incluse dans les sauvegardes SMN.",
  storageError:"Impossible de sauvegarder votre progression dans ce navigateur. L'état précédent est conservé.",
  loading:"Chargement de la progression locale…",
  start:"Commencer",finish:"Marquer terminé",resume:"Reprendre",
  guide:"Lire le guide",openScreen:"Ouvrir l'écran",prerequisite:"Prérequis",notice:"Vous validez vous-même les étapes : consulter un écran ou un guide ne les termine pas.",
  steps:{
   general:{title:"Paramètres généraux",purpose:"Vérifier les préférences de SMN.",prerequisite:"Disposer des droits d'administration."},
   team:{title:"Vérifier et personnaliser l’équipe",purpose:"Adapter l’équipe existante ou, si aucune n’existe, en créer une.",prerequisite:"Avoir vérifié les paramètres généraux."},
   calendar:{title:"Préparer le calendrier",purpose:"Vérifier les jours et les absences de l’équipe.",prerequisite:"Disposer d’une équipe et avoir contrôlé les paramètres calendaires."},
   members:{title:"Vérifier les membres et affectations",purpose:"Personnaliser les profils présents et ajouter seulement les membres manquants.",prerequisite:"Disposer d’une équipe existante ou nouvellement créée."},
   cadence:{title:"Configurer les cycles",purpose:"Préparer les sprints ou les périodes Kanban.",prerequisite:"Disposer d'une équipe et de son calendrier."},
   tickets:{title:"Préparer les tickets",purpose:"Découvrir la consultation et l'import des tickets.",prerequisite:"Avoir sélectionné une équipe et un cycle."},
   reports:{title:"Consulter les rapports",purpose:"Découvrir les modèles et les rapports SMN.",prerequisite:"Disposer des données nécessaires au reporting."},
   backup:{title:"Sauvegarder les données",purpose:"Repérer les fonctions de sauvegarde et restauration.",prerequisite:"Disposer des droits nécessaires."}
  }
 },
 en:{
  statuses:{todo:"To do",in_progress:"In progress",done:"Done (self-declared)"},
  count:(done,total)=>`${done} steps marked done out of ${total} applicable`,
  localNotice:"Progress stays in this browser. It is not transferred to another computer or included in SMN backups.",
  storageError:"Unable to save your progress in this browser. The previous state has been kept.",
  loading:"Loading local progress…",
  start:"Start",finish:"Mark as done",resume:"Resume",
  guide:"Read guide",openScreen:"Open screen",prerequisite:"Prerequisite",notice:"You mark steps manually. Viewing a screen or guide never completes a step.",
  steps:{
   general:{title:"General settings",purpose:"Review SMN preferences.",prerequisite:"Administrator access."},
   team:{title:"Review and customize the team",purpose:"Adapt an existing team, or create one only when none is available.",prerequisite:"General settings have been reviewed."},
   calendar:{title:"Prepare the calendar",purpose:"Review working days and team absences.",prerequisite:"A team exists and calendar settings are available."},
   members:{title:"Review members and assignments",purpose:"Customize existing profiles and add only missing members.",prerequisite:"An existing or newly created team is available."},
   cadence:{title:"Configure cycles",purpose:"Prepare Scrum sprints or Kanban periods.",prerequisite:"A team and its calendar are available."},
   tickets:{title:"Prepare tickets",purpose:"Explore ticket imports and consultation.",prerequisite:"A team and cycle have been selected."},
   reports:{title:"View reports",purpose:"Explore SMN reporting and templates.",prerequisite:"Reporting data is available."},
   backup:{title:"Back up data",purpose:"Find backup and restore features.",prerequisite:"Appropriate access permissions."}
  }
 }
};
