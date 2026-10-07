/* ============================================
   HELPIUM - Direção Page Logic
   User management, Resource management
   ============================================ */

const DirecaoPage = {
  USERS_KEY: 'helpium_users',
  RESOURCES_KEY: 'helpium_resources',

  defaultUsers: [
    { role: 'direcao', email: 'direcao@helpium.com', password: 'direcao123', name: 'Diretora Carla Mendes' },
    { role: 'professor', email: 'professor@helpium.com', password: 'professor123', name: 'Prof. Ana Souza' },
    { role: 'tecnico', email: 'tecnico@helpium.com', password: 'tecnico123', name: 'Técnico João Silva' }
  ],

  init() {
    const user = Auth.requireAuth();
    if (!user || user.role !== 'direcao') {
      window.location.href = 'login.html';
      return;
    }

    if (user.name) {
      const nameEl = document.getElementById('userName');
      const profileNameEl = document.getElementById('profileName');
      const profileEmailEl = document.getElementById('profileEmail');
      if (nameEl) nameEl.textContent = user.name;
      if (profileNameEl) profileNameEl.textContent = user.name;
      if (profileEmailEl) profileEmailEl.textContent = user.email;
    }

    Sidebar.init();
    UserMenu.init();
    Navigation.init();
    Navigation.initBottomNav();

    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Navigation.ringBell();
      Toast.info('Nenhuma nova notificação no momento.');
    });

    this.bindForms();
    this.renderManagementLists(true);
    Navigation.showSection('inicio');
  },

  readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  },

  createPassword(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) +
      Math.floor(1000 + Math.random() * 9000);
  },

  renderManagementLists(showSkeleton) {
    const usersList = document.getElementById('usersList');
    const resourceList = document.getElementById('resourceList');

    if (showSkeleton) {
      if (usersList) SkeletonLoader.showList('#usersList', 3);
      if (resourceList) SkeletonLoader.showList('#resourceList', 2);
      setTimeout(() => this.renderManagementLists(), 350);
      return;
    }

    const users = this.readStorage(this.USERS_KEY, this.defaultUsers);
    if (usersList) {
      usersList.innerHTML = users.map((item) =>
        `<div class="table-row"><strong>${item.name}</strong><span>${item.role === 'tecnico' ? 'Técnico' : item.role === 'direcao' ? 'Direção' : 'Professor'} · ${item.email} · Senha: ${item.password}</span><b class="status">Ativo</b></div>`
      ).join('');
    }

    const resources = this.readStorage(this.RESOURCES_KEY, []);
    if (resourceList) {
      resourceList.innerHTML = resources.length
        ? resources.map((item) =>
            `<div class="resource-row"><strong>${item.name}</strong><span>${item.type}</span></div>`
          ).join('')
        : '<span>Nenhum espaço cadastrado ainda.</span>';
    }
  },

  bindForms() {
    document.getElementById('userForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('newUserName').value.trim();
      const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
      const role = document.getElementById('newUserRole').value;
      const users = this.readStorage(this.USERS_KEY, this.defaultUsers);

      if (users.some((item) => item.email.toLowerCase() === email)) {
        document.getElementById('userFeedback').textContent = 'Este e-mail já está cadastrado.';
        return;
      }

      const password = this.createPassword(name);
      users.push({ name, email, role, password });
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      document.getElementById('userFeedback').textContent = `Usuário criado. Login: ${email} · Senha: ${password}`;
      event.target.reset();
      this.renderManagementLists(true);
    });

    document.getElementById('resourceForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const resources = this.readStorage(this.RESOURCES_KEY, []);
      resources.push({
        name: document.getElementById('resourceName').value.trim(),
        type: document.getElementById('resourceType').value
      });
      localStorage.setItem(this.RESOURCES_KEY, JSON.stringify(resources));
      document.getElementById('resourceFeedback').textContent = 'Espaço adicionado ao sistema geral.';
      event.target.reset();
      this.renderManagementLists();
    });
  }
};