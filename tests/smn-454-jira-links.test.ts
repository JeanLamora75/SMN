import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeJiraBaseUrl,jiraTicketUrl} from "../src/lib/tickets/jira-links";
const read=(file:string)=>readFileSync(file,"utf8");

test("SMN-454 : URL Jira HTTPS validée et normalisée",()=>{
 assert.equal(normalizeJiraBaseUrl("https://myteam.atlassian.net/"),"https://myteam.atlassian.net");
 assert.equal(normalizeJiraBaseUrl("https://jira.example.com/jira/"),"https://jira.example.com/jira");
 assert.equal(jiraTicketUrl("https://jira.example.com/jira","ABC-123"),
  "https://jira.example.com/jira/browse/ABC-123");
 assert.equal(jiraTicketUrl("https://myteam.atlassian.net","ABC-123"),
  "https://myteam.atlassian.net/browse/ABC-123");
});
test("SMN-454 : refus des URL non HTTPS ou contenant des paramètres dangereux",()=>{
 for(const url of ["http://example.com","javascript:alert(1)","https://a:b@example.com",
  "https://example.com?token=secret","https://example.com/#fragment",
  "https://example.com/browse","https://example.com/rest/api",
  "https://example.com:8443","https://example.com//browse"," https://example.com"]){
  assert.equal(normalizeJiraBaseUrl(url),null,url);
 }
});
test("SMN-454 : clés invalides sans lien trompeur",()=>{
 for(const key of ["","../x","ABC/123","ABC?x=1","x#frag","abc b","\nABC-1"]){
  assert.equal(jiraTicketUrl("https://example.atlassian.net",key),null,key);
 }
 assert.equal(jiraTicketUrl(null,"ABC-1"),null);
 assert.equal(jiraTicketUrl("http://example.com","ABC-1"),null);
});
test("SMN-454 : configuration persistée versionnée sans ajout à la base v33",()=>{
 const cfg=read("src/server/tickets/jira-config.ts");
 assert.match(cfg,/SMN_TICKETS_DIR/);
 assert.match(cfg,/jira-config\.json/);
 assert.match(cfg,/previous\.revision!==data\.revision/);
 assert.match(cfg,/await rename\(staging,path\.join\(dir,"jira-config\.json"\)\)/);
 assert.match(cfg,/isSymbolicLink/);
 assert.doesNotMatch(cfg,/ALTER TABLE|smn_indicator_manual_value/);
});
test("SMN-454 : API authentifiée, modification admin uniquement",()=>{
 const api=read("src/app/api/admin/tickets/jira-config/route.ts");
 assert.match(api,/authorizeApi\(request,"read"/);
 assert.match(api,/authorizeApi\(request,"write"/);
 assert.match(api,/actor\.role!=="admin"/);
 assert.match(api,/readJiraConfig/);
 assert.match(api,/writeJiraConfig/);
});
test("SMN-454 : liens sécurisés dans Consultation et Comparaison",()=>{
 for(const file of ["src/app/app/tickets/tickets-consultation.tsx",
  "src/app/app/tickets/tickets-comparison.tsx"]){
  const source=read(file);
  assert.match(source,/jiraTicketUrl\(/);
  assert.match(source,/target="_blank" rel="noopener noreferrer"/);
  assert.match(source,/tickets\.jiraTicketOpen/);
 }
 for(const file of ["src/app/api/admin/tickets/browse/route.ts",
  "src/app/api/admin/tickets/compare/route.ts"]){
  const source=read(file);
  assert.match(source,/readJiraConfig/);
  assert.match(source,/jiraBaseUrl/);
 }
});
test("SMN-454 : entrée Paramètres et chaînes FR EN",()=>{
 assert.match(read("src/lib/settings-catalog.ts"),/id:"jira"/);
 for(const lang of ["fr","en"] as const){
  const json=JSON.parse(read(`src/i18n/${lang}.json`)) as {settingsCatalog:{items:{jira:{title:string}};keywords:{jira:string}};tickets:{jiraSettingsTitle:string;jiraTicketOpen:string}};
  assert.ok(json.settingsCatalog.items.jira.title);
  assert.ok(json.settingsCatalog.keywords.jira);
  assert.ok(json.tickets.jiraSettingsTitle);
  assert.ok(json.tickets.jiraTicketOpen);
 }
});
