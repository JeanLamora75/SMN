CREATE TABLE public.smn_configuration_task (
  installation_id text NOT NULL REFERENCES public.smn_installation(id),
  task_key text NOT NULL CHECK (task_key IN ('reference-country','recovery-phrase','display-preferences')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','done','ignored')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  PRIMARY KEY (installation_id, task_key)
);
INSERT INTO public.smn_configuration_task (installation_id,task_key,status)
VALUES ('singleton','reference-country','todo'),
       ('singleton','recovery-phrase','todo'),
       ('singleton','display-preferences','todo');
UPDATE public.smn_configuration_task SET status='done'
WHERE installation_id='singleton' AND task_key='reference-country'
  AND EXISTS (SELECT 1 FROM public.smn_general_settings
              WHERE installation_id='singleton' AND reference_country IS NOT NULL);
UPDATE public.smn_configuration_task SET status='done'
WHERE installation_id='singleton' AND task_key='recovery-phrase'
  AND EXISTS (SELECT 1 FROM public.smn_recovery_phrase r
    JOIN public.smn_account a ON a.id=r.account_id
    WHERE a.installation_id='singleton' AND a.role='admin'
      AND a.is_active=true AND a.must_change_password=false);
UPDATE public.smn_installation SET schema_version=5
WHERE id='singleton' AND schema_version=4;
