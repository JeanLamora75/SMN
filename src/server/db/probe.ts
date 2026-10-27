// Adaptateur PostgreSQL directement testable (sans side effect server-only de Next).
import { Client } from "pg";
import type { Snapshot } from "../installation/diagnostic";
import { INSTALLATION_RELATIONS } from "../installation/contract";

// Chaque diagnostic lit un instantané cohérent, sans aucune écriture.
export async function probePostgres(uri: string): Promise<Snapshot> {
  const client = new Client({
    connectionString: uri,
    connectionTimeoutMillis: 2500,
    query_timeout: 2500,
    statement_timeout: 2500,
    application_name: "smn-diagnostic",
  });
  let transaction = false;
  try {
    await client.connect();
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    transaction = true;
    const version = await client.query<{ version: string }>(
      "SELECT current_setting('server_version_num') AS version",
    );
    const rights = await client.query<{ can_use: boolean; can_create: boolean }>(
      "SELECT has_schema_privilege(current_user, 'public', 'USAGE') AS can_use, has_schema_privilege(current_user, 'public', 'CREATE') AS can_create",
    );
    const schemaUsage = rights.rows[0]?.can_use === true;
    const schemaCreate = rights.rows[0]?.can_create === true;
    const serverVersion = Number(version.rows[0]?.version);
    if (!schemaUsage) {
      return { schemaUsage: false, schemaCreate, serverVersion, tables: [] };
    }
    // Inclure aussi les vues, séquences, tables étrangères, schémas privés,
    // fonctions et types utilisateur ; pas seulement les tables de public.
    const objects = await client.query<{ name: string }>(`
      SELECT n.nspname || '.' || c.relname || ':' || c.relkind::text AS name
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
        AND n.nspname NOT LIKE 'pg_temp%'
        AND c.relkind IN ('r','p','v','m','S','f','c')
      UNION ALL
      SELECT n.nspname || '.<schema>' AS name
      FROM pg_catalog.pg_namespace n
      WHERE n.nspname NOT IN ('public', 'pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_%'
      UNION ALL
      SELECT n.nspname || '.' || p.proname || ':function' AS name
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      UNION ALL
      SELECT n.nspname || '.' || t.typname || ':type' AS name
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype IN ('d','e','r','m')
    `);
    const tables = objects.rows.map((row) => row.name);
    const marker = "public.smn_installation:r";
    const history = "public._prisma_migrations:r";
    if (!tables.includes(marker) || tables.some((name) => !(INSTALLATION_RELATIONS as readonly string[]).includes(name))) {
      return { schemaUsage, schemaCreate, serverVersion, tables };
    }
    const perms = await client.query<{ installation: boolean; migrations: boolean }>(
      "SELECT has_table_privilege(current_user, 'public.smn_installation', 'SELECT') AS installation, CASE WHEN to_regclass('public._prisma_migrations') IS NOT NULL THEN has_table_privilege(current_user, 'public._prisma_migrations', 'SELECT') ELSE false END AS migrations",
    );
    const tableRead = perms.rows[0]?.installation === true;
    const migrationsRead = perms.rows[0]?.migrations === true;
    if (!tableRead || (tables.includes(history) && !migrationsRead)) {
      return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead };
    }
    const installations = await client.query<{
      id: string; state: string; schema_version: number;
    }>("SELECT id, state, schema_version FROM public.smn_installation LIMIT 2");
    const required = ["smn_installation:id", "smn_installation:state", "smn_installation:schema_version", "smn_installation:mode", "smn_installation:created_at", "smn_product:id", "smn_product:installation_id", "smn_product:name", "smn_team:id", "smn_team:installation_id", "smn_team:product_id", "smn_team:name", "smn_account:id", "smn_account:installation_id", "smn_account:username", "smn_account:email", "smn_account:role", "smn_account:password_hash", "smn_account:must_change_password", "smn_account:created_at", "_prisma_migrations:id", "_prisma_migrations:checksum", "_prisma_migrations:migration_name", "_prisma_migrations:finished_at", "_prisma_migrations:rolled_back_at", "_prisma_migrations:started_at", "_prisma_migrations:applied_steps_count"];
    const cols = await client.query<{ label: string }>(
      "SELECT table_name || ':' || column_name AS label FROM information_schema.columns WHERE table_schema='public'",
    );
    const columnSet = new Set(cols.rows.map((r) => r.label));
    const shapeValid = required.every((name) => columnSet.has(name));
    if (!shapeValid || !tables.includes(history)) return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead, installations: installations.rows, shapeValid: false };
    const migrations = (await client.query<{ migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null }>(
      "SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations LIMIT 29",
    )).rows;
    // Métadonnées de schéma lues en READ ONLY ; aucun DDL ni réparation implicite.
    let multiTeamSchemaValid:boolean|undefined;
    if((installations.rows[0]?.schema_version??0)>=28){
      const integrity=await client.query<{
        product_nullable:boolean;indexes_valid:boolean;
        constraints_valid:boolean;old_unique_gone:boolean;
      }>(`
        SELECT
          (SELECT is_nullable='YES' FROM information_schema.columns
            WHERE table_schema='public' AND table_name='smn_team'
              AND column_name='product_id') AS product_nullable,
          (SELECT count(*)=2 FROM pg_indexes
            WHERE schemaname='public' AND indexname IN
              ('smn_team_product_id_key','smn_team_installation_name_ci_key')
              AND indexdef ILIKE '%UNIQUE%') AS indexes_valid,
          (SELECT count(*)=6 FROM pg_constraint
            WHERE connamespace='public'::regnamespace AND conname IN
              ('smn_product_id_installation_pair_key',
               'smn_team_product_same_installation_fk',
               'smn_account_installation_pair_key',
               'smn_team_installation_pair_key',
               'smn_team_pref_account_same_installation_fk',
               'smn_team_pref_team_same_installation_fk')) AS constraints_valid,
          NOT EXISTS(SELECT 1 FROM pg_constraint
            WHERE connamespace='public'::regnamespace AND conname IN
              ('smn_product_installation_id_key','smn_team_installation_id_key')) AS old_unique_gone
      `);
      const row=integrity.rows[0];
      multiTeamSchemaValid=!!row?.product_nullable&&!!row?.indexes_valid&&
        !!row?.constraints_valid&&!!row?.old_unique_gone&&
        ["id","team_id","revision","after_values","before_values"]
          .every(n=>columnSet.has("smn_team_context_audit:"+n))&&
        ["team_id","vision","product_goal","revision"]
          .every(n=>columnSet.has("smn_team_context:"+n))&&
        ["account_id","installation_id","team_id","updated_at"]
          .every(n=>columnSet.has("smn_account_team_preference:"+n));
    }
    const linksSchemaValid = installations.rows[0]?.schema_version===29 ? [
      ...['id','installation_id','name','created_at','updated_at'].map(n=>'smn_link_category:'+n),
      ...['id','installation_id','title','url','description','category_id','scope','team_id','created_by','updated_by','created_at','updated_at','revision'].map(n=>'smn_link:'+n),
      ...['id','link_id','installation_id','operation','before_values','after_values','actor_id','occurred_at'].map(n=>'smn_link_audit:'+n)
    ].every(n=>columnSet.has(n)) : undefined;
    return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead, installations: installations.rows, migrations, shapeValid, multiTeamSchemaValid, linksSchemaValid, accountActiveColumn: columnSet.has("smn_account:is_active"),
      recoverySchemaValid: ["smn_recovery_phrase:account_id","smn_recovery_phrase:phrase_hash","smn_recovery_phrase:created_at","smn_auth_audit:id","smn_auth_audit:account_id","smn_auth_audit:action","smn_auth_audit:created_at"].every(col=>columnSet.has(col)),
      configurationTasksSchemaValid: ["smn_configuration_task:installation_id","smn_configuration_task:task_key",
        "smn_configuration_task:status","smn_configuration_task:updated_at","smn_configuration_task:updated_by"]
        .every(col=>columnSet.has(col)),
      paletteSchemaValid: columnSet.has("smn_general_settings:palette"),
      backupRetentionSchemaValid: ["smn_backup_retention:installation_id","smn_backup_retention:days",
        "smn_backup_retention:revision","smn_backup_retention:updated_at","smn_backup_retention:updated_by",
        "smn_backup_retention_audit:id","smn_backup_retention_audit:installation_id","smn_backup_retention_audit:actor_id",
        "smn_backup_retention_audit:action","smn_backup_retention_audit:old_days","smn_backup_retention_audit:new_days",
        "smn_backup_retention_audit:package_id","smn_backup_retention_audit:occurred_at"]
        .every(col=>columnSet.has(col)),
      capacityReplanningSchemaValid: [
        ...["id","period_id","target_start_on","target_end_on","revision",
         "confirmed_by","confirmed_at"].map(n=>"smn_capacity_replanning:"+n),
        ...["id","replanning_id","revision","event_id","previous_values",
         "confirmed_values","preview_digest","confirmed_by","confirmed_at"]
          .map(n=>"smn_capacity_replanning_history:"+n)
      ].every(n=>columnSet.has(n)),
      capacityHistoricalSchemaValid: [
        ...["id","team_id","start_on","end_on","quality","qualified_jh",
         "source_kind","source_ref","rationale","revision","updated_by","updated_at"]
         .map(n=>"smn_capacity_historical_quality:"+n),
        ...["id","qualification_id","revision","before_values","after_values",
         "changed_by","changed_at"]
         .map(n=>"smn_capacity_historical_quality_history:"+n)
      ].every(n=>columnSet.has(n)),
      capacityActualSchemaValid: [
        ...["id","period_id","manual_jh","revision","updated_by","updated_at"]
          .map(n=>"smn_capacity_actual_override:"+n),
        ...["id","actual_id","revision","operation","before_jh","after_jh",
         "changed_by","changed_at"]
          .map(n=>"smn_capacity_actual_override_history:"+n),
        ...["id","period_id","event_id","retained_jh","reference_jh","provenance",
         "closed_at","recorded_at","closed_by"]
          .map(n=>"smn_capacity_actual_snapshot:"+n)
      ].every(n=>columnSet.has(n)),
      capacityInitialSchemaValid: [
        ...["id","period_id","event_id","initial_jh","provenance",
         "actual_opened_at","recorded_at","opened_by","manual_revision"]
         .map(n=>"smn_capacity_initial_snapshot:"+n)
      ].every(n=>columnSet.has(n)),
      capacityOverrideSchemaValid: [
        ...["id","team_id","start_on","end_on","manual_jh","revision",
          "frozen_at","closed_at","updated_by","updated_at"]
         .map(n=>"smn_capacity_period_override:"+n),
        ...["id","period_id","revision","operation","before_jh","after_jh",
          "changed_by","changed_at"]
         .map(n=>"smn_capacity_period_override_history:"+n)
      ].every(n=>columnSet.has(n)),
      capacitySchemaValid: [
        ...["installation_id","hours_per_jh","revision","updated_by","updated_at"].map(n=>"smn_capacity_settings:"+n),
        ...["id","installation_id","revision","previous_hours","new_hours","changed_by","changed_at"].map(n=>"smn_capacity_settings_audit:"+n)
      ].every(n=>columnSet.has(n)),
      closuresSchemaValid: [
        ...["id","team_id","name","start_on","end_on","is_active","revision",
          "created_by","created_at","updated_by","updated_at"]
          .map(n=>"smn_company_closure:"+n),
        ...["id","closure_id","revision","operation","previous_values",
          "next_values","changed_by","changed_at"]
          .map(n=>"smn_company_closure_history:"+n)
      ].every(n=>columnSet.has(n)),
      absencesSchemaValid: [
        ...["id","name","color","is_active","created_at","updated_at"]
          .map(n=>"smn_absence_category:"+n),
        ...["id","member_id","category_id","start_on","end_on","start_slot",
          "end_slot","is_planned","reason","revision","created_by","created_at",
          "updated_by","updated_at"].map(n=>"smn_member_absence:"+n),
        ...["id","absence_id","revision","operation","before_values","after_values",
          "changed_by","changed_at"].map(n=>"smn_member_absence_history:"+n)
      ].every(n=>columnSet.has(n)),
      holidayCsvSchemaValid: [
        "id","country_code","holiday_date","previous_name","new_name",
        "action","origin","actor_id","occurred_at"
      ].every(n=>columnSet.has("smn_national_holiday_audit:"+n)),
      holidaysSchemaValid: [
        ...["country_code","holiday_date","name"].map(n=>"smn_national_holiday:"+n),
        ...["country_code","calendar_year","status","entries_count","diagnostic","source_file","checked_at"]
         .map(n=>"smn_national_calendar_coverage:"+n)
      ].every(n=>columnSet.has(n)),
      countriesSchemaValid: ["code","name","origin","created_by","created_at"]
       .every(name=>columnSet.has("smn_country:"+name)),
      memberLocationSchemaValid: ["id","member_id","revision","effective_from","country_iso2",
       "region","city","time_zone","source","created_by","created_at"]
        .every(n=>columnSet.has("smn_member_location:"+n)),
      memberCalendarSchemaValid: [
       ...["id","member_id","revision","effective_from","days","created_by","created_at"]
         .map(n=>"smn_member_calendar_week:"+n),
       ...["id","member_id","on_date","revision","morning","afternoon","note","created_by","created_at"]
         .map(n=>"smn_member_calendar_exception:"+n)
      ].every(n=>columnSet.has(n)),
      lifecycleSchemaValid: ["smn_member:archived_at","smn_member:archived_by",
       ...["id","member_id","assignment_id","action","effective_on","performed_by","occurred_at","details"]
       .map(n=>"smn_member_lifecycle_event:"+n)].every(n=>columnSet.has(n)),
      assignmentVersionsSchemaValid: ["id","assignment_id","revision","effective_from",
       "allocation_percent","contract_percent","contribution_percent","scrum_master_percent",
       "product_owner_percent","developer_percent","created_by","created_at"]
        .every(name=>columnSet.has("smn_member_assignment_version:"+name)),
      memberIdentitySchemaValid: columnSet.has("smn_member:professional_function")&&
       ["id","member_id","previous_values","next_values","changed_by","changed_at"]
        .every(n=>columnSet.has("smn_member_identity_history:"+n)),
      memberProfileSchemaValid: ["smn_member:email","smn_member:revision","smn_member:updated_at"]
        .every(name=>columnSet.has(name)),
      membersSchemaValid: [
       ...["id","installation_id","team_id","requested_count","created_by","created_at"]
         .map(name=>"smn_member_batch:"+name),
       ...["id","installation_id","batch_id","member_number","display_name","is_provisional",
          "contract_percent","contribution_percent","created_at"]
         .map(name=>"smn_member:"+name),
       ...["id","member_id","team_id","start_on","end_on","agile_role","allocation_percent","role_percent"]
         .map(name=>"smn_member_assignment:"+name)
      ].every(name=>columnSet.has(name)),
      accountAuditSchemaValid: ["id","installation_id","actor_id","object_id","action","outcome","old_values","new_values","occurred_at"]
        .every(name=>columnSet.has("smn_account_audit:"+name)),
      settingsSchemaValid: ["smn_general_settings:installation_id","smn_general_settings:locale","smn_general_settings:theme","smn_general_settings:reference_country","smn_general_settings:revision","smn_general_settings:updated_at","smn_general_settings:updated_by","smn_general_settings_audit:id","smn_general_settings_audit:installation_id","smn_general_settings_audit:actor_id","smn_general_settings_audit:old_values","smn_general_settings_audit:new_values","smn_general_settings_audit:changed_at"].every(col=>columnSet.has(col)) };
  } finally {
    if (transaction) await client.query("ROLLBACK").catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}
