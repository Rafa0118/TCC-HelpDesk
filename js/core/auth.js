/* ============================================
   iHelpy - Auth Module
   getCurrentUser, logout, requireAuth
   ============================================ */

const Auth = {
  STORAGE_KEY: 'helpium_logged_user',

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const user = raw ? JSON.parse(raw) : null;
      if (user && !user.uid) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  redirectToLogin() {
    const loginPath = window.location.pathname.includes('/dashboard/') ? '../login.html' : 'login.html';
    window.location.href = loginPath;
  },

  async logout() {
    try {
      if (window.FirebaseDB) {
        await window.FirebaseDB.auth.signOut();
      }
    } catch (error) {
      console.error('Não foi possível encerrar a sessão do Firebase:', error);
      if (typeof Toast !== 'undefined') {
        Toast.error('Não foi possível sair da conta. Tente novamente.');
      }
      return false;
    }

    localStorage.removeItem(this.STORAGE_KEY);
    this.redirectToLogin();
    return true;
  },

  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      this.redirectToLogin();
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
