import sgMail from "@sendgrid/mail";
import { config } from "../config";
import { logger } from "../middleware/logger";

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!config.sendgrid.apiKey) {
    logger.warn("SendGrid API key not configured. Email not sent.");
    return;
  }

  try {
    const msg: any = {
      to: options.to,
      from: config.sendgrid.fromEmail,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    };

    await sgMail.send(msg);
    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error: any) {
    logger.error("Failed to send email via SendGrid", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export const sendBulkEmails = async (emails: EmailOptions[]): Promise<void> => {
  if (!config.sendgrid.apiKey) {
    logger.warn("SendGrid API key not configured. Emails not sent.");
    return;
  }

  try {
    const messages: any[] = emails.map((email) => ({
      to: email.to,
      from: config.sendgrid.fromEmail,
      subject: email.subject,
      text: email.text,
      html: email.html || email.text,
    }));

    await sgMail.send(messages);
    logger.info(`${emails.length} emails sent successfully`);
  } catch (error: any) {
    logger.error("Failed to send bulk emails via SendGrid", error);
    throw new Error(`Bulk email sending failed: ${error.message}`);
  }
};
