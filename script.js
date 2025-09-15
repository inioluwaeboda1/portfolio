// Smooth anchors + active link + SAFE cyclic wrap + mobile menu
(() => {
  const navLinks = [...document.querySelectorAll('.nav-item')];
  const sections = navLinks.map(a => document.getElementById(a.dataset.target));
  const sidebar = document.querySelector('.sidebar');
  const menuBtn = document.querySelector('.menu-toggle');
  const logoBtn = document.getElementById('logoBtn');

  // ---- Smooth anchor clicks
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

  // ---- Mobile menu
  const closeMenu = () => {
    sidebar.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  };
  menuBtn?.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  // ---- Active link (IntersectionObserver)
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

  // ---- Safer cyclic wrap
  // Only wrap when:
  // 1) You're truly at the top or bottom (with small tolerance)
  // 2) You make TWO consecutive scrolls in that direction within 800ms
  // 3) Cooldown to prevent jitter
  let coolDown = false;
  const COOLDOWN_MS = 700;
  const CONFIRM_MS = 800;
  const TOL = 2; // px tolerance

  let lastDir = null;
  let lastTime = 0;
  let dirCount = 0;

  const confirmDirection = (dir) => {
    const now = Date.now();
    if (dir === lastDir && (now - lastTime) < CONFIRM_MS) {
      dirCount += 1;
    } else {
      dirCount = 1;
    }
    lastDir = dir;
    lastTime = now;
    return dirCount >= 2; // require two nudges
  };

  const atTop = () => window.scrollY <= TOL;
  const atBottom = () => (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - TOL);

  const wrapTo = (id) => {
    coolDown = true;
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { coolDown = false; }, COOLDOWN_MS);
  };

  // Wheel
  window.addEventListener('wheel', (e) => {
    if (coolDown) return;
    const dir = e.deltaY > 0 ? 'down' : 'up';

    // Only consider wrapping if *truly* at edges and user confirms direction
    if (dir === 'down' && atBottom() && confirmDirection('down')) {
      wrapTo('about');     // bottom -> About
    } else if (dir === 'up' && atTop() && confirmDirection('up')) {
      wrapTo('projects');  // top -> Projects
    }
  }, { passive: true });

  // Touch (mobile)
  let touchStartY = null;
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (coolDown || touchStartY === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dir = dy < -40 ? 'down' : dy > 40 ? 'up' : null; // need a real swipe
    if (!dir) return;

    if (dir === 'down' && atBottom() && confirmDirection('down')) {
      wrapTo('about');
    } else if (dir === 'up' && atTop() && confirmDirection('up')) {
      wrapTo('projects');
    }
    touchStartY = null;
  }, { passive: true });
})();
