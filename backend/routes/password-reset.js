const { randomUUID } = require("node:crypto");
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const genericResponse = {
  message: "Se uma conta HelpDesk estiver associada a este e-mail, você receberá instruções para redefinir a senha."
};

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createPasswordResetRouter({ auth, emailService, continueUrl, logger = console, maxRequests = 5 }) {
  const router = express.Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({
        error: "too_many_requests",
        message: "Muitas solicitações. Aguarde antes de tentar novamente."
      });
    }
  });

  router.post("/recuperar-senha", limiter, async (request, response) => {
    const email = typeof request.body?.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";

    if (!isValidEmail(email)) {
      response.status(400).json({
        error: "invalid_email",
        message: "Informe um endereço de e-mail válido."
      });
      return;
    }

    const requestId = randomUUID();
    let resetLink;
    try {
      resetLink = await auth.generatePasswordResetLink(email, {
        url: continueUrl,
        handleCodeInApp: false
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        response.status(202).json(genericResponse);
        return;
      }

      if (error.code === "auth/invalid-email") {
        response.status(400).json({
          error: "invalid_email",
          message: "Informe um endereço de e-mail válido."
        });
        return;
      }

      logger.error("[password-reset] Link generation failed", {
        requestId,
        code: error.code || "unknown"
      });
      response.status(503).json({
        error: "processing_failed",
        message: "Não foi possível processar a solicitação agora."
      });
      return;
    }

    try {
      await emailService.sendPasswordReset(email, resetLink);
    } catch (error) {
      logger.error("[password-reset] Email delivery failed", {
        requestId,
        code: error.code || "unknown"
      });
    }

    response.status(202).json(genericResponse);
  });

  return router;
}

module.exports = { createPasswordResetRouter, isValidEmail };
