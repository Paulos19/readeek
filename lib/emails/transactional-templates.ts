const colors = {
  bg: "#09090b",
  card: "#18181b",
  text: "#e4e4e7",
  accent: "#10b981",
  danger: "#ef4444",
};

const baseStyle = `body { margin: 0; padding: 0; background-color: ${colors.bg}; font-family: sans-serif; color: ${colors.text}; } .container { max-width: 600px; margin: 20px auto; background-color: ${colors.card}; border-radius: 16px; overflow: hidden; } .content { padding: 30px; } .btn { display: inline-block; background-color: ${colors.accent}; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }`;

// 1. Template de Alteração de Senha
export function getSecurityAlertTemplate(userName: string) {
  return `
  <!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="container">
      <div style="background-color: ${colors.bg}; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
        <h2 style="color: ${colors.danger}; margin: 0;">Alerta de Segurança 🔒</h2>
      </div>
      <div class="content">
        <h3>Olá, ${userName}.</h3>
        <p>A senha da sua conta Readeek foi alterada recentemente.</p>
        <p>Se foi você, pode ignorar este e-mail. Se não foi você, recupere sua conta imediatamente.</p>
        <p style="font-size: 12px; color: #71717a; margin-top: 30px;">Este é um aviso automático de segurança.</p>
      </div>
    </div>
  </body></html>`;
}

// 2. Template de Recibo de Compra (Comprador)
export function getPurchaseReceiptTemplate(userName: string, productName: string, price: number, newBalance: number) {
  return `
  <!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="container">
      <div style="background-color: ${colors.bg}; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
        <h2 style="color: ${colors.accent}; margin: 0;">Compra Confirmada! 🛍️</h2>
      </div>
      <div class="content">
        <h3>Parabéns pela aquisição, ${userName}!</h3>
        <p>Você acabou de adquirir <strong>"${productName}"</strong>.</p>
        <div style="background-color: ${colors.bg}; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;">Valor: <strong>${price} CR</strong></p>
          <p style="margin: 5px 0;">Seu Saldo Atual: <strong>${newBalance} CR</strong></p>
        </div>
        <p>O item já está disponível na sua Biblioteca ou Inventário.</p>
        <a href="https://readeek.vercel.app/dashboard" class="btn">Ver Minha Compra</a>
      </div>
    </div>
  </body></html>`;
}

// 3. Template de Venda Realizada (Vendedor)
export function getSaleNotificationTemplate(sellerName: string, productName: string, price: number) {
  return `
  <!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="container">
      <div style="background-color: ${colors.bg}; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
        <h2 style="color: ${colors.accent}; margin: 0;">Você fez uma Venda! 💰</h2>
      </div>
      <div class="content">
        <h3>Ótimas notícias, ${sellerName}!</h3>
        <p>Seu produto <strong>"${productName}"</strong> foi vendido.</p>
        <h1 style="color: ${colors.accent}; text-align: center;">+ ${price} CR</h1>
        <p style="text-align: center;">Os créditos já foram adicionados à sua conta.</p>
        <a href="https://readeek.vercel.app/dashboard" class="btn">Ir para Loja</a>
      </div>
    </div>
  </body></html>`;
}

// 4. Template de Livro Publicado (Escritor)
export function getBookPublishedTemplate(authorName: string, bookTitle: string, coverUrl: string | null) {
  return `
  <!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="container">
      <div style="background-color: ${colors.bg}; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
        <h2 style="color: ${colors.accent}; margin: 0;">Seu Livro Nasceu! 📚</h2>
      </div>
      <div class="content">
        <h3>Parabéns, ${authorName}!</h3>
        <p>A obra <strong>"${bookTitle}"</strong> foi processada e exportada com sucesso.</p>
        ${coverUrl ? `<div style="text-align:center; margin: 20px 0;"><img src="${coverUrl}" style="max-width: 150px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></div>` : ''}
        <p>Ele já está disponível na sua biblioteca pessoal e pronto para ser compartilhado.</p>
        <p style="font-size: 14px; color: #a1a1aa;">Custo da operação: 25 Créditos.</p>
      </div>
    </div>
  </body></html>`;
}

export function getPasswordResetTemplate(userName: string, code: string) {
  const colors = { bg: "#09090b", card: "#18181b", text: "#e4e4e7", accent: "#10b981" };
  
  return `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background-color:${colors.bg};font-family:sans-serif;color:${colors.text};">
    <div style="max-width:600px;margin:20px auto;background-color:${colors.card};border-radius:16px;overflow:hidden;text-align:center;padding:40px;">
      <h2 style="color:${colors.accent};margin:0 0 20px;">Recuperação de Senha 🔐</h2>
      <p>Olá, ${userName}. Recebemos um pedido para redefinir sua senha.</p>
      <p>Use o código abaixo no aplicativo:</p>
      <div style="background-color:${colors.bg};padding:20px;margin:30px 0;border-radius:12px;border:1px dashed #333;">
        <span style="font-size:32px;letter-spacing:5px;font-weight:bold;color:#fff;">${code}</span>
      </div>
      <p style="font-size:12px;color:#71717a;">Se não foi você, ignore este e-mail. O código expira em 15 minutos.</p>
    </div>
  </body></html>`;
}