/* ============================================
   iHelpy - Profile Page Logic
   Photo management, profile info display
   Used by professor-perfil.html & tecnico-perfil.html
   ============================================ */

const ProfilePage = {
  getStorageKey() {
    const user = Auth.getCurrentUser();
    return user?.uid ? `helpium_user_${user.uid}_photo` : null;
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
    const profileRole = document.getElementById('profileRole');
    const userName = document.getElementById('userName');

    if (profileName) profileName.textContent = user.name || '—';
    if (profileEmail) profileEmail.textContent = user.email || '—';
    if (profileRole) profileRole.textContent = Auth.getRoleLabel(user.role);
    if (userName) userName.textContent = user.name || user.role;
  },

  loadProfilePhoto() {
    const avatarImage = document.getElementById('profileAvatarImage');
    const removeBtn = document.getElementById('removePhotoBtn');
    if (!avatarImage) return;

    try {
      const storageKey = this.getStorageKey();
      const savedPhoto = storageKey ? localStorage.getItem(storageKey) : null;
      if (savedPhoto) {
        avatarImage.src = savedPhoto;
        if (removeBtn) removeBtn.style.display = 'block';
      } else {
        avatarImage.removeAttribute('src');
        if (removeBtn) removeBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Não foi possível carregar a foto de perfil:', error);
      Toast.error('Não foi possível carregar a foto de perfil neste dispositivo.');
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
          photoInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const storageKey = this.getStorageKey();
          if (!storageKey) {
            Toast.error('Não foi possível identificar sua conta para salvar a foto.');
            photoInput.value = '';
            return;
          }
          try {
            localStorage.setItem(storageKey, dataUrl);
          } catch (error) {
            console.error('Não foi possível salvar a foto de perfil:', error);
            Toast.error('Não foi possível salvar a foto neste dispositivo. Tente uma imagem menor.');
            photoInput.value = '';
            return;
          }
          avatarImage.src = dataUrl;
          if (removeBtn) removeBtn.style.display = 'block';
          photoInput.value = '';
          Toast.success('Foto de perfil atualizada com sucesso!');
        };
        reader.onerror = () => {
          console.error('Não foi possível ler o arquivo da foto de perfil:', reader.error);
          Toast.error('Não foi possível ler esta imagem. Tente outro arquivo.');
          photoInput.value = '';
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const storageKey = this.getStorageKey();
        if (!storageKey) {
          Toast.error('Não foi possível identificar sua conta para remover a foto.');
          return;
        }
        try {
          localStorage.removeItem(storageKey);
          avatarImage.removeAttribute('src');
          removeBtn.style.display = 'none';
          photoInput.value = '';
          Toast.success('Foto de perfil removida.');
        } catch (error) {
          console.error('Não foi possível remover a foto de perfil:', error);
          Toast.error('Não foi possível remover a foto neste dispositivo.');
        }
      });
    }
  },

  bindNotifications() {
    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Toast.info('Nenhuma nova notificação no momento.');
    });
  }
};