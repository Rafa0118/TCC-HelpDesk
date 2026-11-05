/* ============================================
   iHelpy - User Menu Module
   initUserMenu() - dropdown toggle + close
   ============================================ */

const UserMenu = {
  init() {
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userMenu = document.getElementById('userMenu');

    if (!userMenuToggle || !userMenu) return;

    userMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (userMenu.contains(event.target)) return;
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

    document.querySelectorAll('[data-action="profile"]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        userMenu.classList.remove('open');

        const target = button.dataset.target;
        if (target) {
          window.location.href = target;
          return;
        }

        if (document.getElementById('profileModalOverlay')) return;

        if (document.getElementById('perfil') && typeof Navigation !== 'undefined') {
          Navigation.showSection('perfil');
        }
      });
    });

    // Logout buttons
    document.querySelectorAll('[data-action="logout"]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        button.disabled = true;
        const loggedOut = await Auth.logout();
        if (!loggedOut) button.disabled = false;
      });
    });
  }
};
