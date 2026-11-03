(function () {
  'use strict';

  const key = 'yam-minstrels-songs-v1';
  const fields = 'id,title,artist,lyrics,price,buy_url,published,display_order,created_at,updated_at';
  const newId = () => window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function validateSong(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Each song must contain song details.');
    for (const name of ['title', 'artist', 'lyrics', 'price', 'buy_url']) {
      if (value[name] != null && typeof value[name] !== 'string') throw new Error(`The ${name} field must be text.`);
    }
    if (value.published != null && typeof value.published !== 'boolean') throw new Error('A song’s published setting must be true or false.');
    const song = {
      title: String(value.title || '').trim(),
      artist: String(value.artist || 'YAM Minstrels').trim(),
      lyrics: String(value.lyrics || '').trim(),
      price: String(value.price || '').trim(),
      buy_url: String(value.buy_url || '').trim(),
      display_order: Number(value.display_order ?? 0),
      published: value.published !== false
    };
    if (!song.title || song.title.length > 120) throw new Error('Enter a song title of 1–120 characters.');
    if (!song.artist || song.artist.length > 120) throw new Error('Enter a writer or artist of 1–120 characters.');
    if (!song.lyrics || song.lyrics.length > 12000) throw new Error('Enter lyrics of 1–12,000 characters.');
    if (song.price.length > 40) throw new Error('Keep the price label under 41 characters.');
    if (!Number.isInteger(song.display_order) || song.display_order < 0 || song.display_order > 999) throw new Error('Display order must be a whole number from 0 to 999.');
    if (song.buy_url) {
      let url;
      try { url = new URL(song.buy_url); } catch (_) { throw new Error('Enter a complete purchase link beginning with https:// or http://.'); }
      if (!['https:', 'http:'].includes(url.protocol) || song.buy_url.length > 500) throw new Error('Use a purchase link beginning with https:// or http://, up to 500 characters.');
    }
    return song;
  }

  function normalizeSong(value) {
    return { ...validateSong(value), id: String(value.id || newId()), created_at: value.created_at || new Date().toISOString(), updated_at: value.updated_at || value.created_at || new Date().toISOString() };
  }

  function parse(text) {
    let value;
    try { value = JSON.parse(text); } catch (_) { throw new Error('This song library is not valid JSON. Your saved songs have not been changed.'); }
    const rows = Array.isArray(value) ? value : value?.songs;
    if (!Array.isArray(rows)) throw new Error('Choose a songbook backup containing a songs list.');
    const songs = rows.map(normalizeSong);
    if (new Set(songs.map((song) => song.id)).size !== songs.length) throw new Error('The backup contains duplicate song IDs.');
    return songs;
  }

  function readLocal() {
    const text = localStorage.getItem(key);
    return text === null ? [] : parse(text);
  }

  function writeLocal(songs) {
    const validated = parse(JSON.stringify(songs));
    try { localStorage.setItem(key, JSON.stringify(validated)); }
    catch (_) { throw new Error('Could not save songs in this browser. Storage may be full or blocked. Your form has been kept; download a backup before clearing browser data.'); }
    return validated;
  }

  const sort = (songs) => [...songs].sort((a, b) => a.display_order - b.display_order || String(a.created_at || '').localeCompare(String(b.created_at || '')) || a.title.localeCompare(b.title));
  window.YAM_SONGBOOK = Object.freeze({ key, fields, newId, validateSong, normalizeSong, parse, readLocal, writeLocal, sort });
})();
