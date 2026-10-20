import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {dashboardReturnPath,safeDashboardReturn,teamDetailPath,requestedHistoricalContext} from "../src/lib/context-navigation";
import {readTeamDetail} from "../src/server/dashboard/team-detail";
import {canAccess} from "../src/server/access-policy";
import {validRecordId} from "../src/server/dashboard/read";
import {translate} from "../src/i18n/catalog";

const row={product_id:"product",product:"Produit pilote",team_id:"team",team:"Équipe Alpha",mode:"scrum"};
const db=(rows:typeof row[]):Client=>({
  query:async (query:string,params:unknown[])=>{
    assert.match(query,/^SELECT\s+p\.id AS product_id/i);
    assert.match(query,/public\.smn_team/);
    assert.match(query,/t\.installation_id='singleton'/);
    assert.match(query,/t\.id=\$1/);
    assert.match(query,/i\.state='initialized'/);
    assert.doesNotMatch(query,/\bINSERT\b|\bUPDATE\b|\bDELETE\b|smn_account|password_hash/i);
    assert.deepEqual(params,["team"]);
    return {rows};
  }
}) as unknown as Client;

describe("SMN-23 — navigation contextuelle et lecture collective",()=>{
  it("lit la fiche par identifiant stable et contrôle l'installation en SQL paramétré",async()=>{
    assert.deepEqual(await readTeamDetail(db([row]),"team"),{
      productId:"product",product:"Produit pilote",teamId:"team",team:"Équipe Alpha",mode:"scrum",
    });
  });
  it("ne retourne aucune fiche pour un identifiant incorrect, absent ou ambigu",async()=>{
    for(const id of ["", "../admin", "team?id=x", "team/other"," ".repeat(80),"🇫🇷"]){
      assert.equal(validRecordId(id),false);
      assert.equal(await readTeamDetail(db([row]),id),null);
    }
    assert.equal(await readTeamDetail(db([]),"team"),null);
    assert.equal(await readTeamDetail(db([row,row]),"team"),null);
    assert.equal(await readTeamDetail(db([{...row,team_id:"other"}]),"team"),null);
    assert.equal(await readTeamDetail(db([{...row,mode:"safe"}]),"team"),null);
  });
  it("conserve équipe, filtre, cycle et version sans perdre la vue de départ",()=>{
    const source=dashboardReturnPath({
      teamId:"spoofed",filter:"blocked",cycleId:"cycle-2026-12",
      version:"4",asOf:"2026-10-20",unexpected:"value"
    },"team");
    assert.equal(source,"/app?teamId=team&cycleId=cycle-2026-12&filter=blocked&version=4&asOf=2026-10-20");
    const detail=teamDetailPath("team",source);
    const parsed=new URL(detail,"http://smn.local");
    assert.equal(parsed.pathname,"/app/team/team");
    const back=safeDashboardReturn(parsed.searchParams.get("returnTo"),"team");
    assert.equal(back,source);
    assert.equal(requestedHistoricalContext(back),true);
    assert.equal(requestedHistoricalContext(dashboardReturnPath({}, "team")),false);
  });
  it("refuse toute redirection externe, autre chemin ou URL falsifiée",()=>{
    for(const input of [
      "https://evil.example/app?teamId=team","//evil.example/app?teamId=team",
      "/app/../admin?teamId=team","/app/admin/users?teamId=team",
      "/app?teamId=other","/app?teamId=team&filter=x&filter=y",
      "/app?teamId=team&returnTo=https://evil.example",
      "/app?teamId=team#secret","/app?teamId=team&asOf=2026-02-30",
      "javascript:alert(1)","/app?teamId=team&filter="+("a".repeat(2000))
    ]){
      assert.equal(safeDashboardReturn(input,"team"),"/app",input);
    }
    assert.equal(safeDashboardReturn(["/app?teamId=team"],"team"),"/app");
    assert.equal(safeDashboardReturn(null,"team"),"/app");
  });
  it("ignore les filtres inconnus, valeurs non bornées et fausses dates",()=>{
    assert.equal(dashboardReturnPath({
      cycleId:"bad!",filter:"<script>",version:"0",asOf:"2026-02-30"
    },"team"),"/app?teamId=team");
    assert.equal(dashboardReturnPath({}, "invalid/id"),"/app");
    assert.throws(()=>teamDetailPath("../other","/app"),/team-id-invalid/);
  });
  it("n'élargit pas les droits serveur et ne donne pas accès aux fiches individuelles",()=>{
    const valid={is_active:true,must_change_password:false} as const;
    for(const role of ["admin","user"] as const)
      assert.equal(canAccess({...valid,role},"read",{type:"collective",exists:true,inScope:true}),true);
    assert.equal(canAccess({...valid,role:"user"},"write",{type:"collective",exists:true,inScope:true}),false);
    assert.equal(canAccess({...valid,role:"user"},"read",{type:"individual",exists:true,inScope:true}),false);
    assert.equal(canAccess({...valid,role:"user"},"read",{type:"collective",exists:true,inScope:false}),false);
    assert.equal(canAccess(null,"read",{type:"collective",exists:true,inScope:true}),false);
  });
  it("différencie état actuel, historique et ressource manquante en FR/EN",()=>{
    for(const lang of ["fr","en"] as const)for(const key of
      ["detail.currentHeading","detail.currentLabel","detail.historicalNotice","detail.missingTitle","detail.back"] as const){
      assert.ok(translate(lang,key));
      assert.doesNotMatch(translate(lang,key),/translation unavailable|traduction indisponible/i);
    }
  });
});
