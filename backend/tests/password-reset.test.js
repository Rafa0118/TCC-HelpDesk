const assert = require("node:assert/strict");
const { afterEach, beforeEach, test } = require("node:test");
const { createApp, getStartupDiagnostic, readConfig } = require("../server");
const { assertFirebaseProject } = require("../config/firebase-admin");
const { renderPasswordResetEmail } = require("../services/email-service");

const continueUrl = "http://localhost:5500/login.html";
const allowedOrigins = new Set(["http://localhost:5500"]);
let server;
let baseUrl;
let auth;
let emailService;
let logger;

beforeEach(async () => {
  resetMocks();
  server = createApp({
    auth,
    emailService,
    continueUrl,
    allowedOrigins,
    logger
  }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function resetMocks() {
  auth = {
    async generatePasswordResetLink(email, settings) {
      auth.lastCall = { email, settings };
      return "https://helpdesktcc10.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=valid";
    }
  };
  emailService = {
    async sendPasswordReset(email, link) {
      emailService.lastCall = { email, link };
    }
  };
  logger = { error() {} };
}

async function post(body, origin = "http://localhost:5500") {
  return fetch(`${baseUrl}/api/recuperar-senha`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin
    },
    body: JSON.stringify(body)
  });
}

test("valid email uses the Firebase reset link and returns a generic response", async () => {
  const response = await post({ email: " Person@Example.com " });
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    message: "Se uma conta HelpDesk estiver associada a este e-mail, você receberá instruções para redefinir a senha."
  });
  assert.equal(auth.lastCall.email, "person@example.com");
  assert.deepEqual(auth.lastCall.settings, { url: continueUrl, handleCodeInApp: false });
  assert.equal(emailService.lastCall.email, "person@example.com");
  assert.match(emailService.lastCall.link, /oobCode=valid/);
});

test("invalid emails are rejected before calling Firebase", async () => {
  auth.generatePasswordResetLink = async () => {
    throw new Error("Firebase must not be called for invalid input");
  };

  const response = await post({ email: "not-an-email" });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_email");
});

test("unknown accounts receive the same generic response without sending mail", async () => {
  auth.generatePasswordResetLink = async () => {
    const error = new Error("not found");
    error.code = "auth/user-not-found";
    throw error;
  };

  const response = await post({ email: "unknown@example.com" });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).message, "Se uma conta HelpDesk estiver associada a este e-mail, você receberá instruções para redefinir a senha.");
  assert.equal(emailService.lastCall, undefined);
});

test("SMTP failures are logged without exposing account status", async () => {
  const errors = [];
  logger.error = (...args) => errors.push(args);
  emailService.sendPasswordReset = async () => {
    const error = new Error("SMTP failed");
    error.code = "ECONNECTION";
    throw error;
  };
  const response = await post({ email: "person@example.com" });
  assert.equal(response.status, 202);
  assert.match((await response.json()).message, /Se uma conta HelpDesk/);
  assert.equal(errors[0][1].code, "ECONNECTION");
  assert.equal(JSON.stringify(errors).includes("person@example.com"), false);
});

test("CORS rejects origins outside the configured frontend", async () => {
  const response = await post({ email: "person@example.com" }, "https://attacker.example");
  assert.equal(response.status, 403);
});

test("rate limit blocks requests after five attempts", async () => {
  auth.generatePasswordResetLink = async () => {
    const error = new Error("not found");
    error.code = "auth/user-not-found";
    throw error;
  };

  const responses = [];
  for (let index = 0; index < 6; index += 1) {
    responses.push(await post({ email: `person${index}@example.com` }));
  }
  assert.deepEqual(responses.map((response) => response.status), [202, 202, 202, 202, 202, 429]);
});

test("configuration parses frontend origins and Firebase continuation URL", () => {
  const config = readConfig({
    PORT: "3000",
    SMTP_PORT: "465",
    SMTP_HOST: "smtp.gmail.com",
    SMTP_USER: "sender@example.com",
    SMTP_PASS: "local-test-secret",
    EMAIL_FROM: "HelpDesk <sender@example.com>",
    FIREBASE_PROJECT_ID: "helpdesktcc10",
    FRONTEND_URL: "http://localhost:5500",
    CONTINUE_URL: "http://localhost:5500/login.html",
    CORS_ORIGINS: "http://127.0.0.1:5500"
  });

  assert.equal(config.port, 3000);
  assert.equal(config.continueUrl, "http://localhost:5500/login.html");
  assert.deepEqual([...config.allowedOrigins], [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ]);
});

test("configuration reports missing environment variables clearly", () => {
  assert.throws(
    () => readConfig({}),
    /Missing required environment variables: FRONTEND_URL, CONTINUE_URL/
  );
});

test("Firebase service account is checked against the configured project", () => {
  const serviceAccount = {
    type: "service_account",
    project_id: "helpdesktcc10"
  };
  assert.equal(assertFirebaseProject(serviceAccount, "helpdesktcc10"), undefined);
  assert.throws(
    () => assertFirebaseProject(serviceAccount, "another-project"),
    { code: "FIREBASE_PROJECT_MISMATCH" }
  );
  assert.throws(
    () => assertFirebaseProject({ type: "service_account" }, "helpdesktcc10"),
    { code: "FIREBASE_SERVICE_ACCOUNT_INVALID" }
  );
});

test("startup diagnostics identify Gmail authentication without exposing SMTP secrets", () => {
  const diagnostic = getStartupDiagnostic("smtp-connectivity", Object.assign(
    new Error("535 credentials must never appear in the terminal"),
    { code: "EAUTH", responseCode: 535 }
  ));
  assert.equal(diagnostic.stage, "smtp-connectivity");
  assert.match(diagnostic.message, /Gmail recusou a autenticação SMTP/);
  assert.equal(JSON.stringify(diagnostic).includes("credentials must never appear"), false);
});

test("startup diagnostics identify Firebase permission failures", () => {
  const diagnostic = getStartupDiagnostic("firebase-connectivity", Object.assign(
    new Error("permission details"),
    { code: "auth/insufficient-permission" }
  ));
  assert.match(diagnostic.message, /permissões de administrador do Firebase Authentication/);
});

test("email template inserts only the escaped Firebase link and required copy", () => {
  const html = renderPasswordResetEmail("https://example.com/?a=1&b=<script>");
  assert.match(html, /Redefinição de senha/);
  assert.match(html, /Redefinir minha senha/);
  assert.match(html, /Se você não solicitou a redefinição da sua senha, ignore este e-mail/);
  assert.match(html, /https:\/\/example\.com\/\?a=1&amp;b=&lt;script&gt;/);
  assert.match(html, /Equipe HelpDesk/);
});
