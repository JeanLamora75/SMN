import type {Client} from "pg";

/** Read-only prerequisite check: schema changes are reserved to explicit migrations. */
export class CountrySchemaUnavailableError extends Error {
 constructor(){super("country-schema-v30-required");this.name="CountrySchemaUnavailableError";}
}

export async function requireCountrySchemaV30(db:Pick<Client,"query">):Promise<void>{
 const result=await db.query<{schema_version:number;ready:boolean}>(`
 SELECT i.schema_version,
   (i.schema_version >= 30
    AND to_regclass('public.smn_country_name_audit') IS NOT NULL
    AND to_regclass('public.smn_country_lifecycle_audit') IS NOT NULL
    AND to_regclass('public.smn_national_holiday_manual_audit') IS NOT NULL
    AND to_regclass('public.smn_national_calendar_validation_audit') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_country'
        AND column_name IN ('revision','archived_at')
      GROUP BY table_name HAVING count(DISTINCT column_name)=2
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_national_calendar_coverage'
        AND column_name IN ('revision','administrative_validated_at','validated_revision',
                            'validated_by','validation_source')
      GROUP BY table_name HAVING count(DISTINCT column_name)=5
    )) AS ready
 FROM public.smn_installation i WHERE i.id='singleton'
 `);
 if(result.rows.length!==1||result.rows[0].ready!==true)throw new CountrySchemaUnavailableError();
}
