/* ============================================
   HELPIUM - Ticket Metrics
   Computed dashboard and report indicators
   ============================================ */

const TicketMetrics = {
  toDate(value) {
    if (!value) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  },

  getResolutionMinutes(ticket) {
    const openedAt = this.toDate(ticket.createdAt)
    const resolvedAt = this.toDate(ticket.resolvedAtIso)
    if (!openedAt || !resolvedAt) return null
    return Math.max(0, Math.round((resolvedAt - openedAt) / 60000))
  },

  summarize(tickets, now = new Date()) {
    const list = Array.isArray(tickets) ? tickets : []
    const closed = list.filter(ticket => TicketConfig.CLOSED_STATUSES.includes(ticket.status))
    const completed = list.filter(ticket => ticket.status === TicketConfig.STATUSES.CLOSED)
    const open = list.filter(ticket => !TicketConfig.CLOSED_STATUSES.includes(ticket.status))
    const inProgress = list.filter(ticket => ticket.status === TicketConfig.STATUSES.IN_PROGRESS)
    const waiting = list.filter(ticket => ticket.status === TicketConfig.STATUSES.OPEN || ticket.status === TicketConfig.STATUSES.WAITING)
    const resolutionTimes = completed.map(ticket => this.getResolutionMinutes(ticket)).filter(value => value !== null)
    const ratings = completed.map(ticket => Number(ticket.rating?.score)).filter(value => value >= 1 && value <= 5)
    const overdue = open.filter(ticket => {
      const dueAt = this.toDate(ticket.slaDueAt)
      return dueAt && dueAt < now
    })

    return {
      total: list.length,
      open: open.length,
      waiting: waiting.length,
      inProgress: inProgress.length,
      closed: closed.length,
      completed: completed.length,
      cancelled: list.filter(ticket => ticket.status === TicketConfig.STATUSES.CANCELLED).length,
      overdue: overdue.length,
      resolutionRate: list.length ? Math.round((completed.length / list.length) * 100) : 0,
      averageResolutionMinutes: resolutionTimes.length ? Math.round(resolutionTimes.reduce((sum, value) => sum + value, 0) / resolutionTimes.length) : 0,
      averageRating: ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10 : null,
      byCategory: this.countBy(list, ticket => ticket.category || "Outros"),
      byPriority: this.countBy(list, ticket => ticket.priority || "Média"),
      byStatus: this.countBy(list, ticket => ticket.status || TicketConfig.STATUSES.OPEN)
    }
  },

  countBy(tickets, getKey) {
    return tickets.reduce((groups, ticket) => {
      const key = getKey(ticket)
      groups[key] = (groups[key] || 0) + 1
      return groups
    }, {})
  },

  formatDuration(minutes) {
    if (!minutes) return "—"
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    if (!hours) return `${remainder}min`
    return remainder ? `${hours}h ${remainder}min` : `${hours}h`
  }
}
