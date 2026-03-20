import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let transporter: Transporter | null = null;

export async function initializeEmailTransport(): Promise<void> {
  if (env.SMTP_HOST && env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT }, "Email transport configured");
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info(
      { user: testAccount.user, webUrl: "https://ethereal.email" },
      "Ethereal email transport configured (dev mode)",
    );
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    logger.warn("Email transport not initialized, skipping email send");
    return;
  }

  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info({ previewUrl, to, subject }, "Email preview URL");
  } else {
    logger.info({ messageId: info.messageId, to, subject }, "Email sent");
  }
}
