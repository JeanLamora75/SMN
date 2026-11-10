// Pure policy shared by maintenance preflight and Node regression tests.
// A signed application-only ZIP never authorizes implicit database migrations.
export function evaluateDatabaseUpdatePolicy(evidence,requires){
 if(!requires||requires.nodeMajor!==24||requires.postgresMajor!==18||
    requires.schemaVersion!==33)
  throw Error("update-database-requirements-unsupported");
 if(evidence?.diagnostic!=="initialized")throw Error("update-database-diagnostic-failed");
 if(evidence?.postgresMajor!==18)throw Error("update-postgres-version-incompatible");
 if(evidence?.schemaVersion!==33)throw Error("update-schema-version-incompatible");
 if(evidence?.indicatorV33Valid!==true)throw Error("update-indicator-schema-invalid");
 if(!Array.isArray(evidence.migrations)||evidence.migrations.length===0)
  throw Error("update-migration-history-ambiguous");
 const names=new Set();
 for(const item of evidence.migrations){
  if(!item||typeof item.name!=="string"||!item.name||
    names.has(item.name)||item.finished!==true||item.rolledBack!==false||
    typeof item.checksum!=="string"||!/^[0-9a-f]{64}$/.test(item.checksum))
   throw Error("update-migration-history-ambiguous");
  names.add(item.name);
 }
 // No DDL runs in this path. Any future schema upgrade needs a separate,
 // ordered, checksum-pinned migration catalogue and an explicit maintenance action.
 return Object.freeze({action:"noop",schemaVersion:33,postgresMajor:18,
  migrationCount:names.size});
}
