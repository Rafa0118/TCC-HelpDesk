/* ============================================
   HELPIUM - Sidebar Module
   initSidebar() - expand/collapse + mobile
   ============================================ */

const Sidebar = {
  init() {
    const pageShell = document.querySelector('.page-shell');
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');

    if (!pageShell || !sidebar) return;

    // Desktop: expand on hover
    sidebar.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 900) return;
      pageShell.classList.add('is-expanded');
    });

    sidebar.addEventListener('mouseleave', () => {
      if (window.innerWidth <= 900) return;
      pageShell.classList.remove('is-expanded');
    });

    // Mobile: toggle menu
    if (mobileMenuButton) {
      mobileMenuButton.addEventListener('click', () => {
        const isOpen = !pageShell.classList.contains('is-nav-open');
        pageShell.classList.toggle('is-nav-open', isOpen);
        sidebar.classList.toggle('is-open', isOpen);
        mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
        mobileMenuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      if (window.innerWidth > 900) return;

      const clickedInsideSidebar = sidebar.contains(event.target);
      const clickedMenuButton = mobileMenuButton?.contains(event.target);

      if (!clickedInsideSidebar && !clickedMenuButton) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeMobileMenu();
      }
    });
  },

  closeMobileMenu() {
    const pageShell = document.querySelector('.page-shell');
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');

    if (pageShell) pageShell.classList.remove('is-nav-open');
    if (sidebar) sidebar.classList.remove('is-open');
    if (mobileMenuButton) {
      mobileMenuButton.setAttribute('aria-expanded', 'false');
      mobileMenuButton.setAttribute('aria-label', 'Abrir menu');
    }
  }
};
