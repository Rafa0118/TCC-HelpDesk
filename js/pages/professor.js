/* ============================================
   iHelpy - Professor Page Logic
   Ticket management, profile modal
   ============================================ */

const ProfessorPage = {
  STORAGE_KEY: 'helpium_professor_tickets',
  DRAFT_STORAGE_KEY: 'helpium_ticket_draft',

  defaultTickets: [
    { id: '#25', title: 'Projetor n\u00e3o liga', room: 'Sala 12', date: '28/05/2025', status: 'Em andamento' },
    { id: '#24', title: 'Computador lento', room: 'Sala 08', date: '27/05/2025', status: 'Em andamento' },
    { id: '#23', title: 'Internet inst\u00e1vel', room: 'Sala 06', date: '26/05/2025', status: 'Conclu\u00eddo' },
    { id: '#22', title: 'Impressora sem papel', room: 'Sala 01', date: '26/05/2025', status: 'Em espera' }
  ],

  statusClassMap: {
    'Em espera': 'waiting', 'Em andamento': 'progress',
    'Concluído': 'done', 'Cancelado': 'cancelled'
  },

  getTicketPriority(ticket) {
    const categoryWeights = {
      Hardware: 3,
      Software: 2,
      Rede: 4,
      'Projetor/Audiovisual': 3,
      Impressora: 2,
      'Sala de Aula': 3,
      'Acesso/Credencial': 4,
      Infraestrutura: 3,
      Outros: 1
    };
    const priorityWeights = { Urgente: 4, Alta: 3, Média: 2, Baixa: 1 };
    const category = ticket.type || ticket.category || 'Outros';
    const priority = ticket.priority || 'Média';
    const total = (categoryWeights[category] || 1) + (priorityWeights[priority] || 2);

    if (total >= 6) return 'Urgente';
    if (total >= 4) return 'Alta';
    if (total >= 3) return 'Média';
    return 'Baixa';
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  currentFilter: 'Todos',

  getTickets() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
      if (Array.isArray(saved)) return saved;
    } catch { console.warn('Erro ao carregar chamados.'); }
    return [];
  },

  RESOURCES_KEY: 'helpium_resources',

  async loadRooms() {
    const select = document.getElementById('ticketRoom');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Carregando espaços...</option>';
    try {
      const resources = await FirebaseDB.listResources();
      const rooms = [...new Set(resources.map((resource) => resource.name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      localStorage.setItem(this.RESOURCES_KEY, JSON.stringify(resources));
      select.innerHTML = '<option value="" disabled selected>' +
        (rooms.length ? 'Selecione um espaço...' : 'Nenhum espaço cadastrado pela direção') +
        '</option>' + rooms.map((room) => '<option value="' + this.escapeHtml(room) + '">' + this.escapeHtml(room) + '</option>').join('');
    } catch (error) {
      console.error('Erro ao carregar espaços cadastrados pela direção:', error);
      select.innerHTML = '<option value="" disabled selected>Não foi possível carregar os espaços</option>';
      Toast.error('Não foi possível carregar os espaços cadastrados pela direção.');
    }
  },

  saveTickets(tickets) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets));
    try {
      localStorage.setItem('helpium_tickets', JSON.stringify(tickets));
    } catch {}
  },

  renderTickets(showSkeleton) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;
    if (showSkeleton) {
      SkeletonLoader.show('#ticketsTableBody', { rows: 3, columns: 6 });
      setTimeout(() => this.renderTickets(), 350);
      return;
    }
    const tickets = this.getTickets();
    this.renderRecentTickets(tickets);
    const filtered = this.currentFilter === 'Todos' ? tickets : tickets.filter(t => t.status === this.currentFilter);
    tbody.innerHTML = filtered.map(ticket => {
      const cls = this.statusClassMap[ticket.status] || 'waiting';
      return '<tr><td>' + this.escapeHtml(ticket.id) + '</td><td>' + this.escapeHtml(ticket.title) + '</td><td>' + this.escapeHtml(ticket.room) + '</td><td>' + this.escapeHtml(ticket.date) + '</td><td>' + (ticket.locationDetails ? this.escapeHtml(ticket.locationDetails) : '<span class="text-muted">Não informado</span>') + '</td><td><span class="status ' + cls + '">' + this.escapeHtml(ticket.status) + '</span></td><td><div class="ticket-actions"><button class="cancel-ticket-btn" type="button" data-ticket-id="' + this.escapeHtml(ticket.id) + '">Cancelar</button></div></td></tr>';
    }).join('');

    tbody.querySelectorAll('.cancel-ticket-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.dataset.ticketId;
        const tickets = this.getTickets();
        const ticket = tickets.find((item) => item.id === id);
        if (!ticket) return;
        try {
          await FirebaseDB.updateTicket(ticket, { status: 'Cancelado' }, Auth.getCurrentUser());
          this.saveTickets(tickets.map((item) => item.id === id ? { ...item, status: 'Cancelado' } : item));
          this.renderTickets();
          Toast.success('Chamado cancelado.');
        } catch (error) {
          Toast.error('Não foi possível cancelar o chamado.');
        }
      });
    });
  },

  renderRecentTickets(tickets) {
    const preview = document.getElementById('recentTicketsPreview');
    if (!preview) return;

    if (!tickets.length) {
      preview.innerHTML = '<div class="recent-ticket-empty"><p>Você ainda não tem chamados.</p><button class="secondary-btn recent-ticket-empty-action" type="button">Abrir primeiro chamado</button></div>';
      preview.querySelector('.recent-ticket-empty-action')?.addEventListener('click', () => this.openTicketModal());
      return;
    }

    preview.innerHTML = tickets.slice(0, 3).map((ticket) => {
      const statusClass = this.statusClassMap[ticket.status] || 'waiting';
      const priority = this.getTicketPriority(ticket);
      const priorityClass = {
        'Urgente': 'priority-urgent',
        'Alta': 'priority-high',
        'Média': 'priority-medium',
        'Baixa': 'priority-low'
      }[priority];

      return `<article class="recent-ticket-item">
        <div class="recent-ticket-main">
          <span class="recent-ticket-id">${this.escapeHtml(ticket.id)}</span>
          <h3>${this.escapeHtml(ticket.title)}</h3>
          <p>${this.escapeHtml(ticket.room)} · ${this.escapeHtml(ticket.date)}</p>
        </div>
        <div class="recent-ticket-badges">
          <span class="status ${statusClass}">${this.escapeHtml(ticket.status)}</span>
          <span class="recent-ticket-priority ${priorityClass}">${this.escapeHtml(priority)}</span>
        </div>
      </article>`;
    }).join('');
  },

  async init() {
    const user = Auth.requireAuth();
    if (!user || user.role !== 'professor') { Auth.redirectToLogin(); return; }
    if (user.name) document.getElementById('userName').textContent = user.name;
    Sidebar.init(); UserMenu.init(); Navigation.init(); Navigation.initBottomNav();
    this.bindTicketModal(); this.bindProfileModal();
    this.loadProfileData(user);
    try {
      const resources = await FirebaseDB.listResources();
      localStorage.setItem(this.RESOURCES_KEY, JSON.stringify(resources));
    } catch (error) {
      console.warn('Não foi possível atualizar os espaços do Firebase:', error);
    }
    try {
      this.saveTickets(await FirebaseDB.listTickets(user));
    } catch (error) {
      Toast.error('Não foi possível carregar os chamados do banco de dados.');
      this.saveTickets([]);
    }
    this.renderTickets();
    document.addEventListener('bottomNavNewTicket', () => this.openTicketModal());
    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Navigation.ringBell();
      Toast.info('Voc\u00ea tem 2 notifica\u00e7\u00f5es novas.');
    });
    document.getElementById('supportBtn')?.addEventListener('click', () => {
      window.location.href = 'mailto:suporte@helpium.com?subject=Solicita\u00e7\u00e3o%20de%20suporte%20-%20Professor';
    });
    document.querySelector('[data-action="profile"]')?.addEventListener('click', () => this.openProfileModal());
    document.querySelectorAll('.nav-item').forEach(button => {
      button.addEventListener('click', () => {
        const target = button.dataset.target;
        if (target === 'abrir-chamado') this.openTicketModal();
        else if (target === 'perfil') this.openProfileModal();
        else if (target && !target.includes('.html')) {
          Navigation.showSection(target);
        }
        Sidebar.closeMobileMenu();
      });
    });

    // Ensure the Início section is visible (it is hidden by default via .section { display: none })
    const initialTarget = window.location.hash.slice(1);
    if (initialTarget === 'abrir-chamado') {
      Navigation.showSection('inicio');
      this.openTicketModal();
    } else if (initialTarget === 'perfil') {
      Navigation.showSection('inicio');
      this.openProfileModal();
    }
    else if (document.getElementById(initialTarget)) Navigation.showSection(initialTarget);
    else Navigation.showSection('inicio');
  },

  bindTicketModal() {
    const overlay = document.getElementById('ticketModalOverlay');
    const photoInput = document.getElementById('ticketPhotoInput') || document.getElementById('ticketPhoto');
    const photoPreview = document.getElementById('ticketPhotoPreview');
    const photoWrap = document.getElementById('ticketPhotoPreviewWrap');
    const form = document.getElementById('ticketForm');

    document.getElementById('newTicketButton')?.addEventListener('click', () => this.openTicketModal());
    document.getElementById('fabNewTicket')?.addEventListener('click', () => this.openTicketModal());
    document.getElementById('closeTicketModalBtn')?.addEventListener('click', () => this.closeTicketModal());
    document.getElementById('cancelTicketBtn')?.addEventListener('click', () => this.closeTicketModal());

    photoInput?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        this.resetPhotoPreview();
        this.saveTicketDraft();
        return;
      }
      if (!file.type.startsWith('image/')) {
        Toast.error('Selecione uma imagem v\u00e1lida.');
        this.resetPhotoPreview();
        this.saveTicketDraft();
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.src = e.target.result;
        photoWrap?.classList.add('has-image');
        this.saveTicketDraft();
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('removeTicketPhotoBtn')?.addEventListener('click', () => {
      this.resetPhotoPreview();
      this.saveTicketDraft();
    });

    form?.addEventListener('input', () => this.saveTicketDraft());
    form?.addEventListener('change', () => this.saveTicketDraft());

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const f = event.currentTarget;
      const title = f.title.value.trim();
      const room = f.room.value.trim();
      const description = f.description.value.trim();
      const category = f.category.value;
      if (!title || !room || !description) { Toast.warning('Preencha todos os campos obrigatórios.'); return; }

    const ticket = {
        title, room,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'Em espera', type: category,
        priority: '',
        locationDetails: f.location_details.value.trim(),
        description, photo: photoPreview?.getAttribute('src') || ''
    };
      try {
        const created = await FirebaseDB.createTicket(ticket, Auth.getCurrentUser());
        this.saveTickets([created, ...this.getTickets()]);
        this.renderTickets();
        this.clearTicketDraft();
        f.reset();
        this.resetPhotoPreview();
        this.closeTicketModal();
        Toast.success('Chamado registrado com sucesso!');
      } catch (error) {
        console.error('Erro ao registrar chamado no Firebase:', error);
        const reason = error.code === 'permission-denied'
          ? 'permissão negada; publique as regras do Firestore/Storage'
          : error.message || error.code || 'erro desconhecido';
        Toast.error('Falha ao salvar: ' + reason);
      }
    });

    overlay?.addEventListener('click', (e) => { if (e.target === overlay) this.closeTicketModal(); });
  },

  async openTicketModal() {
    const o = document.getElementById('ticketModalOverlay');
    o?.classList.add('open'); o?.setAttribute('aria-hidden', 'false');
    const note = document.getElementById('ticketDraftNote');
    if (note) note.textContent = 'O rascunho é salvo automaticamente neste dispositivo.';
    await this.loadRooms();
    this.restoreTicketDraft();
  },

  closeTicketModal() {
    const o = document.getElementById('ticketModalOverlay');
    o?.classList.remove('open'); o?.setAttribute('aria-hidden', 'true');
    Navigation.showSection('inicio');
  },

  getTicketDraftStorageKey() {
    const user = Auth.getCurrentUser();
    return user?.uid ? this.DRAFT_STORAGE_KEY + '_' + user.uid : null;
  },

  saveTicketDraft() {
    const form = document.getElementById('ticketForm');
    const storageKey = this.getTicketDraftStorageKey();
    if (!form || !storageKey) return;

    const draft = {
      title: form.title.value,
      room: form.room.value,
      category: form.category.value,
      locationDetails: form.location_details.value,
      description: form.description.value,
      photo: document.getElementById('ticketPhotoPreview')?.getAttribute('src') || ''
    };
    const hasContent = Boolean(
      draft.title.trim() ||
      draft.room ||
      draft.category !== 'Outros' ||
      draft.locationDetails.trim() ||
      draft.description.trim() ||
      draft.photo
    );

    try {
      if (!hasContent) {
        localStorage.removeItem(storageKey);
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch (error) {
        if (!draft.photo) throw error;
        localStorage.setItem(storageKey, JSON.stringify({ ...draft, photo: '', photoOmitted: true }));
        const note = document.getElementById('ticketDraftNote');
        if (note) note.textContent = 'Rascunho salvo sem a foto por falta de espaço. Selecione a imagem novamente ao retomar.';
        return;
      }
      const note = document.getElementById('ticketDraftNote');
      if (note) note.textContent = 'O rascunho é salvo automaticamente neste dispositivo.';
    } catch (error) {
      console.error('Não foi possível salvar o rascunho do chamado:', error);
      const note = document.getElementById('ticketDraftNote');
      if (note) note.textContent = 'Não foi possível salvar o rascunho neste dispositivo.';
    }
  },

  restoreTicketDraft() {
    const form = document.getElementById('ticketForm');
    const storageKey = this.getTicketDraftStorageKey();
    if (!form || !storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (!draft || typeof draft !== 'object') return;

      form.title.value = typeof draft.title === 'string' ? draft.title : '';
      form.room.value = typeof draft.room === 'string' ? draft.room : '';
      form.category.value = typeof draft.category === 'string' ? draft.category : 'Outros';
      form.location_details.value = typeof draft.locationDetails === 'string' ? draft.locationDetails : '';
      form.description.value = typeof draft.description === 'string' ? draft.description : '';

      const photoPreview = document.getElementById('ticketPhotoPreview');
      const photoWrap = document.getElementById('ticketPhotoPreviewWrap');
      if (typeof draft.photo === 'string' && draft.photo.startsWith('data:image/')) {
        photoPreview.src = draft.photo;
        photoWrap?.classList.add('has-image');
      }
      if (draft.photoOmitted) {
        const note = document.getElementById('ticketDraftNote');
        if (note) note.textContent = 'Rascunho salvo sem a foto por falta de espaço. Selecione a imagem novamente ao retomar.';
      }
    } catch (error) {
      console.error('Não foi possível recuperar o rascunho do chamado:', error);
      const note = document.getElementById('ticketDraftNote');
      if (note) note.textContent = 'Não foi possível recuperar o rascunho salvo neste dispositivo.';
    }
  },

  clearTicketDraft() {
    const storageKey = this.getTicketDraftStorageKey();
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Não foi possível apagar o rascunho após salvar o chamado:', error);
      const note = document.getElementById('ticketDraftNote');
      if (note) note.textContent = 'Chamado registrado, mas não foi possível apagar o rascunho salvo neste dispositivo.';
    }
  },

  resetPhotoPreview() {
    const p = document.getElementById('ticketPhotoPreview');
    const w = document.getElementById('ticketPhotoPreviewWrap');
    const i = document.getElementById('ticketPhotoInput') || document.getElementById('ticketPhoto');
    if (p) p.src = ''; w?.classList.remove('has-image'); if (i) i.value = '';
  },

  bindProfileModal() {
    const o = document.getElementById('profileModalOverlay');
    document.getElementById('closeProfileModalBtn')?.addEventListener('click', () => this.closeProfileModal());
    o?.addEventListener('click', (e) => { if (e.target === o) this.closeProfileModal(); });
  },

  openProfileModal() {
    const o = document.getElementById('profileModalOverlay');
    o?.classList.add('open'); o?.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.target === 'perfil'));
  },

  closeProfileModal() {
    const o = document.getElementById('profileModalOverlay');
    o?.classList.remove('open'); o?.setAttribute('aria-hidden', 'true');
    Navigation.showSection('inicio');
  },

  loadProfileData(user) {
    document.getElementById('profileName').textContent = user.name || '\u2014';
    document.getElementById('profileEmail').textContent = user.email || '\u2014';
    document.getElementById('profileRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '\u2014';
    const saved = localStorage.getItem('helpium_professor_photo');
    const img = document.getElementById('profileAvatarImage');
    if (saved && img) img.src = saved;
  }
};
