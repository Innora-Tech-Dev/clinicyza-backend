import { env } from "@/config/env";

/**
 * Email sender.
 * TODO: plug in a real provider (Resend, SES, SendGrid, SMTP) before production.
 * Until then, emails are printed to the server console so flows can be tested.
 */
export async function sendEmail({ to, subject, text }) {
  if (env.isProduction) {
    console.warn(`[email] No email provider configured — email to ${to} was NOT sent.`);
    return { delivered: false };
  }
  console.info(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n${text}\n`);
  return { delivered: false, logged: true };
}
