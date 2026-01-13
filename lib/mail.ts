import nodemailer from 'nodemailer';

// Suas credenciais (Recomendado colocar no .env em produção)
const SMTP_CONFIG = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true para 465, false para outras portas
  auth: {
    user: "paulohenrique.012araujo@gmail.com",
    pass: "vihr htgg eqdh ptjg",
  },
};

const transporter = nodemailer.createTransport(SMTP_CONFIG);

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: '"Readeek" <paulohenrique.012araujo@gmail.com>',
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    return null;
  }
};