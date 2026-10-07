/* ============================================
   HELPIUM - Auth Module
   getCurrentUser, logout, requireAuth
   ============================================ */

const Auth = {
  STORAGE_KEY: 'helpium_logged_user',

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.href = 'login.html';
  },

  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  },

  getUserInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  },

  getRoleLabel(role) {
    const labels = {
      professor: 'Professor(a)',
      tecnico: 'Técnico(a)',
      direcao: 'Direção'
    };
    return labels[role] || role;
  }
};
