/* Unified ticket repository: migration, lifecycle and collaboration */
const Tickets = {
  getAll() {
    let canonical = this.read(TicketConfig.STORAGE_KEY)
    let legacy = this.read(TicketConfig.LEGACY_STORAGE_KEY)
    let source = canonical.length ? canonical : legacy
    if (!source.length) {
      source = [
        {
          id: '#1047',
          title: 'Projetor não liga na Sala 12',
          room: 'Sala 12',
          requester: 'Prof. Carlos Mendes',
          category: 'Hardware',
          priority: 'Alta',
          status: 'Em espera',
          description: 'O projetor não emite sinal de luz e o led frontal fica piscando na cor laranja intermitente.',
          createdAt: new Date().toISOString()
        },
        {
          id: '#1049',
          title: 'Wi-Fi oscilando e caindo no Lab 03',
          room: 'Laboratório 03',
          requester: 'Profª. Ana Souza',
          category: 'Rede',
          priority: 'Alta',
          status: 'Em andamento',
          description: 'Durante as aulas práticas, 6 computadores perdem conexão com a internet simultaneamente.',
          createdAt: new Date(Date.now() - 3600000).toISOString()
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
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ]
      this.save(source)
    }
    const tickets = source.map(ticket => this.normalize(ticket)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (JSON.stringify(source) !== JSON.stringify(tickets) || (!canonical.length && legacy.length)) this.save(tickets)
    return tickets
  },

  read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]")
      return Array.isArray(value) ? value : []
    } catch {
      return []
    }
  },

  save(tickets) {
    const normalized = tickets.map(ticket => this.normalize(ticket))
    const serialized = JSON.stringify(normalized)
    localStorage.setItem(TicketConfig.STORAGE_KEY, serialized)
    localStorage.setItem(TicketConfig.LEGACY_STORAGE_KEY, serialized)
    document.dispatchEvent(new CustomEvent("helpium:tickets-changed", { detail: { tickets: normalized } }))
    return normalized
  },

  normalize(ticket = {}) {
    let status = this.normalizeStatus(ticket.status)
    const category = TicketConfig.CATEGORY_ALIASES[ticket.category || ticket.type] || ticket.category || ticket.type || "Outros"
    const priority = TicketConfig.PRIORITIES.includes(ticket.priority) ? ticket.priority : this.priorityFor(category)
    const createdAt = this.iso(ticket.createdAt) || this.brDate(ticket.date, ticket.time) || new Date().toISOString()
    const resolution = ticket.resolution || { category: ticket.resolutionCategory || "", action: ticket.resolutionAction || "", subcategory: ticket.resolutionSubcategory || "", timeSpent: ticket.resolutionTimeSpent || "", parts: ticket.resolutionParts || "", details: ticket.resolutionDetails || "", userNote: ticket.resolutionUserNote || "" }
    const id = String(ticket.id || this.nextId())
    const assignee = String(ticket.assignee || ticket.technicianName || "").trim()

    if (!assignee && (status === "Em andamento" || status === "Em análise")) {
      status = "Em espera"
    }

    return {
      ...ticket,
      id: id.startsWith("#") ? id : `#${id}`,
      title: String(ticket.title || "Chamado sem título").trim(),
      room: String(ticket.room || "Local não informado").trim(),
      category, type: category, priority, status,
      requester: ticket.requester || ticket.requesterName || "Professor(a)",
      requesterEmail: String(ticket.requesterEmail || "").toLowerCase(),
      assignee,
      assigneeEmail: String(ticket.assigneeEmail || "").toLowerCase(),
      technicianName: assignee,
      description: ticket.description || "", photo: ticket.photo || "", createdAt,
      updatedAt: this.iso(ticket.updatedAt) || createdAt,
      date: ticket.date || this.date(createdAt), time: ticket.time || this.time(createdAt),
      resolvedAtIso: this.iso(ticket.resolvedAtIso) || (status === "Concluído" ? this.brDate(ticket.resolvedAt) : ""),
      resolvedAt: ticket.resolvedAt || "", resolution,
      resolutionCategory: resolution.category, resolutionAction: resolution.action, resolutionSubcategory: resolution.subcategory,
      resolutionTimeSpent: resolution.timeSpent, resolutionParts: resolution.parts, resolutionDetails: resolution.details, resolutionUserNote: resolution.userNote,
      history: Array.isArray(ticket.history) ? ticket.history : [], comments: Array.isArray(ticket.comments) ? ticket.comments : [], rating: ticket.rating || null,
      slaDueAt: this.iso(ticket.slaDueAt) || new Date(new Date(createdAt).getTime() + TicketConfig.SLA_HOURS[priority] * 3600000).toISOString(),
      reopenedReason: ticket.reopenedReason || ""
    }
  },

  normalizeStatus(status) {
    const aliases = { Aberto: "Em espera", Resolvido: "Concluído" }
    return Object.values(TicketConfig.STATUSES).includes(aliases[status] || status) ? aliases[status] || status : "Em espera"
  },

  priorityFor(category) {
    const weight = TicketConfig.CATEGORY_WEIGHTS[category] || 1
    return weight >= 4 ? "Alta" : weight >= 3 ? "Média" : "Baixa"
  },

  nextId() {
    const highest = this.read(TicketConfig.STORAGE_KEY).reduce((max, ticket) => Math.max(max, Number(String(ticket.id || "").replace(/\D/g, "")) || 0), 0)
    return `#${highest + 1}`
  },

  find(id) {
    return this.getAll().find(ticket => String(ticket.id) === String(id)) || null
  },

  create(data, actor = {}) {
    const now = new Date().toISOString()
    const ticket = this.normalize({ ...data, id: this.nextId(), status: "Em espera", createdAt: now, updatedAt: now, requester: data.requester || actor.name, requesterEmail: data.requesterEmail || actor.email, history: [this.event("created", "Chamado aberto", actor)] })
    this.save([ticket, ...this.getAll()])
    this.notifyTechnicians("Novo chamado", `${ticket.id} — ${ticket.title}`, ticket.id)
    return ticket
  },

  assign(id, technician, actor = {}) {
    return this.mutate(id, ticket => {
      this.assertOpen(ticket)
      const assignee = technician.name || "Técnico(a)"
      return { ...ticket, assignee, assigneeEmail: technician.email || "", technicianName: assignee, status: ticket.status === "Em espera" ? "Em andamento" : ticket.status, history: [...ticket.history, this.event("assigned", `Atendimento assumido por ${assignee}`, actor)] }
    })
  },

  resolve(id, resolution, actor = {}) {
    return this.mutate(id, ticket => {
      this.assertOpen(ticket)
      if (!resolution.details) throw new Error("Informe os detalhes da resolução para concluir o chamado.")
      const now = new Date().toISOString()
      const full = { ...ticket.resolution, ...resolution }
      return { ...ticket, status: "Concluído", assignee: actor.name || ticket.assignee, assigneeEmail: actor.email || ticket.assigneeEmail, technicianName: actor.name || ticket.technicianName, resolvedAtIso: now, resolvedAt: this.dateTime(now), resolution: full, resolutionCategory: full.category, resolutionAction: full.action, resolutionSubcategory: full.subcategory, resolutionTimeSpent: full.timeSpent, resolutionParts: full.parts, resolutionDetails: full.details, resolutionUserNote: full.userNote, history: [...ticket.history, this.event("resolved", "Chamado concluído", actor)] }
    }, ticket => {
      if (ticket.requesterEmail) Notifications.create({ recipientEmail: ticket.requesterEmail, title: "Chamado concluído", message: `${ticket.id} foi concluído. Avalie o atendimento.`, ticketId: ticket.id, type: "success" })
    })
  },

  reopen(id, reason, actor = {}) {
    if (!String(reason || "").trim()) throw new Error("Informe o motivo para reabrir o chamado.")
    return this.mutate(id, ticket => {
      if (!this.closed(ticket)) throw new Error("Apenas chamados encerrados podem ser reabertos.")
      return { ...ticket, status: "Em espera", resolvedAtIso: "", resolvedAt: "", reopenedReason: reason.trim(), history: [...ticket.history, this.event("reopened", `Chamado reaberto: ${reason.trim()}`, actor)] }
    })
  },

  addComment(id, message, actor = {}) {
    if (!String(message || "").trim()) throw new Error("Escreva uma mensagem antes de enviar.")
    return this.mutate(id, ticket => ({ ...ticket, comments: [...ticket.comments, { id: `comment-${Date.now()}`, message: message.trim(), author: actor.name || "Usuário", authorEmail: actor.email || "", createdAt: new Date().toISOString() }], history: [...ticket.history, this.event("comment", "Novo comentário adicionado", actor)] }))
  },

  rate(id, score, comment, actor = {}) {
    const value = Number(score)
    if (value < 1 || value > 5) throw new Error("Selecione uma nota entre 1 e 5.")
    return this.mutate(id, ticket => {
      if (ticket.status !== "Concluído") throw new Error("A avaliação está disponível após a conclusão.")
      return { ...ticket, rating: { score: value, comment: String(comment || "").trim(), ratedAt: new Date().toISOString(), by: actor.name || "Solicitante" } }
    })
  },

  mutate(id, transform, afterSave) {
    const tickets = this.getAll()
    const index = tickets.findIndex(ticket => String(ticket.id) === String(id))
    if (index < 0) throw new Error("Chamado não encontrado.")
    const updated = this.normalize(transform(tickets[index]))
    updated.updatedAt = new Date().toISOString()
    tickets[index] = updated
    this.save(tickets)
    if (afterSave) afterSave(updated)
    return updated
  },

  closed(ticket) {
    return TicketConfig.CLOSED_STATUSES.includes(ticket.status)
  },

  assertOpen(ticket) {
    if (this.closed(ticket)) throw new Error("Chamados encerrados são somente leitura. Reabra-o para continuar.")
  },

  event(type, message, actor = {}) {
    return { id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, message, actor: actor.name || "Sistema", createdAt: new Date().toISOString() }
  },

  notifyTechnicians(title, message, ticketId) {
    try {
      const users = JSON.parse(localStorage.getItem("helpium_users") || "[]")
      users.filter(user => user.role === "tecnico").forEach(user => Notifications.create({ recipientEmail: user.email, title, message, ticketId }))
    } catch {}
  },

  iso(value) {
    if (!value) return ""
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? "" : date.toISOString()
  },

  brDate(value, time = "00:00") {
    const match = String(value || "").match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (!match) return ""
    const parts = String(time || "00:00").match(/\d{1,2}:\d{2}/)?.[0].split(":").map(Number) || [0, 0]
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), parts[0], parts[1]).toISOString()
  },

  date(value) {
    return new Date(value).toLocaleDateString("pt-BR")
  },

  time(value) {
    return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  },

  dateTime(value) {
    return `${this.date(value)} ${this.time(value)}`
  }
}


