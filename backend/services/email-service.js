const fs = require("node:fs");
const path = require("node:path");
const nodemailer = require("nodemailer");

const templatePath = path.join(__dirname, "..", "templates", "password-reset.html");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderPasswordResetEmail(resetLink) {
  const template = fs.readFileSync(templatePath, "utf8");
  return template.replace("{{RESET_LINK}}", escapeHtml(resetLink));
}

function createEmailService({ host, port, user, pass, from }) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass }
  });

  return {
    transporter,
    async sendPasswordReset(email, resetLink) {
      const html = renderPasswordResetEmail(resetLink);
      const text = [
        "Redefinição de senha",
        "",
        "Olá!",
        "",
        "Recebemos uma solicitação para redefinir a senha da sua conta no HelpDesk.",
        "Para cadastrar uma nova senha, acesse o link abaixo:",
        resetLink,
        "",
        "Se você não solicitou a redefinição da sua senha, ignore este e-mail. Nenhuma alteração será realizada na sua conta.",
        "",
        "Equipe HelpDesk"
      ].join("\n");

      await transporter.sendMail({
        from,
        to: email,
        subject: "Redefinição de senha",
        text,
        html,
        disableFileAccess: true,
        disableUrlAccess: true
      });
    }
  };
}

module.exports = { createEmailService, renderPasswordResetEmail };
