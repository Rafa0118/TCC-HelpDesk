/* ============================================
   iHelpy - Direção Page Logic
   User management, Resource management
   ============================================ */

const DirecaoPage = {
  USERS_KEY: 'helpium_users',
  RESOURCES_KEY: 'helpium_resources',
  tickets: [],
  userCount: 0,
  ticketLoadError: false,

  async init() {
    const user = Auth.requireAuth();
    if (!user || user.role !== 'direcao') {
      Auth.redirectToLogin();
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
    this.bindTicketReportModal();

    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Navigation.ringBell();
      Toast.info('Nenhuma nova notificação no momento.');
    });

    this.bindForms();
    SkeletonLoader.showList('#usersList', 3);
    SkeletonLoader.showList('#resourceList', 2);
    try {
      const [users, resources] = await Promise.all([FirebaseDB.listUsers(), FirebaseDB.listResources()]);
      this.userCount = users.length;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users.map(({ name, email, role }) => ({ name, email, role }))));
      localStorage.setItem(this.RESOURCES_KEY, JSON.stringify(resources));
    } catch (error) {
      Toast.error('Não foi possível carregar os dados administrativos.');
      this.userCount = 0;
      localStorage.setItem(this.USERS_KEY, '[]');
      localStorage.setItem(this.RESOURCES_KEY, '[]');
    }
    this.renderManagementLists();
    try {
      this.tickets = await FirebaseDB.listTickets(user);
    } catch (error) {
      console.error('Não foi possível carregar chamados para a direção:', error);
      this.tickets = [];
      this.ticketLoadError = true;
      Toast.error('Não foi possível carregar os chamados reais. Verifique as regras do Firestore.');
    }
    this.renderTicketDashboard();
    Navigation.showSection('inicio');
  },

  getTicketStatusCounts(tickets) {
    return {
      pending: tickets.filter((ticket) => ['Em espera', 'Aberto', 'PENDENTE'].includes(ticket.status)).length,
      progress: tickets.filter((ticket) => ['Em andamento', 'Em atendimento', 'EM_ATENDIMENTO'].includes(ticket.status)).length,
      done: tickets.filter((ticket) => ['Concluído', 'Resolvido', 'CONCLUIDO'].includes(ticket.status)).length,
      cancelled: tickets.filter((ticket) => ['Cancelado', 'CANCELADO'].includes(ticket.status)).length
    };
  },

  getTicketDate(ticket, field = 'dataAbertura') {
    const value = ticket[field];
    if (value && typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (field === 'dataAbertura' && ticket.date) {
      const match = ticket.date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    }
    return null;
  },

  ticketStatusClass(status) {
    if (['Em espera', 'Aberto', 'PENDENTE'].includes(status)) return 'pending';
    if (['Em andamento', 'Em atendimento', 'EM_ATENDIMENTO'].includes(status)) return 'progress';
    if (['Cancelado', 'CANCELADO'].includes(status)) return 'cancelled';
    return 'resolved';
  },

  renderTicketRow(ticket) {
    const title = ticket.title || ticket.tipoProblema || 'Chamado';
    const requester = ticket.requester || ticket.usuarioNome || 'Solicitante';
    const room = ticket.room || ticket.localNome || 'Local não informado';
    const status = ticket.status || 'Em espera';
    const details = [requester, room, ticket.date].filter(Boolean).join(' · ');
    const hasReport = [
      ticket.resolutionCategory,
      ticket.resolutionSubcategory,
      ticket.resolutionDetails,
      ticket.resolutionTimeSpent,
      ticket.resolutionParts,
      ticket.resolutionUserNote
    ].some((value) => typeof value === 'string' && value.trim());
    const reportButton = hasReport
      ? `<button type="button" class="ticket-report-button" data-ticket-report="${this.escapeHtml(ticket.id)}">Ver relatório</button>`
      : '';
    return `<div class="table-row ticket-row"><strong>${this.escapeHtml(ticket.id)} · ${this.escapeHtml(title)}</strong><span>${this.escapeHtml(details)}</span><b class="status ${this.ticketStatusClass(status)}">${this.escapeHtml(status)}</b>${reportButton}</div>`;
  },

  bindTicketReportModal() {
    const overlay = document.getElementById('ticketReportOverlay');
    document.getElementById('closeTicketReportBtn')?.addEventListener('click', () => this.closeTicketReport());
    overlay?.addEventListener('click', (event) => {
      if (event.target === overlay) this.closeTicketReport();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay?.classList.contains('open')) this.closeTicketReport();
    });

    ['recentTicketsList', 'allTicketsList'].forEach((listId) => {
      document.getElementById(listId)?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ticket-report]');
        if (button) this.openTicketReport(button.dataset.ticketReport);
      });
    });
  },

  openTicketReport(ticketId) {
    const ticket = this.tickets.find((item) => String(item.id) === String(ticketId));
    if (!ticket) {
      Toast.error('Não foi possível localizar o relatório deste chamado.');
      return;
    }

    const overlay = document.getElementById('ticketReportOverlay');
    const reportId = document.getElementById('ticketReportId');
    const content = document.getElementById('ticketReportContent');
    if (!overlay || !reportId || !content) {
      console.error('Não foi possível abrir o relatório: elementos da janela não encontrados.');
      Toast.error('Não foi possível exibir o relatório técnico.');
      return;
    }

    const fields = [
      ['Técnico responsável', ticket.technicianName || ticket.tecnicoNome],
      ['Categoria da resolução', ticket.resolutionCategory],
      ['Ação realizada', ticket.resolutionSubcategory],
      ['Tempo de atendimento', ticket.resolutionTimeSpent],
      ['Peças utilizadas', ticket.resolutionParts],
      ['Procedimento e resolução', ticket.resolutionDetails],
      ['Observação ao solicitante', ticket.resolutionUserNote],
      ['Concluído em', ticket.resolvedAt]
    ];
    reportId.textContent = `${ticket.id || 'Chamado'} · ${ticket.title || ticket.tipoProblema || 'Chamado'}`;
    content.innerHTML = fields.map(([label, value]) =>
      `<div class="ticket-report-field"><strong>${this.escapeHtml(label)}</strong><p>${this.escapeHtml(value || 'Não informado')}</p></div>`
    ).join('');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  },

  closeTicketReport() {
    const overlay = document.getElementById('ticketReportOverlay');
    overlay?.classList.remove('open');
    overlay?.setAttribute('aria-hidden', 'true');
  },

  renderTicketDashboard() {
    const tickets = this.tickets;
    const counts = this.getTicketStatusCounts(tickets);
    const setValue = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value);
    };

    setValue('dashboardDate', new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
    setValue('statTotalTickets', tickets.length);
    setValue('statProgressTickets', counts.progress);
    setValue('statDoneTickets', counts.done);
    setValue('statUsers', this.userCount);
    setValue('queuePending', counts.pending);

    const assigned = tickets.filter((ticket) => ticket.technicianName || ticket.tecnicoNome);
    const technicians = new Set(assigned.map((ticket) => ticket.technicianName || ticket.tecnicoNome));
    setValue('queueAssigned', assigned.length);
    setValue('queueTechnicians', technicians.size);

    const priorityCounts = {
      high: tickets.filter((ticket) => ['Alta', 'Urgente', 'ALTA'].includes(ticket.priority || ticket.prioridade)).length,
      medium: tickets.filter((ticket) => ['Média', 'Moderada', 'MODERADA'].includes(ticket.priority || ticket.prioridade)).length,
      low: tickets.filter((ticket) => ['Baixa', 'BAIXA'].includes(ticket.priority || ticket.prioridade)).length
    };
    const totalPriorities = priorityCounts.high + priorityCounts.medium + priorityCounts.low;
    const percent = (value) => totalPriorities ? Math.round(value / totalPriorities * 100) : 0;
    setValue('priorityHigh', percent(priorityCounts.high) + '%');
    setValue('priorityMedium', percent(priorityCounts.medium) + '%');
    setValue('priorityLow', percent(priorityCounts.low) + '%');
    const donut = document.getElementById('priorityDonut');
    if (donut) {
      const highStop = percent(priorityCounts.high);
      const mediumStop = highStop + percent(priorityCounts.medium);
      donut.style.background = totalPriorities
        ? `conic-gradient(#7a4ae8 0 ${highStop}%, #a98cf1 ${highStop}% ${mediumStop}%, #d8caff ${mediumStop}% 100%)`
        : 'conic-gradient(#e5e7eb 0 100%)';
      donut.setAttribute('aria-label', `Alta ${percent(priorityCounts.high)}%, média ${percent(priorityCounts.medium)}%, baixa ${percent(priorityCounts.low)}%`);
    }

    const maxStatus = Math.max(counts.pending, counts.progress, counts.done, 1);
    [['barPending', counts.pending], ['barProgress', counts.progress], ['barDone', counts.done]].forEach(([id, count]) => {
      const bar = document.getElementById(id);
      if (bar) bar.style.setProperty('--bar-height', `${count ? Math.max(8, count / maxStatus * 100) : 0}%`);
    });

    const sorted = [...tickets].sort((first, second) => {
      const firstDate = this.getTicketDate(first)?.getTime() || 0;
      const secondDate = this.getTicketDate(second)?.getTime() || 0;
      return secondDate - firstDate;
    });
    const recentList = document.getElementById('recentTicketsList');
    if (recentList) recentList.innerHTML = sorted.length
      ? sorted.slice(0, 4).map((ticket) => this.renderTicketRow(ticket)).join('')
      : `<p class="ticket-empty">${this.ticketLoadError ? 'Falha ao carregar os chamados.' : 'Nenhum chamado cadastrado.'}</p>`;
    const allList = document.getElementById('allTicketsList');
    if (allList) allList.innerHTML = sorted.length
      ? sorted.map((ticket) => this.renderTicketRow(ticket)).join('')
      : `<p class="ticket-empty">${this.ticketLoadError ? 'Falha ao carregar os chamados.' : 'Nenhum chamado cadastrado.'}</p>`;

    this.renderTicketReports(tickets, counts);
  },

  renderTicketReports(tickets, counts) {
    const now = new Date();
    const monthlyTickets = tickets.filter((ticket) => {
      const date = this.getTicketDate(ticket);
      return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const resolvedDurations = tickets.map((ticket) => {
      const opened = this.getTicketDate(ticket);
      const closed = this.getTicketDate(ticket, 'dataFechamento');
      return opened && closed && closed >= opened ? (closed - opened) / 60000 : null;
    }).filter((duration) => duration !== null);
    const averageMinutes = resolvedDurations.length
      ? Math.round(resolvedDurations.reduce((sum, duration) => sum + duration, 0) / resolvedDurations.length)
      : null;
    const resolutionRate = tickets.length ? Math.round(counts.done / tickets.length * 100) : 0;
    const setValue = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value);
    };
    setValue('reportMonthlyTickets', monthlyTickets.length);
    setValue('reportAverageResolution', averageMinutes === null ? '—' : averageMinutes >= 60
      ? `${Math.floor(averageMinutes / 60)}h ${averageMinutes % 60}m`
      : `${averageMinutes} min`);
    setValue('reportResolutionRate', `${resolutionRate}%`);

    const monthBuckets = [];
    for (let offset = 3; offset >= 0; offset -= 1) {
      monthBuckets.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
    }
    const monthCounts = monthBuckets.map((month) => tickets.filter((ticket) => {
      const date = this.getTicketDate(ticket);
      return date && date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    }).length);
    const maxMonth = Math.max(...monthCounts, 1);
    const chart = document.getElementById('monthlyChart');
    if (chart) chart.innerHTML = monthBuckets.map((month, index) => {
      const count = monthCounts[index];
      const height = count ? Math.max(8, count / maxMonth * 100) : 0;
      const label = month.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return `<div class="bar-item"><div class="bar" style="--bar-height: ${height}%" aria-label="${count} chamados"></div><span>${this.escapeHtml(label)}</span></div>`;
    }).join('');
  },

  readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  },

  escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  },

  createPassword(name) {
    const prefix = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'user';
    return prefix + 'A!' + Math.floor(100000 + Math.random() * 900000);
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

    const users = this.readStorage(this.USERS_KEY, []);
    if (usersList) {
      usersList.innerHTML = users.map((item) =>
        `<div class="table-row"><strong>${this.escapeHtml(item.name)}</strong><span>${item.role === 'tecnico' ? 'Técnico' : item.role === 'direcao' ? 'Direção' : 'Professor'} · ${this.escapeHtml(item.email)}</span><b class="status">Ativo</b></div>`
      ).join('');
    }

    const resources = this.readStorage(this.RESOURCES_KEY, []);
    if (resourceList) {
      resourceList.innerHTML = resources.length
        ? resources.map((item) =>
            `<div class="resource-row"><strong>${this.escapeHtml(item.name || item.nome)}</strong><span>${this.escapeHtml(item.type || item.tipo)}</span></div>`
          ).join('')
        : '<span>Nenhum espaço cadastrado ainda.</span>';
    }
  },

  bindForms() {
    document.getElementById('userForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('newUserName').value.trim();
      const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
      const role = document.getElementById('newUserRole').value;
      const users = this.readStorage(this.USERS_KEY, []);

      if (users.some((item) => item.email.toLowerCase() === email)) {
        document.getElementById('userFeedback').textContent = 'Este e-mail já está cadastrado.';
        return;
      }

      const password = this.createPassword(name);
      try {
        await FirebaseDB.createManagedUser(name, email, password, role);
        users.push({ name, email, role });
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        document.getElementById('userFeedback').textContent = `Usuário criado. Login: ${email} · Senha: ${password}`;
        event.target.reset();
        this.renderManagementLists();
      } catch (error) {
        document.getElementById('userFeedback').textContent = error.code === 'auth/email-already-in-use'
          ? 'Este e-mail já está cadastrado.'
          : 'Não foi possível criar o usuário no Firebase.';
      }
    });

    document.getElementById('resourceForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const resources = this.readStorage(this.RESOURCES_KEY, []);
      const resource = {
        name: document.getElementById('resourceName').value.trim(),
        type: document.getElementById('resourceType').value
      };
      try {
        resources.push(await FirebaseDB.createResource(resource));
        localStorage.setItem(this.RESOURCES_KEY, JSON.stringify(resources));
        document.getElementById('resourceFeedback').textContent = 'Espaço adicionado ao sistema geral.';
        event.target.reset();
        this.renderManagementLists();
      } catch (error) {
        document.getElementById('resourceFeedback').textContent = 'Não foi possível salvar o espaço no Firebase.';
      }
    });
  }
};