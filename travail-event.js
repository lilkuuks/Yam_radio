(function () {
  'use strict';

  const event = Object.freeze({
    title: 'Travail 3.0',
    start: '2026-11-13T21:00:00+00:00',
    end: '2026-11-14T06:00:00+00:00',
    timezone: 'Africa/Accra',
    venue: 'RWC Auditorium',
    registrationUrl: 'https://qrco.de/bh5Oq6'
  });
  const start = Date.parse(event.start);
  const end = Date.parse(event.end);

  function getState(now = Date.now()) {
    const phase = now < start ? 'before' : now < end ? 'live' : 'after';
    const seconds = Math.max(0, Math.floor((start - now) / 1000));
    return {
      phase,
      days: Math.floor(seconds / 86400),
      hours: Math.floor(seconds / 3600) % 24,
      minutes: Math.floor(seconds / 60) % 60,
      seconds: seconds % 60
    };
  }

  function updateCountdown() {
    const state = getState();
    document.querySelectorAll('[data-event-status]').forEach((node) => {
      node.textContent = state.phase === 'before' ? 'The night begins in'
        : state.phase === 'live' ? 'Travail 3.0 is happening now · Until 6:00 AM GMT'
          : 'Travail 3.0 has ended · Thank you for joining us';
    });
    document.querySelectorAll('[data-countdown]').forEach((node) => { node.hidden = state.phase !== 'before'; });
    ['days', 'hours', 'minutes', 'seconds'].forEach((unit) => {
      document.querySelectorAll(`[data-countdown-${unit}]`).forEach((node) => {
        node.textContent = String(state[unit]).padStart(2, '0');
      });
    });
  }

  window.YAM_EVENT = Object.freeze({ ...event, getState });
  updateCountdown();
  if (document.querySelector('[data-countdown]')) window.setInterval(updateCountdown, 1000);
})();
