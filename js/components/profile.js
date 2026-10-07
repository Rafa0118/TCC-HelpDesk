/* ============================================
   HELPIUM - Profile Page Logic
   Photo management, profile info display
   Used by professor-perfil.html & tecnico-perfil.html
   ============================================ */

const ProfilePage = {
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

    this.loadProfileInfo(user);
    this.bindPhotoActions();
    this.loadProfilePhoto();
    this.bindNotifications();
  },

  loadProfileInfo(user) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const userName = document.getElementById('userName');

    if (profileName) profileName.textContent = user.name || '—';
    if (profileEmail) profileEmail.textContent = user.email || '—';
    if (userName) userName.textContent = user.name || user.role;
  },

  loadProfilePhoto() {
    const avatarImage = document.getElementById('profileAvatarImage');
    const removeBtn = document.getElementById('removePhotoBtn');
    if (!avatarImage) return;

    const savedPhoto = localStorage.getItem(this.getStorageKey());
    if (savedPhoto) {
      avatarImage.src = savedPhoto;
      if (removeBtn) removeBtn.style.display = 'block';
    } else {
      if (removeBtn) removeBtn.style.display = 'none';
    }
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

        if (!file.type.startsWith('image/')) {
          Toast.error('Selecione uma imagem válida.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          localStorage.setItem(this.getStorageKey(), dataUrl);
          avatarImage.src = dataUrl;
          if (removeBtn) removeBtn.style.display = 'block';
          Toast.success('Foto de perfil atualizada com sucesso!');
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        localStorage.removeItem(this.getStorageKey());
        avatarImage.src = '';
        removeBtn.style.display = 'none';
        photoInput.value = '';
        Toast.success('Foto de perfil removida.');
      });
    }
  },

  bindNotifications() {
    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Toast.info('Nenhuma nova notificação no momento.');
    });
  }
};