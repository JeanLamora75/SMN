import type {DashboardBlock,DashboardLayout} from "@/server/dashboard-builder/layout";
import {requireCreatableDashboardTemplate} from "./templates";

/**
 * Builds a fresh, unconfigured draft. No database writes and no business data.
 * The active team's Scrum/Kanban mode is supplied by the authorized page context.
 */
export function resetDashboardDraft(
 mode:"scrum"|"kanban",
 newId:()=>string,
):DashboardLayout{
 if(mode!=="scrum"&&mode!=="kanban")throw Error("dashboard-reset-mode-invalid");
 const block=():DashboardBlock=>{
  const template=requireCreatableDashboardTemplate("M01");
  return {
   id:newId(),templateId:template.id,templateVersion:template.version,
   slots:template.slots.map(slot=>({id:newId(),templateSlotId:slot.slotId})),
  };
 };
 return {
  schemaVersion:1,
  header:{blocks:[block(),block()]},
  rows:[
   {id:newId(),blocks:[block(),block()]},
   {id:newId(),blocks:[block(),block()]},
   {id:newId(),blocks:[block()]},
  ],
 };
}
