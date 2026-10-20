import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { passwordHash, verifyPassword } from "../src/server/auth/password";
import { validRecoveryPhrase, validNewPassword, renewPassword, prepareRecoveryPhrase } from "../src/server/auth/recovery";
import { RECOVERY_MIGRATION_SQL } from "../src/server/accounts/recovery-migration";
import type { Account } from "../src/server/auth/credentials";
import type { Client } from "pg";

const validAccount=async():Promise<Account>=>({
  id:"admin_test",username:"admin",email:"admin@example.test",role:"admin",is_active:true,
  must_change_password:false,password_hash:await passwordHash("SecretActuel2026"),
});
function fakeDb(hash:string) {
  const calls:{sql:string;args:unknown[]}[]=[];
  const client={
    query:async(sql:string,args:unknown[]=[])=>{
      calls.push({sql,args});
      if(sql.includes("SELECT password_hash FROM public.smn_account")) return {rowCount:1,rows:[{password_hash:hash}]};
      return {rowCount:1,rows:[]};
    },
  } as unknown as Client;
  return {client,calls};
}
describe("SMN-17 — sécurité du renouvellement et de la récupération locale",()=>{
  it("refuse phrases courtes, espaces de bord, lignes et valeurs non textuelles",()=>{
    for(const value of ["trop court"," ".repeat(21), "phrase assez longue\nligne", "phrase assez longue\rligne",null,42]) {
      assert.equal(validRecoveryPhrase(value),false);
    }
    assert.equal(validRecoveryPhrase("Phrase secours longue 2026 !"),true);
    assert.equal(validNewPassword("1234"),true);
    assert.equal(validNewPassword("abc"),false);
  });
  it("dérive une valeur salée, sans plaintext ni déterminisme",async()=>{
    const one=await passwordHash("Phrase secours longue 2026 !");
    const two=await passwordHash("Phrase secours longue 2026 !");
    assert.notEqual(one,two);
    assert.equal(await verifyPassword("Phrase secours longue 2026 !",one),true);
    assert.equal(await verifyPassword("mauvais",one),false);
    assert.equal(one.includes("Phrase secours"),false);
  });
  it("refuse le renouvellement sans preuve ou si le nouveau secret est identique",async()=>{
    const account=await validAccount();
    const fake=fakeDb(account.password_hash);
    assert.equal(await renewPassword(fake.client,account,"erroné","NouveauSecret2026"),false);
    assert.equal(await renewPassword(fake.client,account,"SecretActuel2026","SecretActuel2026"),false);
    assert.equal(fake.calls.length,0,"Un refus ne commence pas de transaction et n'écrit rien");
  });
  it("renouvelle atomiquement, invalide la phrase antérieure et écrit une trace sans secret",async()=>{
    const account=await validAccount();
    const fake=fakeDb(account.password_hash);
    assert.equal(await renewPassword(fake.client,account,"SecretActuel2026","NouveauSecret2026"),true);
    const queries=fake.calls.map(x=>x.sql).join("\n");
    assert.match(queries,/BEGIN/);
    assert.match(queries,/DELETE FROM public.smn_recovery_phrase/);
    assert.match(queries,/password_changed/);
    assert.match(queries,/COMMIT/);
    assert.equal(queries.includes("NouveauSecret2026"),false);
    const updated=fake.calls.find(x=>x.sql.includes("UPDATE public.smn_account"));
    assert.ok(updated);
    assert.equal(await verifyPassword("NouveauSecret2026",updated.args[0] as string),true);
  });
  it("ne prépare une phrase que pour un admin avec son mot de passe actuel",async()=>{
    const account=await validAccount();
    const fake=fakeDb(account.password_hash);
    const phrase="Phrase de secours indépendante 2026 !";
    assert.equal(await prepareRecoveryPhrase(fake.client,{...account,role:"user"},"SecretActuel2026",phrase),false);
    assert.equal(await prepareRecoveryPhrase(fake.client,account,"incorrect",phrase),false);
    assert.equal(fake.calls.length,0);
    assert.equal(await prepareRecoveryPhrase(fake.client,account,"SecretActuel2026",phrase),true);
    const row=fake.calls.find(x=>x.sql.includes("INSERT INTO public.smn_recovery_phrase"));
    assert.ok(row);
    assert.equal(await verifyPassword(phrase,row.args[1] as string),true);
    assert.equal(fake.calls.some(x=>x.sql.includes("recovery_prepared")),true);
  });
  it("refuse une rotation concurrente après verrouillage, sans écrire de trace",async()=>{
    const account=await validAccount();
    const fake=fakeDb("scrypt:1:"+"f".repeat(32)+":"+"f".repeat(128));
    assert.equal(await renewPassword(fake.client,account,"SecretActuel2026","NouveauSecret2026"),false);
    assert.equal(fake.calls.some(x=>x.sql.includes("ROLLBACK")),true);
    assert.equal(fake.calls.some(x=>x.sql.includes("UPDATE public.smn_account")),false);
  });
  it("migration additive sans suppression des comptes ni modification d'installation étrangère",()=>{
    assert.match(RECOVERY_MIGRATION_SQL,/CREATE TABLE public.smn_recovery_phrase/);
    assert.match(RECOVERY_MIGRATION_SQL,/CREATE TABLE public.smn_auth_audit/);
    assert.match(RECOVERY_MIGRATION_SQL,/schema_version=3 WHERE id='singleton' AND schema_version=2/);
    assert.doesNotMatch(RECOVERY_MIGRATION_SQL,/DROP TABLE|DELETE FROM public.smn_account/i);
  });
});
