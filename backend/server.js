const path = require("node:path");
const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const { initializeFirebaseAdmin } = require("./config/firebase-admin");
const { createPasswordResetRouter } = require("./routes/password-reset");
const { createEmailService } = require("./services/email-service");

dotenv.config({ path: path.join(__dirname, ".env") });

function readConfig(env = process.env) {
  const required = [
    "FRONTEND_URL",
    "CONTINUE_URL",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM",
    "FIREBASE_PROJECT_ID"
  ];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}.`);
  }

  const port = Number(env.PORT || 3000);
  const smtpPort = Number(env.SMTP_PORT || 465);
  let frontendUrl;
  let continueUrl;
  try {
    frontendUrl = new URL(env.FRONTEND_URL);
    continueUrl = new URL(env.CONTINUE_URL);
  } catch {
    throw new Error("FRONTEND_URL and CONTINUE_URL must be absolute HTTP(S) URLs.");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }
  if (!Number.isInteger(smtpPort) || ![465, 587].includes(smtpPort)) {
    throw new Error("SMTP_PORT must be 465 or 587.");
  }
  if (!["http:", "https:"].includes(frontendUrl.protocol) ||
      !["http:", "https:"].includes(continueUrl.protocol)) {
    throw new Error("FRONTEND_URL and CONTINUE_URL must be absolute HTTP(S) URLs.");
  }
  if (env.NODE_ENV === "production" &&
      (frontendUrl.protocol !== "https:" || continueUrl.protocol !== "https:")) {
    throw new Error("Production frontend and continue URLs must use HTTPS.");
  }

  const extraOrigins = (env.CORS_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean);
  const parsedOrigins = extraOrigins.map((origin) => {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGINS must contain absolute HTTP(S) origins.");
    }
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error("CORS_ORIGINS must contain origins without paths.");
    }
    return parsed.origin;
  });
  const allowedOrigins = new Set([
    frontendUrl.origin,
    ...parsedOrigins
  ]);
  return {
    port,
    smtpPort,
    smtpHost: env.SMTP_HOST,
    smtpUser: env.SMTP_USER,
    smtpPass: env.SMTP_PASS,
    emailFrom: env.EMAIL_FROM,
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    continueUrl: continueUrl.href,
    allowedOrigins
  };
}

function getStartupDiagnostic(stage, error) {
  const code = typeof error?.code === "string" && /^[A-Z0-9_/-]{1,48}$/i.test(error.code)
    ? error.code
    : undefined;

  if (stage === "configuration") {
    return {
      stage,
      message: error.message
    };
  }

  if (stage === "firebase-credentials") {
    if (code === "ENOENT") {
      return {
        stage,
        code,
        message: "Chave do Firebase não encontrada. Confira backend/serviceAccountKey.json ou FIREBASE_SERVICE_ACCOUNT_PATH."
      };
    }
    if (error instanceof SyntaxError) {
      return {
        stage,
        message: "O arquivo de credenciais do Firebase não contém JSON válido."
      };
    }
    if (code === "FIREBASE_PROJECT_MISMATCH") {
      return {
        stage,
        code,
        message: "O projeto da chave de serviço não corresponde a FIREBASE_PROJECT_ID."
      };
    }
    if (code === "FIREBASE_SERVICE_ACCOUNT_INVALID") {
      return {
        stage,
        code,
        message: "A chave de serviço não contém os metadados esperados para uma conta de serviço Firebase."
      };
    }
    return {
      stage,
      ...(code ? { code } : {}),
      message: "Não foi possível inicializar as credenciais do Firebase Admin. Confira a chave e as permissões do arquivo."
    };
  }

  if (stage === "firebase-connectivity") {
    if (code === "auth/insufficient-permission" || code === "PERMISSION_DENIED" || error?.status === 403) {
      return {
        stage,
        ...(code ? { code } : {}),
        message: "Firebase recusou a operação. Conceda à conta de serviço as permissões de administrador do Firebase Authentication."
      };
    }
    if (["ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) {
      return {
        stage,
        code,
        message: "Não foi possível conectar aos serviços do Firebase. Verifique DNS, conexão e firewall."
      };
    }
    return {
      stage,
      ...(code ? { code } : {}),
      message: "A autenticação da conta de serviço no Firebase falhou. Confira o projeto, as credenciais e as permissões."
    };
  }

  if (stage === "smtp-configuration") {
    return {
      stage,
      ...(code ? { code } : {}),
      message: "Não foi possível criar o transporte SMTP. Confira SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e EMAIL_FROM."
    };
  }

  if (stage === "smtp-connectivity") {
    if (code === "EAUTH" || error?.responseCode === 535 || error?.responseCode === 534) {
      return {
        stage,
        code: code || "EAUTH",
        message: "O Gmail recusou a autenticação SMTP. Confira SMTP_USER, a senha de app em SMTP_PASS e a verificação em duas etapas da conta."
      };
    }
    if (["ENOTFOUND", "ECONNECTION", "ECONNRESET", "ETIMEDOUT", "ESOCKET", "EAI_AGAIN"].includes(code)) {
      return {
        stage,
        code,
        message: "Não foi possível conectar ao servidor SMTP. Confira SMTP_HOST, a porta 465/587 e o acesso de rede."
      };
    }
    return {
      stage,
      ...(code ? { code } : {}),
      message: "A verificação do SMTP falhou. Confira as configurações da conta e se o provedor permite conexão SMTP."
    };
  }

  if (stage === "listen" && code === "EADDRINUSE") {
    return {
      stage,
      code,
      message: "A porta configurada já está em uso. Altere PORT no .env ou encerre o processo que a utiliza."
    };
  }

  return {
    stage,
    ...(code ? { code } : {}),
    message: "A inicialização da API falhou. Confira a configuração do backend."
  };
}

function createApp({ auth, emailService, continueUrl, allowedOrigins, logger = console }) {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.K_SERVICE) {
    app.set("trust proxy", 1);
  }

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed."));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  }));
  app.use(express.json({ limit: "10kb" }));
  app.get("/healthz", (_request, response) => response.json({ status: "ok" }));
  app.use("/api", createPasswordResetRouter({ auth, emailService, continueUrl, logger }));
  app.use((_request, response) => {
    response.status(404).json({ error: "not_found", message: "Rota não encontrada." });
  });
  app.use((error, _request, response, _next) => {
    if (error.type === "entity.parse.failed") {
      response.status(400).json({ error: "invalid_json", message: "Envie um corpo JSON válido." });
      return;
    }
    if (error.type === "entity.too.large") {
      response.status(413).json({ error: "payload_too_large", message: "A solicitação excede o limite permitido." });
      return;
    }

    logger.error("[api] Request failed", { code: error.code || "request_error" });
    response.status(error.message === "Origin is not allowed." ? 403 : 500).json({
      error: "request_failed",
      message: "Não foi possível processar a solicitação."
    });
  });
  return app;
}

async function start() {
  let stage = "configuration";
  try {
    const config = readConfig();

    stage = "firebase-credentials";
    const auth = initializeFirebaseAdmin(config.firebaseProjectId);

    stage = "firebase-connectivity";
    await auth.listUsers(1);

    stage = "smtp-configuration";
    const emailService = createEmailService({
      host: config.smtpHost,
      port: config.smtpPort,
      user: config.smtpUser,
      pass: config.smtpPass,
      from: config.emailFrom
    });

    stage = "smtp-connectivity";
    await emailService.transporter.verify();

    const app = createApp({
      auth,
      emailService,
      continueUrl: config.continueUrl,
      allowedOrigins: config.allowedOrigins
    });

    stage = "listen";
    return await new Promise((resolve, reject) => {
      const server = app.listen(config.port, () => resolve(server));
      server.once("error", reject);
    });
  } catch (error) {
    const diagnostic = getStartupDiagnostic(stage, error);
    const startupError = new Error(diagnostic.message);
    startupError.startupDiagnostic = diagnostic;
    throw startupError;
  }
}

if (require.main === module) {
  start().catch((error) => {
    console.error("[startup] Backend initialization failed", error.startupDiagnostic || {
      stage: "startup",
      message: "A inicialização da API falhou. Confira a configuração do backend."
    });
    process.exitCode = 1;
  });
}

module.exports = { createApp, getStartupDiagnostic, readConfig, start };
