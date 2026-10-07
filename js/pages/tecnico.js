/* ============================================
   HELPIUM - Tecnico Page Logic
   Technician Dashboard, Ticket Attendance & Funnel Resolution
   ============================================ */

const TecnicoPage = {
  STORAGE_KEY: 'helpium_tickets',
  LEGACY_KEY: 'helpium_professor_tickets',

  EISENHOWER_MATRIX: {
    'Hardware': 3,
    'Software': 2,
    'Rede': 4,
    'Projetor/Audiovisual': 3,
    'Impressora': 2,
    'Sala de Aula': 3,
    'Acesso/Credencial': 4,
    'Infraestrutura': 3,
    'Outros': 1
  },

  PRIORITY_WEIGHTS: {
    'Urgente': 4,
    'Alta': 3,
    'Média': 2,
    'Baixa': 1
  },

  calculatePriority(ticket) {
    const category = ticket.type || ticket.category || 'Outros';
    const userPriority = ticket.priority || 'Média';
    const catWeight = this.EISENHOWER_MATRIX[category] || 1;
    const prioWeight = this.PRIORITY_WEIGHTS[userPriority] || 2;
    const total = catWeight + prioWeight;

    if (total >= 6) return 'Urgente';
    if (total >= 4) return 'Alta';
    if (total >= 3) return 'Média';
    return 'Baixa';
  },

  getPriorityLabel(priority) {
    const labels = { 'Urgente': 'Urgente', 'Alta': 'Alta', 'Média': 'Média', 'Baixa': 'Baixa' };
    return labels[priority] || 'Média';
  },

  RESOLUTION_FUNNEL: {
    'Hardware': {
      icon: 'devices',
      label: 'Hardware (Equipamentos Físicos e Peças)',
      groups: [
        {
          group: 'Periféricos e Cabos',
          options: [
            { id: 'hw_troca_periferico', label: 'Troca de periférico (Teclado, mouse, monitor, fone, webcam)' },
            { id: 'hw_troca_cabos', label: 'Troca ou reparo de cabo de vídeo / força (HDMI, VGA, DisplayPort, Força)' },
            { id: 'hw_reparo_conectores', label: 'Reparo ou desobstrução de conector físico (USB, P2, Áudio frontal)' }
          ]
        },
        {
          group: 'Manutenção Física e Preventiva',
          options: [
            { id: 'hw_manut_preventiva', label: 'Manutenção preventiva (Desmontagem, limpeza de poeira e desoxidação)' },
            { id: 'hw_pasta_termica', label: 'Higienização de coolers/ventoinhas e troca de pasta térmica do CPU' },
            { id: 'hw_revisao_contatos', label: 'Revisão e limpeza de contatos de memória RAM e barramentos PCIe' }
          ]
        },
        {
          group: 'Componentes Internos e Peças',
          options: [
            { id: 'hw_troca_ram', label: 'Substituição ou upgrade de pente de memória RAM' },
            { id: 'hw_troca_disco', label: 'Substituição ou instalação de unidade de armazenamento (SSD/HD)' },
            { id: 'hw_troca_fonte', label: 'Substituição de fonte de alimentação ATX ou regulador de tensão' },
            { id: 'hw_troca_placa', label: 'Diagnóstico e substituição de placa-mãe ou processador' }
          ]
        },
        {
          group: 'Audiovisual, Impressão e Estrutura',
          options: [
            { id: 'hw_manut_projetor', label: 'Manutenção de Projetor / Data-show (Troca de lâmpada, filtro de ar e calibração)' },
            { id: 'hw_manut_impressora', label: 'Manutenção mecânica de impressora (Toner, cilindro, roletes, desobstrução)' },
            { id: 'hw_suporte_montagem', label: 'Ajuste de fixação em suporte de teto/parede, trava antifurto ou bancada' }
          ]
        }
      ]
    },
    'Software': {
      icon: 'terminal',
      label: 'Software (Sistemas, Programas e Drivers)',
      groups: [
        {
          group: 'Formatação e Sistema Operacional',
          options: [
            { id: 'sw_formatacao_so', label: 'Formatação completa e reinstalação limpa do Sistema Operacional (Windows / Linux)' },
            { id: 'sw_restauracao_imagem', label: 'Restauração de imagem institucional padrão / clonagem de disco' },
            { id: 'sw_reparo_boot', label: 'Reparo de inicialização e integridade do sistema (Boot EFI, SFC, DISM)' }
          ]
        },
        {
          group: 'Atualização e Drivers',
          options: [
            { id: 'sw_atualizacao_drivers', label: 'Atualização ou reinstalação de drivers (Vídeo, Áudio Realtek, Rede Ethernet/Wi-Fi)' },
            { id: 'sw_atualizacao_so', label: 'Instalação de patches de segurança e atualizações cumulativas do S.O.' },
            { id: 'sw_atualizacao_bios', label: 'Atualização de BIOS / Firmware da placa-mãe' }
          ]
        },
        {
          group: 'Configuração e Instalação de Softwares',
          options: [
            { id: 'sw_instalacao_office', label: 'Instalação e ativação do Pacote Office 365 / LibreOffice' },
            { id: 'sw_instalacao_pedagogico', label: 'Instalação e configuração de softwares pedagógicos / laboratoriais específicos' },
            { id: 'sw_config_navegador', label: 'Configuração de navegadores (Chrome, Edge), certificados digitais e extensões' }
          ]
        },
        {
          group: 'Otimização, Limpeza e Segurança',
          options: [
            { id: 'sw_remocao_malware', label: 'Varredura e remoção de malwares, adwares e vírus' },
            { id: 'sw_otimizacao_limpeza', label: 'Otimização de inicialização, limpeza de arquivos temporários e registro' },
            { id: 'sw_config_perfil', label: 'Ajuste de perfil de usuário local, variáveis de ambiente e permissões' }
          ]
        }
      ]
    },
    'Rede e Conectividade': {
      icon: 'wifi',
      label: 'Rede e Conectividade (Wi-Fi, Cabos e Internet)',
      groups: [
        {
          group: 'Cabeamento e Pontos Físicos',
          options: [
            { id: 'net_crimpagem_rj45', label: 'Nova crimpagem e troca de conector RJ-45 / Substituição de patch cord' },
            { id: 'net_tomada_keystone', label: 'Diagnóstico com testador de cabo e troca de tomada Keystone na parede' },
            { id: 'net_patch_panel', label: 'Manutenção em Rack / Patch Panel / remanejamento de portas' }
          ]
        },
        {
          group: 'Configuração de IP e Protocolos',
          options: [
            { id: 'net_config_ip', label: 'Configuração de IP estático, Máscara, Gateway padrão e servidores DNS' },
            { id: 'net_renovacao_dhcp', label: 'Renovação de concessão DHCP e resolução de conflito de IP' },
            { id: 'net_proxy_firewall', label: 'Ajuste de configurações de Proxy institucional e liberação de portas de firewall' }
          ]
        },
        {
          group: 'Equipamentos de Rede e Wi-Fi',
          options: [
            { id: 'net_reconfig_ap', label: 'Reconfiguração e reinicialização de Access Point Wi-Fi / Roteador' },
            { id: 'net_ajuste_canais', label: 'Otimização de canais de rádio Wi-Fi (2.4GHz / 5GHz) contra interferência' },
            { id: 'net_porta_switch', label: 'Diagnóstico em porta de Switch gerenciável / configuração de VLAN' },
            { id: 'net_link_operadora', label: 'Diagnóstico em Link de fibra óptica / autenticação de modem ONT' }
          ]
        }
      ]
    },
    'Infraestrutura e Elétrica': {
      icon: 'bolt',
      label: 'Infraestrutura e Elétrica (Energia e Instalações)',
      groups: [
        {
          group: 'Instalações Elétricas e Tomadas',
          options: [
            { id: 'infra_tomada_eletrica', label: 'Substituição de tomada elétrica padrão ABNT, canaleta ou fiação de bancada' },
            { id: 'infra_filtro_linha', label: 'Substituição de filtro de linha / régua de tomadas danificada' },
            { id: 'infra_disjuntor_quadro', label: 'Verificação e rearme de disjuntor em quadro elétrico de distribuição' }
          ]
        },
        {
          group: 'Proteção Elétrica e Climatização',
          options: [
            { id: 'infra_bateria_nobreak', label: 'Troca de bateria selada de No-break ou manutenção em estabilizador' },
            { id: 'infra_ar_condicionado', label: 'Higienização de filtros de ar-condicionado e desobstrução de dreno' },
            { id: 'infra_suporte_fixacao', label: 'Fixação e reforço mecânico de suporte de projetor / lousa em parede' }
          ]
        }
      ]
    },
    'Acesso e Contas': {
      icon: 'lock_reset',
      label: 'Acesso e Contas (Senhas e Credenciais)',
      groups: [
        {
          group: 'Senhas e Domínio',
          options: [
            { id: 'acc_reset_senha', label: 'Redefinição e recuperação de senha de acesso institucional' },
            { id: 'acc_desbloqueio_ad', label: 'Desbloqueio de usuário e sincronização no Active Directory / Domínio' },
            { id: 'acc_permissoes_rede', label: 'Concessão ou ajuste de permissões em pastas compartilhadas na rede' },
            { id: 'acc_email_institucional', label: 'Configuração e sincronização de e-mail institucional (Google Workspace / MS 365)' }
          ]
        }
      ]
    },
    'Outros': {
      icon: 'handyman',
      label: 'Outros (Atendimento Operacional e Triagem)',
      groups: [
        {
          group: 'Tratativas Operacionais',
          options: [
            { id: 'oth_orientacao_usuario', label: 'Orientação técnica presencial ao solicitante sobre uso do equipamento' },
            { id: 'oth_nao_reproduzido', label: 'Validação em bancada (defeito intermitente não reproduzido em testes)' },
            { id: 'oth_garantia_externa', label: 'Equipamento encaminhado para assistência técnica autorizada externa / garantia' },
            { id: 'oth_cancelado_justificado', label: 'Cancelamento justificado por chamado em duplicidade ou fora do escopo' }
          ]
        }
      ]
    }
  },

  defaultTickets: [
    {
      id: '#1047',
      title: 'Projetor não liga na Sala 12',
      room: 'Sala 12',
      requester: 'Prof. Carlos Mendes',
      date: '24/09/2026',
      time: '08:15',
      type: 'Hardware',
      priority: 'Alta',
      status: 'Em espera',
      description: 'O projetor não emite sinal de luz e o led frontal fica piscando na cor laranja intermitente.',
      photo: '',
      resolutionCategory: '',
      resolutionSubcategory: '',
      resolutionDetails: '',
      resolutionTimeSpent: '',
      resolutionParts: '',
      resolutionUserNote: '',
      technicianName: '',
      resolvedAt: ''
    },
    {
      id: '#1049',
      title: 'Wi-Fi oscilando e caindo no Lab 03',
      room: 'Laboratório 03',
      requester: 'Profª. Ana Souza',
      date: '24/09/2026',
      time: '09:30',
      type: 'Rede',
      priority: 'Alta',
      status: 'Em andamento',
      description: 'Durante as aulas práticas, 6 computadores perdem conexão com a internet simultaneamente.',
      photo: '',
      resolutionCategory: 'Rede e Conectividade',
      resolutionSubcategory: 'Reconfiguração / reinicialização de Access Point Wi-Fi ou Roteador',
      resolutionDetails: 'Identificada sobrecarga no canal 6 do Access Point Unifi. Realizada a migração para canal 11.',
      resolutionTimeSpent: '45 minutos',
      resolutionParts: 'Ajuste de configuração via controladora',
      resolutionUserNote: 'Monitorando estabilidade durante a aula de hoje.',
      technicianName: 'Técnico João Silva',
      resolvedAt: ''
    },
    {
      id: '#1052',
      title: 'Computador do professor sem saída de áudio',
      room: 'Sala 04',
      requester: 'Prof. Ricardo Gomes',
      date: '23/09/2026',
      time: '14:20',
      type: 'Software',
      priority: 'Média',
      status: 'Concluído',
      description: 'Caixas de som não reproduzem o áudio dos vídeos exibidos na aula.',
      photo: '',
      resolutionCategory: 'Software',
      resolutionSubcategory: 'Atualização ou reinstalação de drivers de dispositivos (Áudio, Vídeo, Rede)',
      resolutionDetails: 'Reinstalado o pacote de drivers Realtek High Definition Audio. Realizados testes com áudio estéreo perfeito.',
      resolutionTimeSpent: '30 minutos',
      resolutionParts: 'Nenhum insumo consumido',
      resolutionUserNote: 'Áudio calibrado e volume padrão ajustado em 70%.',
      technicianName: 'Técnico João Silva',
      resolvedAt: '23/09/2026 15:00'
    },
    {
      id: '#1042',
      title: 'Ar-condicionado do Bloco B sem refrigerar',
      room: 'Bloco B - Sala 22',
      requester: 'Coordenação Pedagógica',
      date: '24/09/2026',
      time: '07:45',
      type: 'Infraestrutura',
      priority: 'Alta',
      status: 'Em andamento',
      description: 'Aparelho liga porém ventila apenas em temperatura ambiente.',
      photo: '',
      resolutionCategory: 'Infraestrutura e Elétrica',
      resolutionSubcategory: 'Limpeza de filtros ou manutenção básica de ar-condicionado',
      resolutionDetails: 'Realizada a higienização dos filtros de ar primários e checagem do disjuntor.',
      resolutionTimeSpent: '30 minutos',
      resolutionParts: 'Limpa contato e kit de higienização',
      resolutionUserNote: 'Em teste de estabilidade térmica.',
      technicianName: 'Técnico João Silva',
      resolvedAt: ''
    },
    {
      id: '#1038',
      title: 'Monitor com linhas verticais',
      room: 'Sala 14',
      requester: 'Prof. Marcos Lima',
      date: '24/09/2026',
      time: '10:00',
      type: 'Hardware',
      priority: 'Alta',
      status: 'Em espera',
      description: 'Monitor da bancada apresenta listras coloridas e aquecimento.',
      photo: '',
      resolutionCategory: '',
      resolutionSubcategory: '',
      resolutionDetails: '',
      resolutionTimeSpent: '',
      resolutionParts: '',
      resolutionUserNote: '',
      technicianName: '',
      resolvedAt: ''
    },
    {
      id: '#1040',
      title: 'Portão eletrônico da entrada travado',
      room: 'Entrada Principal',
      requester: 'Diretora Carla Mendes',
      date: '23/09/2026',
      time: '11:10',
      type: 'Infraestrutura',
      priority: 'Alta',
      status: 'Concluído',
      description: 'Sensor de fim de curso descalibrado, impedindo fechamento.',
      photo: '',
      resolutionCategory: 'Infraestrutura e Elétrica',
      resolutionSubcategory: 'Outro reparo de infraestrutura',
      resolutionDetails: 'Reaperto dos ímãs do sensor fim de curso e lubrificação das roldanas com graxa branca.',
      resolutionTimeSpent: '45 minutos',
      resolutionParts: 'Graxa branca especial e parafusos Allen',
      resolutionUserNote: 'Portão operando perfeitamente em modo automático.',
      technicianName: 'Técnico João Silva',
      resolvedAt: '23/09/2026 12:00'
    },
    {
      id: '#1048',
      title: 'Sistema de catraca / acesso sem resposta',
      room: 'Recepção / Catracas',
      requester: 'Secretaria Escolar',
      date: '23/09/2026',
      time: '08:00',
      type: 'Acesso',
      priority: 'Média',
      status: 'Cancelado',
      description: 'Catraca 02 apresentava tela congelada.',
      photo: '',
      resolutionCategory: 'Outros',
      resolutionSubcategory: 'Cancelado por duplicidade ou fora de escopo técnico',
      resolutionDetails: 'Chamado duplicado. O suporte da empresa terceirizada realizou a troca da placa minutos antes.',
      resolutionTimeSpent: 'Até 15 minutos',
      resolutionParts: 'Nenhum',
      resolutionUserNote: 'Atendido pelo fornecedor da garantia.',
      technicianName: 'Técnico João Silva',
      resolvedAt: '23/09/2026 08:25'
    }
  ],
  currentFilter: 'Todos',
  currentCategoryFilter: 'Todas',
  searchQuery: '',
  activeEditingTicketId: null,

  getTickets() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) return saved;

      const legacy = JSON.parse(localStorage.getItem(this.LEGACY_KEY) || 'null');
      if (Array.isArray(legacy) && legacy.length > 0) {
        const merged = [...this.defaultTickets];
        legacy.forEach((lt) => {
          if (!merged.some((t) => t.id === lt.id)) {
            merged.push({
              id: lt.id,
              title: lt.title || 'Chamado Solicitado',
              room: lt.room || 'Sala',
              requester: lt.requester || 'Professor',
              date: lt.date || new Date().toLocaleDateString('pt-BR'),
              time: '10:00',
              type: lt.type || 'Hardware',
              priority: lt.priority || 'Média',
              status: lt.status || 'Em espera',
              description: lt.description || 'Sem descrição.',
              photo: lt.photo || '',
              resolutionCategory: lt.resolutionCategory || '',
              resolutionSubcategory: lt.resolutionSubcategory || '',
              resolutionDetails: lt.resolutionDetails || '',
              resolutionTimeSpent: lt.resolutionTimeSpent || '',
              resolutionParts: lt.resolutionParts || '',
              resolutionUserNote: lt.resolutionUserNote || '',
              technicianName: lt.technicianName || '',
              resolvedAt: lt.resolvedAt || ''
            });
          }
        });
        this.saveTickets(merged);
        return merged;
      }
    } catch (e) {
      console.warn('Erro ao carregar chamados:', e);
    }
    this.saveTickets(this.defaultTickets);
    return [...this.defaultTickets];
  },

  saveTickets(tickets) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets));
      localStorage.setItem(this.LEGACY_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Erro ao salvar chamados:', e);
    }
  },

  getTicketById(id) {
    const tickets = this.getTickets();
    return tickets.find((t) => String(t.id).trim() === String(id).trim()) || null;
  },

  updateTicket(id, updateData) {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => String(t.id).trim() === String(id).trim());
    if (index === -1) return false;
    tickets[index] = { ...tickets[index], ...updateData };
    this.saveTickets(tickets);
    return true;
  },

  init() {
    const user = Auth.requireAuth();
    if (!user || user.role !== 'tecnico') {
      window.location.href = 'login.html';
      return;
    }

    if (window.location.hash === '#perfil') {
      window.location.replace('tecnico-perfil.html');
      return;
    }

    window.addEventListener('hashchange', (event) => {
      if (window.location.hash !== '#perfil') return;
      event.stopImmediatePropagation();
      window.location.replace('tecnico-perfil.html');
    }, true);

    if (user.name) {
      const nameEl = document.getElementById('userName');
      if (nameEl) nameEl.textContent = user.name;
    }

    Sidebar.init();
    UserMenu.init();
    Navigation.init();
    Navigation.initBottomNav();

    // Bottom nav CTA: atender primeiro chamado pendente
    document.addEventListener('bottomNavNewTicket', () => {
      const pending = this.getTickets().filter((t) => t.status !== 'Concluído' && t.status !== 'Cancelado');
      if (pending.length) {
        const priorityOrder = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
        pending.sort((a, b) => {
          return (priorityOrder[this.calculatePriority(a)] || 4) - (priorityOrder[this.calculatePriority(b)] || 4);
        });
        this.attendTicket(pending[0].id);
      } else {
        Toast.info('Nenhum chamado pendente na fila.');
      }
    });

    document.getElementById('notificationsBtn')?.addEventListener('click', () => {
      Navigation.ringBell();
      Toast.info('Você tem chamados prioritários na sua fila de atendimento.');
    });

    document.getElementById('supportBtn')?.addEventListener('click', () => {
      Toast.info('Canal de suporte com a coordenação de TI acionado.');
    });

    this.bindResolutionModal();
    this.bindFiltersAndSearch();
    this.renderStats(this.getTickets());
    this.renderAllSections(true);
    const initialTarget = window.location.hash.slice(1);
    if (document.getElementById(initialTarget)) Navigation.showSection(initialTarget);
    else Navigation.showSection('inicio');
  },

  renderAllSections(showSkeleton = false) {
    if (showSkeleton) {
      SkeletonLoader.showList('#priorityTicketsList', 3);
      SkeletonLoader.showList('#myTicketsGrid', 3);
      SkeletonLoader.showList('#allTicketsGrid', 3);
      setTimeout(() => this.renderAllSections(false), 300);
      return;
    }

    const tickets = this.getTickets();
    this.renderStats(tickets);
    this.renderPriorityTickets(tickets);
    this.renderMyTickets(tickets);
    this.renderAllTickets(tickets);
    this.renderReports(tickets);
  },

  renderStats(tickets) {
    const total = tickets.length;
    const inProgress = tickets.filter((t) => t.status === 'Em andamento').length;
    const completed = tickets.filter((t) => t.status === 'Concluído').length;
    const waiting = tickets.filter((t) => t.status === 'Em espera').length;

    const totalEl = document.getElementById('statTotalTickets');
    const progressEl = document.getElementById('statProgressTickets');
    const doneEl = document.getElementById('statDoneTickets');
    const waitingEl = document.getElementById('statWaitingTickets');

    if (totalEl) totalEl.textContent = total;
    if (progressEl) progressEl.textContent = inProgress;
    if (doneEl) doneEl.textContent = completed;
    if (waitingEl) waitingEl.textContent = waiting;
  },

  renderPriorityTickets(tickets) {
    const container = document.getElementById('priorityTicketsList');
    if (!container) return;

    const priorityOrder = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    const priorityList = tickets
      .filter((t) => t.status !== 'Concluído' && t.status !== 'Cancelado')
      .map((t) => ({ ...t, calculatedPriority: this.calculatePriority(t) }))
      .sort((a, b) => {
        const pa = priorityOrder[a.calculatedPriority] ?? 4;
        const pb = priorityOrder[b.calculatedPriority] ?? 4;
        return pa - pb;
      })
      .slice(0, 3);

    if (priorityList.length === 0) {
      container.innerHTML = `
        <div class="empty-ticket-hint">
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          <p>Nenhum chamado urgente pendente no momento. Bom trabalho!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = priorityList
      .map((ticket) => {
        const statusClass = this.getStatusClass(ticket.status);
        const priorityClass = this.getPriorityClass(ticket.calculatedPriority);
        return `
        <div class="ticket-item priority-card" data-ticket-id="${ticket.id}">
          <div class="priority-card-heading">
            <span class="priority-pill ${priorityClass}">
              <span class="material-symbols-outlined" aria-hidden="true">flag</span>
              ${this.getPriorityLabel(ticket.calculatedPriority)}
            </span>
            <span class="status ${statusClass}">${ticket.status}</span>
          </div>
          <div class="ticket-meta">
            <span class="ticket-title">${ticket.id} · ${this.escapeHtml(ticket.title)}</span>
            <span class="ticket-subtitle">${this.escapeHtml(ticket.room)} • Solicitado por ${this.escapeHtml(ticket.requester || 'Professor')}</span>
          </div>
          <div class="ticket-actions-row">
            <span class="priority-ticket-date">
              <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
              <span>${this.escapeHtml(ticket.date || 'Data não informada')}${ticket.time ? ` · ${this.escapeHtml(ticket.time)}` : ''}</span>
            </span>
            <button type="button" class="btn-attend-ticket" data-open-ticket="${ticket.id}" title="Atender chamado">
              <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
              <span>Atender</span>
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    container.querySelectorAll('[data-open-ticket]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.attendTicket(btn.dataset.openTicket);
      });
    });

    container.querySelectorAll('.priority-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.openResolutionModal(card.dataset.ticketId);
      });
    });
  },

  renderMyTickets(tickets) {
    const container = document.getElementById('myTicketsGrid');
    if (!container) return;

    const filtered = this.filterTicketList(tickets);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-ticket-hint">
          <span class="material-symbols-outlined" aria-hidden="true">search_off</span>
          <p>Nenhum chamado encontrado com os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((ticket) => this.buildTicketCardHtml(ticket)).join('');
    this.attachTicketCardEvents(container);
  },

  renderAllTickets(tickets) {
    const container = document.getElementById('allTicketsGrid');
    if (!container) return;

    const filtered = this.filterTicketList(tickets);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-ticket-hint">
          <span class="material-symbols-outlined" aria-hidden="true">filter_list_off</span>
          <p>Nenhum chamado corresponde aos critérios de busca.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((ticket) => this.buildTicketCardHtml(ticket)).join('');
    this.attachTicketCardEvents(container);
  },

  renderReports(tickets) {
    const total = tickets.length;
    const completed = tickets.filter((t) => t.status === 'Concluído');
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const reportCountEl = document.getElementById('reportCompletedCount');
    const reportRateEl = document.getElementById('reportResolutionRate');
    if (reportCountEl) reportCountEl.textContent = completed.length;
    if (reportRateEl) reportRateEl.textContent = rate + '%';

    const catCounts = {
      'Hardware': 0,
      'Software': 0,
      'Rede e Conectividade': 0,
      'Infraestrutura e Elétrica': 0,
      'Acesso e Contas': 0,
      'Outros': 0
    };

    tickets.forEach((t) => {
      const cat = t.resolutionCategory || t.type;
      if (cat && catCounts[cat] !== undefined) {
        catCounts[cat]++;
      } else if (cat && cat.toLowerCase().includes('hard')) {
        catCounts['Hardware']++;
      } else if (cat && cat.toLowerCase().includes('soft')) {
        catCounts['Software']++;
      } else if (cat && (cat.toLowerCase().includes('rede') || cat.toLowerCase().includes('wi'))) {
        catCounts['Rede e Conectividade']++;
      } else if (cat && (cat.toLowerCase().includes('infra') || cat.toLowerCase().includes('elétr') || cat.toLowerCase().includes('ar-cond'))) {
        catCounts['Infraestrutura e Elétrica']++;
      } else {
        catCounts['Outros']++;
      }
    });

    const catGrid = document.getElementById('categoryBreakdownGrid');
    if (catGrid) {
      catGrid.innerHTML = Object.entries(catCounts)
        .map(([catName, count]) => {
          const funnelInfo = this.RESOLUTION_FUNNEL[catName] || { icon: 'category' };
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return `
            <div class="category-stat-card">
              <div class="category-stat-top">
                <span class="material-symbols-outlined cat-icon" aria-hidden="true">${funnelInfo.icon}</span>
                <span class="cat-title">${catName}</span>
                <span class="cat-count">${count}</span>
              </div>
              <div class="cat-progress-bar">
                <div class="cat-progress-fill" style="width: ${percent}%;"></div>
              </div>
              <span class="cat-percent">${percent}% dos chamados</span>
            </div>
          `;
        })
        .join('');
    }

    const auditListEl = document.getElementById('recentResolutionsList');
    if (auditListEl) {
      const resolvedList = completed.slice(0, 5);
      if (resolvedList.length === 0) {
        auditListEl.innerHTML = '<p class="empty-text">Nenhum chamado concluído ainda.</p>';
      } else {
        auditListEl.innerHTML = resolvedList
          .map((t) => `
            <div class="resolution-audit-item" data-open-ticket="${t.id}">
              <div class="audit-left">
                <div class="audit-badge done">✓ Concluído</div>
                <strong>${t.id} · ${this.escapeHtml(t.title)}</strong>
                <div class="audit-meta">
                  <span><span class="material-symbols-outlined" aria-hidden="true">category</span> ${this.escapeHtml(t.resolutionCategory || 'Hardware')}</span>
                  <span><span class="material-symbols-outlined" aria-hidden="true">timer</span> ${this.escapeHtml(t.resolutionTimeSpent || '30m')}</span>
                  <span><span class="material-symbols-outlined" aria-hidden="true">person</span> ${this.escapeHtml(t.technicianName || 'Técnico')}</span>
                </div>
                ${t.resolutionDetails ? `<p class="audit-desc">"${this.escapeHtml(t.resolutionDetails)}"</p>` : ''}
              </div>
              <button type="button" class="btn-view-resolution" data-open-ticket="${t.id}">Ver Ficha</button>
            </div>
          `)
          .join('');

        auditListEl.querySelectorAll('[data-open-ticket]').forEach((el) => {
          el.addEventListener('click', () => {
            this.openResolutionModal(el.dataset.openTicket);
          });
        });
      }
    }
  },

  buildTicketCardHtml(ticket) {
    const statusClass = this.getStatusClass(ticket.status);
    const priorityClass = this.getPriorityClass(this.calculatePriority(ticket));
    const hasResolution = Boolean(ticket.resolutionCategory || ticket.resolutionDetails);

    return `
      <article class="technician-ticket-card status-border-${statusClass}" data-ticket-id="${ticket.id}">
        <header class="tech-card-header">
          <div class="tech-card-tags">
            <span class="ticket-badge-id">${ticket.id}</span>
            <span class="priority-pill ${priorityClass}">
              <span class="material-symbols-outlined" aria-hidden="true">flag</span>
              ${this.getPriorityLabel(this.calculatePriority(ticket))}
            </span>
            <span class="room-pill">
              <span class="material-symbols-outlined" aria-hidden="true">meeting_room</span>
              ${this.escapeHtml(ticket.room)}
            </span>
          </div>
          <span class="status ${statusClass}">${ticket.status}</span>
        </header>

        <div class="tech-card-body">
          <h3 class="tech-card-title">${this.escapeHtml(ticket.title)}</h3>
          
          <div class="tech-card-meta">
            <span class="meta-inline">
              <span class="material-symbols-outlined" aria-hidden="true">person</span>
              ${this.escapeHtml(ticket.requester || 'Solicitante')}
            </span>
            <span class="meta-inline">
              <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
              ${ticket.date} ${ticket.time ? 'às ' + ticket.time : ''}
            </span>
          </div>

          <div class="solicitation-preview-box">
            <span class="preview-label">Problema Relatado:</span>
            <p class="preview-text">${this.escapeHtml(ticket.description || 'Sem detalhes informados.')}</p>
          </div>

          ${
            hasResolution
              ? `
            <div class="resolution-preview-card">
              <div class="resolution-badge-bar">
                <span class="funnel-cat-badge">
                  <span class="material-symbols-outlined" aria-hidden="true">category</span>
                  ${this.escapeHtml(ticket.resolutionCategory || 'Geral')}
                </span>
                ${
                  ticket.resolutionSubcategory
                    ? `<span class="funnel-subcat-badge">${this.escapeHtml(ticket.resolutionSubcategory)}</span>`
                    : ''
                }
              </div>

              ${
                ticket.resolutionDetails
                  ? `
                <div class="resolution-text-snippet">
                  <strong>Resolução Técnica:</strong>
                  <p>${this.escapeHtml(ticket.resolutionDetails)}</p>
                </div>
              `
                  : ''
              }

              <div class="resolution-footer-tags">
                ${
                  ticket.resolutionTimeSpent
                    ? `<span><span class="material-symbols-outlined" aria-hidden="true">timer</span> ${this.escapeHtml(ticket.resolutionTimeSpent)}</span>`
                    : ''
                }
                ${
                  ticket.technicianName
                    ? `<span><span class="material-symbols-outlined" aria-hidden="true">badge</span> ${this.escapeHtml(ticket.technicianName)}</span>`
                    : ''
                }
                ${
                  ticket.resolvedAt
                    ? `<span><span class="material-symbols-outlined" aria-hidden="true">event_available</span> ${ticket.resolvedAt}</span>`
                    : ''
                }
              </div>
            </div>
          `
              : `
            <div class="pending-resolution-notice">
              <span class="material-symbols-outlined" aria-hidden="true">hourglass_top</span>
              <span>Aguardando atendimento e diagnóstico do técnico</span>
            </div>
          `
          }
        </div>

        <footer class="tech-card-footer">
          <button type="button" class="btn-attend-action" data-open-ticket="${ticket.id}">
            <span class="material-symbols-outlined" aria-hidden="true">build_circle</span>
            <span>${ticket.status === 'Concluído' ? 'Ver / Editar Resolução' : 'Atender Chamado'}</span>
          </button>
        </footer>
      </article>
    `;
  },

  attachTicketCardEvents(container) {
    container.querySelectorAll('[data-open-ticket]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.attendTicket(btn.dataset.openTicket);
      });
    });

    container.querySelectorAll('.technician-ticket-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.openResolutionModal(card.dataset.ticketId);
      });
    });
  },

  filterTicketList(tickets) {
    return tickets.filter((ticket) => {
      if (this.currentFilter !== 'Todos' && ticket.status !== this.currentFilter) {
        return false;
      }

      if (this.currentCategoryFilter !== 'Todas') {
        const cat = ticket.resolutionCategory || ticket.type || '';
        if (!cat.toLowerCase().includes(this.currentCategoryFilter.toLowerCase())) {
          return false;
        }
      }

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = (ticket.title || '').toLowerCase().includes(q);
        const matchId = (ticket.id || '').toLowerCase().includes(q);
        const matchRoom = (ticket.room || '').toLowerCase().includes(q);
        const matchRequester = (ticket.requester || '').toLowerCase().includes(q);
        const matchDesc = (ticket.description || '').toLowerCase().includes(q);
        const matchRes = (ticket.resolutionDetails || '').toLowerCase().includes(q);
        const matchCat = (ticket.resolutionCategory || '').toLowerCase().includes(q);

        if (!matchTitle && !matchId && !matchRoom && !matchRequester && !matchDesc && !matchRes && !matchCat) {
          return false;
        }
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
        this.renderMyTickets(this.getTickets());
        this.renderAllTickets(this.getTickets());
      });
    });

    const catSelect = document.getElementById('filterCategorySelect');
    catSelect?.addEventListener('change', (e) => {
      this.currentCategoryFilter = e.target.value;
      this.renderMyTickets(this.getTickets());
      this.renderAllTickets(this.getTickets());
    });

    const searchInput = document.getElementById('ticketSearchInput');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.renderMyTickets(this.getTickets());
      this.renderAllTickets(this.getTickets());
    });
  },

  bindResolutionModal() {
    const overlay = document.getElementById('resolutionModalOverlay');
    const closeBtn = document.getElementById('closeResolutionModalBtn');
    const cancelBtn = document.getElementById('cancelResolutionBtn');
    const form = document.getElementById('technicianResolutionForm');
    const categorySelect = document.getElementById('resolutionCategorySelect');
    const actionSelect = document.getElementById('resolutionActionSelect');
    const statusBtns = document.querySelectorAll('.status-segment, .status-option-btn');
    const statusInput = document.getElementById('selectedStatusInput');
    const detailsTextarea = document.getElementById('resolutionDetailsTextarea');
    const charCounter = document.getElementById('charCounter');
    const quickChips = document.querySelectorAll('.quick-chip');

    closeBtn?.addEventListener('click', () => this.closeResolutionModal());
    cancelBtn?.addEventListener('click', () => this.closeResolutionModal());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeResolutionModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('open')) {
        this.closeResolutionModal();
      }
    });

    statusBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.status-segment, .status-option-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const status = btn.dataset.status;
        if (statusInput) statusInput.value = status;
        this.updateModalStatusBadge(status);
      });
    });

    categorySelect?.addEventListener('change', (e) => {
      this.populateActionGroups(e.target.value, '');
      this.populateSubcategories(e.target.value, '', '');
    });

    actionSelect?.addEventListener('change', (e) => {
      this.populateSubcategories(categorySelect?.value || '', e.target.value, '');
    });

    detailsTextarea?.addEventListener('input', () => {
      if (charCounter) {
        charCounter.textContent = detailsTextarea.value.length + ' caracteres';
      }
    });

    quickChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const template = chip.dataset.template;
        if (!detailsTextarea) return;
        if (detailsTextarea.value.trim().length > 0) {
          detailsTextarea.value = detailsTextarea.value + '\n\n' + template;
        } else {
          detailsTextarea.value = template;
        }
        detailsTextarea.focus();
        if (charCounter) {
          charCounter.textContent = detailsTextarea.value.length + ' caracteres';
        }
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveResolution(form);
    });
  },

  populateActionGroups(category, selectedGroup = '') {
    const actionSelect = document.getElementById('resolutionActionSelect');
    if (!actionSelect) return;

    const data = this.RESOLUTION_FUNNEL[category];
    if (!data || !Array.isArray(data.groups)) {
      actionSelect.innerHTML = '<option value="" disabled selected>Selecione o domínio primeiro...</option>';
      actionSelect.disabled = true;
      return;
    }

    actionSelect.innerHTML = '<option value="" disabled ' + (!selectedGroup ? 'selected' : '') + '>Selecione a ação específica...</option>' +
      data.groups.map((group) => {
        const isSelected = selectedGroup === group.group;
        return '<option value="' + this.escapeHtml(group.group) + '" ' + (isSelected ? 'selected' : '') + '>' +
          this.escapeHtml(group.group) + '</option>';
      }).join('');
    actionSelect.disabled = false;
  },

  populateSubcategories(category, selectedGroup = '', selectedSubcat = '') {
    const subcategorySelect = document.getElementById('resolutionSubcategorySelect');
    if (!subcategorySelect) return;

    const data = this.RESOLUTION_FUNNEL[category];
    const group = data?.groups?.find((item) => item.group === selectedGroup);
    if (!category || !group) {
      subcategorySelect.innerHTML = '<option value="" disabled selected>Selecione a ação primeiro...</option>';
      subcategorySelect.disabled = true;
      return;
    }

    let optionsHtml = '<option value="" disabled ' + (!selectedSubcat ? 'selected' : '') + '>Selecione a ação / causa específica...</option>';

    if (Array.isArray(group.options)) {
      group.options.forEach((opt) => {
        const isSelected = selectedSubcat === opt.label || selectedSubcat === opt.id;
        optionsHtml += '<option value="' + this.escapeHtml(opt.label) + '" ' + (isSelected ? 'selected' : '') + '>' + this.escapeHtml(opt.label) + '</option>';
      });
    } else if (Array.isArray(data.subcategories)) {
      data.subcategories.forEach((sub) => {
        const isSelected = selectedSubcat === sub.label || selectedSubcat === sub.id;
        optionsHtml += '<option value="' + this.escapeHtml(sub.label) + '" ' + (isSelected ? 'selected' : '') + '>' + this.escapeHtml(sub.label) + '</option>';
      });
    }

    subcategorySelect.innerHTML = optionsHtml;
    subcategorySelect.disabled = false;
    subcategorySelect.classList.remove('pulse-highlight');
    void subcategorySelect.offsetWidth; // trigger reflow
    subcategorySelect.classList.add('pulse-highlight');
  },

  attendTicket(ticketId) {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      Toast.error('Chamado não encontrado.');
      return;
    }

    if (ticket.status === 'Em espera' || ticket.status === 'Aberto') {
      this.updateTicket(ticketId, { status: 'Em andamento' });
      Toast.success('Chamado ' + ticket.id + ' colocado em andamento.');
    }

    this.openResolutionModal(ticketId);
  },

  openResolutionModal(ticketId) {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      Toast.error('Chamado não encontrado.');
      return;
    }

    this.activeEditingTicketId = ticket.id;

    document.getElementById('modalTicketId').textContent = ticket.id;
    document.getElementById('modalTicketTitle').textContent = ticket.title;
    document.getElementById('modalTicketRequester').textContent = ticket.requester || 'Professor(a)';
    document.getElementById('modalTicketRoom').textContent = ticket.room || 'Ambiente';
    document.getElementById('modalTicketDate').textContent = (ticket.date || '') + (ticket.time ? ' às ' + ticket.time : '');
    document.getElementById('modalTicketPriority').textContent = (ticket.priority || 'Média') + ' prioridade';
    document.getElementById('modalTicketDescription').textContent = ticket.description || 'Sem descrição fornecida pelo solicitante.';

    const photoWrap = document.getElementById('modalTicketPhotoWrap');
    const photoImg = document.getElementById('modalTicketPhoto');
    if (ticket.photo && photoWrap && photoImg) {
      photoImg.src = ticket.photo;
      photoWrap.style.display = 'block';
    } else if (photoWrap) {
      photoWrap.style.display = 'none';
    }

    const currentStatus = ticket.status || 'Em andamento';
    const statusInput = document.getElementById('selectedStatusInput');
    if (statusInput) statusInput.value = currentStatus;

    document.querySelectorAll('.status-segment, .status-option-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.status === currentStatus);
    });
    this.updateModalStatusBadge(currentStatus);

    const categorySelect = document.getElementById('resolutionCategorySelect');
    const detectedCategory = ticket.resolutionCategory || (this.RESOLUTION_FUNNEL[ticket.type] ? ticket.type : '');
    if (categorySelect) {
      categorySelect.value = detectedCategory;
    }

    const detectedGroup = this.RESOLUTION_FUNNEL[detectedCategory]?.groups?.find((group) =>
      group.options?.some((option) => option.label === ticket.resolutionSubcategory || option.id === ticket.resolutionSubcategory)
    )?.group || '';
    this.populateActionGroups(detectedCategory, detectedGroup);
    this.populateSubcategories(detectedCategory, detectedGroup, ticket.resolutionSubcategory || '');

    const timeSpentSelect = document.getElementById('resolutionTimeSpent');
    if (timeSpentSelect) {
      timeSpentSelect.value = ticket.resolutionTimeSpent || '30 minutos';
    }

    const partsInput = document.getElementById('resolutionParts');
    if (partsInput) {
      partsInput.value = ticket.resolutionParts || '';
    }

    const detailsTextarea = document.getElementById('resolutionDetailsTextarea');
    if (detailsTextarea) {
      detailsTextarea.value = ticket.resolutionDetails || '';
      const charCounter = document.getElementById('charCounter');
      if (charCounter) {
        charCounter.textContent = detailsTextarea.value.length + ' caracteres';
      }
    }

    const userNoteInput = document.getElementById('resolutionUserNote');
    if (userNoteInput) {
      userNoteInput.value = ticket.resolutionUserNote || '';
    }

    const overlay = document.getElementById('resolutionModalOverlay');
    overlay?.classList.add('open');
    overlay?.setAttribute('aria-hidden', 'false');
  },

  closeResolutionModal() {
    const overlay = document.getElementById('resolutionModalOverlay');
    overlay?.classList.remove('open');
    overlay?.setAttribute('aria-hidden', 'true');
    this.activeEditingTicketId = null;
    document.getElementById('technicianResolutionForm')?.reset();

    this.resetFunnelSelects();
    this.resetModalStatus();

    const badge = document.getElementById('modalTicketStatusBadge');
    if (badge) badge.classList.add('modal-badge-hidden');
  },

  resetFunnelSelects() {
    const categorySelect = document.getElementById('resolutionCategorySelect');
    const actionSelect = document.getElementById('resolutionActionSelect');
    const subcategorySelect = document.getElementById('resolutionSubcategorySelect');

    if (categorySelect) {
      categorySelect.value = '';
      this.populateActionGroups('', '');
    }
    if (actionSelect) {
      actionSelect.innerHTML = '<option value="" disabled selected>Selecione o domínio primeiro...</option>';
      actionSelect.disabled = true;
    }
    if (subcategorySelect) {
      subcategorySelect.innerHTML = '<option value="" disabled selected>Selecione a ação primeiro...</option>';
      subcategorySelect.disabled = true;
      subcategorySelect.classList.remove('pulse-highlight');
    }
  },

  resetModalStatus() {
    const statusInput = document.getElementById('selectedStatusInput');
    if (statusInput) statusInput.value = 'Em andamento';
    document.querySelectorAll('.status-segment, .status-option-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.status === 'Em andamento');
    });
    this.updateModalStatusBadge('Em andamento');
  },

  updateModalStatusBadge(status) {
    const badge = document.getElementById('modalTicketStatusBadge');
    if (!badge) return;
    badge.textContent = status;
    badge.className = 'cover-badge ' + this.getStatusClass(status);
    badge.classList.toggle('modal-badge-hidden', !status);
  },

  handleSaveResolution(form) {
    if (!this.activeEditingTicketId) {
      Toast.error('Nenhum chamado ativo selecionado.');
      return;
    }

    const ticket = this.getTicketById(this.activeEditingTicketId);
    if (!ticket) {
      Toast.error('Chamado não localizado.');
      return;
    }

    const newStatus = document.getElementById('selectedStatusInput')?.value || 'Em andamento';
    const category = document.getElementById('resolutionCategorySelect')?.value || '';
    const action = document.getElementById('resolutionActionSelect')?.value || '';
    const subcategory = document.getElementById('resolutionSubcategorySelect')?.value || '';
    const timeSpent = document.getElementById('resolutionTimeSpent')?.value || '';
    const parts = document.getElementById('resolutionParts')?.value.trim() || '';
    const details = document.getElementById('resolutionDetailsTextarea')?.value.trim() || '';
    const userNote = document.getElementById('resolutionUserNote')?.value.trim() || '';

    if (newStatus === 'Concluído' && (!category || !action || !subcategory || !details)) {
      Toast.warning('Para concluir o chamado, selecione o domínio, a ação, a visão detalhada e informe os detalhes da resolução.');
      return;
    }

    const currentUser = Auth.getCurrentUser();
    const technicianName = currentUser?.name || 'Técnico';
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const updated = this.updateTicket(this.activeEditingTicketId, {
      status: newStatus,
      resolutionCategory: category,
      resolutionSubcategory: subcategory,
      resolutionTimeSpent: timeSpent,
      resolutionParts: parts,
      resolutionDetails: details,
      resolutionUserNote: userNote,
      technicianName: technicianName,
      resolvedAt: newStatus === 'Concluído' ? formattedDate : (ticket.resolvedAt || '')
    });

    if (updated) {
      this.closeResolutionModal();
      this.renderAllSections();
      Toast.success('Chamado ' + this.activeEditingTicketId + ' atualizado com sucesso (' + newStatus + ')!');
    } else {
      Toast.error('Erro ao salvar as informações do chamado.');
    }
  },

  getStatusClass(status) {
    switch (status) {
      case 'Concluído':
      case 'Resolvido':
        return 'done';
      case 'Em andamento':
      case 'Em análise':
        return 'progress';
      case 'Cancelado':
        return 'cancelled';
      case 'Em espera':
      case 'Aberto':
      default:
        return 'waiting';
    }
  },

  getPriorityClass(priority) {
    switch (priority) {
      case 'Urgente':
        return 'priority-urgent';
      case 'Alta':
        return 'priority-high';
      case 'Média':
        return 'priority-medium';
      case 'Baixa':
      default:
        return 'priority-low';
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
