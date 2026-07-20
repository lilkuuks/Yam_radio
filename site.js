(function () {
  'use strict';

  const config = window.YAM_CONFIG || {};
  if (!config.supabaseUrl || !config.supabasePublishableKey || !window.supabase) return;

  const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const formatTime = (value) => {
    if (!value) return '6:30 AM';
    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
  };

  const applySettings = (rows) => {
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const schedule = settings.service_schedule;
    const announcement = settings.announcement;

    if (schedule) {
      const shortLabel = `${schedule.day || 'Sunday'} ${formatTime(schedule.time)}`;
      const longLabel = `Every ${schedule.day || 'Sunday'} ${formatTime(schedule.time)}`;
      document.querySelectorAll('[data-service-time-short]').forEach((element) => {
        element.textContent = shortLabel;
      });
      document.querySelectorAll('[data-service-time-long]').forEach((element) => {
        element.textContent = longLabel;
      });
    }

    const banner = document.querySelector('#site-announcement');
    if (banner && announcement && announcement.enabled && announcement.text) {
      banner.querySelector('span').textContent = announcement.text;
      banner.hidden = false;
    }
  };

  client.from('site_settings')
    .select('key,value')
    .in('key', ['service_schedule', 'announcement'])
    .then(({ data, error }) => {
      if (!error && data) applySettings(data);
    });
})();
