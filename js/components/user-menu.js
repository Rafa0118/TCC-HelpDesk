/* ============================================
   HELPIUM - User Menu Module
   initUserMenu() - dropdown toggle + close
   ============================================ */

const UserMenu = {
  init() {
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userMenu = document.getElementById('userMenu');

    if (!userMenuToggle || !userMenu) return;

    userMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      userMenu.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', (event) => {
      if (!userMenuToggle.contains(event.target)) {
        userMenu.classList.remove('open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        userMenu.classList.remove('open');
      }
    });

    // Logout buttons
    document.querySelectorAll('[data-action="logout"]').forEach((button) => {
      button.addEventListener('click', () => {
        Auth.logout();
      });
    });
  }
};
