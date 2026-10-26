import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {annualDisplayStatus,currentParisYear,normalizeCountrySearch} from "../src/lib/countries/year-status";

describe("Catalogue annuel des pays",()=>{
 it("une couverture historique configurée sans attestation devient À vérifier",()=>{
  assert.equal(annualDisplayStatus({year:2026,status:"configured",count:11,diagnostic:null}),"review");
  assert.equal(annualDisplayStatus({year:2026,status:"partial",count:2,diagnostic:null}),"review");
 });
 it("la confirmation exige une attestation administrative vérifiée",()=>{
  assert.equal(annualDisplayStatus({year:2026,status:"configured",count:11,diagnostic:null,administrativeValidated:true}),"configured");
 });
 it("une année vide n'est pas configurée, une absence de ligne est inconnue",()=>{
  assert.equal(annualDisplayStatus({year:2026,status:"not-configured",count:0,diagnostic:null}),"not-configured");
  assert.equal(annualDisplayStatus(undefined),"unknown");
  assert.equal(annualDisplayStatus({year:2026,status:"configured",count:0,diagnostic:null}),"unknown");
 });
 it("les anomalies et compteurs incohérents sont explicites",()=>{
  assert.equal(annualDisplayStatus({year:2026,status:"invalid",count:3,diagnostic:"bad-file"}),"invalid");
  assert.equal(annualDisplayStatus({year:2026,status:"configured",count:-1,diagnostic:null}),"unknown");
 });
 it("recherche insensible aux accents, espaces et à la casse",()=>{
  assert.equal(normalizeCountrySearch("  ÉSPAGNE  "),"espagne");
  assert.equal(normalizeCountrySearch("FR"),"fr");
 });
 it("le millésime par défaut suit Europe/Paris",()=>{
  assert.equal(currentParisYear(new Date("2026-12-31T23:30:00Z")),2027);
  assert.equal(currentParisYear(new Date("2026-01-01T00:00:00Z")),2026);
 });
});
