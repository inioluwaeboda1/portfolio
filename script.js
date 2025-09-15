// Smooth anchor clicks + active link + cyclic scroll wrap + mobile menu
(() => {
    const navLinks = [...document.querySelectorAll('.nav-item')];
    const sections = navLinks.map(a => document.getElementById(a.dataset.target));
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.menu-toggle');
    const logoBtn = document.getElementById('logoBtn');

    // Smooth scroll for sidebar links
    navLinks.forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            document.getElementById(a.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMenu();
        });
    });

    logoBtn.addEventListener('click', () => {
        document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
        closeMenu();
    });

    // Mobile menu toggle
    const closeMenu = () => {
        sidebar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
    });

    // Active link highlighting via IntersectionObserver
    const linkById = Object.fromEntries(navLinks.map(a => [a.dataset.target, a]));
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            if (entry.isIntersecting) {
                for (const l of navLinks) l.classList.remove('active');
                linkById[id].classList.add('active');
                linkById[id].setAttribute('aria-current', 'page');
            } else {
                linkById[id].removeAttribute('aria-current');
            }
        });
    }, { root: null, threshold: 0.6 });

    sections.forEach(s => io.observe(s));

    // Cyclic scroll wrap (wheel + touch), debounced to avoid jitter
    let coolDown = false;
    const COOLDOWN_MS = 700;

    const currentSection = () => {
        // Return section most in view
        const mid = window.innerHeight / 2;
        let best = sections[0], bestDist = Infinity;
        sections.forEach(sec => {
            const rect = sec.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const dist = Math.abs(center - mid);
            if (dist < bestDist) { bestDist = dist; best = sec; }
        });
        return best;
    };

    const wrapIfNeeded = (direction) => {
        if (coolDown) return;
        const cur = currentSection();
        const rect = cur.getBoundingClientRect();

        // Downward wrap: at bottom of Projects -> About
        if (direction === 'down' && cur.id === 'projects' && rect.bottom <= window.innerHeight + 2) {
            coolDown = true;
            document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => (coolDown = false), COOLDOWN_MS);
        }

        // Upward wrap: above top of About -> Projects
        if (direction === 'up' && cur.id === 'about' && rect.top >= -2) {
            coolDown = true;
            document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => (coolDown = false), COOLDOWN_MS);
        }
    };

    // Wheel
    window.addEventListener('wheel', (e) => {
        const dir = e.deltaY > 0 ? 'down' : 'up';
        wrapIfNeeded(dir);
    }, { passive: true });

    // Touch (mobile)
    let touchStartY = null;
    window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', (e) => {
        if (touchStartY === null) return;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dir = dy < -40 ? 'down' : dy > 40 ? 'up' : null;
        if (dir) wrapIfNeeded(dir);
        touchStartY = null;
    }, { passive: true });

})();
