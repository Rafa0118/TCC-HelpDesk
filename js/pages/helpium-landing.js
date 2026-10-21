const contactForm = document.getElementById("contact-form")
const formStatus = document.getElementById("form-status")

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault()

    formStatus.textContent =
      "O envio ainda não está disponível porque o serviço de recebimento não foi configurado. Nenhuma solicitação foi enviada ou salva. Procure a equipe responsável da sua escola para saber como continuar."
    formStatus.classList.add("is-visible")
    formStatus.focus()
  })

  contactForm.addEventListener("input", () => {
    formStatus.classList.remove("is-visible")
    formStatus.textContent = ""
  })

  contactForm.addEventListener("change", () => {
    formStatus.classList.remove("is-visible")
    formStatus.textContent = ""
  })
}
