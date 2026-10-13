import nodemailer from 'nodemailer'

// Sin SMTP configurado (desarrollo), el mensaje se imprime en la terminal de `npm run dev`.
export async function sendMail({ to, subject, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  if (!SMTP_HOST) {
    console.log(`\n[MAIL NO ENVIADO: falta SMTP_HOST en .env]\nPara: ${to}\nAsunto: ${subject}\n\n${text}\n`)
    return false
  }
  const port = Number(SMTP_PORT) || 587
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined })
  await transport.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, text })
  return true
}
