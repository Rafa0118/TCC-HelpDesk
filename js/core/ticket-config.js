/* ============================================
   HELPIUM - Ticket Domain Configuration
   Canonical statuses, categories, priorities and SLA rules
   ============================================ */

const TicketConfig = {
  STORAGE_KEY: "helpium_tickets",
  LEGACY_STORAGE_KEY: "helpium_professor_tickets",

  STATUSES: {
    OPEN: "Em espera",
    IN_PROGRESS: "Em andamento",
    WAITING: "Em análise",
    CLOSED: "Concluído",
    CANCELLED: "Cancelado"
  },

  CLOSED_STATUSES: ["Concluído", "Cancelado"],

  STATUS_CLASSES: {
    "Em espera": "waiting",
    "Em andamento": "progress",
    "Em análise": "progress",
    "Concluído": "done",
    "Cancelado": "cancelled"
  },

  PRIORITIES: ["Urgente", "Alta", "Média", "Baixa"],
  PRIORITY_CLASSES: {
    Urgente: "priority-urgent",
    Alta: "priority-high",
    Média: "priority-medium",
    Baixa: "priority-low"
  },
  PRIORITY_WEIGHTS: { Urgente: 4, Alta: 3, Média: 2, Baixa: 1 },

  CATEGORIES: ["Hardware", "Software", "Rede", "Infraestrutura", "Acesso", "Outros"],
  CATEGORY_ALIASES: {
    "Rede e Conectividade": "Rede",
    "Infraestrutura e Elétrica": "Infraestrutura",
    "Acesso e Contas": "Acesso",
    "Acesso/Credencial": "Acesso",
    "Projetor/Audiovisual": "Hardware",
    "Impressora": "Hardware",
    "Sala de Aula": "Hardware",
    "Wi‑Fi": "Rede",
    "Wi-Fi": "Rede",
    "Computador do professor": "Hardware"
  },
  CATEGORY_WEIGHTS: {
    Hardware: 3,
    Software: 2,
    Rede: 4,
    Infraestrutura: 3,
    Acesso: 4,
    Outros: 1
  },
  SLA_HOURS: { Urgente: 4, Alta: 8, Média: 24, Baixa: 72 }
}
