/* ============================================
   HELPIUM - Responsive Tables
   Copia o texto de cada <th> para o atributo data-label das células,
   permitindo que o CSS mobile transforme as linhas em cartões.
   Também observa mudanças (as linhas são geradas via JS).
   ============================================ */

const ResponsiveTables = {
  labelTable(table) {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => {
      const sr = th.querySelector(".sr-only")
      return sr ? "" : th.textContent.trim()
    })
    if (!heads.length) return
    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (cell.tagName !== "TD") return
        if (cell.hasAttribute("colspan")) return
        const label = heads[index]
        if (label && cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label)
        if (!label) cell.setAttribute("data-label", "")
      })
    })
  },

  init() {
    const tables = document.querySelectorAll("table")
    tables.forEach((table) => {
      this.labelTable(table)
      const body = table.querySelector("tbody")
      if (!body) return
      let scheduled = false
      new MutationObserver(() => {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(() => {
          scheduled = false
          this.labelTable(table)
        })
      }).observe(body, { childList: true })
    })
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ResponsiveTables.init())
} else {
  ResponsiveTables.init()
}
