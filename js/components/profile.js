/* ============================================
   HELPIUM - Profile Page Logic
   Photo management, profile info display, password change
   Used by professor-perfil.html, tecnico-perfil.html, direcao-perfil.html
   ============================================ */

const ProfilePage = {
  USERS_KEY: 'helpium_users',
  LOGGED_KEY: 'helpium_logged_user',

  getStorageKey() {
    const user = Auth.getCurrentUser();
    if (!user) return 'helpium_profile_photo';
    return 'helpium_' + user.role + '_photo';
  },

  init() {
    const user = Auth.requireAuth();
    if (!user) return;

    Sidebar.init();
    UserMenu.init();
    Navigation.init();
    Navigation.initBottomNav();

    this.initEmbedded();
  },

  initEmbedded() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    this.loadProfileInfo(user);
    this.bindPhotoActions();
    this.loadProfilePhoto();
    this.bindEditableFields();
    this.bindPasswordChange();
    this.bindNotifications();
    this.loadTechnicianStats();
    this.bindPasswordModal();
    this.bindPreferences();
    this.bindEditProfileModal();
  },

  loadProfileInfo(user) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const editProfileName = document.getElementById('editProfileName');
    const editProfileEmail = document.getElementById('editProfileEmail');
    const userName = document.getElementById('userName');

    const roleLabels = {
      professor: 'Professor(a)',
      tecnico: 'Técnico(a)',
      direcao: 'Direção'
    };

    const name = user.name || '—';
    const email = user.email || '—';
    const role = roleLabels[user.role] || user.role;

    if (profileName) profileName.textContent = name;
    if (profileEmail) profileEmail.textContent = email;
    if (editProfileName) editProfileName.value = name;
    if (editProfileEmail) editProfileEmail.value = email;
    if (userName) userName.textContent = name;
    
    const profileRole = document.getElementById('profileRole');
    if (profileRole) profileRole.textContent = role;
    
    const profileStatus = document.getElementById('profileStatus');
    if (profileStatus) profileStatus.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    
    const profileRoleView = document.getElementById('profileRoleView');
    if (profileRoleView) profileRoleView.textContent = role;
  },

  loadProfilePhoto() {
    const avatarImage = document.getElementById('profileAvatarImage');
    const avatarPlaceholder = document.getElementById('profileAvatarPlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    if (!avatarImage) return;

    const savedPhoto = localStorage.getItem(this.getStorageKey());
    if (savedPhoto) {
      avatarImage.src = savedPhoto;
      if (removeBtn) removeBtn.style.display = 'block';
    } else {
      if (removeBtn) removeBtn.style.display = 'none';
    }
    this.updateAvatarPlaceholder(avatarImage, avatarPlaceholder);
  },

  updateAvatarPlaceholder(avatarImage, avatarPlaceholder) {
    if (!avatarImage) return;
    const hasPhoto = avatarImage.src && avatarImage.src !== window.location.href;
    avatarImage.style.display = hasPhoto ? 'block' : 'none';
    if (avatarPlaceholder) avatarPlaceholder.style.display = hasPhoto ? 'none' : 'flex';
  },

  bindPhotoActions() {
    const avatarImage = document.getElementById('profileAvatarImage');
    const photoInput = document.getElementById('profilePhotoInput');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    const removeBtn = document.getElementById('removePhotoBtn');

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => photoInput?.click());
    }

    if (photoInput) {
      photoInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          Toast.error('Selecione uma imagem válida (JPG, PNG, WebP, GIF).');
          this.resetPhotoInput(photoInput);
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          Toast.error('Imagem muito grande. Máximo 5MB.');
          this.resetPhotoInput(photoInput);
          return;
        }

        // Check browser support for FileReader
        if (typeof FileReader === 'undefined') {
          Toast.error('Seu navegador não suporta upload de imagem. Use um navegador moderno.');
          this.resetPhotoInput(photoInput);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          if (!dataUrl || typeof dataUrl !== 'string') {
            Toast.error('Não foi possível processar a imagem.');
            this.resetPhotoInput(photoInput);
            return;
          }

          // Validate the image by creating an image element
          const img = new Image();
          img.onload = () => {
            localStorage.setItem(this.getStorageKey(), dataUrl);
            avatarImage.src = dataUrl;
            if (removeBtn) removeBtn.style.display = 'block';
            this.updateAvatarPlaceholder(avatarImage, document.getElementById('profileAvatarPlaceholder'));
            Toast.success('Foto de perfil atualizada com sucesso!');
          };
          img.onerror = () => {
            Toast.error('Arquivo de imagem inválido ou corrompido.');
            this.resetPhotoInput(photoInput);
          };
          img.src = dataUrl;
        };

        reader.onerror = () => {
          Toast.error('Não foi possível ler a imagem. Tente novamente.');
          this.resetPhotoInput(photoInput);
        };

        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        localStorage.removeItem(this.getStorageKey());
        avatarImage.src = '';
        removeBtn.style.display = 'none';
        if (photoInput) photoInput.value = '';
        this.updateAvatarPlaceholder(avatarImage, document.getElementById('profileAvatarPlaceholder'));
        Toast.success('Foto de perfil removida.');
      });
    }
  },

  resetPhotoInput(photoInput) {
    if (photoInput) photoInput.value = '';
  },

  bindEditableFields() {
    document.querySelectorAll('.field-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const isEditing = !input.disabled;

        if (isEditing) {
          this.saveField(input);
        } else {
          input.disabled = false;
          input.focus();
          btn.innerHTML = '<span class="material-symbols-outlined">check</span>';
          btn.classList.add('saving');
        }
      });
    });

    document.querySelectorAll('.field-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.saveField(input);
        } else if (e.key === 'Escape') {
          input.disabled = true;
          const btn = document.querySelector(`.field-edit-btn[data-target="${input.id}"]`);
          if (btn) {
            btn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
            btn.classList.remove('saving');
          }
          this.loadProfileInfo(Auth.getCurrentUser());
        }
      });
    });
  },

  saveField(input) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const field = input.id === 'editProfileName' ? 'name' : 'email';
    const value = input.value.trim();

    if (!value) {
      Toast.warning('Preencha o campo.');
      input.focus();
      return;
    }

    if (field === 'email' && !this.isValidEmail(value)) {
      Toast.warning('Email inválido.');
      input.focus();
      return;
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (userIndex !== -1) {
      users[userIndex][field] = value;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    const loggedUser = Auth.getCurrentUser();
    loggedUser[field] = value;
    localStorage.setItem(this.LOGGED_KEY, JSON.stringify(loggedUser));

    input.disabled = true;
    const btn = document.querySelector(`.field-edit-btn[data-target="${input.id}"]`);
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
      btn.classList.remove('saving');
    }

    this.loadProfileInfo(loggedUser);
    Toast.success(field === 'name' ? 'Nome atualizado!' : 'Email atualizado!');
  },

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  getUsers() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  },

  bindPasswordChange() {
    const form = document.getElementById('changePasswordForm');
    const feedback = document.getElementById('passwordFeedback');
    const newPasswordInput = document.getElementById('newPassword');
    const strengthEl = document.getElementById('passwordStrength');
    if (!form) return;

    if (newPasswordInput && strengthEl) {
      newPasswordInput.addEventListener('input', () => {
        const val = newPasswordInput.value;
        strengthEl.className = 'password-strength';
        if (val.length === 0) return;
        if (val.length < 8) strengthEl.classList.add('weak');
        else if (val.length < 12) strengthEl.classList.add('medium');
        else strengthEl.classList.add('strong');
      });
    }

    document.querySelectorAll('.field-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('.material-symbols-outlined');
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          icon.textContent = 'visibility_off';
        } else {
          input.type = 'password';
          icon.textContent = 'visibility';
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const currentPassword = form.currentPassword.value;
      const newPassword = form.newPassword.value;
      const confirmPassword = form.confirmPassword.value;

      const user = Auth.getCurrentUser();
      if (!user) return;

      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (userIndex === -1) {
        this.showFeedback(feedback, 'Usuário não encontrado.', 'error');
        return;
      }

      if (users[userIndex].password !== currentPassword) {
        this.showFeedback(feedback, 'Senha atual incorreta.', 'error');
        return;
      }

      if (newPassword.length < 6) {
        this.showFeedback(feedback, 'A nova senha deve ter no mínimo 6 caracteres.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        this.showFeedback(feedback, 'As senhas não coincidem.', 'error');
        return;
      }

      users[userIndex].password = newPassword;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      this.showFeedback(feedback, 'Senha alterada com sucesso!', 'success');
      form.reset();
      if (strengthEl) strengthEl.className = 'password-strength';
    });
  },

  showFeedback(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = 'form-feedback ' + type;
    if (type === 'success') {
      setTimeout(() => {
        el.textContent = '';
        el.className = 'form-feedback';
      }, 4000);
    }
  },

  loadTechnicianStats() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'tecnico') return;

    let tickets = [];
    try {
      tickets = JSON.parse(localStorage.getItem('helpium_tickets') || '[]');
    } catch {}

    const completedTickets = tickets.filter(t => t.status === 'Concluído' || (t.assignedTo && t.assignedTo.toLowerCase() === user.name.toLowerCase() && t.status === 'Concluído'));
    const attendedCount = completedTickets.length > 0 ? completedTickets.length : tickets.filter(t => t.assignedTo || t.status === 'Concluído').length;

    let totalScore = 0;
    let ratedCount = 0;
    tickets.forEach(t => {
      if (t.rating && typeof t.rating.score === 'number') {
        totalScore += t.rating.score;
        ratedCount++;
      }
    });

    const avgRating = ratedCount > 0 ? (totalScore / ratedCount).toFixed(1) : '5.0';

    const countEl = document.getElementById('techAttendedCount');
    const ratingEl = document.getElementById('techAverageRating');

    if (countEl) countEl.textContent = attendedCount;
    if (ratingEl) ratingEl.textContent = avgRating + ' ⭐ (' + ratedCount + ' avaliações)';
  },

  bindPasswordModal() {
    const modal = document.getElementById('passwordModalOverlay');
    const openBtn = document.getElementById('openPasswordModalBtn');
    const closeBtn = document.getElementById('closePasswordModalBtn');
    const cancelBtn = document.getElementById('cancelPasswordBtn');
    const form = document.getElementById('changePasswordForm');

    openBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      modal?.classList.add('open', 'active');
      modal?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      modal?.classList.remove('open', 'active');
      modal?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      form?.reset();
      const feedback = document.getElementById('passwordFeedback');
      if (feedback) feedback.textContent = '';
      const strengthEl = document.getElementById('passwordStrength');
      if (strengthEl) strengthEl.className = 'password-strength';
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Handle form submit successfully closing modal
    form?.addEventListener('submit', (e) => {
      setTimeout(() => {
        const feedback = document.getElementById('passwordFeedback');
        if (feedback && feedback.classList.contains('success')) {
          setTimeout(closeModal, 1500);
        }
      }, 100);
    });
  },

  bindNotifications() {
    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Toast.info('Nenhuma nova notificação no momento.');
    });
  },

  bindPreferences() {
    const themeSelect = document.getElementById('themeSelect');
    const themeQuickBtn = document.getElementById('themeToggleQuickBtn');

    const currentTheme = typeof DarkMode !== 'undefined' && DarkMode.getCurrentTheme ? DarkMode.getCurrentTheme() : 'light';
    if (themeSelect) {
      themeSelect.value = currentTheme;
      themeSelect.addEventListener('change', () => {
        if (themeSelect.value === 'dark') {
          DarkMode.enableDark();
        } else {
          DarkMode.disableDark();
        }
        Toast.success('Tema atualizado!');
      });
    }

    themeQuickBtn?.addEventListener('click', () => {
      DarkMode.toggle();
      const newTheme = DarkMode.getCurrentTheme();
      if (themeSelect) themeSelect.value = newTheme;
      Toast.success('Tema alternado!');
    });
  },

  bindEditProfileModal() {
    const modal = document.getElementById('editProfileModalOverlay');
    const openBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.getElementById('closeEditProfileModalBtn');
    const cancelBtn = document.getElementById('cancelEditProfileBtn');
    const form = document.getElementById('editProfileForm');

    openBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const user = Auth.getCurrentUser();
      if (user) {
        const nameInput = document.getElementById('editProfileName');
        const emailInput = document.getElementById('editProfileEmail');
        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
      }
      modal?.classList.add('open', 'active');
      modal?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      modal?.classList.remove('open', 'active');
      modal?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = Auth.getCurrentUser();
      if (!user) return;

      const nameInput = document.getElementById('editProfileName');
      const emailInput = document.getElementById('editProfileEmail');
      const newName = nameInput ? nameInput.value.trim() : '';
      const newEmail = emailInput ? emailInput.value.trim() : '';

      if (!newName || !newEmail) {
        Toast.warning('Preencha todos os campos.');
        return;
      }

      if (!this.isValidEmail(newEmail)) {
        Toast.warning('E-mail inválido.');
        return;
      }

      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      }

      user.name = newName;
      user.email = newEmail;
      localStorage.setItem(this.LOGGED_KEY, JSON.stringify(user));

      this.loadProfileInfo(user);
      Toast.success('Informações atualizadas com sucesso!');
      closeModal();
    });
  }
};