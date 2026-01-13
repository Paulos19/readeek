import nodemailer from 'nodemailer';

// Suas credenciais (Recomendado colocar no .env em produção)
const SMTP_CONFIG = {
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
  secure: process.env.EMAIL_SERVER_SECURE === "true", // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
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