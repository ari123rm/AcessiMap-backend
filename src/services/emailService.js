const nodemailer = require('nodemailer');

// Função para criar uma conta de teste no Ethereal
async function createTestAccount() {
  return await nodemailer.createTestAccount();
}

// Função para enviar o e-mail de verificação
async function sendVerificationEmail(userEmail, token) {
  // Para desenvolvimento, criamos uma nova conta de teste a cada vez.
  // Em produção, você usaria credenciais fixas de um serviço como SendGrid ou Gmail.
  const testAccount = await createTestAccount();

  const transporter = nodemailer.createTransport({
    service: 'gmail', // Usa o serviço pré-configurado do Gmail
    auth: {
      user: process.env.EMAIL_USER, // Seu e-mail do .env
      pass: process.env.EMAIL_PASS, // Sua senha de app do .env
    },
  });

  // A URL que o usuário irá clicar
 const verificationUrl = `http://localhost:3000/verificar-email?token=${token}`;

  const mailOptions = {
    from: `"AcessiMapa" <${process.env.EMAIL_USER}>`, // Remetente
    to: userEmail, // Destinatário
    subject: 'Verifique seu e-mail para ativar sua conta',
    html: `
      <p>Olá!</p>
      <p>Obrigado por se registrar no AcessiMapa. Por favor, clique no link abaixo para verificar seu e-mail e ativar sua conta:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Este link expira em 1 hora.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail de verificação REAL enviado com sucesso para:', userEmail);
    // A URL de pré-visualização do Ethereal não existe mais
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação real:', error);
    // Lançar o erro pode ser uma boa ideia para que o processo de registro pare
    throw new Error('Não foi possível enviar o e-mail de verificação.');
  }
}

module.exports = { sendVerificationEmail };