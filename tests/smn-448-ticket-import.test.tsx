import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {LocaleProvider} from "../src/i18n/client";
import TicketsImportDialog from "../src/app/app/tickets/tickets-import-dialog";
import {validateTicketCsv,TICKET_CSV_COLUMNS} from "../src/lib/ticket-csv-contract";
import type {TicketScope} from "../src/server/tickets/snapshot-storage";
import {translate} from "../src/i18n/catalog";

const scope:TicketScope={teamId:"team_1",cycleId:"sprint_1",mode:"scrum"};
const columns=TICKET_CSV_COLUMNS.join(",");
const content=columns+"\nXYZ-22,Task,Titre libre,Critique,Terminé,3\n";
const src=(path:string)=>readFileSync(path,"utf8");

test("La prévalidation accepte la date métier historique et les statuts libres sans persistance",()=>{
 const result=validateTicketCsv(content);
 assert.equal(result.valid,true);
 assert.equal(result.rows[0].status,"Terminé");
 assert.equal(result.rows[0].storyPoints,"3");
 const api=src("src/app/api/admin/tickets/validate/route.ts");
 assert.match(api,/authorizeApi\(request,"write"/);
 assert.match(api,/validateTicketCsv\(/);
 assert.doesNotMatch(api,/saveTicketSnapshot|INSERT INTO|UPDATE public/);
});

test("Les erreurs CSV comportent leur ligne et leur colonne, sans écrire les fichiers",()=>{
 const malformed=validateTicketCsv(columns+"\nXYZ-22,Task,Titre libre,Critique,Done");
 assert.equal(malformed.valid,false);
 assert.ok(malformed.errors.some(e=>e.line===2&&e.column==="CSV"&&e.code==="column-count"));
 const duplicated=validateTicketCsv(content+"XYZ-22,Bug,Duplicate,Low,Done,1\n");
 assert.equal(duplicated.valid,false);
 assert.ok(duplicated.errors.some(e=>e.code==="duplicate-jira-id"&&e.line===3));
});

test("La modale d'import utilise les composants natifs Cockpit Agile, en FR et EN",()=>{
 for(const language of ["fr","en"] as const){
  const html=renderToStaticMarkup(
   <LocaleProvider locale={language}>
    <TicketsImportDialog scope={scope} cycleName="Sprint 3" onClose={()=>{}} onSaved={()=>{}}/>
   </LocaleProvider>);
  assert.match(html,/smn-cockpit-modal smn-tickets-dialog smn-tickets-import-dialog/);
  assert.match(html,/smn-cockpit-modal-header/);
  assert.match(html,/smn-cockpit-modal-body/);
  assert.match(html,/smn-cockpit-modal-footer/);
  assert.match(html,/type="file"/);
  assert.match(html,/type="date"/);
  assert.match(html,/Sprint 3/);
  assert.match(html,new RegExp(language==="fr"?"Importer une photographie CSV":"Import a CSV snapshot"));
 }
});

test("Les messages critiques de confirmation et d'erreur sont traduits en FR/EN",()=>{
 const keys=[
  "tickets.importDialogTitle","tickets.importDateHelp","tickets.importInvalid",
  "tickets.importReplaceTitle","tickets.importReplaceDescription",
  "tickets.importReplaceConfirm","tickets.importConflictChanged",
  "tickets.importErrorCodes.duplicateJiraId",
 ] as const;
 for(const key of keys)
  for(const locale of ["fr","en"] as const){
   const text=translate(locale,key);
   assert.ok(text.trim());
   assert.doesNotMatch(text,/traduction indisponible|translation unavailable/i);
  }
});

test("L'import interdit l'écrasement silencieux et gère la concurrence",()=>{
 const client=src("src/app/app/tickets/tickets-import-dialog.tsx");
 assert.match(client,/setStage\("confirm"\)/);
 assert.match(client,/expectedSnapshotId:expected/);
 assert.match(client,/listCurrent\(controller\.signal\)/);
 assert.match(client,/importReplaceConfirm/);
 assert.match(client,/snapshot\.snapshotId/);
 const storage=src("src/server/tickets/snapshot-storage.ts");
 assert.match(storage,/confirmation-required/);
 assert.match(storage,/expectedSnapshotId/);
 assert.match(storage,/await rename\(next,path\.join\(dir,"current\.json"\)\)/);
});

test("Seul l'admin dispose du bouton d'import et les futures actions restent désactivées",()=>{
 const client=src("src/app/app/tickets/tickets-files.tsx");
 assert.match(client,/role==="admin"&&<button/);
 assert.match(client,/setImportOpen\(true\)/);
 assert.match(client,/onSaved=\{snapshotId=>/);
 assert.match(client,/setVersion\(value=>value\+1\)/);
 assert.match(client,/smn-tickets-hero-actions/);
});

test("La modale affiche les six en-têtes CSV exacts du contrat, en FR et EN",()=>{
 assert.equal(TICKET_CSV_COLUMNS.length,6);
 for(const language of ["fr","en"] as const){
  const html=renderToStaticMarkup(<LocaleProvider locale={language}>
   <TicketsImportDialog scope={scope} cycleName="Sprint 3" onClose={()=>{}} onSaved={()=>{}}/>
  </LocaleProvider>);
  assert.match(html,/<details class="smn-tickets-import-columns">/);
  assert.doesNotMatch(html,/<details class="smn-tickets-import-columns" open/);
  assert.match(html,/<summary id="smn-tickets-import-columns-title">/);
  assert.match(html,/<ol>/);
  for(const column of TICKET_CSV_COLUMNS)
   assert.ok(html.includes("<code>"+column+"</code>"),"Colonne attendue : "+column);
  assert.match(html,language==="fr"?/Colonnes obligatoires du fichier CSV/:/Required CSV column headers/);
  assert.match(html,language==="fr"?/Leur ordre est libre/:/They can appear in any order/);
 }
});

test("Les fichiers CSV UTF-8 et Windows-1252 conservent les accents",()=>{
 const {decodeTicketCsvBytes}=require("../src/lib/ticket-csv-encoding") as typeof import("../src/lib/ticket-csv-encoding");
 const csv=columns+"\nSMN-46,Story,Capacité de développement et jours fériés,Medium,Terminé,2\n";
 const utf8=decodeTicketCsvBytes(new TextEncoder().encode(csv));
 assert.equal(utf8.encoding,"utf-8");
 assert.equal(validateTicketCsv(utf8.text).rows[0].title,"Capacité de développement et jours fériés");
 const windows1252=Uint8Array.from([...csv].map(char=>{
  const code=char.charCodeAt(0);
  assert.ok(code<=255,"Fixture uniquement compatible avec Windows-1252");
  return code;
 }));
 const decoded=decodeTicketCsvBytes(windows1252);
 assert.equal(decoded.encoding,"windows-1252");
 const parsed=validateTicketCsv(decoded.text);
 assert.equal(parsed.valid,true);
 assert.equal(parsed.rows[0].title,"Capacité de développement et jours fériés");
 assert.equal(parsed.rows[0].status,"Terminé");
 assert.doesNotMatch(decoded.text,/\uFFFD/);
});
