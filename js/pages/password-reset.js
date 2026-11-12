const passwordResetForm = document.getElementById("passwordResetForm");
const passwordResetEmail = document.getElementById("email");
const passwordResetSubmit = document.getElementById("passwordResetSubmit");
const passwordResetFeedback = document.getElementById("passwordResetFeedback");

passwordResetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  passwordResetFeedback.textContent = "";
  passwordResetFeedback.removeAttribute("data-kind");

  const email = passwordResetEmail.value.trim();
  if (!passwordResetEmail.validity.valid || !email) {
    passwordResetFeedback.textContent = "Informe um endereço de e-mail válido.";
    passwordResetFeedback.dataset.kind = "error";
    passwordResetEmail.focus();
    return;
  }

  passwordResetSubmit.disabled = true;
  passwordResetSubmit.textContent = "Enviando...";
  try {
    const result = await PasswordResetAPI.request(email);
    passwordResetFeedback.textContent = result.message;
    passwordResetFeedback.dataset.kind = "success";
  } catch (error) {
    passwordResetFeedback.textContent = PasswordResetAPI.getErrorMessage(error);
    passwordResetFeedback.dataset.kind = "error";
  } finally {
    passwordResetSubmit.disabled = false;
    passwordResetSubmit.textContent = "Enviar link de redefinição";
  }
});
