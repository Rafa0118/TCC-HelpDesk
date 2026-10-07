/* ============================================
   HELPIUM - Dark Mode Toggle
   ============================================ */

const DarkMode = (() => {
  const STORAGE_KEY = 'helpium-theme';
  const TOGGLE_ATTR = 'data-theme';

  function getStored() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute(TOGGLE_ATTR, 'dark');
    } else {
      document.documentElement.removeAttribute(TOGGLE_ATTR);
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateAllToggles();
  }

  function toggle() {
    const isDark = document.documentElement.getAttribute(TOGGLE_ATTR) === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  }

  function current() {
    return document.documentElement.getAttribute(TOGGLE_ATTR) === 'dark' ? 'dark' : 'light';
  }

  function updateAllToggles() {
    const isDark = current() === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
      btn.setAttribute('aria-label', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
    });
  }

  function injectToggle() {
    const headerTools = document.querySelector('.header-tools');
    if (!headerTools) return;

    const isDark = current() === 'dark';
    const btn = document.createElement('button');
    btn.className = 'header-action theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
    btn.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
    btn.addEventListener('click', toggle);

    // Insert before the notification bell
    const bell = headerTools.querySelector('.header-action, .bell');
    if (bell && bell !== btn) {
      headerTools.insertBefore(btn, bell);
    } else {
      headerTools.prepend(btn);
    }
  }

  function init() {
    // Apply stored theme immediately
    const stored = getStored();
    if (stored) {
      setTheme(stored);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!getStored()) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });

    injectToggle();
  }

  return { init, toggle, current };
})();