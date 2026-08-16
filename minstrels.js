(function () {
  'use strict';

  const STORAGE_KEY = 'yam-minstrels-songs-v1';
  const config = window.YAM_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase);
  const sampleSongs = [
    {
      id: 'sample-1', title: 'Alive in Your Word', artist: 'YAM Minstrels', price: 'Coming soon', buy_url: '', published: true,
      lyrics: 'You called the morning out of night\nAnd spoke Your courage into me\nNow every step becomes a witness\nOf the grace that set me free\n\nWe are alive, alive in Your Word\nHearts awakened, voices heard\nThrough every season we will sing\nJesus, You are everything'
    },
    {
      id: 'sample-2', title: 'Glorious Day', artist: 'YAM Minstrels', price: 'Coming soon', buy_url: '', published: true,
      lyrics: 'Mercy met me in the waiting\nHope was standing at the door\nAll the fear I used to carry\nCannot hold me anymore\n\nEvery day is a glorious day\nWhen Your presence leads the way\nI will walk in love and truth\nI belong, Lord, I belong to You\n\nLet the weary find a family\nLet the searching find a home\nIn the fellowship of heaven\nNone of us will walk alone'
    },
    {
      id: 'sample-3', title: 'Made Alive', artist: 'YAM Minstrels', price: 'Coming soon', buy_url: '', published: true,
      lyrics: 'Not by strength and not by striving\nBy Your Spirit we arise\nYoung and chosen, filled with purpose\nWith Your fire in our eyes\n\nMade alive in Christ forever\nBuilt in grace and joined together\nWe will shine through every night\nBy Your Word we are made alive'
    }
  ];

  const readLocalSongs = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Array.isArray(saved) ? saved.filter((song) => song.published !== false) : sampleSongs;
    } catch (_error) {
      return sampleSongs;
    }
  };

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

  const loadSongs = async () => {
    if (!isConfigured) {
      renderSongs(readLocalSongs());
      return;
    }

    const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await client.from('minstrel_songs')
      .select('id,title,artist,lyrics,price,buy_url,published,display_order')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    renderSongs(error ? readLocalSongs() : (data || []));
  };

  loadSongs();
})();
