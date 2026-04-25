/* ─────────────────────────────────────────────
   NOE BAPTISM — script.js
───────────────────────────────────────────── */

/* ── MUSIC ── */
const bgMusic     = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

bgMusic.volume = 0;

let fadeInterval = null;

function fadeAudio(targetVol, duration, onDone) {
  if (fadeInterval) clearInterval(fadeInterval);
  const steps    = 40;
  const stepTime = duration / steps;
  const startVol = bgMusic.volume;
  const delta    = (targetVol - startVol) / steps;
  let   current  = 0;
  fadeInterval = setInterval(() => {
    current++;
    bgMusic.volume = Math.min(1, Math.max(0, startVol + delta * current));
    if (current >= steps) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      if (onDone) onDone();
    }
  }, stepTime);
}

musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicToggle.classList.add('playing');
    fadeAudio(0.1, 800);
  } else {
    fadeAudio(0, 600, () => bgMusic.pause());
    musicToggle.classList.remove('playing');
  }
});

/* Pause when browser is backgrounded / closed on mobile */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    bgMusic.pause();
  } else {
    bgMusic.play().catch(() => {});
  }
});

/* Auto-start on first user interaction (bypasses browser autoplay block) */
/* musicStarted is reset on every page load — music always starts fresh */
let musicStarted = false;
function startMusicOnInteraction() {
  if (musicStarted) return;
  musicStarted = true;
  bgMusic.play().then(() => {
    musicToggle.classList.add('playing');
    fadeAudio(0.1, 1800);
  }).catch(() => {});
  document.removeEventListener('touchstart', startMusicOnInteraction);
  document.removeEventListener('click', startMusicOnInteraction);
}
document.addEventListener('touchstart', startMusicOnInteraction, { once: true });
document.addEventListener('click',      startMusicOnInteraction, { once: true });

/* ── SCROLL TO TOP ON EVERY LOAD ── */
window.scrollTo(0, 0);
history.scrollRestoration = 'manual';

/* ── INTRO SEQUENCE ── */
const bear    = document.getElementById('intro-bear');
const overlay = document.getElementById('intro-overlay');

// Bear flies in from left → center (0ms)
window.addEventListener('load', () => {
  window.scrollTo(0, 0);

  // Try to start music immediately on load
  bgMusic.play().then(() => {
    musicStarted = true;
    musicToggle.classList.add('playing');
    fadeAudio(0.1, 1800);
  }).catch(() => { /* autoplay blocked — first interaction will trigger it */ });

  // Slight delay so CSS transition is active
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bear.classList.add('center');
    });
  });

  // After fly-in + 1s pause → start revealing elements staggered
  setTimeout(() => {
    const revealEls = document.querySelectorAll('[data-reveal]');
    revealEls.forEach(el => {
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('revealed'), delay);
    });
  }, 1800); // ~0.9s fly-in + 1s pause

  // Bear flies out to the right
  setTimeout(() => {
    bear.classList.remove('center');
    bear.classList.add('exit');
  }, 2000);

  // Remove overlay + unlock scroll after bear is gone
  setTimeout(() => {
    overlay.style.display = 'none';
    document.body.classList.remove('intro-locked');
  }, 2900); // 2000 + 0.85s exit transition
});

/* ── TIMELINE DATA ── */
const timelineData = {
  church: {
    img:   'dove.png',
    title: 'მეფისქალაქის ტაძარი',
    body:  '13:00 - ნათლობის ცერემონია'
  },
  reception: {
    img:   'horse.png',
    title: 'დარბაზი სალხინაშვილების',
    body:  '17:00 - სადღეგრძელო სუფრა და სიხარული'
  }
};

/* ── BALLOON FOLLOW (click only) ── */
const tlItems   = document.querySelectorAll('.tl-item');
const tlBalloon = document.getElementById('tlBalloon');

let balloonBaseTop = -180;

function moveBalloonTo(item) {
  if (!tlBalloon) return;
  const dotCenterY = item.offsetTop + item.offsetHeight / 2;
  balloonBaseTop = dotCenterY - tlBalloon.offsetHeight + 30;
  tlBalloon.style.top = balloonBaseTop + 'px';
  tlBalloon.classList.add('visible');
}

/* ── MODAL ── */
const modalOverlay = document.getElementById('modalOverlay');
const modalImg     = document.getElementById('modalImg');
const modalTitle   = document.getElementById('modalTitle');
const modalBody    = document.getElementById('modalBody');
const modalClose   = document.getElementById('modalClose');

function openModal(id) {
  const data = timelineData[id];
  if (!data) return;
  modalImg.src           = data.img;
  modalImg.alt           = data.title;
  modalTitle.textContent = data.title;
  modalBody.textContent  = data.body;
  modalOverlay.classList.add('active');
  modalOverlay.removeAttribute('aria-hidden');
}

function closeModal() {
  modalOverlay.classList.remove('active');
  modalOverlay.setAttribute('aria-hidden', 'true');
}

/* Hover dip on timeline items */
tlItems.forEach(item => {
  item.addEventListener('mouseenter', () => {
    if (!tlBalloon) return;
    tlBalloon.style.transition = 'top 0.4s ease, opacity 0.4s ease';
    tlBalloon.style.top = (balloonBaseTop + 20) + 'px';
  });
  item.addEventListener('mouseleave', () => {
    if (!tlBalloon) return;
    tlBalloon.style.transition = 'top 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
    tlBalloon.style.top = balloonBaseTop + 'px';
  });
});

document.querySelectorAll('.tl-card').forEach(card => {
  card.addEventListener('click', () => {
    const item = card.closest('.tl-item');
    tlItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    moveBalloonTo(item);
    openModal(item.dataset.id);
  });
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ── RSVP FORM ── */
const rsvpForm = document.getElementById('rsvpForm');
const rsvpSuccess = document.getElementById('rsvpSuccess');
const API_URL = 'https://weddsites-backend.vercel.app/api/rsvp';
const PROJECT_ID = 'sergi-baptism-2026';

async function submitRsvp(payload) {
  const requestBody = {
    projectId: PROJECT_ID,
    name: (payload.name || '').trim(),
    surname: payload.surname || '',
    attendance: payload.attendance,
    guestCount:
      payload.guestCount === undefined || payload.guestCount === null || payload.guestCount === ''
        ? undefined
        : Number(payload.guestCount)
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  let result = {};
  try {
    result = await response.json();
  } catch (parseError) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.error || 'RSVP submit failed');
  }

  return result;
}

if (rsvpForm && rsvpSuccess) {
  rsvpForm.addEventListener('submit', async e => {
    e.preventDefault();

    const formData = new FormData(rsvpForm);
    const name = (formData.get('guestName') || '').toString().trim();
    const surname = (formData.get('guestSurname') || '').toString().trim();
    const attendance = formData.get('attendance');
    const guestCountRaw = formData.get('guestCount');
    const submitButton = rsvpForm.querySelector('.rsvp-submit');
    const shouldSendGuestCount = attendance === 'yes';

    if (!name || !attendance) {
      rsvpSuccess.textContent = 'გთხოვთ შეავსოთ აუცილებელი ველები.';
      rsvpSuccess.hidden = false;
      return;
    }

    if (submitButton) submitButton.disabled = true;
    rsvpSuccess.textContent = 'იგზავნება...';
    rsvpSuccess.hidden = false;

    try {
      await submitRsvp({
        name,
        surname,
        attendance,
        guestCount: shouldSendGuestCount ? guestCountRaw : undefined
      });

      rsvpSuccess.textContent = `მადლობა, ${name}. თქვენი პასუხი მიღებულია.`;
      rsvpSuccess.hidden = false;
      rsvpForm.reset();
    } catch (error) {
      rsvpSuccess.textContent = error && error.message
        ? `შეცდომა: ${error.message}`
        : 'შეცდომა დაფიქსირდა, გთხოვთ სცადოთ თავიდან.';
      rsvpSuccess.hidden = false;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
