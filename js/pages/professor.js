/* ============================================
   HELPIUM - Professor Page Logic
   Ticket management, profile modal
   ============================================ */

const ProfessorPage = {
  STORAGE_KEY: 'helpium_professor_tickets',

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

  CATEGORY_MAP: {
    'Rede': 'Rede e Conectividade',
    'Infraestrutura': 'Infraestrutura e Elétrica',
    'Acesso': 'Acesso e Contas',
    'Acesso/Credencial': 'Acesso e Contas',
    'Projetor/Audiovisual': 'Hardware',
    'Impressora': 'Hardware',
    'Sala de Aula': 'Hardware'
  },

  normalizeCategory(category) {
    if (!category) return '';
    return this.CATEGORY_MAP[category] || category;
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
    const category = this.normalizeCategory(ticket.type || ticket.category || 'Outros');
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
  currentCategoryFilter: 'Todas',
  searchQuery: '',

  filterTicketList(tickets) {
    return tickets.filter((ticket) => {
      if (this.currentFilter !== 'Todos' && ticket.status !== this.currentFilter) {
        return false;
      }
      if (this.currentCategoryFilter !== 'Todas') {
        const cat = this.normalizeCategory(ticket.category || ticket.type || '');
        if (!cat.toLowerCase().includes(this.currentCategoryFilter.toLowerCase())) {
          return false;
        }
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = (ticket.title || '').toLowerCase().includes(q);
        const matchId = (ticket.id || '').toLowerCase().includes(q);
        const matchRoom = (ticket.room || '').toLowerCase().includes(q);
        const matchCat = (ticket.category || ticket.type || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchRoom && !matchCat) return false;
      }
      return true;
    });
  },

  bindFiltersAndSearch() {
    document.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter || 'Todos';
        this.renderTickets();
      });
    });

    const catSelect = document.getElementById('filterCategorySelect');
    catSelect?.addEventListener('change', (e) => {
      this.currentCategoryFilter = e.target.value;
      this.renderTickets();
    });

    const searchInput = document.getElementById('ticketSearchInput');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.renderTickets();
    });
  },

  getTickets() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch { console.warn('Erro ao carregar chamados.'); }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultTickets));
    return [...this.defaultTickets];
  },

  RESOURCES_KEY: 'helpium_resources',

  defaultRooms: ['Sala 01', 'Sala 02', 'Sala 03', 'Sala 04', 'Laboratório 01', 'Laboratório 02', 'Laboratório 03', 'Laboratório 04', 'Sala 12', 'Bloco B - Sala 22', 'Coordenação Pedagógica'],

  loadRooms() {
    const select = document.getElementById('ticketRoom');
    if (!select) return;
    let rooms = [...this.defaultRooms];
    try {
      const saved = JSON.parse(localStorage.getItem(this.RESOURCES_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        const extra = saved.map(r => r.name).filter(n => n && !rooms.includes(n));
        rooms = [...rooms, ...extra];
      }
    } catch {}
    rooms.sort();
    select.innerHTML = '<option value="" disabled selected>Selecione uma sala...</option>' +
      rooms.map(r => '<option value="' + this.escapeHtml(r) + '">' + this.escapeHtml(r) + '</option>').join('');
  },

  saveTickets(tickets) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets));
    try {
      localStorage.setItem('helpium_tickets', JSON.stringify(tickets));
    } catch {}
  },

  updateStats(tickets) {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'Em andamento' || t.status === 'Em espera').length;
    const completed = tickets.filter(t => t.status === 'Concluído').length;

    const totalEl = document.getElementById('statTotalTickets');
    const pendingEl = document.getElementById('statPendingTickets');
    const completedEl = document.getElementById('statCompletedTickets');

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (completedEl) completedEl.textContent = completed;
  },

  renderTickets(showSkeleton) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;
    if (showSkeleton) {
      SkeletonLoader.show('#ticketsTableBody', { rows: 3, columns: 11 });
      setTimeout(() => this.renderTickets(), 350);
      return;
    }
    const tickets = this.getTickets();
    this.updateStats(tickets);
    this.renderRecentTickets(tickets);
    const filtered = this.filterTicketList(tickets);

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 24px; color: var(--muted);">Nenhum chamado encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(ticket => {
      const cls = this.statusClassMap[ticket.status] || 'waiting';
      let actionHtml = '';
      if (ticket.status === 'Concluído') {
        if (ticket.rating) {
          actionHtml = '<span class="status done">Avaliado (' + ticket.rating.score + '★)</span>';
        } else {
          actionHtml = '<button class="btn btn--primary" type="button" style="padding: 4px 10px; font-size: 0.85rem;" onclick="ProfessorPage.openRatingModalById(\'' + this.escapeHtml(ticket.id) + '\')">Avaliar ⭐</button>';
        }
      } else if (ticket.status !== 'Cancelado') {
        actionHtml = '<button class="cancel-ticket-btn" type="button" data-ticket-id="' + this.escapeHtml(ticket.id) + '">Cancelar</button>';
      } else {
        actionHtml = '<span class="text-muted">—</span>';
      }

      const resolvedAt = ticket.resolvedAt || (ticket.resolvedAtIso ? new Date(ticket.resolvedAtIso).toLocaleDateString('pt-BR') : '—');
      const resolvedBy = ticket.technicianName || ticket.assignee || '—';
      const dateStr = ticket.date || (ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : '—');
      const category = ticket.category || ticket.type || 'Outros';
      const priority = ticket.priority || 'Média';
      const requester = ticket.requester || 'Professor(a)';
      const room = ticket.room || '—';

      return `
        <tr>
          <td data-label="Nº">${this.escapeHtml(ticket.id)}</td>
          <td data-label="Título">${this.escapeHtml(ticket.title)}</td>
          <td data-label="Categoria">${this.escapeHtml(category)}</td>
          <td data-label="Prioridade">${this.escapeHtml(priority)}</td>
          <td data-label="Solicitante">${this.escapeHtml(requester)}</td>
          <td data-label="Sala">${this.escapeHtml(room)}</td>
          <td data-label="Aberto em">${this.escapeHtml(dateStr)}</td>
          <td data-label="Status"><span class="status ${cls}">${this.escapeHtml(ticket.status || 'Aberto')}</span></td>
          <td data-label="Resolvido em">${this.escapeHtml(resolvedAt)}</td>
          <td data-label="Resolvido por">${this.escapeHtml(resolvedBy)}</td>
          <td data-label="Ações"><div class="ticket-actions">${actionHtml}</div></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.cancel-ticket-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.ticketId;
        this.saveTickets(this.getTickets().map(t => t.id === id ? { ...t, status: 'Cancelado' } : t));
        this.renderTickets();
        Toast.success('Chamado cancelado.');
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

  init() {
    const user = Auth.requireAuth();
    if (!user || user.role !== 'professor') { window.location.href = Auth.loginUrl(); return; }
    if (user.name) document.getElementById('userName').textContent = user.name;
    Sidebar.init(); UserMenu.init(); Navigation.init(); Navigation.initBottomNav();
    ProfilePage.initEmbedded();
    this.bindTicketModal(); this.bindFiltersAndSearch();
    this.renderTickets(true);
    this.bindRatingModal();
    this.checkUnratedTickets();
    document.addEventListener('bottomNavNewTicket', () => this.openTicketModal());
    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Navigation.ringBell();
      Toast.info('Voc\u00ea tem 2 notifica\u00e7\u00f5es novas.');
    });
    document.getElementById('supportBtn')?.addEventListener('click', () => {
      window.location.href = 'mailto:suporte@helpium.com?subject=Solicita\u00e7\u00e3o%20de%20suporte%20-%20Professor';
    });
    document.querySelectorAll('[data-action="profile"]').forEach((button) => {
      button.addEventListener('click', () => {
        Navigation.showSection('perfil');
        window.location.hash = '#perfil';
      });
    });
    document.querySelectorAll('.nav-item').forEach(button => {
      button.addEventListener('click', () => {
        const target = button.dataset.target;
        if (target === 'abrir-chamado') this.openTicketModal();
        else if (target && target.includes('.html')) {
          window.location.href = target;
          return;
        }
        else if (target && !target.includes('.html')) {
          Navigation.showSection(target);
        }
        Sidebar.closeMobileMenu();
      });
    });

    Navigation.openFromHash();

    // Ensure the Início section is visible (it is hidden by default via .section { display: none })
    const initialTarget = window.location.hash.slice(1);
    if (initialTarget === 'abrir-chamado') {
      Navigation.showSection('inicio');
      this.openTicketModal();
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
      if (!file) { this.resetPhotoPreview(); return; }
      if (!file.type.startsWith('image/')) { Toast.error('Selecione uma imagem v\u00e1lida.'); this.resetPhotoPreview(); return; }
      const reader = new FileReader();
      reader.onload = (e) => { photoPreview.src = e.target.result; photoWrap?.classList.add('has-image'); };
      reader.readAsDataURL(file);
    });
    document.getElementById('removeTicketPhotoBtn')?.addEventListener('click', () => this.resetPhotoPreview());

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const f = event.currentTarget;
      const title = f.title.value.trim();
      const room = f.room.value.trim();
      const description = f.description.value.trim();
      const category = f.category.value;
      if (!title || !room || !description) { Toast.warning('Preencha todos os campos obrigatórios.'); return; }

    const tickets = this.getTickets();
    const nextNum = tickets.length ? Number(String(tickets[0].id).replace('#', '')) + 1 : 26;
    tickets.unshift({
        id: '#' + nextNum, title, room,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'Em espera', type: category,
        priority: '',
        locationDetails: f.location_details.value.trim(),
        description, photo: photoPreview?.src || ''
    });
      this.saveTickets(tickets);
      this.renderTickets();
      f.reset();
      this.resetPhotoPreview();
      this.closeTicketModal();
      Toast.success('Chamado registrado com sucesso!');
    });

    overlay?.addEventListener('click', (e) => { if (e.target === overlay) this.closeTicketModal(); });
  },

  openTicketModal() {
    const o = document.getElementById('ticketModalOverlay');
    o?.classList.add('open'); o?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.loadRooms();
  },

  closeTicketModal() {
    const o = document.getElementById('ticketModalOverlay');
    o?.classList.remove('open'); o?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.getElementById('ticketForm')?.reset(); this.resetPhotoPreview();
    Navigation.showSection('inicio');
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

  bindRatingModal() {
    const overlay = document.getElementById('ratingModalOverlay');
    const closeBtn = document.getElementById('closeRatingModalBtn');
    const skipBtn = document.getElementById('skipRatingBtn');
    const form = document.getElementById('ratingForm');
    const starBtns = document.querySelectorAll('.star-btn');
    const scoreInput = document.getElementById('selectedRatingScore');
    const ratingBadgeText = document.getElementById('ratingBadgeText');

    const ratingLabelsMap = {
      1: '1 estrela - Precisa melhorar',
      2: '2 estrelas - Regular',
      3: '3 estrelas - Bom',
      4: '4 estrelas - Muito bom',
      5: '5 estrelas - Excelente ⭐'
    };

    closeBtn?.addEventListener('click', () => this.closeRatingModal());
    skipBtn?.addEventListener('click', () => this.closeRatingModal());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeRatingModal();
    });

    starBtns.forEach(btn => {
      const score = parseInt(btn.dataset.score, 10);
      btn.addEventListener('click', () => {
        if (scoreInput) scoreInput.value = score;
        if (ratingBadgeText) ratingBadgeText.textContent = ratingLabelsMap[score];
        starBtns.forEach((b, idx) => {
          b.style.color = idx < score ? '#f59e0b' : '#cbd5e1';
        });
      });
      btn.addEventListener('mouseenter', () => {
        starBtns.forEach((b, idx) => {
          b.style.color = idx < score ? '#f59e0b' : '#cbd5e1';
        });
        if (ratingBadgeText) ratingBadgeText.textContent = ratingLabelsMap[score];
      });
    });

    const starPicker = document.getElementById('starRatingPicker');
    starPicker?.addEventListener('mouseleave', () => {
      const currentScore = parseInt(scoreInput?.value || '5', 10);
      starBtns.forEach((b, idx) => {
        b.style.color = idx < currentScore ? '#f59e0b' : '#cbd5e1';
      });
      if (ratingBadgeText) ratingBadgeText.textContent = ratingLabelsMap[currentScore];
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticketId = document.getElementById('ratingTicketId').value;
      const score = parseInt(scoreInput?.value || '5', 10);
      const comment = document.getElementById('ratingComment')?.value.trim() || '';

      const tickets = this.getTickets();
      const updated = tickets.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            rating: {
              score,
              comment,
              ratedAt: new Date().toISOString()
            }
          };
        }
        return t;
      });
      this.saveTickets(updated);
      this.renderTickets();
      this.closeRatingModal();
      Toast.success('Avaliação enviada com sucesso! Obrigado.');
      
      this.checkUnratedTickets();
    });
  },

  openRatingModal(ticket) {
    const overlay = document.getElementById('ratingModalOverlay');
    const idInput = document.getElementById('ratingTicketId');
    const infoEl = document.getElementById('ratingTicketInfo');
    const scoreInput = document.getElementById('selectedRatingScore');
    const starBtns = document.querySelectorAll('.star-btn');

    if (idInput) idInput.value = ticket.id;
    if (infoEl) {
      infoEl.innerHTML = 'O chamado <strong>' + this.escapeHtml(ticket.id) + '</strong> ("' + this.escapeHtml(ticket.title) + '") atendido por <strong>' + this.escapeHtml(ticket.technicianName || 'Técnico') + '</strong> foi concluído! Por favor, avalie o atendimento.';
    }
    if (scoreInput) scoreInput.value = '5';
    starBtns.forEach(b => b.style.color = '#f59e0b');

    overlay?.classList.add('open');
    overlay?.setAttribute('aria-hidden', 'false');
  },

  openRatingModalById(id) {
    const tickets = this.getTickets();
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      this.openRatingModal(ticket);
    }
  },

  closeRatingModal() {
    const overlay = document.getElementById('ratingModalOverlay');
    overlay?.classList.remove('open');
    overlay?.setAttribute('aria-hidden', 'true');
    document.getElementById('ratingForm')?.reset();
  },

  checkUnratedTickets() {
    const tickets = this.getTickets();
    const unratedCompleted = tickets.find(t => t.status === 'Concluído' && !t.rating);
    if (unratedCompleted) {
      setTimeout(() => {
        this.openRatingModal(unratedCompleted);
      }, 500);
    }
  },

};
