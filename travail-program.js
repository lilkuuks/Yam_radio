(function () {
  'use strict';

  const event = window.YAM_EVENT;
  if (!event) return;

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function updateStatus() {
    const state = event.getState();
    const block = document.querySelector('.status-now');
    if (!block) return;
    block.classList.toggle('is-live', state.phase === 'live');
    if (state.phase === 'before') {
      setText('[data-now-label]', 'Event countdown');
      setText('[data-now-title]', `${state.days}d ${state.hours}h ${state.minutes}m to go`);
      setText('[data-now-time]', 'Friday, 13 November · 9:00 PM GMT');
    } else if (state.phase === 'live') {
      setText('[data-now-label]', 'Happening now');
      setText('[data-now-title]', 'Travail 3.0');
      setText('[data-now-time]', 'Until Saturday, 14 November · 6:00 AM GMT');
    } else {
      setText('[data-now-label]', 'Event complete');
      setText('[data-now-title]', 'Thank you for joining us');
      setText('[data-now-time]', 'Travail 3.0 has ended');
    }
  }

  updateStatus();
  window.setInterval(updateStatus, 30000);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => {}));
  }
})();
