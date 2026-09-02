(function () {
  'use strict';

  const travailEvent = Object.freeze({
    date: '2026-09-05',
    startTime: '09:00',
    endTime: '15:00',
    venue: 'RWC Auditorium'
  });

  const programSchedule = Object.freeze([
    { time: '09:00', endTime: '09:15', title: 'Arrival & Registration', category: 'general', minister: 'Welcome team' },
    { time: '09:15', endTime: '09:25', title: 'Opening Prayer', category: 'prayer', minister: 'Prayer lead' },
    { time: '09:25', endTime: '09:50', title: 'Praise & Worship', category: 'worship', minister: 'Worship team' },
    { time: '09:50', endTime: '10:00', title: 'Welcome & Introduction', category: 'general', minister: 'YAM host' },
    { time: '10:00', endTime: '10:30', title: 'Prayer Session I', category: 'prayer', minister: 'Prayer lead' },
    { time: '10:30', endTime: '11:15', title: 'Word Session', category: 'word', minister: 'Minister to be announced' },
    { time: '11:15', endTime: '12:00', title: 'Travail · Intense Prayer', category: 'special', minister: 'Prayer ministry' },
    { time: '12:00', endTime: '12:30', title: 'Worship Session', category: 'worship', minister: 'Worship team' },
    { time: '12:30', endTime: '13:00', title: 'Break & Refreshment', category: 'break', minister: '' },
    { time: '13:00', endTime: '13:30', title: 'Word & Exhortation', category: 'word', minister: 'Minister to be announced' },
    { time: '13:30', endTime: '14:15', title: 'Prayer Session II', category: 'prayer', minister: 'Prayer lead' },
    { time: '14:15', endTime: '14:45', title: 'Testimonies & Impartation', category: 'special', minister: 'Facilitation team' },
    { time: '14:45', endTime: '15:00', title: 'Closing & Announcements', category: 'general', minister: 'YAM host' },
    { time: '15:00', endTime: '15:00', title: 'End', category: 'general', minister: '', terminal: true }
  ]);

  const eventStart = Date.parse(`${travailEvent.date}T${travailEvent.startTime}:00+00:00`);
  const eventEnd = Date.parse(`${travailEvent.date}T${travailEvent.endTime}:00+00:00`);
  const wideScreen = window.matchMedia('(min-width: 760px)');

  function sessionStart(session) {
    return Date.parse(`${travailEvent.date}T${session.time}:00+00:00`);
  }

  function sessionEnd(session) {
    return Date.parse(`${travailEvent.date}T${session.endTime}:00+00:00`);
  }

  function formatClock(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  function formatRange(session) {
    return session.terminal ? formatClock(session.time) : `${formatClock(session.time)} – ${formatClock(session.endTime)}`;
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
    timeline.innerHTML = programSchedule.map((session, index) => `
      <article class="timeline-box category-${session.category}" data-session="${index}">
        <span class="box-number">${String(index + 1).padStart(2, '0')}</span>
        <p class="box-time">${formatRange(session)}</p>
        <h3>${session.title}</h3>
        ${session.minister ? `<p class="box-minister">${session.minister}</p>` : ''}
        <span class="box-state" data-box-state>${session.terminal ? 'Finish' : 'Upcoming'}</span>
      </article>`).join('');
    layoutSnake();
  }

  function layoutSnake() {
    const columns = wideScreen.matches ? 3 : 2;
    const boxes = [...document.querySelectorAll('[data-session]')];

    boxes.forEach((box, index) => {
      const row = Math.floor(index / columns) + 1;
      const offset = index % columns;
      const column = row % 2 === 1 ? offset + 1 : columns - offset;
      box.style.gridRow = row;
      box.style.gridColumn = column;
      box.classList.remove('connect-left', 'connect-right', 'connect-down');

      if (index === boxes.length - 1) return;
      const nextIndex = index + 1;
      const nextRow = Math.floor(nextIndex / columns) + 1;
      const nextOffset = nextIndex % columns;
      const nextColumn = nextRow % 2 === 1 ? nextOffset + 1 : columns - nextOffset;
      if (nextRow > row) box.classList.add('connect-down');
      else box.classList.add(nextColumn > column ? 'connect-right' : 'connect-left');
    });
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function updateStatus(now) {
    const state = getProgramState(now);
    const nowBlock = document.querySelector('.status-now');
    if (!nowBlock) return state;
    nowBlock.classList.toggle('is-live', state.phase === 'live');

    if (state.phase === 'before') {
      const days = Math.max(1, Math.ceil((eventStart - state.timestamp) / 86400000));
      setText('[data-now-label]', 'Program countdown');
      setText('[data-now-title]', `Starts in ${days} day${days === 1 ? '' : 's'}`);
      setText('[data-now-time]', 'Saturday · 9:00 AM');
    } else if (state.phase === 'after') {
      setText('[data-now-label]', 'Program complete');
      setText('[data-now-title]', 'Travail 2.0 has ended');
      setText('[data-now-time]', 'Thank you for joining us');
    } else if (state.phase === 'gap') {
      setText('[data-now-label]', 'Happening now');
      setText('[data-now-title]', 'Transition');
      setText('[data-now-time]', 'The next session begins shortly');
    } else {
      const current = programSchedule[state.currentIndex];
      setText('[data-now-label]', 'Happening now');
      setText('[data-now-title]', current.title);
      setText('[data-now-time]', formatRange(current));
    }

    const next = state.nextIndex >= 0 ? programSchedule[state.nextIndex] : null;
    setText('[data-next-title]', next ? next.title : 'Program complete');
    setText('[data-next-time]', next ? formatRange(next) : 'We are prevailing.');

    document.querySelectorAll('[data-session]').forEach((box) => {
      const index = Number(box.dataset.session);
      const session = programSchedule[index];
      const isActive = index === state.currentIndex;
      const isCompleted = session.terminal ? state.timestamp >= sessionStart(session) : state.timestamp >= sessionEnd(session);
      box.classList.toggle('is-active', isActive);
      box.classList.toggle('is-completed', isCompleted && !isActive);
      const label = box.querySelector('[data-box-state]');
      if (label) label.textContent = isActive ? 'Live' : (isCompleted ? 'Done' : (session.terminal ? 'Finish' : 'Upcoming'));
    });

    return state;
  }

  renderTimeline();
  updateStatus();
  if (wideScreen.addEventListener) wideScreen.addEventListener('change', layoutSnake);
  else wideScreen.addListener(layoutSnake);
  window.setInterval(updateStatus, 30000);

  window.YAM_TRAVAIL = Object.freeze({ travailEvent, programSchedule, getProgramState, layoutSnake });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => {}));
  }
})();
