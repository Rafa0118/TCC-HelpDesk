/* ============================================
   HELPIUM - Navigation Module
   initNavigation() - section switching
   ============================================ */

const Navigation = {
  init() {
    const triggers = document.querySelectorAll('[data-target]');
    const sections = document.querySelectorAll('.section');

    triggers.forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.dataset.target;

        // If target is an external page, navigate there
        if (target && target.includes('.html')) {
          window.location.href = target;
          return;
        }

        // Otherwise, switch sections
        this.showSection(target, sections, document.querySelectorAll('[data-target]'));
        Sidebar.closeMobileMenu();
      });
    });

    // Update URL hash when switching sections, if hash navigation is used
    window.addEventListener('hashchange', () => {
      this.openFromHash();
    });
  },

  /**
   * Play a bell-ring animation on the notification button
   */
  ringBell() {
    const bell = document.getElementById('notificationsBtn');
    if (!bell) return;
    bell.classList.remove('ringing');
    void bell.offsetWidth; // force reflow so the animation replays
    bell.classList.add('ringing');
  },

  /**
   * Animate a numeric stat value counting up from zero
   * Supports: "42", "42m", "96%", "1,5", "1.234"
   */
  animateCounter(el) {
    if (!el || el.dataset.counted === 'true') return;
    const raw = el.textContent.trim().replace(/\s/g, '');
    const match = raw.match(/^([+-]?)(\d+(?:[.,]\d+)?)(.*)$/);
    if (!match) return;

    const [, sign, numPart, suffix] = match;
    const hasComma = numPart.includes(',');
    const isThousands = /^\d{1,3}(\.\d{3})+$/.test(numPart); // e.g. 1.234
    const target = isThousands
      ? parseInt(numPart.replace(/\./g, ''), 10)
      : parseFloat(numPart.replace(/\./g, '').replace(',', '.'));
    if (isNaN(target)) return;

    const decimals = hasComma ? numPart.split(',')[1].length : 0;

    el.dataset.counted = 'true';
    const duration = 800;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      let out;
      if (hasComma) {
        out = (target * eased).toFixed(decimals).replace('.', ',');
      } else {
        out = String(Math.round(target * eased)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
      el.textContent = sign + out + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  showSection(targetId, sections, navTriggers) {
    if (!sections) sections = document.querySelectorAll('.section');
    if (!navTriggers) navTriggers = document.querySelectorAll('[data-target]');

    sections.forEach((section) => {
      section.classList.toggle('active', section.id === targetId);
    });

    navTriggers.forEach((el) => {
      el.classList.toggle('active', el.dataset.target === targetId);
    });

    // Re-trigger entrance animations for the now-visible section
    const activeSection = document.getElementById(targetId);
    if (activeSection) {
      activeSection.querySelectorAll('.hero-box, .stat-card, .bar, .ticket-row, .table-row, .report-item, .ticket-item, .mini-item, .metric-box, .section-card, .panel-card, .report-box, .shortcut, .new-ticket-button').forEach((el) => {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      });

      // Animate stat counters inside the active section
      activeSection.querySelectorAll('.stat-value, .report-box strong, .metric-value').forEach((el) => {
        this.animateCounter(el);
      });
    }

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Mobile bottom nav: emit custom event for the central CTA button
  initBottomNav() {
    const cta = document.querySelector('.mobile-bottom-nav [data-action="new-ticket"]');
    if (cta) {
      cta.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('bottomNavNewTicket'));
      });
    }
  },

  // Open section from URL hash
  openFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      this.showSection(hash);
      return true;
    }
    return false;
  }
};
