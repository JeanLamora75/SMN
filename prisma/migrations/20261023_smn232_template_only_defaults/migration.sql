-- SMN : quatre modèles Scrum de démarrage, sans enrichissement des règles métier.
-- Idempotent : uniquement les modèles manquants par équipe, aucun Sprint existant touché.
-- Les occurrences déjà générées restent strictement inchangées.
WITH defaults(name,frequency,weekday,position,local_time,duration_minutes) AS (
 VALUES
  ('Sprint Planning','sprint',NULL::integer,'start','09:30',120),
  ('Daily Scrum','daily',NULL::integer,NULL::text,'09:00',15),
  ('Sprint Review','sprint',NULL::integer,'end','15:00',60),
  ('Sprint Retrospective','sprint',NULL::integer,'end','16:30',60)
), inserted AS (
 INSERT INTO public.smn_scrum_ceremony_template
  (id,team_id,name,frequency,weekday,position,local_time,duration_minutes,active)
 SELECT gen_random_uuid()::text,t.id,d.name,d.frequency,d.weekday,d.position,
        d.local_time::time,d.duration_minutes,true
 FROM public.smn_team t
 JOIN public.smn_installation i ON i.id=t.installation_id
 CROSS JOIN defaults d
 WHERE i.state='initialized' AND lower(i.mode)='scrum'
 AND NOT EXISTS (
  SELECT 1 FROM public.smn_scrum_ceremony_template existing
  WHERE existing.team_id=t.id AND lower(btrim(existing.name))=lower(btrim(d.name))
 )
 RETURNING id,name,frequency,weekday,position,local_time,duration_minutes
)
INSERT INTO public.smn_scrum_ceremony_template_history
 (id,template_id,revision,before_values,after_values,actor_id)
SELECT gen_random_uuid()::text,id,1,NULL,
 jsonb_build_object('name',name,'frequency',frequency,'weekday',weekday,
   'position',position,'time',to_char(local_time,'HH24:MI'),
   'duration',duration_minutes,'active',true),NULL
FROM inserted;
