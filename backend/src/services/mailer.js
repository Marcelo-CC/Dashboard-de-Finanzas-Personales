import nodemailer from 'nodemailer';

/**
 * Servicio de correo. Con SMTP configurado envía correos reales (p. ej. Gmail con contraseña de aplicación);
 * sin SMTP imprime el enlace en la consola para poder probar el flujo en desarrollo.
 */
export function createMailer({ smtp, mailFrom }) {
  const transport = smtp.host
    ? nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.pass },
      })
    : null;

  return {
    async sendPasswordReset({ to, name, link, minutes }) {
      const subject = 'Restablece tu contraseña - Dashboard de Finanzas Personales';
      const text = `Hola ${name}:\n\nRecibimos una solicitud para restablecer tu contraseña.\n` +
        `Abre este enlace (válido por ${minutes} minutos y de un solo uso):\n${link}\n\n` +
        'Si no fuiste tú, ignora este mensaje.';
      const html = `<p>Hola <strong>${name}</strong>:</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Restablecer contraseña</a></p>
        <p>El enlace es válido por <strong>${minutes} minutos</strong> y puede usarse una sola vez.</p>
        <p style="color:#64748b">Si no fuiste tú, ignora este mensaje.</p>`;
      if (!transport) {
        console.log(`\n[correo de desarrollo] Para: ${to}\n${text}\n`);
        return { delivered: false, preview: link };
      }
      await transport.sendMail({ from: mailFrom, to, subject, text, html });
      return { delivered: true };
    },
  };
}
