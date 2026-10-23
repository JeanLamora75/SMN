import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {
  metricAvailable,metricNotRecorded,metricUnavailable,
  collectionAvailable,collectionUnavailable,
  type CollectiveCycleProjection
} from "../src/lib/dashboard-data-contract";

describe("SMN-21 — contrat de projection collective (étape 0)",()=>{
  it("distingue un zéro explicitement mesuré d'une absence et d'une erreur",()=>{
    const zero=metricAvailable(0,{quality:"known",source:"manual"});
    assert.equal(zero.state,"available");
    if(zero.state==="available"){
      assert.equal(zero.value,0);
      assert.equal(zero.source,"manual");
    }
    assert.deepEqual(metricNotRecorded(),{state:"not-recorded"});
    assert.deepEqual(metricUnavailable("producer-not-ready"),
      {state:"unavailable",reason:"producer-not-ready"});
  });

  it("conserve les informations de qualité et de clôture lorsqu'elles existent",()=>{
    const value=metricAvailable(42.5,{
      quality:"estimated",source:"closure-snapshot",
      snapshotVersion:2,updatedAt:"2026-10-23T12:00:00Z"
    });
    assert.deepEqual(value,{
      state:"available",value:42.5,quality:"estimated",
      source:"closure-snapshot",snapshotVersion:2,updatedAt:"2026-10-23T12:00:00Z"
    });
  });

  it("refuse les valeurs fabriquées et les versions invalides",()=>{
    assert.throws(()=>metricAvailable(NaN,{quality:"known",source:"calculated"}),
      /dashboard-invalid-metric/);
    assert.throws(()=>metricAvailable(Infinity,{quality:"known",source:"calculated"}),
      /dashboard-invalid-metric/);
    assert.throws(()=>metricAvailable(1,{quality:"known",source:"closure-snapshot",
      snapshotVersion:0}),/dashboard-invalid-snapshot-version/);
  });

  it("distingue une liste réellement vide d'un registre indisponible",()=>{
    assert.deepEqual(collectionAvailable([],0,{source:"manual"}),{
      state:"available",items:[],total:0,source:"manual",snapshotVersion:null
    });
    assert.deepEqual(collectionUnavailable("schema-missing"),{
      state:"unavailable",reason:"schema-missing"
    });
    assert.throws(()=>collectionAvailable(["une fiche"],0,{source:"manual"}),
      /dashboard-invalid-collection-total/);
  });

  it("décrit séparément chaque famille de métriques du cycle sans valeur implicite",()=>{
    const noData=metricNotRecorded();
    const missing=collectionUnavailable("producer-not-ready");
    const result:CollectiveCycleProjection={
      teamId:"team",cycleId:"sprint",cycleStatus:"active",snapshotVersion:null,
      goals:missing,
      capacity:{initialJh:noData,actualJh:noData},
      storyPoints:{initial:noData,done:noData},
      tickets:{initial:noData,done:noData},
      workingDaysRemaining:noData,
      events:missing,obstacles:missing,risks:missing,notesAndAlerts:missing
    };
    assert.equal(result.cycleId,"sprint");
    assert.equal(result.tickets.initial.state,"not-recorded");
    assert.equal(result.events.state,"unavailable");
  });
});
