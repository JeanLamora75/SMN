import type {Client} from "pg";
import type {AbsenceState,AbsenceSlot} from "./absence";
import {requireTeamMemberScope} from "./team-scope";
import type {TeamActor} from "@/server/teams/resolve";

type Row={id:string;member_id:string;revision:number;category_id:string;
 category_name:string;category_color:string;start_on:string;end_on:string;
 start_slot:AbsenceSlot;end_slot:AbsenceSlot;is_planned:boolean;reason:string;
 created_at:string;updated_at:string;deleted:boolean};

/** La clause d'affectation filtre avant projection : aucune lecture globale des absences. */
export async function readScopedTeamAbsences(db:Client,actor:TeamActor,
 memberId:string,teamId:string):Promise<AbsenceState>{
 const scope=await requireTeamMemberScope(db,actor,memberId,teamId);
 const member=await db.query<{archived:boolean}>(`
  SELECT archived_at IS NOT NULL AS archived FROM public.smn_member
  WHERE id=$1 AND installation_id='singleton'`,[memberId]);
 if(member.rows.length!==1)throw new Error("member-not-found");
 const [cats,items]=await Promise.all([
  db.query<{id:string;name:string;color:string;is_active:boolean}>(`
   SELECT id,name,color,is_active FROM public.smn_absence_category ORDER BY name,id`),
  db.query<Row>(`
   SELECT a.id,a.member_id,a.revision,a.category_id,c.name AS category_name,
    c.color AS category_color,a.start_on::text AS start_on,a.end_on::text AS end_on,
    a.start_slot,a.end_slot,a.is_planned,a.reason,a.created_at::text AS created_at,
    a.updated_at::text AS updated_at,
    EXISTS(SELECT 1 FROM public.smn_member_absence_history h
     WHERE h.absence_id=a.id AND h.revision=a.revision
      AND h.after_values->>'deleted'='true') AS deleted
   FROM public.smn_member_absence a
   JOIN public.smn_absence_category c ON c.id=a.category_id
   WHERE a.member_id=$1
    AND EXISTS(SELECT 1 FROM public.smn_member_assignment own
     WHERE own.member_id=a.member_id AND own.team_id=$2
      AND own.start_on<=a.start_on
      AND (own.end_on IS NULL OR own.end_on>=a.end_on))
    AND NOT EXISTS(SELECT 1 FROM public.smn_member_assignment other
     JOIN public.smn_team t ON t.id=other.team_id
     WHERE other.member_id=a.member_id AND other.team_id<>$2
      AND t.installation_id='singleton'
      AND other.start_on<=a.end_on
      AND (other.end_on IS NULL OR other.end_on>=a.start_on))
   ORDER BY a.start_on DESC,a.id LIMIT 501`,[memberId,scope.teamId])
 ]);
 if(items.rows.length>500)throw new Error("member-absence-history-limit");
 return {memberId,archived:member.rows[0].archived,
  categories:cats.rows.map(x=>({id:x.id,name:x.name,color:x.color,isActive:x.is_active})),
  absences:items.rows.map(x=>({id:x.id,memberId:x.member_id,revision:x.revision,
   categoryId:x.category_id,categoryName:x.category_name,categoryColor:x.category_color,
   startOn:x.start_on,endOn:x.end_on,startSlot:x.start_slot,endSlot:x.end_slot,
   isPlanned:x.is_planned,reason:x.reason,createdAt:x.created_at,
   updatedAt:x.updated_at,deleted:x.deleted})),
  selectedDate:null,onDate:[]};
}
