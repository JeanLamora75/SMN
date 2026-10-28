import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("la capacité conserve la période Sprint en dépendances primitives et annule le GET périmé",()=>{
 const text=source("src/app/app/admin/development-capacity/development-capacity-view.tsx");
 assert.match(text,/const initialStart=initialPeriod\?\.start;/);
 assert.match(text,/const initialEnd=initialPeriod\?\.end;/);
 assert.match(text,/if\(!initialStart\|\|!initialEnd\|\|start!==initialStart\|\|end!==initialEnd\)return;/);
 assert.match(text,/\},\[start,end,initialStart,initialEnd,t\]\);/);
 assert.match(text,/return\(\)=>controller\.abort\(\);/);
});

test("le rafraîchissement de rapport dépend du message localisé, pas du callback traduit recréé",()=>{
 const text=source("src/app/app/reports/report-data-refresh.tsx");
 assert.match(text,/const failedMessage=tr\("failed"\);/);
 assert.match(text,/setError\(failedMessage\)/);
 assert.match(text,/\[url,failedMessage\]\);/);
 assert.match(text,/return \(\)=>ctrl\.abort\(\);/);
});

test("l'autosauvegarde du studio conserve sa temporisation sans dépendre de la fonction instable",()=>{
 const text=source("src/app/app/reports/report-studio.tsx");
 assert.match(text,/import \{useEffect,useEffectEvent,useMemo,useRef,useState\} from "react"/);
 assert.match(text,/const autoSave=useEffectEvent\(\(\)=>\{void save\(\);\}\);/);
 assert.match(text,/const timer=setTimeout\(\(\)=>\{\s*autoSave\(\);\s*\},650\)/);
 assert.match(text,/return \(\)=>clearTimeout\(timer\);\},\[content,saved,saving,error,readOnly\]\);/);
 assert.match(text,/changeVersion\.current!==sendingVersion/);
 assert.match(text,/sessionId:sessionId\.current,sequence:\+\+sequence\.current,/);
 assert.match(text,/\bcontent\}\)\}/);
});
