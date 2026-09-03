(function () {
  'use strict';

  const STORAGE_KEY = 'yam-admin-drafts-v1';
  const SONGS_KEY = 'yam-minstrels-songs-v1';
  const LOCAL_SESSION_KEY = 'yam-local-admin-auth-v1';
  const config = window.YAM_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase);
  const hasLocalAdmin = !isConfigured && Boolean(
    config.adminUsername && config.adminPasswordSalt && config.adminPasswordHash && config.adminPasswordIterations
  );
  const client = isConfigured ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey) : null;
  const defaults = { serviceDay: 'Sunday', serviceTime: '18:30', timezone: 'Atlantic/Reykjavik', announcement: '', smsAudience: 'all', smsMessage: '', savedAt: null };

  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value === null ? fallback : value;
    } catch (_error) { return fallback; }
  };

  let drafts = { ...defaults, ...readJson(STORAGE_KEY, {}) };
  const localSongs = readJson(SONGS_KEY, []);
  let songs = Array.isArray(localSongs) ? localSongs : [];
  let currentUser = null;
  let toastTimer;

  const elements = {
    authGate: document.querySelector('#auth-gate'), loginForm: document.querySelector('#login-form'),
    loginEmail: document.querySelector('#login-email'), loginPassword: document.querySelector('#login-password'),
    loginHelp: document.querySelector('#login-help'), loginIdentifierLabel: document.querySelector('#login-identifier-label'),
    authError: document.querySelector('#auth-error'), signOut: document.querySelector('#sign-out'),
    connection: document.querySelector('#connection-status'), setupNotice: document.querySelector('#setup-notice'),
    serviceForm: document.querySelector('#service-form'), serviceDay: document.querySelector('#service-day'),
    serviceTime: document.querySelector('#service-time'), timezone: document.querySelector('#service-timezone'),
    timezoneLabel: document.querySelector('#service-timezone-label'), nextService: document.querySelector('#next-service'),
    saveService: document.querySelector('#save-service'), announcementForm: document.querySelector('#announcement-form'),
    announcement: document.querySelector('#announcement-text'), saveAnnouncement: document.querySelector('#save-announcement'),
    songCount: document.querySelector('#song-count'), songLibraryCount: document.querySelector('#song-library-count'),
    songList: document.querySelector('#admin-song-list'), songEmpty: document.querySelector('#admin-song-empty'),
    songForm: document.querySelector('#song-form'), songFormTitle: document.querySelector('#song-form-title'),
    songId: document.querySelector('#song-id'), songTitle: document.querySelector('#song-title'),
    songArtist: document.querySelector('#song-artist'), songPrice: document.querySelector('#song-price'),
    songBuyUrl: document.querySelector('#song-buy-url'), songOrder: document.querySelector('#song-order'),
    songPublished: document.querySelector('#song-published'), songLyrics: document.querySelector('#song-lyrics'),
    saveSong: document.querySelector('#save-song'), cancelSongEdit: document.querySelector('#cancel-song-edit'),
    smsForm: document.querySelector('#sms-form'), smsAudience: document.querySelector('#sms-audience'),
    smsMessage: document.querySelector('#sms-message'), saveSms: document.querySelector('#save-sms'),
    characterCount: document.querySelector('#character-count'), segmentCount: document.querySelector('#segment-count'),
    lastSaved: document.querySelector('#last-saved'), toast: document.querySelector('#toast')
  };

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const showToast = (message) => {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2600);
  };

  const setConnection = (label, connected) => {
    const dot = document.createElement('span');
    elements.connection.replaceChildren(dot, document.createTextNode(label));
    elements.connection.classList.toggle('connected', connected);
  };

  const setButtonBusy = (button, busy, label) => {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? label : button.dataset.label;
  };

  const bytesToHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const hexToBytes = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map((pair) => parseInt(pair, 16)));

  const verifyLocalPassword = async (password) => {
    if (!window.crypto?.subtle) throw new Error('Secure browser encryption is unavailable. Open this page over HTTPS or localhost.');
    const key = await window.crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await window.crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(config.adminPasswordSalt),
      iterations: Number(config.adminPasswordIterations)
    }, key, 256);
    const actual = bytesToHex(new Uint8Array(bits));
    const expected = String(config.adminPasswordHash);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
      difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
    }
    return difference === 0;
  };

  const formatTime = (value) => {
    if (!value) return '6:30 PM';
    const [hours, minutes] = value.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  const updateSavedLabel = () => {
    elements.lastSaved.textContent = drafts.savedAt
      ? `Saved ${new Date(drafts.savedAt).toLocaleString()}`
      : (isConfigured ? 'No saved changes yet' : 'Local drafts only');
  };

  const updateServicePreview = () => {
    elements.nextService.textContent = `${elements.serviceDay.value} · ${formatTime(elements.serviceTime.value)}`;
    elements.timezoneLabel.textContent = elements.timezone.value.trim() || defaults.timezone;
  };

  const updateMessageCount = () => {
    const count = elements.smsMessage.value.length;
    const segments = count === 0 ? 0 : Math.ceil(count / 160);
    elements.characterCount.textContent = `${count} / 320 characters`;
    elements.segmentCount.textContent = `${segments} SMS segment${segments === 1 ? '' : 's'}`;
  };

  const updateModeLabels = () => {
    elements.saveService.textContent = currentUser ? 'Publish schedule' : 'Save locally';
    elements.saveAnnouncement.textContent = currentUser ? 'Publish announcement' : 'Save draft';
    elements.saveSong.textContent = elements.songId.value
      ? (currentUser ? 'Update song' : 'Update locally')
      : (currentUser ? 'Publish song' : 'Add song locally');
    [elements.saveService, elements.saveAnnouncement, elements.saveSong].forEach((button) => delete button.dataset.label);
  };

  const renderDrafts = () => {
    elements.serviceDay.value = drafts.serviceDay; elements.serviceTime.value = drafts.serviceTime;
    elements.timezone.value = drafts.timezone; elements.announcement.value = drafts.announcement;
    elements.smsAudience.value = drafts.smsAudience; elements.smsMessage.value = drafts.smsMessage;
    updateServicePreview(); updateMessageCount(); updateSavedLabel();
  };

  const saveLocalDrafts = (message) => {
    drafts.savedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    updateSavedLabel(); showToast(message);
  };

  const renderSongs = () => {
    songs = [...songs].sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0) || String(a.title).localeCompare(String(b.title)));
    const publishedCount = songs.filter((song) => song.published !== false).length;
    elements.songCount.textContent = `${publishedCount} song${publishedCount === 1 ? '' : 's'}`;
    elements.songLibraryCount.textContent = `${songs.length} song${songs.length === 1 ? '' : 's'}`;
    elements.songEmpty.hidden = songs.length > 0;
    elements.songList.innerHTML = songs.map((song) => `
      <article class="admin-song-item" data-song-id="${escapeHtml(song.id)}">
        <div class="admin-song-main"><div><strong>${escapeHtml(song.title)}</strong>
          <small>${escapeHtml(song.artist || 'YAM Minstrels')} · ${escapeHtml(song.price || 'No price')}</small></div>
          <span class="song-state${song.published === false ? ' draft' : ''}">${song.published === false ? 'Draft' : 'Live'}</span></div>
        <div class="admin-song-actions"><button type="button" data-action="edit">Edit</button>
          <button class="delete-song" type="button" data-action="delete">Delete</button></div>
      </article>`).join('');
  };

  const resetSongForm = () => {
    elements.songForm.reset(); elements.songId.value = ''; elements.songArtist.value = 'YAM Minstrels';
    elements.songOrder.value = String(songs.length); elements.songPublished.checked = true;
    elements.songFormTitle.textContent = 'Add a song'; elements.cancelSongEdit.hidden = true; updateModeLabels();
  };

  const editSong = (id) => {
    const song = songs.find((item) => String(item.id) === String(id));
    if (!song) return;
    elements.songId.value = song.id; elements.songTitle.value = song.title || '';
    elements.songArtist.value = song.artist || 'YAM Minstrels'; elements.songPrice.value = song.price || '';
    elements.songBuyUrl.value = song.buy_url || ''; elements.songOrder.value = String(song.display_order || 0);
    elements.songPublished.checked = song.published !== false; elements.songLyrics.value = song.lyrics || '';
    elements.songFormTitle.textContent = 'Edit song'; elements.cancelSongEdit.hidden = false; updateModeLabels();
    elements.songForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    elements.songTitle.focus({ preventScroll: true });
  };

  const loadRemoteData = async () => {
    const [settingsResult, smsResult, songsResult] = await Promise.all([
      client.from('site_settings').select('key,value,updated_at'),
      client.from('sms_drafts').select('audience,message,created_at').order('created_at', { ascending: false }).limit(1),
      client.from('minstrel_songs').select('id,title,artist,lyrics,price,buy_url,published,display_order,created_at,updated_at')
        .order('display_order', { ascending: true }).order('created_at', { ascending: true })
    ]);
    if (settingsResult.error) throw settingsResult.error;
    if (smsResult.error) showToast('Settings loaded, but the latest SMS draft could not be read.');
    const settings = Object.fromEntries(settingsResult.data.map((row) => [row.key, row.value]));
    const schedule = settings.service_schedule || {}; const announcement = settings.announcement || {};
    const latestSms = smsResult.data && smsResult.data[0];
    drafts = { ...drafts, serviceDay: schedule.day || defaults.serviceDay, serviceTime: schedule.time || defaults.serviceTime,
      timezone: schedule.timezone || defaults.timezone, announcement: announcement.text || '',
      smsAudience: latestSms?.audience || drafts.smsAudience, smsMessage: latestSms?.message || drafts.smsMessage,
      savedAt: settingsResult.data.reduce((latest, row) => !latest || row.updated_at > latest ? row.updated_at : latest, null) };
    if (!songsResult.error) songs = songsResult.data || [];
    else showToast('Run the latest Supabase migration to enable song publishing.');
    renderDrafts(); renderSongs(); resetSongForm();
  };

  const authorizeSession = async (session) => {
    document.body.classList.remove('auth-pending'); elements.authError.textContent = '';
    if (!session?.user) {
      currentUser = null; elements.authGate.hidden = false; elements.signOut.hidden = true;
      setConnection('Sign in required', false); updateModeLabels(); return;
    }
    const { data, error } = await client.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle();
    if (error || !data) {
      await client.auth.signOut(); currentUser = null;
      elements.authError.textContent = 'This account is not approved as a YAM administrator.';
      elements.authGate.hidden = false; elements.signOut.hidden = true;
      setConnection('Administrator access required', false); return;
    }
    currentUser = session.user; elements.authGate.hidden = true; elements.signOut.hidden = false;
    elements.setupNotice.innerHTML = '<strong>Connected securely</strong><span>Website settings and Minstrels songs publish immediately. SMS sending remains off until a provider is connected.</span>';
    setConnection(`Connected · ${currentUser.email}`, true); updateModeLabels();
    try { await loadRemoteData(); } catch (loadError) { showToast(loadError.message || 'Could not load admin data.'); }
  };

  const authorizeLocalSession = (authorized) => {
    document.body.classList.remove('auth-pending');
    elements.authError.textContent = '';
    if (!authorized) {
      currentUser = null;
      elements.authGate.hidden = false;
      elements.signOut.hidden = true;
      setConnection('Sign in required', false);
      updateModeLabels();
      return;
    }
    currentUser = { id: 'local-admin', email: config.adminUsername };
    elements.authGate.hidden = true;
    elements.signOut.hidden = false;
    elements.setupNotice.innerHTML = '<strong>Local admin mode</strong><span>This browser is signed in. Changes remain on this device until Supabase is connected.</span>';
    setConnection(`Local admin · ${config.adminUsername}`, true);
    updateModeLabels();
  };

  elements.serviceDay.addEventListener('change', updateServicePreview);
  elements.serviceTime.addEventListener('input', updateServicePreview);
  elements.timezone.addEventListener('input', updateServicePreview);

  elements.serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!elements.serviceTime.value || !elements.timezone.value.trim()) return showToast('Add a service time and time zone.');
    drafts.serviceDay = elements.serviceDay.value; drafts.serviceTime = elements.serviceTime.value;
    drafts.timezone = elements.timezone.value.trim(); updateServicePreview();
    if (!currentUser) return saveLocalDrafts('Service details saved on this device.');
    setButtonBusy(elements.saveService, true, 'Publishing…');
    const { error } = await client.from('site_settings').upsert({ key: 'service_schedule',
      value: { day: drafts.serviceDay, time: drafts.serviceTime, timezone: drafts.timezone },
      updated_by: currentUser.id, updated_at: new Date().toISOString() });
    setButtonBusy(elements.saveService, false, '');
    if (error) return showToast(error.message);
    drafts.savedAt = new Date().toISOString(); updateSavedLabel(); showToast('Service schedule published to the website.');
  });

  elements.announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault(); drafts.announcement = elements.announcement.value.trim();
    if (!currentUser) return saveLocalDrafts('Announcement draft saved.');
    setButtonBusy(elements.saveAnnouncement, true, 'Publishing…');
    const { error } = await client.from('site_settings').upsert({ key: 'announcement',
      value: { text: drafts.announcement, enabled: Boolean(drafts.announcement) },
      updated_by: currentUser.id, updated_at: new Date().toISOString() });
    setButtonBusy(elements.saveAnnouncement, false, '');
    if (error) return showToast(error.message);
    drafts.savedAt = new Date().toISOString(); updateSavedLabel();
    showToast(drafts.announcement ? 'Announcement published.' : 'Announcement removed.');
  });

  elements.songForm.addEventListener('submit', async (event) => {
    event.preventDefault(); const id = elements.songId.value;
    const song = { title: elements.songTitle.value.trim(), artist: elements.songArtist.value.trim() || 'YAM Minstrels',
      price: elements.songPrice.value.trim(), buy_url: elements.songBuyUrl.value.trim(),
      display_order: Number(elements.songOrder.value || 0), published: elements.songPublished.checked,
      lyrics: elements.songLyrics.value.trim() };
    if (!song.title || !song.lyrics) return showToast('A song title and lyrics are required.');
    setButtonBusy(elements.saveSong, true, id ? 'Updating…' : 'Publishing…');
    if (currentUser) {
      const payload = { ...song, updated_by: currentUser.id, updated_at: new Date().toISOString() };
      const query = id ? client.from('minstrel_songs').update(payload).eq('id', id).select().single()
        : client.from('minstrel_songs').insert(payload).select().single();
      const { data, error } = await query; setButtonBusy(elements.saveSong, false, '');
      if (error) return showToast(error.message);
      songs = id ? songs.map((item) => String(item.id) === String(id) ? data : item) : [...songs, data];
      drafts.savedAt = new Date().toISOString(); updateSavedLabel(); renderSongs(); resetSongForm();
      showToast(id ? 'Song updated on the website.' : 'Song published to the website.'); return;
    }
    const generatedId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `local-${Date.now()}`;
    const localSong = { ...song, id: id || generatedId };
    songs = id ? songs.map((item) => String(item.id) === String(id) ? localSong : item) : [...songs, localSong];
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs)); setButtonBusy(elements.saveSong, false, '');
    renderSongs(); resetSongForm(); showToast(id ? 'Song updated on this device.' : 'Song added to the Minstrels page on this device.');
  });

  elements.songList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const id = button.closest('[data-song-id]')?.dataset.songId; if (!id) return;
    if (button.dataset.action === 'edit') return editSong(id);
    const song = songs.find((entry) => String(entry.id) === String(id));
    if (!song || !window.confirm(`Delete “${song.title}”? This cannot be undone.`)) return;
    button.disabled = true;
    if (currentUser) {
      const { error } = await client.from('minstrel_songs').delete().eq('id', id);
      if (error) { button.disabled = false; showToast(error.message); return; }
    }
    songs = songs.filter((entry) => String(entry.id) !== String(id));
    if (!currentUser) localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
    if (elements.songId.value === id) resetSongForm(); renderSongs(); showToast('Song deleted.');
  });

  elements.cancelSongEdit.addEventListener('click', resetSongForm);
  elements.smsMessage.addEventListener('input', updateMessageCount);
  elements.saveSms.addEventListener('click', async () => {
    drafts.smsAudience = elements.smsAudience.value; drafts.smsMessage = elements.smsMessage.value.trim();
    if (!drafts.smsMessage) { showToast('Write a message before saving the SMS draft.'); elements.smsMessage.focus(); return; }
    if (!currentUser) return saveLocalDrafts('SMS draft saved on this device.');
    setButtonBusy(elements.saveSms, true, 'Saving…');
    const { error } = await client.from('sms_drafts').insert({ audience: drafts.smsAudience, message: drafts.smsMessage, created_by: currentUser.id });
    setButtonBusy(elements.saveSms, false, ''); if (error) return showToast(error.message);
    drafts.savedAt = new Date().toISOString(); updateSavedLabel(); showToast('SMS draft saved securely.');
  });
  elements.smsForm.addEventListener('submit', (event) => { event.preventDefault(); showToast('Connect the SMS provider before sending.'); });

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); elements.authError.textContent = '';
    const submit = elements.loginForm.querySelector('button[type="submit"]'); setButtonBusy(submit, true, 'Signing in…');
    if (hasLocalAdmin) {
      try {
        const usernameMatches = elements.loginEmail.value.trim().toLowerCase() === String(config.adminUsername).toLowerCase();
        const passwordMatches = await verifyLocalPassword(elements.loginPassword.value);
        if (!usernameMatches || !passwordMatches) {
          elements.authError.textContent = 'Incorrect username or password.';
          setButtonBusy(submit, false, '');
          return;
        }
        sessionStorage.setItem(LOCAL_SESSION_KEY, 'authenticated');
        elements.loginPassword.value = '';
        setButtonBusy(submit, false, '');
        authorizeLocalSession(true);
      } catch (loginError) {
        elements.authError.textContent = loginError.message || 'Could not sign in.';
        setButtonBusy(submit, false, '');
      }
      return;
    }
    if (!client) { setButtonBusy(submit, false, ''); return; }
    const { data, error } = await client.auth.signInWithPassword({ email: elements.loginEmail.value.trim(), password: elements.loginPassword.value });
    setButtonBusy(submit, false, '');
    if (error) { elements.authError.textContent = error.message; return; }
    elements.loginPassword.value = ''; await authorizeSession(data.session);
  });
  elements.signOut.addEventListener('click', async () => {
    if (hasLocalAdmin) {
      sessionStorage.removeItem(LOCAL_SESSION_KEY);
      authorizeLocalSession(false);
      return;
    }
    elements.signOut.disabled = true; await client.auth.signOut(); elements.signOut.disabled = false; await authorizeSession(null);
  });

  document.querySelectorAll('.sidebar nav a').forEach((link) => link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar nav a').forEach((item) => item.classList.remove('active')); link.classList.add('active');
  }));

  renderDrafts(); renderSongs(); resetSongForm();
  if (!isConfigured) {
    if (hasLocalAdmin) {
      elements.loginHelp.textContent = 'Use the local administrator credentials configured for this site.';
      elements.loginIdentifierLabel.textContent = 'Username';
      elements.loginEmail.autocomplete = 'username';
      authorizeLocalSession(sessionStorage.getItem(LOCAL_SESSION_KEY) === 'authenticated');
      return;
    }
    document.body.classList.remove('auth-pending'); setConnection('Local setup mode', false);
    elements.setupNotice.innerHTML = '<strong>Setup mode</strong><span>Add local admin credentials or Supabase details through .env to protect this page and enable publishing.</span>';
    return;
  }
  client.auth.getSession().then(({ data }) => authorizeSession(data.session)).catch(() => {
    document.body.classList.remove('auth-pending'); elements.authGate.hidden = false;
    elements.authError.textContent = 'Could not connect. Check the Supabase settings and try again.';
  });
})();
