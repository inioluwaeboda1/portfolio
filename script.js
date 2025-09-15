// Smooth anchors + active link + STALL-DETECTED cyclic wrap + mobile menu
(() => {
  const navLinks = [...document.querySelectorAll('.nav-item')];
  const sections = navLinks.map(a => document.getElementById(a.dataset.target));
  const sidebar = document.querySelector('.sidebar');
  const menuBtn = document.querySelector('.menu-toggle');
  const logoBtn = document.getElementById('logoBtn');

  // Smooth anchor clicks
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMenu();
    });
  });
  logoBtn?.addEventListener('click', () => {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    closeMenu();
  });

  // Mobile menu
  const closeMenu = () => {
    sidebar.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  };
  menuBtn?.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  // Active link (IntersectionObserver)
  const linkById = Object.fromEntries(navLinks.map(a => [a.dataset.target, a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        linkById[id].classList.add('active');
        linkById[id].setAttribute('aria-current', 'page');
      } else {
        linkById[id].removeAttribute('aria-current');
      }
    });
  }, { threshold: 0.6 });
  sections.forEach(s => io.observe(s));


  
  let coolDown = false;
  const COOLDOWN_MS = 700;
  const CONFIRM_MS = 900;
  const TOL = 1;

  let lastDir = null;
  let lastTime = 0;
  let stalledCount = 0;

  const atTop = () => window.scrollY <= TOL;
  const atBottom = () =>
    Math.ceil(window.scrollY + window.innerHeight) >=
    (document.documentElement.scrollHeight - TOL);

  const confirmStalled = (dir, stalled) => {
    const now = Date.now();
    if (stalled && dir === lastDir && (now - lastTime) < CONFIRM_MS) {
      stalledCount += 1;
    } else {
      stalledCount = stalled ? 1 : 0;
    }
    lastDir = dir;
    lastTime = now;
    return stalledCount >= 2; // require two stalled nudges
  };

  const wrapTo = (id) => {
    coolDown = true;
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => (coolDown = false), COOLDOWN_MS);
  };

  // Wheel: detect "stalled" (no movement) first
  window.addEventListener('wheel', (e) => {
    if (coolDown) return;
    const dir = e.deltaY > 0 ? 'down' : 'up';
    const beforeY = window.scrollY;

    // After the wheel event, check if the page actually moved
    requestAnimationFrame(() => {
      const afterY = window.scrollY;
      const stalled = Math.abs(afterY - beforeY) < 0.5;

      if (dir === 'down' && atBottom() && confirmStalled('down', stalled)) {
        wrapTo('about');
      } else if (dir === 'up' && atTop() && confirmStalled('up', stalled)) {
        wrapTo('projects');
      }
    });
  }, { passive: true });

  // Touch (mobile): require two real swipes while at edge
  let touchStartY = null;
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (coolDown || touchStartY === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dir = dy < -60 ? 'down' : dy > 60 ? 'up' : null; // stronger swipe
    if (!dir) { touchStartY = null; return; }

    const stalled = (dir === 'down' && atBottom()) || (dir === 'up' && atTop());
    if (dir === 'down' && atBottom() && confirmStalled('down', stalled)) {
      wrapTo('about');
    } else if (dir === 'up' && atTop() && confirmStalled('up', stalled)) {
      wrapTo('projects');
    }
    touchStartY = null;
  }, { passive: true });
})();
