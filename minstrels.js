(function () {
  'use strict';

  const songbook = window.YAM_SONGBOOK;
  const STORAGE_KEY = songbook.key;
  const config = window.YAM_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase);
  const readLocalSongs = () => songbook.sort(songbook.readLocal().filter((song) => song.published));

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const safeBuyUrl = (value) => {
    if (!value) return '';
    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
    } catch (_error) {
      return '';
    }
  };

  const renderSongs = (songs) => {
    const grid = document.querySelector('#song-grid');
    const empty = document.querySelector('#song-empty');
    if (!songs.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    grid.innerHTML = songs.map((song, index) => {
      const buyUrl = safeBuyUrl(song.buy_url);
      const lyrics = escapeHtml(song.lyrics);
      const isLong = String(song.lyrics || '').length > 260 || String(song.lyrics || '').split('\n').length > 9;
      return `
        <article class="song-card">
          <p class="song-index"><span>Song ${String(index + 1).padStart(2, '0')}</span></p>
          <h3>${escapeHtml(song.title)}</h3>
          <p class="song-byline">Written by ${escapeHtml(song.artist || 'YAM Minstrels')}</p>
          <div class="lyrics${isLong ? ' is-collapsed' : ''}" id="lyrics-${index}">${lyrics}</div>
          ${isLong ? `<button class="read-more" type="button" aria-expanded="false" aria-controls="lyrics-${index}">Read full lyrics</button>` : ''}
          <div class="song-actions">
            <span class="song-price">${escapeHtml(song.price || 'Purchase')}</span>
            ${buyUrl
              ? `<a class="buy-song" href="${escapeHtml(buyUrl)}" target="_blank" rel="noopener">Buy song <span aria-hidden="true">↗</span></a>`
              : '<span class="buy-song" aria-disabled="true">Buy song · Soon</span>'}
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('.read-more').forEach((button) => {
      button.addEventListener('click', () => {
        const lyrics = document.getElementById(button.getAttribute('aria-controls'));
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        button.textContent = expanded ? 'Read full lyrics' : 'Show less';
        lyrics.classList.toggle('is-collapsed', expanded);
        lyrics.classList.toggle('is-expanded', !expanded);
      });
    });
  };

  let loading = false;
  const status = document.querySelector('#songbook-status');
  const retry = document.querySelector('#songbook-retry');
  const loadSongs = async () => {
    if (loading) return;
    loading = true; retry.disabled = true;
    try {
      let songs;
      if (!isConfigured) {
        songs = readLocalSongs();
        status.textContent = songs.length ? 'These songs are saved in this browser only.' : '';
        status.hidden = !songs.length;
      } else {
        const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data, error } = await client.from('minstrel_songs')
          .select(songbook.fields).eq('published', true)
          .order('display_order', { ascending: true }).order('created_at', { ascending: true });
        if (error) throw error;
        songs = data || []; status.hidden = true;
      }
      renderSongs(songs); retry.hidden = true;
    } catch (_error) {
      document.querySelector('#song-empty').hidden = true;
      status.textContent = 'Could not load the songbook. Your saved songs have not been changed. Please try again.';
      status.hidden = false; retry.hidden = false;
    } finally { loading = false; retry.disabled = false; }
  };

  retry.addEventListener('click', loadSongs);
  window.addEventListener('storage', (event) => {
    if (!isConfigured && event.key === STORAGE_KEY) loadSongs();
  });
  window.addEventListener('focus', loadSongs);
  loadSongs();
})();
