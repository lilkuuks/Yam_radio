update public.site_settings
set value = jsonb_set(value, '{time}', '"18:30"'::jsonb),
    updated_at = now()
where key = 'service_schedule'
  and value ->> 'day' = 'Sunday'
  and value ->> 'time' = '06:30';
