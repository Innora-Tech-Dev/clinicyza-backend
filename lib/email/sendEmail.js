import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

/**
 * Email sender.
 *  - SMTP_HOST set → sends through SMTP (locally: Mailpit on :1025, UI on http://localhost:8025).
 *  - SMTP_HOST empty → development prints the email to the console; production logs a warning.
 * Rule (spec §3.6): emails never contain diagnoses, symptoms or document contents.
 * Throws when the SMTP provider fails, so the "email.send" job can retry.
 */
let transport;
const getTransport = () =>
  (transport ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    ...(env.smtpUser && { auth: { user: env.smtpUser, pass: env.smtpPass } }),
  }));

export async function sendEmail({ to, subject, text, html }) {
  if (!env.smtpHost) {
    if (env.isProduction) {
      logger.warn("email not sent — no SMTP provider configured", { subject });
      return { delivered: false };
    }
    console.info(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n${text}\n`);
    return { delivered: false, logged: true };
  }

  const info = await getTransport().sendMail({
    from: env.emailFrom,
    replyTo: env.emailReplyTo,
    to,
    subject,
    text,
    ...(html && { html }),
  });
  logger.info("email sent", { subject, messageId: info.messageId });
  return { delivered: true, messageId: info.messageId };
}
