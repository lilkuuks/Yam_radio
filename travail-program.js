(function () {
  'use strict';

  const travailEvent = Object.freeze({
    title: 'Travail',
    edition: '2.0',
    date: '2026-09-05',
    startTime: '09:00',
    endTime: '15:00',
    timeZone: 'Africa/Accra',
    venue: 'RWC Auditorium',
    tagline: 'A glorious time of worship, prayer and the Word.',
    scripture: 'Isaiah 66:8'
  });

  const programSchedule = Object.freeze([
    { id: 'arrival', time: '09:00', endTime: '09:15', title: 'Arrival & Registration', category: 'general', minister: 'Welcome team', description: 'Arrive, settle in and prepare your heart for the day.' },
    { id: 'opening-prayer', time: '09:15', endTime: '09:25', title: 'Opening Prayer', category: 'prayer', minister: 'Prayer lead', description: 'The gathering opens in prayer and consecration.' },
    { id: 'praise-worship', time: '09:25', endTime: '09:50', title: 'Praise & Worship', category: 'worship', minister: 'Worship team', description: 'A focused time of praise and worship in God’s presence.' },
    { id: 'welcome', time: '09:50', endTime: '10:00', title: 'Welcome & Introduction', category: 'general', minister: 'YAM host', description: 'Welcome, orientation and the spiritual focus for Travail 2.0.' },
    { id: 'prayer-one', time: '10:00', endTime: '10:30', title: 'Prayer Session I', category: 'prayer', minister: 'Prayer lead', description: 'A guided prayer session centered on yielding, renewal and prevailing.' },
    { id: 'word-one', time: '10:30', endTime: '11:15', title: 'Word Session', category: 'word', minister: 'Minister to be announced', description: 'Teaching and exhortation from the Word of God.', scripture: 'Isaiah 66:8' },
    { id: 'travail', time: '11:15', endTime: '12:00', title: 'Travail · Intense Prayer', category: 'special', minister: 'Prayer ministry', description: 'An extended corporate prayer moment—the heart of the Travail gathering.' },
    { id: 'worship', time: '12:00', endTime: '12:30', title: 'Worship Session', category: 'worship', minister: 'Worship team', description: 'Unhurried worship and response in God’s presence.' },
    { id: 'break', time: '12:30', endTime: '13:00', title: 'Break & Refreshment', category: 'break', minister: '', description: 'A short pause for refreshments, rest and fellowship.' },
    { id: 'word-two', time: '13:00', endTime: '13:30', title: 'Word & Exhortation', category: 'word', minister: 'Minister to be announced', description: 'A concise charge to strengthen faith and sustain the posture of prayer.' },
    { id: 'prayer-two', time: '13:30', endTime: '14:15', title: 'Prayer Session II', category: 'prayer', minister: 'Prayer lead', description: 'Corporate intercession, declarations and personal response.' },
    { id: 'testimonies', time: '14:15', endTime: '14:45', title: 'Testimonies & Impartation', category: 'special', minister: 'Facilitation team', description: 'Testimonies, ministry and a final moment of impartation.' },
    { id: 'closing', time: '14:45', endTime: '15:00', title: 'Closing & Announcements', category: 'general', minister: 'YAM host', description: 'Closing prayer, acknowledgements and important announcements.' },
    { id: 'end', time: '15:00', endTime: '15:00', title: 'End', category: 'general', minister: '', description: 'Travail 2.0 concludes. Thank you for joining us.', terminal: true }
  ]);

  const ministers = Object.freeze([
    { title: 'Word Ministry', role: 'Word sessions', note: 'Minister details will be added when confirmed.', image: '../Assets/travail-card-word.webp', alt: 'Young man worshipping during a Youth Alive Meets gathering' },
    { title: 'Prayer Ministry', role: 'Travail & prayer', note: 'Session leadership details will be added when confirmed.', image: '../Assets/travail-card-community.webp', alt: 'Young people praying together during a Youth Alive Meets gathering' },
    { title: 'Worship Team', role: 'Praise & worship', note: 'Team details will be added when confirmed.', image: '../Assets/travail-card-worship.webp', alt: 'Young woman worshipping during a Youth Alive Meets gathering' }
  ]);

  const categoryLabels = Object.freeze({
    general: 'Program',
    prayer: 'Prayer',
    worship: 'Worship',
    word: 'Word',
    break: 'Break',
    special: 'Special moment'
  });

  const eventStart = new Date(`${travailEvent.date}T${travailEvent.startTime}:00+00:00`).getTime();
  const eventEnd = new Date(`${travailEvent.date}T${travailEvent.endTime}:00+00:00`).getTime();

  function sessionStart(session) {
    return new Date(`${travailEvent.date}T${session.time}:00+00:00`).getTime();
  }

  function sessionEnd(session) {
    return new Date(`${travailEvent.date}T${session.endTime}:00+00:00`).getTime();
  }

  function formatClock(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }

  function formatRange(session) {
    if (session.terminal) return formatClock(session.time);
    return `${formatClock(session.time)} – ${formatClock(session.endTime)}`;
  }

  function countdown(milliseconds) {
    const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days) return `${days} day${days === 1 ? '' : 's'}${hours ? ` · ${hours} hr` : ''}`;
    if (hours) return `${hours} hr${minutes ? ` · ${minutes} min` : ''}`;
    return `${minutes} min`;
  }

  function getProgramState(now) {
    const timestamp = typeof now === 'number' ? now : Date.now();
    if (timestamp < eventStart) return { phase: 'before', currentIndex: -1, nextIndex: 0, timestamp };
    if (timestamp >= eventEnd) return { phase: 'after', currentIndex: -1, nextIndex: -1, timestamp };

    const currentIndex = programSchedule.findIndex((session) => !session.terminal && timestamp >= sessionStart(session) && timestamp < sessionEnd(session));
    const nextIndex = programSchedule.findIndex((session) => !session.terminal && sessionStart(session) > timestamp);
    return { phase: currentIndex >= 0 ? 'live' : 'gap', currentIndex, nextIndex, timestamp };
  }

  function renderTimeline() {
    const timeline = document.querySelector('[data-program-timeline]');
    if (!timeline) return;

    timeline.innerHTML = programSchedule.map((session, index) => {
      const [clock, suffix] = formatClock(session.time).split(' ');
      const minister = session.minister ? `<p class="session-minister">${session.minister}</p>` : '';
      return `
        <article class="timeline-item category-${session.category}" data-session-item="${index}" id="session-${session.id}">
          <div class="session-time"><time datetime="${travailEvent.date}T${session.time}:00+00:00">${clock}</time><span>${suffix}</span></div>
          <div class="timeline-marker" aria-hidden="true"><span></span></div>
          <button class="session-card" type="button" data-session-open="${index}" aria-haspopup="dialog" aria-label="View details for ${session.title}, ${formatRange(session)}">
            <span class="session-meta"><span class="session-category">${categoryLabels[session.category]}</span><span class="session-status" data-session-status>${session.terminal ? 'Finish' : 'Upcoming'}</span></span>
            <h3>${session.title}</h3>
            ${minister}
            <span class="session-open" aria-hidden="true">+</span>
          </button>
        </article>`;
    }).join('');
  }

  function renderMinisters() {
    const track = document.querySelector('[data-ministers]');
    if (!track) return;
    track.innerHTML = ministers.map((minister) => `
      <article class="minister-card">
        <img src="${minister.image}" alt="${minister.alt}" width="360" height="270" loading="lazy" decoding="async" />
        <div class="minister-card-copy">
          <p class="minister-role">${minister.role}</p>
          <h3>${minister.title}</h3>
          <p>${minister.note}</p>
        </div>
      </article>`).join('');
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function updateNext(session, index) {
    if (!session) {
      setText('[data-next-index]', '—');
      setText('[data-next-title]', 'Program complete');
      setText('[data-next-time]', 'Thank you for joining us.');
      setText('[data-next-minister]', 'We are prevailing.');
      return;
    }
    setText('[data-next-index]', String(index + 1).padStart(2, '0'));
    setText('[data-next-title]', session.title);
    setText('[data-next-time]', formatRange(session));
    setText('[data-next-minister]', session.minister || categoryLabels[session.category]);
  }

  function updateProgramStatus(now) {
    const state = getProgramState(now);
    const liveCard = document.querySelector('.live-card');
    if (!liveCard) return state;

    liveCard.classList.toggle('is-live', state.phase === 'live');
    liveCard.classList.toggle('is-before', state.phase === 'before');
    liveCard.classList.toggle('is-after', state.phase === 'after');

    if (state.phase === 'before') {
      setText('[data-live-label]', 'Program countdown');
      setText('[data-live-state]', `Begins in ${countdown(eventStart - state.timestamp)}`);
      setText('[data-live-title]', 'Travail begins soon');
      setText('[data-live-time]', 'Saturday · 9:00 AM');
      setText('[data-live-description]', 'Return here during the event for the current session and time remaining.');
      updateNext(programSchedule[0], 0);
    } else if (state.phase === 'after') {
      setText('[data-live-label]', 'Program complete');
      setText('[data-live-state]', 'After the program');
      setText('[data-live-title]', 'Travail 2.0 has ended');
      setText('[data-live-time]', 'Saturday · 3:00 PM');
      setText('[data-live-description]', 'Thank you for joining Youth Alive Meets for a glorious time in God’s presence.');
      updateNext(null, -1);
    } else if (state.phase === 'gap') {
      setText('[data-live-label]', 'Happening now');
      setText('[data-live-state]', 'Transition moment');
      setText('[data-live-title]', 'Preparing for the next session');
      setText('[data-live-time]', state.nextIndex >= 0 ? `Next at ${formatClock(programSchedule[state.nextIndex].time)}` : 'Program in progress');
      setText('[data-live-description]', 'Stay close—the program continues shortly.');
      updateNext(programSchedule[state.nextIndex], state.nextIndex);
    } else {
      const current = programSchedule[state.currentIndex];
      const remaining = sessionEnd(current) - state.timestamp;
      setText('[data-live-label]', 'Live');
      setText('[data-live-state]', `Ends in ${countdown(remaining)}`);
      setText('[data-live-title]', current.title);
      setText('[data-live-time]', formatRange(current));
      setText('[data-live-description]', current.minister ? `Led by ${current.minister}. ${current.description}` : current.description);
      updateNext(programSchedule[state.nextIndex], state.nextIndex);
    }

    document.querySelectorAll('[data-session-item]').forEach((item) => {
      const index = Number(item.dataset.sessionItem);
      const session = programSchedule[index];
      const start = sessionStart(session);
      const end = sessionEnd(session);
      const isActive = index === state.currentIndex;
      const isCompleted = session.terminal ? state.timestamp >= start : state.timestamp >= end;
      const label = item.querySelector('[data-session-status]');
      item.classList.toggle('is-active', isActive);
      item.classList.toggle('is-completed', isCompleted && !isActive);
      if (label) label.textContent = isActive ? 'Live' : (isCompleted ? 'Completed' : (session.terminal ? 'Finish' : 'Upcoming'));
    });

    return state;
  }

  function setupDialog() {
    const dialog = document.querySelector('#session-dialog');
    if (!dialog) return;
    const closeButton = dialog.querySelector('.dialog-close');

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-session-open]');
      if (!trigger) return;
      const session = programSchedule[Number(trigger.dataset.sessionOpen)];
      if (!session) return;

      setText('[data-dialog-category]', categoryLabels[session.category]);
      setText('[data-dialog-title]', session.title);
      setText('[data-dialog-time]', formatRange(session));
      setText('[data-dialog-minister]', session.minister);
      setText('[data-dialog-scripture]', session.scripture || '');
      setText('[data-dialog-description]', session.description);
      document.querySelector('[data-dialog-minister-wrap]').hidden = !session.minister;
      document.querySelector('[data-dialog-scripture-wrap]').hidden = !session.scripture;
      dialog.showModal();
    });

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
  }

  function setupBackToNow() {
    const button = document.querySelector('[data-back-to-now]');
    const nowSection = document.querySelector('#now');
    if (!button || !nowSection) return;

    const updateVisibility = () => {
      button.hidden = window.scrollY < nowSection.offsetTop + nowSection.offsetHeight;
    };
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
    button.addEventListener('click', () => nowSection.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function setupReveals() {
    const items = document.querySelectorAll('.timeline-item');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((item) => observer.observe(item));
  }

  renderTimeline();
  renderMinisters();
  updateProgramStatus();
  setupDialog();
  setupBackToNow();
  setupReveals();
  window.setInterval(() => updateProgramStatus(), 30000);

  window.YAM_TRAVAIL = Object.freeze({ travailEvent, programSchedule, ministers, getProgramState });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('../sw.js').catch(() => {
        /* The live page remains usable when private browsing blocks offline support. */
      });
    });
  }
})();
