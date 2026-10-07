/* ============================================
   HELPIUM - Toast Notifications
   showToast(message, type, duration)
   ============================================ */

const Toast = {
  _timeoutId: null,

  show(message, type = 'info', duration = 2800) {
    let toast = document.getElementById('helpium-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'helpium-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    clearTimeout(this._timeoutId);

    toast.className = 'toast';
    toast.textContent = message;

    // Force reflow for re-triggering animation
    void toast.offsetWidth;

    toast.classList.add(type);
    toast.classList.add('show');

    this._timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  }
};
