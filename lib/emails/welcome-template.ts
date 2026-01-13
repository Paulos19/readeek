export function getWelcomeTemplate(userName: string) {
  // Cores do Readeek baseadas no app
  const colors = {
    bg: "#09090b", // zinc-950
    card: "#18181b", // zinc-900
    text: "#e4e4e7", // zinc-200
    accent: "#10b981", // emerald-500
    accentDark: "#047857",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Readeek</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${colors.bg}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${colors.text}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${colors.card}; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; }
    .header { background-color: ${colors.bg}; padding: 30px; text-align: center; border-bottom: 1px solid #27272a; }
    .hero { padding: 40px 30px; text-align: center; }
    .hero h1 { color: #ffffff; font-size: 28px; margin: 0 0 10px; }
    .hero p { font-size: 16px; line-height: 1.6; color: #a1a1aa; }
    .features-grid { padding: 0 20px 30px; }
    .feature-row { display: flex; margin-bottom: 20px; background-color: ${colors.bg}; border-radius: 12px; padding: 15px; border: 1px solid #27272a; align-items: center; }
    .icon-box { width: 50px; height: 50px; background-color: rgba(16, 185, 129, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-right: 15px; color: ${colors.accent}; }
    .text-box h3 { margin: 0 0 5px; color: #fff; font-size: 18px; }
    .text-box p { margin: 0; font-size: 14px; color: #a1a1aa; }
    .cta-button { display: inline-block; background-color: ${colors.accent}; color: #000000; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 20px; }
    .footer { background-color: ${colors.bg}; padding: 30px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #27272a; }
  </style>
</head>
<body>
  <div class="container">
    
    <div class="header">
      <img src="https://readeek.vercel.app/icon.png" alt="Readeek Logo" width="60" height="60" style="border-radius: 12px;">
      <h2 style="color: ${colors.accent}; margin: 10px 0 0; letter-spacing: 2px;">READEEK</h2>
    </div>

    <div class="hero">
      <h1>Olá, ${userName}! 👋</h1>
      <p>Estamos muito felizes em ter você aqui. O Readeek é o seu novo ecossistema literário completo. Veja o que preparamos para você:</p>
    </div>

    <div class="features-grid">
      
      <div class="feature-row">
        <div class="icon-box">📖</div>
        <div class="text-box">
          <h3>Leitura Imersiva</h3>
          <p>Importe seus ePubs, marque textos, mude fontes e leia sem distrações.</p>
        </div>
      </div>

      <div class="feature-row">
        <div class="icon-box">✍️</div>
        <div class="text-box">
          <h3>Writer Studio</h3>
          <p>Escreva seus próprios livros, crie personagens e organize sua lore com IA.</p>
        </div>
      </div>

      <div class="feature-row">
        <div class="icon-box">💬</div>
        <div class="text-box">
          <h3>Comunidade</h3>
          <p>Entre em clubes do livro, faça desafios literários e compartilhe resenhas.</p>
        </div>
      </div>

      <div class="feature-row">
        <div class="icon-box">🛍️</div>
        <div class="text-box">
          <h3>Marketplace</h3>
          <p>Compre e venda livros físicos ou digitais usando Créditos ou Trade.</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://readeek.vercel.app" class="cta-button">Começar a Explorar</a>
      </div>
    
    </div>

    <div class="footer">
      <p>Enviado com ❤️ pela equipe Readeek.</p>
      <p>Se você não criou esta conta, ignore este e-mail.</p>
      <p>© 2026 Readeek Inc.</p>
    </div>

  </div>
</body>
</html>
  `;
}