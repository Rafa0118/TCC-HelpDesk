window.PasswordResetAPI = (() => {
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  const genericMessage = "Se uma conta HelpDesk estiver associada a este e-mail, você receberá instruções para redefinir a senha.";

  function getBaseUrl() {
    if (typeof window.HELPDESK_API_BASE_URL === "string") {
      return window.HELPDESK_API_BASE_URL.replace(/\/+$/, "");
    }

    return localHosts.has(window.location.hostname) ? "http://localhost:3000" : "";
  }

  async function requestWithFirebase(email) {
    try {
      if (!window.FirebaseDB || typeof window.FirebaseDB.sendPasswordResetEmail !== "function") {
        const error = new Error("firebase_unavailable");
        error.kind = "network";
        throw error;
      }

      await window.FirebaseDB.sendPasswordResetEmail(email);
      return { message: genericMessage };
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return { message: genericMessage };
      }
      if (error.kind) {
        throw error;
      }
      console.error("[password-reset] Firebase request failed", {
        code: error.code || "unknown"
      });
      error.kind = "firebase";
      throw error;
    }
  }

  async function request(email) {
    let response;
    try {
      response = await fetch(`${getBaseUrl()}/api/recuperar-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    } catch {
      return requestWithFirebase(email);
    }

    let result = {};
    try {
      result = await response.json();
    } catch {
      result = {};
    }

    if (!response.ok) {
      if (response.status === 404 || response.status >= 500) {
        return requestWithFirebase(email);
      }
      const error = new Error(result.error || "request_failed");
      error.kind = "http";
      error.status = response.status;
      throw error;
    }
    if (typeof result.message !== "string" || !result.message.trim()) {
      const error = new Error("invalid_response");
      error.kind = "http";
      error.status = 502;
      throw error;
    }

    return result;
  }

  function getErrorMessage(error) {
    if (error.kind === "network") {
      return "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.";
    }
    if (error.status === 400) {
      return "Informe um endereço de e-mail válido.";
    }
    if (error.status === 429) {
      return "Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.";
    }
    if (error.code === "auth/invalid-email") {
      return "Informe um endereço de e-mail válido.";
    }
    if (error.code === "auth/too-many-requests") {
      return "Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.";
    }
    if (error.code === "auth/network-request-failed") {
      return "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.";
    }
    if ([
      "auth/app-not-authorized",
      "auth/invalid-api-key",
      "auth/invalid-continue-uri",
      "auth/operation-not-allowed",
      "auth/unauthorized-continue-uri"
    ].includes(error.code)) {
      return "O serviço de redefinição está com uma configuração incompleta. Entre em contato com o suporte.";
    }
    return "Não foi possível processar a solicitação agora. Tente novamente mais tarde.";
  }

  return { request, getErrorMessage };
})();
