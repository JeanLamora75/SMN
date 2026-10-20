import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Client } from "pg";
import { readCollectiveDashboard } from "../src/server/dashboard/read";

function db(rows: {product_id:string;product:string;team_id:string;team:string;mode:string}[]): Client {
  return { query: async (sql:string) => {
    assert.match(sql, /public\.smn_installation/);
    assert.match(sql, /public\.smn_product/);
    assert.match(sql, /public\.smn_team/);
    assert.doesNotMatch(sql, /smn_account|password_hash|username|email|member|absence/i);
    return { rows };
  }} as unknown as Client;
}

describe("SMN-21 — lecture collective du tableau de bord", () => {
  it("restitue le contexte réel Scrum sans inventer de cycles, indicateurs, alertes ni réunions", async () => {
    const value = await readCollectiveDashboard(db([
      { product_id:"product",product: "Produit pilote",team_id:"team",team: "Équipe Alpha", mode: "scrum" },
    ]));
    assert.deepEqual(value.context, { productId: "product", product: "Produit pilote", teamId: "team", team: "Équipe Alpha", mode: "scrum" });
    assert.equal(value.currentCycle, null);
    for (const field of ["pendingCycles","objectives","metrics","events","attention"] as const)
      assert.deepEqual(value[field], []);
    assert.doesNotMatch(JSON.stringify(value), /"admin"|"password_hash"|"email"/);
  });
  it("respecte le mode Kanban sans convertir la période absente en Sprint", async () => {
    const value=await readCollectiveDashboard(db([
      { product_id:"product",product: "Flux service",team_id:"team",team: "Équipe Ops", mode: "kanban" },
    ]));
    assert.equal(value.context.mode, "kanban");
    assert.equal(value.currentCycle, null);
  });
  it("refuse un contexte absent, multiple ou de mode inconnu", async () => {
    for (const rows of [[], [
      {product_id:"product",product:"A",team_id:"team",team:"A",mode:"scrum"}, {product_id:"product",product:"B",team_id:"team",team:"B",mode:"scrum"},
    ], [{product_id:"product",product:"A",team_id:"team",team:"A",mode:"safe"}]]) {
      await assert.rejects(() => readCollectiveDashboard(db(rows)),/dashboard-context-unavailable/);
    }
  });
});
