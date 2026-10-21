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
      window.location.href = Auth.loginUrl();
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
    ProfilePage.initEmbedded();

    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Navigation.ringBell();
      Toast.info('Nenhuma nova notificação no momento.');
    });

    this.bindForms();
    this.bindTicketFilters();
    this.bindUserFilters();
    this.bindEditUserModal();
    this.bindDeleteUserModal();
    this.bindReportFilters();
    this.bindTicketInfoModal();
    this.renderManagementLists(true);
    this.renderUsers(true);
    this.renderAllTickets(true);
    this.renderReports(true);
    Navigation.showSection('inicio');
  },

  readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      if (!Array.isArray(value) || !value.length) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return value;
    } catch {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
  },

  createPassword(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) +
      Math.floor(1000 + Math.random() * 9000);
  },

  renderManagementLists(showSkeleton) {
    const resourceList = document.getElementById('resourceList');

    if (showSkeleton) {
      if (resourceList) {
        const itemsContainer = resourceList.querySelector('.resource-items') || resourceList;
        itemsContainer.innerHTML = '<span>Carregando espaços...</span>';
      }
      setTimeout(() => this.renderManagementLists(), 350);
      return;
    }

    const resources = this.readStorage(this.RESOURCES_KEY, [
      { name: 'Sala 01', type: 'Sala' },
      { name: 'Sala 02', type: 'Sala' },
      { name: 'Laboratório 01', type: 'Laboratório' },
      { name: 'Laboratório 02', type: 'Laboratório' },
      { name: 'Laboratório 03', type: 'Laboratório' },
      { name: 'Sala 12', type: 'Sala' },
      { name: 'Coordenação', type: 'Sala' }
    ]);
    if (resourceList) {
      const itemsContainer = resourceList.querySelector('.resource-items') || resourceList;
      itemsContainer.innerHTML = resources.length
        ? resources.map((item) =>
            `<div class="resource-row"><strong>${this.escapeHtml(item.name)}</strong><span>${this.escapeHtml(item.type)}</span></div>`
          ).join('')
        : '<span>Nenhum espaço cadastrado ainda.</span>';
    }
  },

  getTickets() {
    let tickets = [];
    if (typeof Tickets !== 'undefined' && typeof Tickets.getAll === 'function') {
      tickets = Tickets.getAll();
    }
    if (!tickets.length) {
      try {
        tickets = JSON.parse(localStorage.getItem('helpium_tickets') || localStorage.getItem('helpium_professor_tickets') || '[]');
      } catch {
        tickets = [];
      }
    }
    if (!Array.isArray(tickets) || tickets.length === 0) {
      tickets = [
        {
          id: '#1047',
          title: 'Projetor não liga na Sala 12',
          room: 'Sala 12',
          requester: 'Prof. Carlos Mendes',
          category: 'Hardware',
          priority: 'Alta',
          status: 'Em andamento',
          description: 'O projetor não emite sinal de luz.',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          date: new Date().toLocaleDateString('pt-BR'),
          assignee: 'Técnico João Silva',
          technicianName: 'Técnico João Silva'
        },
        {
          id: '#1052',
          title: 'Computador sem áudio na Coordenação',
          room: 'Coordenação',
          requester: 'Coord. Mariana',
          category: 'Hardware',
          priority: 'Média',
          status: 'Concluído',
          description: 'Caixas de som não reproduzem áudio.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          date: new Date(Date.now() - 3600000 * 24).toLocaleDateString('pt-BR'),
          assignee: 'Técnico João Silva',
          technicianName: 'Técnico João Silva',
          resolutionTimeSpent: '35',
          resolvedAt: new Date().toLocaleDateString('pt-BR')
        },
        {
          id: '#1055',
          title: 'Queda de Wi-Fi no Laboratório',
          room: 'Lab 03',
          requester: 'Prof. Roberto',
          category: 'Rede',
          priority: 'Alta',
          status: 'Concluído',
          description: 'A rede sem fio caiu durante a aula prática.',
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          date: new Date(Date.now() - 3600000 * 48).toLocaleDateString('pt-BR'),
          assignee: 'Técnico João Silva',
          technicianName: 'Técnico João Silva',
          resolutionTimeSpent: '25',
          resolvedAt: new Date().toLocaleDateString('pt-BR')
        }
      ];
      try {
        localStorage.setItem('helpium_tickets', JSON.stringify(tickets));
        localStorage.setItem('helpium_professor_tickets', JSON.stringify(tickets));
      } catch {}
    }
    return tickets;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  statusClassMap: {
    'Aberto': 'waiting',
    'Em espera': 'waiting',
    'Em andamento': 'progress',
    'Concluído': 'done',
    'Cancelado': 'cancelled'
  },

  currentPeriodFilter: 'month',
  currentChartView: 'donut',
  heatmapExpanded: false,

  bindReportFilters() {
    document.querySelectorAll('.report-period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.report-period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPeriodFilter = btn.dataset.period || 'month';
        this.renderReports();
      });
    });

    document.getElementById('exportReportPdfBtn')?.addEventListener('click', () => {
      this.exportReportToPDF();
    });

    document.getElementById('heatmapToggleBtn')?.addEventListener('click', (e) => {
      this.heatmapExpanded = !this.heatmapExpanded;
      e.target.textContent = this.heatmapExpanded ? 'Ver menos' : 'Ver todos';
      this.renderInfrastructureHeatmap();
    });

    document.querySelectorAll('.chart-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-view-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--text)';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
        this.currentChartView = btn.dataset.view || 'donut';
        this.renderIncidentsPriorityDashboard();
      });
    });
  },

  getTicketById(id) {
    const tickets = this.getTickets();
    return tickets.find(t => t.id === id) || null;
  },

  calculatePriority(ticket) {
    if (ticket.priority === 'Alta') return 3;
    if (ticket.priority === 'Baixa') return 1;
    return 2;
  },

  getPriorityLabel(priority) {
    if (priority >= 3) return 'Alta';
    if (priority === 1) return 'Baixa';
    return 'Média';
  },

  getPriorityClass(priority) {
    if (priority >= 3) return 'high';
    if (priority === 1) return 'low';
    return 'medium';
  },

  openTicketInfoModal(ticketId) {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      Toast.error('Chamado não encontrado.');
      return;
    }
    this.activeInfoTicketId = ticket.id;

    const idEl = document.getElementById('ticketInfoModalTicketId');
    const titleTextEl = document.getElementById('ticketInfoModalTitleText');
    const reqEl = document.getElementById('ticketInfoModalRequester');
    const roomEl = document.getElementById('ticketInfoModalRoom');
    const dateEl = document.getElementById('ticketInfoModalDate');
    const typeEl = document.getElementById('ticketInfoModalType');
    const descEl = document.getElementById('ticketInfoModalDescription');
    const photoWrap = document.getElementById('ticketInfoModalPhotoWrap');
    const photoImg = document.getElementById('ticketInfoModalPhoto');

    if (idEl) idEl.textContent = ticket.id;
    if (titleTextEl) titleTextEl.textContent = ticket.title || 'Chamado sem título';
    if (reqEl) reqEl.textContent = ticket.requester || 'Professor(a)';
    if (roomEl) roomEl.textContent = ticket.room || 'Ambiente';
    if (dateEl) dateEl.textContent = (ticket.date || '') + (ticket.time ? ' às ' + ticket.time : '');
    if (typeEl) typeEl.textContent = ticket.category || ticket.type || 'Geral';
    if (descEl) descEl.textContent = ticket.description || 'Sem descrição fornecida.';

    if (ticket.photo && photoWrap && photoImg) {
      photoImg.src = ticket.photo;
      photoWrap.style.display = 'block';
    } else if (photoWrap) {
      photoWrap.style.display = 'none';
    }

    const overlay = document.getElementById('ticketInfoModalOverlay');
    const pdfBtn = document.getElementById('ticketInfoDownloadPdfBtn');
    if (pdfBtn) {
      const statusLower = (ticket.status || '').toLowerCase();
      if (statusLower === 'concluído' || statusLower === 'concluido' || statusLower === 'cancelado') {
        pdfBtn.style.display = 'inline-flex';
        pdfBtn.onclick = () => {
          this.closeTicketInfoModal();
          this.generateTicketPDF(ticket);
        };
      } else {
        pdfBtn.style.display = 'none';
        pdfBtn.onclick = null;
      }
    }

    overlay?.classList.add('open');
    overlay?.setAttribute('aria-hidden', 'false');
  },

  closeTicketInfoModal() {
    const overlay = document.getElementById('ticketInfoModalOverlay');
    overlay?.classList.remove('open');
    overlay?.setAttribute('aria-hidden', 'true');
  },

  bindTicketInfoModal() {
    const overlay = document.getElementById('ticketInfoModalOverlay');
    const closeBtn = document.getElementById('closeTicketInfoModalBtn');
    const closeBtn2 = document.getElementById('closeTicketInfoBtn');

    closeBtn?.addEventListener('click', () => this.closeTicketInfoModal());
    closeBtn2?.addEventListener('click', () => this.closeTicketInfoModal());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeTicketInfoModal();
    });
  },


  generateTicketPDF(ticket) {
    const reportHtml = this.buildTicketReportHtml(ticket);
    const container = document.createElement("div");
    container.id = "ticket-report-pdf";
    container.innerHTML = reportHtml;
    Object.assign(container.style, {
      position: "absolute",
      left: "-9999px",
      top: "0px",
      width: "794px",
      background: "#ffffff",
      margin: "0",
      padding: "0"
    });
    document.body.appendChild(container);

    if (!window.html2canvas) {
      Toast.error("Falha ao carregar o gerador de PDF.");
      document.body.removeChild(container);
      return;
    }

    html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 794,
      windowHeight: container.scrollHeight
    })
      .then((canvas) => {
        this.savePdfFromCanvas(canvas, ticket.id);
      })
      .catch((err) => {
        console.error("Falha ao gerar PDF:", err);
        Toast.error("Não foi possível gerar o PDF do chamado.");
      })
      .finally(() => {
        document.body.removeChild(container);
      });
  },

  savePdfFromCanvas(canvas, ticketId) {
    if (!window.jspdf) {
      Toast.error("Falha ao carregar a biblioteca de PDF.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const marginLeft = 0;

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.height / imgProps.width;
    const imgHeight = imgWidth * ratio;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", marginLeft, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", marginLeft, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeId = (ticketId || "chamado").replace(/[^a-zA-Z0-9]/g, "");
    pdf.save("CHAMADO_" + safeId + "_Helpium.pdf");
    Toast.success("PDF do chamado " + (ticketId || "") + " gerado com sucesso.");
  },


  buildTicketReportHtml(ticket) {
    const priority = this.calculatePriority(ticket);
    const priorityLabel = this.getPriorityLabel(priority);
    const openedDate = (ticket.date || "—") + (ticket.time ? " às " + ticket.time : "");
    const resolvedAt = ticket.resolvedAt || "—";
    const requester = ticket.requester || "Solicitante";
    const room = ticket.room || "Ambiente não informado";
    const ticketType = ticket.type || ticket.category || "Geral";
    const category = ticket.resolutionCategory || ticketType || "—";
    const action = ticket.resolutionAction || "—";
    const subcategory = ticket.resolutionSubcategory || "—";
    const timeSpent = ticket.resolutionTimeSpent || "Não informado";
    const parts = ticket.resolutionParts || "Nenhuma peça utilizada.";
    const details = ticket.resolutionDetails || "Sem detalhes de resolução registrados.";
    const userNote = ticket.resolutionUserNote || "Nenhuma mensagem para o solicitante.";
    const photoNote = ticket.photo ? "Anexo fotográfico: presente" : "Anexo fotográfico: sem anexo";
    const technicianName = ticket.technicianName || ticket.assignee || "—";
    const generatedAt = new Date().toLocaleString('pt-BR', {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
    const id = ticket.id || "—";
    const e = (s) => this.escapeHtml(s);

    return `
      <div class="pdf-report">
        <header class="pdf-header">
          <div class="pdf-header-left">
            <div class="pdf-vendor">Helpium</div>
            <div class="pdf-report-title">Relatório de Atendimento Técnico</div>
            <div class="pdf-meta-sub">Sistema de Help Desk Escolar</div>
          </div>
          <div class="pdf-header-right">
            <div class="pdf-call-id">CHAMADO Nº ${e(id)}</div>
          </div>
        </header>
        <hr class="pdf-rule">

        <section class="pdf-section">
          <div class="pdf-section-title">1. DADOS DO CHAMADO</div>
          <table class="pdf-table">
            <tbody>
              <tr class="pdf-row"><td class="pdf-cell-full"><span class="pdf-lbl">Título do chamado</span><span class="pdf-val">${e(ticket.title || "—")}</span></td></tr>
              <tr class="pdf-row">
                <td><span class="pdf-lbl">Status atual</span><span class="pdf-val">${e(ticket.status || "Em andamento")}</span></td>
                <td><span class="pdf-lbl">Prioridade calculada</span><span class="pdf-val pdf-priority-${priorityLabel}">${e(priorityLabel)}</span></td>
              </tr>
              <tr class="pdf-row">
                <td><span class="pdf-lbl">Categoria</span><span class="pdf-val">${e(category)}</span></td>
                <td><span class="pdf-lbl">Sala / Local</span><span class="pdf-val">${e(room)}</span></td>
              </tr>
              <tr class="pdf-row">
                <td><span class="pdf-lbl">Solicitante</span><span class="pdf-val">${e(requester)}</span></td>
                <td><span class="pdf-lbl">Aberto em</span><span class="pdf-val">${e(openedDate)}</span></td>
              </tr>
              <tr class="pdf-row"><td class="pdf-cell-full"><span class="pdf-lbl">Concluído em</span><span class="pdf-val">${e(resolvedAt)}</span></td></tr>
            </tbody>
          </table>
        </section>

        <section class="pdf-section">
          <div class="pdf-section-title">2. DESCRIÇÃO DO PROBLEMA RELATADO</div>
          <div class="pdf-callout">
            <div class="pdf-callout-text">${e(ticket.description || "Sem descrição detalhada fornecida pelo solicitante.")}</div>
          </div>
          <div class="pdf-meta-line">${photoNote} · Tipo de chamado: ${e(ticketType)}</div>
        </section>

        <section class="pdf-section">
          <div class="pdf-section-title">3. RESOLUÇÃO TÉCNICA APLICADA</div>
          <table class="pdf-table">
            <tbody>
              <tr class="pdf-row">
                <td><span class="pdf-lbl">Domínio principal</span><span class="pdf-val">${e(category)}</span></td>
                <td><span class="pdf-lbl">Ação específica</span><span class="pdf-val">${e(action)}</span></td>
              </tr>
              <tr class="pdf-row">
                <td><span class="pdf-lbl">Visão detalhada</span><span class="pdf-val">${e(subcategory)}</span></td>
                <td><span class="pdf-lbl">Tempo de atendimento</span><span class="pdf-val">${e(timeSpent)}</span></td>
              </tr>
              <tr class="pdf-row"><td class="pdf-cell-full"><span class="pdf-lbl">Peças utilizadas</span><span class="pdf-val">${e(parts)}</span></td></tr>
            </tbody>
          </table>
          <div class="pdf-observation">
            <div class="pdf-observation-text">${e(details)}</div>
          </div>
        </section>

        <section class="pdf-section">
          <div class="pdf-section-title">4. MENSAGEM DE ENTREGA AO SOLICITANTE</div>
          <div class="pdf-callout">
            <div class="pdf-callout-text">${e(userNote)}</div>
          </div>
        </section>

        <div class="pdf-signature-bar">
          <div class="pdf-sig">
            <span class="pdf-sig-label">Técnico responsável</span>
            <span class="pdf-sig-value">${e(technicianName)}</span>
          </div>
          <div class="pdf-sig">
            <span class="pdf-sig-label">Data de emissão</span>
            <span class="pdf-sig-value">${e(generatedAt)}</span>
          </div>
          <div class="pdf-sig">
            <span class="pdf-sig-label">Número do chamado</span>
            <span class="pdf-sig-value">${e(id)}</span>
          </div>
        </div>

        <hr class="pdf-rule">
        <footer class="pdf-footer">
          <span>Helpium — Sistema de Help Desk Escolar</span>
          <span class="pdf-footer-right">Gerado em: ${e(generatedAt)} · CHAMADO ${e(id)}</span>
        </footer>
      </div>
    `;
  },

  
  renderAllTickets(showSkeleton) {
    const tbody = document.getElementById('allTicketsTableBody');
    if (!tbody) return;

    if (showSkeleton) {
      if (typeof SkeletonLoader !== 'undefined') {
        SkeletonLoader.show('#allTicketsTableBody', { rows: 4, columns: 11 });
        setTimeout(() => this.renderAllTickets(), 350);
        return;
      }
    }

    const tickets = this.getTickets();
    const searchInput = document.getElementById('ticketsSearchInput');
    const statusSelect = document.getElementById('filterStatus');
    const categorySelect = document.getElementById('filterCategory');
    const prioritySelect = document.getElementById('filterPriority');
    const dateFromInput = document.getElementById('filterDateFrom');
    const dateToInput = document.getElementById('filterDateTo');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const statusFilter = statusSelect?.value || '';
    const categoryFilter = categorySelect?.value || '';
    const priorityFilter = prioritySelect?.value || '';
    const dateFrom = dateFromInput?.value ? new Date(dateFromInput.value) : null;
    const dateTo = dateToInput?.value ? new Date(dateToInput.value) : null;

    const filtered = tickets.filter(ticket => {
      if (query) {
        const text = `${ticket.id} ${ticket.title} ${ticket.category || ticket.type} ${ticket.requester} ${ticket.room} ${ticket.technicianName || ticket.assignee || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      if (statusFilter && ticket.status !== statusFilter) return false;

      const cat = ticket.category || ticket.type || '';
      if (categoryFilter && cat !== categoryFilter) return false;

      const prio = ticket.priority || '';
      if (priorityFilter && prio !== priorityFilter) return false;

      if (!this.checkPeriod(ticket)) return false;

      if (dateFrom || dateTo) {
        const tDate = new Date(ticket.createdAt || ticket.date || Date.now());
        if (dateFrom && tDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (tDate > endOfDay) return false;
        }
      }

      return true;
    });

    const countEl = document.getElementById('ticketsCount');
    if (countEl) {
      countEl.textContent = `${filtered.length} chamado${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 24px; color: var(--muted);">Nenhum chamado encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(ticket => {
      const cls = this.statusClassMap[ticket.status] || 'waiting';
      const resolvedAt = ticket.resolvedAt || (ticket.resolvedAtIso ? new Date(ticket.resolvedAtIso).toLocaleDateString('pt-BR') : '—');
      const resolvedBy = ticket.technicianName || ticket.assignee || '—';
      const dateStr = ticket.date || (ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : '—');

      const statusLower = (ticket.status || '').toLowerCase();
      const isConcluidoOrCancelado = statusLower === 'concluído' || statusLower === 'concluido' || statusLower === 'cancelado';

      const actionBtn = isConcluidoOrCancelado
        ? `<button type="button" class="btn btn-primary btn-sm" data-download-pdf="${ticket.id}" style="padding: 4px 10px; font-size: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">download</span> Baixar PDF</button>`
        : `<button type="button" class="btn btn-secondary btn-sm" data-open-ticket="${ticket.id}" style="padding: 4px 10px; font-size: 0.75rem; border: 1px solid var(--line); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">visibility</span> Ver Ficha</button>`;

      return `
        <tr>
          <td data-label="Nº">${this.escapeHtml(ticket.id)}</td>
          <td data-label="Título">${this.escapeHtml(ticket.title)}</td>
          <td data-label="Categoria">${this.escapeHtml(ticket.category || ticket.type || 'Outros')}</td>
          <td data-label="Prioridade">${this.escapeHtml(ticket.priority || 'Média')}</td>
          <td data-label="Solicitante">${this.escapeHtml(ticket.requester || 'Professor(a)')}</td>
          <td data-label="Sala">${this.escapeHtml(ticket.room || '—')}</td>
          <td data-label="Aberto em">${this.escapeHtml(dateStr)}</td>
          <td data-label="Status"><span class="status ${cls}">${this.escapeHtml(ticket.status || 'Aberto')}</span></td>
          <td data-label="Resolvido em">${this.escapeHtml(resolvedAt)}</td>
          <td data-label="Resolvido por">${this.escapeHtml(resolvedBy)}</td>
          <td data-label="Ações">${actionBtn}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-open-ticket]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTicketInfoModal(btn.dataset.openTicket);
      });
    });

    tbody.querySelectorAll('[data-download-pdf]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = this.getTicketById(btn.dataset.downloadPdf);
        if (t) this.generateTicketPDF(t);
      });
    });
  },

  bindTicketFilters() {
    document.getElementById('ticketsSearchInput')?.addEventListener('input', () => this.renderAllTickets());
    document.getElementById('filterStatus')?.addEventListener('change', () => this.renderAllTickets());
    document.getElementById('filterCategory')?.addEventListener('change', () => this.renderAllTickets());
    document.getElementById('filterPriority')?.addEventListener('change', () => this.renderAllTickets());
    document.getElementById('filterDateFrom')?.addEventListener('change', () => this.renderAllTickets());
    document.getElementById('filterDateTo')?.addEventListener('change', () => this.renderAllTickets());

    document.querySelectorAll('.quick-filter').forEach(btn => {
      if (btn.dataset.period !== undefined) {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.quick-filter').forEach(b => {
            if (b.dataset.period !== undefined) {
              b.classList.remove('active');
              b.setAttribute('aria-pressed', 'false');
            }
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          this.currentPeriodFilter = parseInt(btn.dataset.period, 10);
          this.renderAllTickets();
        });
      }
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'helpium_tickets' || e.key === 'helpium_professor_tickets') {
        this.renderAllTickets();
      }
    });
    document.addEventListener('helpium:tickets-changed', () => {
      this.renderAllTickets();
    });
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
      users.push({ name, email, role, password, createdAt: new Date().toISOString() });
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      document.getElementById('userFeedback').textContent = `Usuário criado. Login: ${email} · Senha: ${password}`;
      event.target.reset();
      this.renderManagementLists(true);
      this.renderUsers();
      Toast.success('Usuário criado com sucesso!');
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
      Toast.success('Espaço adicionado com sucesso!');
    });
  },

  renderUsers(showSkeleton) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (showSkeleton) {
      if (typeof SkeletonLoader !== 'undefined') {
        SkeletonLoader.show('#usersTableBody', { rows: 3, columns: 6 });
        setTimeout(() => this.renderUsers(), 350);
        return;
      }
    }

    const users = this.readStorage(this.USERS_KEY, this.defaultUsers);
    const searchInput = document.getElementById('usersSearchInput');
    const roleSelect = document.getElementById('filterUserRole');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const roleFilter = roleSelect?.value || '';

    const filtered = users.filter(user => {
      if (query) {
        const text = `${user.name} ${user.email} ${user.role}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      if (roleFilter && user.role !== roleFilter) return false;
      return true;
    });

    const countEl = document.getElementById('usersCount');
    if (countEl) {
      countEl.textContent = `${filtered.length} usuário${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--muted);">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    const roleNameMap = {
      'direcao': 'Direção',
      'professor': 'Professor',
      'tecnico': 'Técnico'
    };

    const roleBadgeMap = {
      'direcao': 'done',
      'professor': 'progress',
      'tecnico': 'waiting'
    };

    tbody.innerHTML = filtered.map(user => {
      const roleLabel = roleNameMap[user.role] || user.role || 'Usuário';
      const roleBadge = roleBadgeMap[user.role] || 'waiting';
      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—';

      return `
        <tr>
          <td data-label="Usuário"><strong>${this.escapeHtml(user.name)}</strong></td>
          <td data-label="Perfil"><span class="status ${roleBadge}">${this.escapeHtml(roleLabel)}</span></td>
          <td data-label="Email">${this.escapeHtml(user.email)}</td>
          <td data-label="Status"><span class="status done">Ativo</span></td>
          <td data-label="Cadastrado em">${this.escapeHtml(createdAt)}</td>
          <td data-label="Ações">
            <div class="ticket-actions" style="display: flex; gap: 6px;">
              <button class="btn btn--secondary btn-sm edit-user-btn" type="button" data-email="${this.escapeHtml(user.email)}" style="padding: 4px 10px; font-size: 0.85rem;">Editar</button>
              <button class="btn btn-secondary btn-sm delete-user-btn" type="button" data-email="${this.escapeHtml(user.email)}" data-name="${this.escapeHtml(user.name)}" style="padding: 4px 10px; font-size: 0.85rem; color: var(--cancelled-text); border-color: rgba(179, 49, 49, 0.3);">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        this.openEditUserModal(email);
      });
    });

    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        const name = btn.dataset.name;
        this.openDeleteUserModal(email, name);
      });
    });
  },

  openDeleteUserModal(email, name) {
    document.getElementById('deleteUserEmailTarget').value = email;
    const nameTarget = document.getElementById('deleteUserNameTarget');
    if (nameTarget) nameTarget.textContent = name || email;

    const overlay = document.getElementById('deleteUserModalOverlay');
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  },

  closeDeleteUserModal() {
    const overlay = document.getElementById('deleteUserModalOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.getElementById('deleteUserEmailTarget').value = '';
    const nameTarget = document.getElementById('deleteUserNameTarget');
    if (nameTarget) nameTarget.textContent = '';
  },

  bindDeleteUserModal() {
    const overlay = document.getElementById('deleteUserModalOverlay');
    const closeBtn = document.getElementById('closeDeleteUserModalBtn');
    const cancelBtn = document.getElementById('cancelDeleteUserBtn');
    const confirmBtn = document.getElementById('confirmDeleteUserBtn');

    closeBtn?.addEventListener('click', () => this.closeDeleteUserModal());
    cancelBtn?.addEventListener('click', () => this.closeDeleteUserModal());

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeDeleteUserModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('open')) {
        this.closeDeleteUserModal();
      }
    });

    confirmBtn?.addEventListener('click', () => {
      const email = document.getElementById('deleteUserEmailTarget').value.trim().toLowerCase();
      if (!email) return;

      const users = this.readStorage(this.USERS_KEY, this.defaultUsers);
      const updated = users.filter(u => u.email.toLowerCase() !== email);

      localStorage.setItem(this.USERS_KEY, JSON.stringify(updated));
      this.closeDeleteUserModal();
      this.renderUsers();
      this.renderManagementLists();
      Toast.success('Usuário excluído com sucesso!');

      const currentUser = Auth.getCurrentUser();
      if (currentUser && currentUser.email.toLowerCase() === email) {
        Auth.logout();
      }
    });
  },

  openEditUserModal(email) {
    const users = this.readStorage(this.USERS_KEY, this.defaultUsers);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      Toast.error('Usuário não encontrado.');
      return;
    }

    document.getElementById('editUserOriginalEmail').value = user.email;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPassword').value = user.password || '';
    document.getElementById('editUserRole').value = user.role || 'professor';

    const overlay = document.getElementById('editUserModalOverlay');
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  },

  closeEditUserModal() {
    const overlay = document.getElementById('editUserModalOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.getElementById('editUserForm')?.reset();
  },

  bindEditUserModal() {
    const overlay = document.getElementById('editUserModalOverlay');
    const closeBtn = document.getElementById('closeEditUserModalBtn');
    const cancelBtn = document.getElementById('cancelEditUserBtn');
    const form = document.getElementById('editUserForm');

    closeBtn?.addEventListener('click', () => this.closeEditUserModal());
    cancelBtn?.addEventListener('click', () => this.closeEditUserModal());

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeEditUserModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('open')) {
        this.closeEditUserModal();
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const originalEmail = document.getElementById('editUserOriginalEmail').value.trim().toLowerCase();
      const newName = document.getElementById('editUserName').value.trim();
      const newEmail = document.getElementById('editUserEmail').value.trim().toLowerCase();
      const newPassword = document.getElementById('editUserPassword').value.trim();
      const newRole = document.getElementById('editUserRole').value;

      const users = this.readStorage(this.USERS_KEY, this.defaultUsers);

      if (newEmail !== originalEmail && users.some(u => u.email.toLowerCase() === newEmail)) {
        Toast.error('Este e-mail já está em uso por outro usuário.');
        return;
      }

      const updated = users.map(u => {
        if (u.email.toLowerCase() === originalEmail) {
          return {
            ...u,
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole
          };
        }
        return u;
      });

      localStorage.setItem(this.USERS_KEY, JSON.stringify(updated));
      this.closeEditUserModal();
      this.renderUsers();
      this.renderManagementLists();
      Toast.success('Usuário atualizado com sucesso!');
    });
  },

  bindUserFilters() {
    document.getElementById('usersSearchInput')?.addEventListener('input', () => this.renderUsers());
    document.getElementById('filterUserRole')?.addEventListener('change', () => this.renderUsers());
  },

  parseTicketDate(ticket) {
    if (ticket.createdAt) {
      const d = new Date(ticket.createdAt);
      if (!isNaN(d)) return d;
    }
    if (ticket.date) {
      const parts = ticket.date.split('/');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d)) return d;
      }
      const d2 = new Date(ticket.date);
      if (!isNaN(d2)) return d2;
    }
    return new Date();
  },

  checkPeriod(ticket) {
    if (!this.currentPeriodFilter || this.currentPeriodFilter === 'all' || this.currentPeriodFilter === '0') {
      return true;
    }
    const ticketDate = this.parseTicketDate(ticket);
    const diffDays = Math.abs(new Date() - ticketDate) / (1000 * 60 * 60 * 24);

    if (this.currentPeriodFilter === 'week' || this.currentPeriodFilter === 7) {
      return diffDays <= 7;
    }
    if (this.currentPeriodFilter === 'month' || this.currentPeriodFilter === 30) {
      return diffDays <= 30;
    }
    if (this.currentPeriodFilter === 'year' || this.currentPeriodFilter === 365) {
      return diffDays <= 365;
    }
    const days = parseInt(this.currentPeriodFilter, 10);
    if (!isNaN(days) && days > 0) {
      return diffDays <= days;
    }
    return true;
  },

  filterTicketsByPeriod(tickets) {
    return tickets.filter(t => this.checkPeriod(t));
  },

  renderReports(showSkeleton) {
    const totalEl = document.getElementById('reportTotalTickets');
    const rateEl = document.getElementById('reportResolutionRate');
    const avgTimeEl = document.getElementById('reportAvgTime');
    const topTechEl = document.getElementById('reportTopTechnician');
    const techListEl = document.getElementById('reportTechniciansList');
    const barChartEl = document.getElementById('reportBarChart');

    if (showSkeleton) {
      if (techListEl) techListEl.innerHTML = '<p style="color: var(--muted);">Carregando relatórios...</p>';
    }

    const allTickets = this.getTickets();
    const tickets = this.filterTicketsByPeriod(allTickets);

    const total = tickets.length;
    const completed = tickets.filter(t => t.status === 'Concluído' || t.status === 'Resolvido');
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    if (totalEl) totalEl.textContent = total;
    if (rateEl) rateEl.textContent = rate + '%';

    const times = completed.map(t => parseInt(t.resolutionTimeSpent || '42', 10)).filter(n => !isNaN(n));
    const avgMins = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 42;
    if (avgTimeEl) avgTimeEl.textContent = avgMins + 'm';

    const techCounts = {};
    completed.forEach(t => {
      const tech = t.technicianName || t.assignee || 'Técnico João Silva';
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    });

    const techSorted = Object.entries(techCounts).sort((a, b) => b[1] - a[1]);
    const topTech = techSorted.length > 0 ? techSorted[0][0] : 'Nenhum';
    if (topTechEl) topTechEl.textContent = topTech;

    if (techListEl) {
      if (techSorted.length === 0) {
        techListEl.innerHTML = '<p style="color: var(--text-secondary, #666); margin: 0;">Nenhum atendimento concluído no período selecionado.</p>';
      } else {
        techListEl.innerHTML = techSorted.map(([name, count]) => {
          const pct = completed.length > 0 ? Math.round((count / completed.length) * 100) : 0;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fff; border: 1px solid var(--line); border-radius: 8px;">
              <div>
                <strong>${this.escapeHtml(name)}</strong>
                <span style="display: block; font-size: 0.8rem; color: var(--muted);">${count} chamado${count === 1 ? '' : 's'} resolvido${count === 1 ? '' : 's'}</span>
              </div>
              <span class="status done">${pct}% do total</span>
            </div>
          `;
        }).join('');
      }
    }

    if (barChartEl) {
      const openCount = tickets.filter(t => t.status === 'Aberto').length;
      const progressCount = tickets.filter(t => t.status === 'Em andamento' || t.status === 'Em progresso').length;
      const doneCount = completed.length;
      const maxVal = Math.max(openCount, progressCount, doneCount, 1);

      barChartEl.innerHTML = `
        <div class="bar-item"><div class="bar" style="--bar-height: ${Math.round((openCount/maxVal)*100)}%"></div><span>Abertos (${openCount})</span></div>
        <div class="bar-item"><div class="bar" style="--bar-height: ${Math.round((progressCount/maxVal)*100)}%"></div><span>Andamento (${progressCount})</span></div>
        <div class="bar-item"><div class="bar" style="--bar-height: ${Math.round((doneCount/maxVal)*100)}%"></div><span>Concluídos (${doneCount})</span></div>
      `;
    }

    this.renderInfrastructureHeatmap();
    this.renderIncidentsPriorityDashboard();
  },

  renderInfrastructureHeatmap() {
    const gridEl = document.getElementById('heatmapRoomsGrid');
    if (!gridEl) return;

    const resources = this.readStorage(this.RESOURCES_KEY, [
      { name: 'Sala 12', type: 'Sala' },
      { name: 'Sala 08', type: 'Sala' },
      { name: 'Lab 03', type: 'Laboratório' },
      { name: 'Sala 01', type: 'Sala' },
      { name: 'Coordenação', type: 'Sala' },
      { name: 'Auditório', type: 'Sala' }
    ]);

    const tickets = this.filterTicketsByPeriod(this.getTickets());
    const roomCounts = {};
    tickets.forEach(t => {
      const room = (t.room || 'Não informada').trim();
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    });

    const allRooms = Array.from(new Set([...resources.map(r => r.name), ...Object.keys(roomCounts)]));

    if (allRooms.length === 0) {
      gridEl.innerHTML = '<p style="color: var(--muted); margin: 0;">Nenhum espaço cadastrado ou com chamados no período.</p>';
      return;
    }

    const displayRooms = this.heatmapExpanded ? allRooms : allRooms.slice(0, 4);

    const roomsHtml = displayRooms.map(roomName => {
      const count = roomCounts[roomName] || 0;
      let statusLabel = 'Estável';
      let borderColor = '#10b981';
      let bgBadge = 'rgba(16, 185, 129, 0.12)';

      if (count >= 4) {
        statusLabel = 'Crítico';
        borderColor = '#ef4444';
        bgBadge = 'rgba(239, 68, 68, 0.12)';
      } else if (count >= 2) {
        statusLabel = 'Atenção';
        borderColor = '#f59e0b';
        bgBadge = 'rgba(245, 158, 11, 0.12)';
      }

      return `
        <div style="background: var(--surface); border: 1px solid var(--line); border-left: 4px solid ${borderColor}; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <strong style="font-size: 0.95rem; color: var(--text);">${this.escapeHtml(roomName)}</strong>
            <span style="background: ${bgBadge}; color: ${borderColor}; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">${statusLabel}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--muted); margin-top: 4px;">
            <span>Incidências: <strong>${count}</strong></span>
            <span style="font-size: 0.75rem;">${count === 1 ? '1 chamado' : `${count} chamados`}</span>
          </div>
        </div>
      `;
    }).join('');

    const toggleBtn = document.getElementById('heatmapToggleBtn');
    if (toggleBtn) {
      if (allRooms.length <= 4) {
        toggleBtn.style.display = 'none';
      } else {
        toggleBtn.style.display = 'inline-block';
        toggleBtn.textContent = this.heatmapExpanded ? 'Ver menos' : `Ver todos (${allRooms.length})`;
      }
    }

    gridEl.innerHTML = roomsHtml;
  },

  renderIncidentsPriorityDashboard() {
    const container = document.getElementById('dynamicChartContainer');
    if (!container) return;

    const tickets = this.filterTicketsByPeriod(this.getTickets());
    const priorities = { 'Urgente': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0 };
    tickets.forEach(t => {
      const p = t.priority || 'Média';
      if (priorities[p] !== undefined) {
        priorities[p]++;
      } else {
        priorities['Média']++;
      }
    });

    const total = tickets.length;
    const colors = {
      'Urgente': '#ef4444',
      'Alta': '#f59e0b',
      'Média': '#7a4ae8',
      'Baixa': '#10b981'
    };

    if (total === 0) {
      container.innerHTML = '<p style="color: var(--muted); margin: 0;">Nenhum chamado no período selecionado para exibir no gráfico.</p>';
      return;
    }

    if (this.currentChartView === 'bar') {
      const maxVal = Math.max(...Object.values(priorities), 1);
      container.innerHTML = `
        <div style="display: flex; align-items: flex-end; justify-content: space-around; width: 100%; height: 200px; padding-top: 20px; gap: 16px;">
          ${Object.entries(priorities).map(([prio, count]) => {
            const h = Math.round((count / maxVal) * 150);
            return `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--muted);">${count}</span>
                <div style="width: 100%; max-width: 48px; height: ${Math.max(h, 8)}px; background: ${colors[prio]}; border-radius: 6px 6px 0 0; transition: height 0.3s;"></div>
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text);">${prio}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (this.currentChartView === 'horizontal') {
      const maxVal = Math.max(...Object.values(priorities), 1);
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; gap: 12px; padding: 10px 0;">
          ${Object.entries(priorities).map(([prio, count]) => {
            const w = Math.max(Math.round((count / maxVal) * 100), 4);
            return `
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 70px; font-size: 0.85rem; font-weight: 600; color: var(--text); text-align: right;">${prio}</span>
                <div style="flex: 1; background: var(--bg-surface-alt, #f1f5f9); border-radius: 6px; height: 22px; overflow: hidden; position: relative;">
                  <div style="width: ${w}%; height: 100%; background: ${colors[prio]}; border-radius: 6px; transition: width 0.3s;"></div>
                </div>
                <span style="width: 40px; font-size: 0.85rem; font-weight: 700; color: var(--muted);">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (this.currentChartView === 'line') {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; gap: 16px; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--muted);">
            <span>Tendência de Volume por Prioridade</span>
            <span>Total: ${total} chamados</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; position: relative; height: 120px; padding: 0 20px; border-bottom: 2px solid var(--line);">
            ${Object.entries(priorities).map(([prio, count]) => {
              return `
                <div style="display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; gap: 6px;">
                  <span style="font-size: 0.75rem; font-weight: 700; color: ${colors[prio]};">${count}</span>
                  <div style="width: 14px; height: 14px; border-radius: 50%; background: ${colors[prio]}; border: 3px solid var(--surface); box-shadow: var(--shadow-sm);"></div>
                  <span style="font-size: 0.75rem; font-weight: 600; color: var(--text);">${prio}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (this.currentChartView === 'funnel') {
      const statuses = {
        'Em espera': tickets.filter(t => t.status === 'Em espera' || t.status === 'Aberto').length,
        'Em andamento': tickets.filter(t => t.status === 'Em andamento').length,
        'Concluído': tickets.filter(t => t.status === 'Concluído' || t.status === 'Resolvido').length
      };
      const statusColors = { 'Em espera': '#f59e0b', 'Em andamento': '#7a4ae8', 'Concluído': '#10b981' };
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; gap: 10px; padding: 10px 20px;">
          <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 4px; text-align: center; font-weight: 600;">Funil de Resolução de Chamados</div>
          ${Object.entries(statuses).map(([st, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return `
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
                  <span>${st}</span>
                  <span>${count} (${pct}%)</span>
                </div>
                <div style="width: 100%; background: var(--bg-surface-alt, #f1f5f9); border-radius: 8px; height: 14px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: ${statusColors[st]}; border-radius: 8px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      let cumulativePercent = 0;
      const slices = Object.entries(priorities).map(([prio, count]) => {
        if (count === 0) return null;
        const percent = (count / total) * 100;
        const offset = cumulativePercent;
        cumulativePercent += percent;
        return { prio, count, percent, offset, color: colors[prio] };
      }).filter(Boolean);

      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 30px; flex-wrap: wrap; width: 100%;">
          <div style="position: relative; width: 160px; height: 160px; display: grid; place-items: center;">
            <svg width="160" height="160" viewBox="0 0 32 32" style="transform: rotate(-90deg);">
              ${slices.map(slice => {
                const dashArray = `${slice.percent} ${100 - slice.percent}`;
                return `<circle cx="16" cy="16" r="10" fill="transparent" stroke="${slice.color}" stroke-width="${this.currentChartView === 'donut' ? '5' : '10'}" stroke-dasharray="${dashArray}" stroke-dashoffset="${-slice.offset}" />`;
              }).join('')}
            </svg>
            <div style="position: absolute; text-align: center;">
              <span style="font-size: 1.3rem; font-weight: 900; color: var(--text); display: block; line-height: 1;">${total}</span>
              <span style="font-size: 0.65rem; color: var(--muted); text-transform: uppercase; font-weight: 700;">Total</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; min-width: 140px;">
            ${Object.entries(priorities).map(([prio, count]) => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colors[prio]}; display: inline-block;"></span>
                  <span style="font-weight: 600; color: var(--text);">${prio}</span>
                </div>
                <strong style="color: var(--muted);">${count} (${Math.round((count / (total || 1)) * 100)}%)</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  },
  buildReportPdfHtml(tickets, periodName, generatedAt, total, rate, completed) {
    const rows = tickets.length === 0
      ? `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b;">Nenhum chamado registrado neste período.</td></tr>`
      : tickets.map(t => `
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(t.id)}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(t.title)}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(t.category || t.type || 'Outros')}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(t.requester || 'Professor(a)')}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(t.status || 'Aberto')}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(t.date || t.createdAt?.slice(0, 10) || '—')}</td>
          </tr>
        `).join('');

    return `
      <div style="font-family: Inter, Arial, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; width: 794px; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7a4ae8; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #7a4ae8;">Helpium · Relatório Gerencial</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Sistema de Help Desk Escolar — Painel da Direção</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 13px; font-weight: 600; color: #1e293b;">Período: ${periodName}</div>
            <div style="font-size: 12px; color: #64748b;">Emitido em: ${generatedAt}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
            <span style="font-size: 12px; color: #64748b; display: block;">Total de Chamados</span>
            <strong style="font-size: 24px; color: #1e293b; margin-top: 4px; display: block;">${total}</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
            <span style="font-size: 12px; color: #64748b; display: block;">Taxa de Resolução</span>
            <strong style="font-size: 24px; color: #10b981; margin-top: 4px; display: block;">${rate}%</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
            <span style="font-size: 12px; color: #64748b; display: block;">Chamados Concluídos</span>
            <strong style="font-size: 24px; color: #7a4ae8; margin-top: 4px; display: block;">${completed.length}</strong>
          </div>
        </div>
        <h3 style="font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px;">Listagem de Chamados no Período</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Nº</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Título</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Categoria</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Solicitante</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Status</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Data</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 40px; text-align: right; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Helpium — Relatório Gerencial da Direção · Gerado automaticamente em ${generatedAt}
        </div>
      </div>
    `;
  },

  exportReportToPDF() {
    const btn = document.getElementById('exportReportPdfBtn');
    if (btn) btn.disabled = true;

    const allTickets = this.getTickets();
    const tickets = this.filterTicketsByPeriod(allTickets);
    const periodLabelMap = {
      'week': 'Esta Semana (Últimos 7 dias)',
      'month': 'Este Mês (Últimos 30 dias)',
      'year': 'Este Ano (Últimos 365 dias)',
      'all': 'Todo o Histórico'
    };
    const periodName = periodLabelMap[this.currentPeriodFilter] || 'Período Selecionado';
    const generatedAt = new Date().toLocaleString('pt-BR');
    const total = tickets.length;
    const completed = tickets.filter(t => t.status === 'Concluído' || t.status === 'Resolvido');
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const htmlContent = this.buildReportPdfHtml(tickets, periodName, generatedAt, total, rate, completed);

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0px',
      width: '794px',
      background: '#ffffff'
    });
    document.body.appendChild(container);

    if (!window.html2canvas || !window.jspdf) {
      Toast.error('Bibliotecas de PDF não carregadas.');
      document.body.removeChild(container);
      if (btn) btn.disabled = false;
      return;
    }

    html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      .then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.height / imgProps.width;
        const imgHeight = imgWidth * ratio;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save('Relatorio_Gerencial_Helpium.pdf');
        Toast.success('Relatório em PDF gerado com sucesso!');
      })
      .catch(err => {
        console.error('Erro PDF:', err);
        Toast.error('Erro ao gerar relatório em PDF.');
      })
      .finally(() => {
        document.body.removeChild(container);
        if (btn) btn.disabled = false;
      });
  }
};