(function () {
  'use strict';

  const STORAGE_KEY = 'yam-admin-drafts-v1';
  const config = window.YAM_CONFIG || {};
  const isConfigured = Boolean(
    config.supabaseUrl && config.supabasePublishableKey && window.supabase
  );
  const client = isConfigured
    ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey)
    : null;

  const defaults = {
    serviceDay: 'Sunday',
    serviceTime: '06:30',
    timezone: 'Atlantic/Reykjavik',
    announcement: '',
    smsAudience: 'all',
    smsMessage: '',
    savedAt: null
  };

  const readLocalDrafts = () => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (_error) {
      return { ...defaults };
    }
  };

  let drafts = readLocalDrafts();
  let currentUser = null;
  let toastTimer;

  const elements = {
    authGate: document.querySelector('#auth-gate'),
    loginForm: document.querySelector('#login-form'),
    loginEmail: document.querySelector('#login-email'),
    loginPassword: document.querySelector('#login-password'),
    authError: document.querySelector('#auth-error'),
    signOut: document.querySelector('#sign-out'),
    connection: document.querySelector('#connection-status'),
    setupNotice: document.querySelector('#setup-notice'),
    serviceForm: document.querySelector('#service-form'),
    serviceDay: document.querySelector('#service-day'),
    serviceTime: document.querySelector('#service-time'),
    timezone: document.querySelector('#service-timezone'),
    nextService: document.querySelector('#next-service'),
    announcementForm: document.querySelector('#announcement-form'),
    announcement: document.querySelector('#announcement-text'),
    smsForm: document.querySelector('#sms-form'),
    smsAudience: document.querySelector('#sms-audience'),
    smsMessage: document.querySelector('#sms-message'),
    saveSms: document.querySelector('#save-sms'),
    characterCount: document.querySelector('#character-count'),
    segmentCount: document.querySelector('#segment-count'),
    lastSaved: document.querySelector('#last-saved'),
    toast: document.querySelector('#toast')
  };

  const showToast = (message) => {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2400);
  };

  const setConnection = (label, connected) => {
    elements.connection.innerHTML = '<span></span>' + label;
    elements.connection.classList.toggle('connected', connected);
  };

  const formatTime = (value) => {
    if (!value) return '6:30 AM';
    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
  };

  const updateSavedLabel = () => {
    elements.lastSaved.textContent = drafts.savedAt
      ? `Saved ${new Date(drafts.savedAt).toLocaleString()}`
      : (isConfigured ? 'No saved changes yet' : 'Local drafts only');
  };

  const updateServicePreview = () => {
    elements.nextService.textContent = `${elements.serviceDay.value} · ${formatTime(elements.serviceTime.value)}`;
  };

  const updateMessageCount = () => {
    const count = elements.smsMessage.value.length;
    const segments = Math.max(1, Math.ceil(count / 160));
    elements.characterCount.textContent = `${count} / 320 characters`;
    elements.segmentCount.textContent = `${segments} SMS segment${segments === 1 ? '' : 's'}`;
  };

  const renderDrafts = () => {
    elements.serviceDay.value = drafts.serviceDay;
    elements.serviceTime.value = drafts.serviceTime;
    elements.timezone.value = drafts.timezone;
    elements.announcement.value = drafts.announcement;
    elements.smsAudience.value = drafts.smsAudience;
    elements.smsMessage.value = drafts.smsMessage;
    updateServicePreview();
    updateMessageCount();
    updateSavedLabel();
  };

  const saveLocalDrafts = (message) => {
    drafts.savedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    updateSavedLabel();
    showToast(message);
  };

  const loadRemoteData = async () => {
    const [settingsResult, smsResult] = await Promise.all([
      client.from('site_settings').select('key,value,updated_at'),
      client.from('sms_drafts').select('audience,message,created_at')
        .order('created_at', { ascending: false }).limit(1)
    ]);

    if (settingsResult.error) throw settingsResult.error;

    const settings = Object.fromEntries(
      settingsResult.data.map((row) => [row.key, row.value])
    );
    const schedule = settings.service_schedule || {};
    const announcement = settings.announcement || {};
    const latestSms = smsResult.data && smsResult.data[0];

    drafts = {
      ...drafts,
      serviceDay: schedule.day || defaults.serviceDay,
      serviceTime: schedule.time || defaults.serviceTime,
      timezone: schedule.timezone || defaults.timezone,
      announcement: announcement.text || '',
      smsAudience: latestSms?.audience || drafts.smsAudience,
      smsMessage: latestSms?.message || drafts.smsMessage,
      savedAt: settingsResult.data.reduce((latest, row) => {
        return !latest || row.updated_at > latest ? row.updated_at : latest;
      }, null)
    };
    renderDrafts();
  };

  const authorizeSession = async (session) => {
    document.body.classList.remove('auth-pending');
    if (!session?.user) {
      currentUser = null;
      elements.authGate.hidden = false;
      elements.signOut.hidden = true;
      setConnection('Sign in required', false);
      return;
    }

    const { data, error } = await client.from('admin_users')
      .select('user_id').eq('user_id', session.user.id).maybeSingle();

    if (error || !data) {
      await client.auth.signOut();
      currentUser = null;
      elements.authError.textContent = 'This account is not approved as a YAM administrator.';
      elements.authGate.hidden = false;
      return;
    }

    currentUser = session.user;
    elements.authGate.hidden = true;
    elements.signOut.hidden = false;
    elements.setupNotice.innerHTML = '<strong>SMS pending</strong><span>Supabase is connected. Add the SMS provider secrets and adapter before enabling sends.</span>';
    setConnection(`Connected · ${currentUser.email}`, true);

    try {
      await loadRemoteData();
    } catch (error) {
      showToast(error.message || 'Could not load admin data.');
    }
  };

  elements.serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    drafts.serviceDay = elements.serviceDay.value;
    drafts.serviceTime = elements.serviceTime.value;
    drafts.timezone = elements.timezone.value.trim();
    updateServicePreview();

    if (!currentUser) {
      saveLocalDrafts('Service details saved on this device.');
      return;
    }

    const { error } = await client.from('site_settings').upsert({
      key: 'service_schedule',
      value: { day: drafts.serviceDay, time: drafts.serviceTime, timezone: drafts.timezone },
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    });
    if (error) return showToast(error.message);
    drafts.savedAt = new Date().toISOString();
    updateSavedLabel();
    showToast('Service schedule published to the website.');
  });

  elements.announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    drafts.announcement = elements.announcement.value.trim();

    if (!currentUser) {
      saveLocalDrafts('Announcement draft saved.');
      return;
    }

    const { error } = await client.from('site_settings').upsert({
      key: 'announcement',
      value: { text: drafts.announcement, enabled: Boolean(drafts.announcement) },
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    });
    if (error) return showToast(error.message);
    drafts.savedAt = new Date().toISOString();
    updateSavedLabel();
    showToast(drafts.announcement ? 'Announcement published.' : 'Announcement removed.');
  });

  elements.smsMessage.addEventListener('input', updateMessageCount);

  elements.saveSms.addEventListener('click', async () => {
    drafts.smsAudience = elements.smsAudience.value;
    drafts.smsMessage = elements.smsMessage.value.trim();

    if (!currentUser) {
      saveLocalDrafts('SMS draft saved on this device.');
      return;
    }

    const { error } = await client.from('sms_drafts').insert({
      audience: drafts.smsAudience,
      message: drafts.smsMessage,
      created_by: currentUser.id
    });
    if (error) return showToast(error.message);
    drafts.savedAt = new Date().toISOString();
    updateSavedLabel();
    showToast('SMS draft saved securely.');
  });

  elements.smsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showToast('Connect the SMS provider before sending.');
  });

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    elements.authError.textContent = '';
    const { data, error } = await client.auth.signInWithPassword({
      email: elements.loginEmail.value.trim(),
      password: elements.loginPassword.value
    });
    if (error) {
      elements.authError.textContent = error.message;
      return;
    }
    elements.loginPassword.value = '';
    await authorizeSession(data.session);
  });

  elements.signOut.addEventListener('click', async () => {
    await client.auth.signOut();
    await authorizeSession(null);
  });

  renderDrafts();

  if (!isConfigured) {
    document.body.classList.remove('auth-pending');
    setConnection('Local setup mode', false);
    elements.setupNotice.innerHTML = '<strong>Setup mode</strong><span>Add the Supabase URL and publishable key to config.js to enable authentication and shared data.</span>';
    return;
  }

  client.auth.getSession().then(({ data }) => authorizeSession(data.session));
})();
