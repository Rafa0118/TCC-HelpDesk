# API de recuperação de senha

O frontend autentica usuários existentes com Firebase Authentication. O cadastro público está desativado; novas contas são provisionadas pela direção. Esta API apenas gera links oficiais de redefinição com Firebase Admin e os envia usando o template HelpDesk e SMTP. O manipulador padrão do Firebase processa o link e atualiza a senha; o endereço `CONTINUE_URL` é somente o retorno após a redefinição.

## Desenvolvimento local

1. Instale Node.js 22 ou superior e entre nesta pasta.
2. Copie `.env.example` para `.env` e informe um e-mail SMTP e uma senha de aplicativo Gmail. Não use a senha normal da conta.
3. Baixe uma chave de conta de serviço do projeto Firebase `helpdesktcc10` e salve-a como `serviceAccountKey.json` nesta pasta. Conceda somente as permissões necessárias para administrar o Firebase Authentication. Nunca envie essa chave ao Git.
4. No Firebase Console, adicione `localhost` aos domínios autorizados do Authentication.
5. Execute:

```powershell
npm install
npm test
npm start
```

Sirva a pasta `TCC-HelpDesk` na porta 5500 (por exemplo, com a extensão Live Server). A API local usa `http://localhost:3000`. Os testes são isolados e não enviam e-mails nem acessam o Firebase.

O backend valida a conectividade do Firebase Admin e do SMTP antes de abrir a porta. `SMTP_PASS` deve ser uma senha de aplicativo quando usar Gmail com autenticação em duas etapas.

## Publicação no Cloud Run

O repositório atualmente não declara Firebase Hosting nem outro serviço de backend. Publique esta pasta como serviço Node.js separado no Cloud Run. Em produção, use a conta de serviço associada ao Cloud Run (Application Default Credentials) em vez de copiar `serviceAccountKey.json` para a imagem. Se a API não estiver disponível, a página de recuperação usa o envio padrão do Firebase Authentication como alternativa; para manter o template SMTP personalizado, publique a API e configure `window.HELPDESK_API_BASE_URL`.

1. Habilite Cloud Run, Cloud Build e Secret Manager no projeto.
2. Crie um segredo `SMTP_PASS` no Secret Manager com a senha de aplicativo SMTP e conceda à conta de serviço do Cloud Run acesso de leitura somente a esse segredo.
3. Associe ao Cloud Run uma conta de serviço com o papel Firebase Authentication Admin no projeto Firebase.
4. Cadastre o domínio real do frontend em Firebase Authentication > Configurações > Domínios autorizados. Use-o também em `FRONTEND_URL` e `CONTINUE_URL`.
5. A partir da pasta `backend`, publique com valores reais:

```powershell
gcloud run deploy helpdesk-password-reset `
  --source . `
  --region SUA_REGIAO `
  --service-account CONTA_DE_SERVICO_DO_CLOUD_RUN `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=helpdesktcc10,FRONTEND_URL=https://SEU_DOMINIO,CONTINUE_URL=https://SEU_DOMINIO/login.html,SMTP_HOST=smtp.gmail.com,SMTP_PORT=465,SMTP_USER=SEU_EMAIL,EMAIL_FROM=HelpDesk <SEU_EMAIL>" `
  --set-secrets "SMTP_PASS=SMTP_PASS:latest"
```

Não publique antes de substituir os valores de exemplo e configurar o segredo e as permissões. Depois do deploy, defina `window.HELPDESK_API_BASE_URL` para a URL HTTPS do serviço Cloud Run antes de carregar `js/core/password-reset-api.js` no frontend, ou configure um proxy HTTPS no mesmo domínio para `/api`.

## Segurança e configuração

- `POST /api/recuperar-senha` aceita JSON `{ "email": "..." }`. E-mails malformados recebem `400`; solicitações válidas recebem uma resposta genérica para não confirmar se a conta existe.
- O limite padrão é cinco solicitações por IP a cada 15 minutos. CORS aceita `FRONTEND_URL` e, opcionalmente, origens adicionais em `CORS_ORIGINS` separadas por vírgula.
- Erros de entrega SMTP são registrados com identificador de solicitação e código de erro, sem e-mail, link ou credencial. A resposta ao usuário permanece genérica.
- `GET /healthz` verifica se a API está disponível. O processo só inicia após verificar Firebase Admin e SMTP.
- O link é criado exclusivamente por `generatePasswordResetLink(email, actionCodeSettings)` e enviado ao endereço submetido; o Firebase aplica a senha após o usuário concluir o fluxo padrão.
