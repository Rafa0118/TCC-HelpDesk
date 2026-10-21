/* ============================================
   HELPIUM - Persistent Notifications
   ============================================ */

const Notifications = {
  STORAGE_KEY: "helpium_notifications",

  getAll() {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]")
      return Array.isArray(notifications) ? notifications : []
    } catch {
      return []
    }
  },

  save(notifications) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications))
    document.dispatchEvent(new CustomEvent("helpium:notifications-changed"))
  },

  create({ recipientEmail = "", title, message, ticketId = "", type = "info" }) {
    const notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recipientEmail: String(recipientEmail).toLowerCase(),
      title: title || "Atualização no Helpium",
      message: message || "",
      ticketId,
      type,
      read: false,
      createdAt: new Date().toISOString()
    }
    this.save([notification, ...this.getAll()].slice(0, 200))
    return notification
  },

  forUser(email) {
    const normalizedEmail = String(email || "").toLowerCase()
    return this.getAll().filter(notification => !notification.recipientEmail || notification.recipientEmail === normalizedEmail)
  },

  unreadCount(email) {
    return this.forUser(email).filter(notification => !notification.read).length
  },

  markAllRead(email) {
    const normalizedEmail = String(email || "").toLowerCase()
    this.save(this.getAll().map(notification => {
      if (!notification.recipientEmail || notification.recipientEmail === normalizedEmail) return { ...notification, read: true }
      return notification
    }))
  },

  bindBell() {
    const button = document.getElementById("notificationsBtn")
    const user = typeof Auth !== "undefined" ? Auth.getCurrentUser() : null
    if (!button || !user) return

    const update = () => {
      const unread = this.unreadCount(user.email)
      const dot = button.querySelector(".notification-dot")
      button.setAttribute("aria-label", unread ? `Notificações: ${unread} não lida${unread === 1 ? "" : "s"}` : "Notificações")
      if (dot) dot.hidden = unread === 0
    }

    button.addEventListener("click", () => {
      if (typeof Navigation !== "undefined") Navigation.ringBell()
      const items = this.forUser(user.email)
      if (!items.length) {
        Toast.info("Nenhuma notificação no momento.")
        return
      }
      const unread = items.filter(item => !item.read)
      const latest = unread[0] || items[0]
      this.markAllRead(user.email)
      Toast.info(`${latest.title}: ${latest.message}`)
      update()
    })

    document.addEventListener("helpium:notifications-changed", update)
    update()
  }
}
