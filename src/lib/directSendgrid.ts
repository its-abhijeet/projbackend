import fs from "fs";
import path from "path";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import logger from "../logger";
import dotenv from "dotenv";
dotenv.config();

// Use env var for safety
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
console.log(process.env.SENDGRID_API_KEY);

function loadTemplate(templateName: string, context: Record<string, any>) {
  const filePath = path.join(process.cwd(), "templates", `${templateName}.html`);
  const source = fs.readFileSync(filePath, "utf8");
  const template = Handlebars.compile(source);
  return template(context);
}

export interface MailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
}

// Generic email sender
export async function sendEmail(opts: MailOptions): Promise<boolean> {
  try {
    let html: string | undefined;
    if (opts.template) {
      html = loadTemplate(opts.template, opts.context || {});
    }

    const msg = {
      to: opts.to,
      from: "ujjwalkumar0149@gmail.com", // must be verified in SendGrid
      subject: opts.subject,
      text: html ? html.replace(/<[^>]*>/g, "") : "",
      html: html || "",
    };

    logger.info(`Attempting to send email to ${opts.to}`);

    await sgMail.send(msg);
    logger.info(`✅ Email sent successfully to ${opts.to}`);
    return true;
  } catch (error: any) {
    logger.error("❌ Error sending email:", error.message);
    if (error.response) {
      logger.error("Status code:", error.response.statusCode);
      logger.error("Body:", error.response.body);
    }
    return false;
  }
}

// Confirmation email sender
export async function sendConfirmationEmail(
  opts: MailOptions,
  token: string
): Promise<boolean> {
  try {
    const baseUrl = "http://localhost:8000";
    const confirmUrl = `${baseUrl}/confirm?token=${encodeURIComponent(token)}`;

    logger.info(`Generated confirmation URL: ${confirmUrl}`);

    const context = {
      ...opts.context,
      confirmUrl,
    };

    let html: string | undefined;
    if (opts.template) {
      html = loadTemplate(opts.template, context);
      logger.info(`Loaded template: ${opts.template}`);
    }

    const msg = {
      to: opts.to,
      from: "ujjwalkumar0149@gmail.com", // must be verified in SendGrid
      subject: "Confirm your Email Address | Green Cycle Hub",
      text: html ? html.replace(/<[^>]*>/g, "") : "",
      html: html || "",
    };

    logger.info(`Attempting to send confirmation email to ${opts.to}`);

    await sgMail.send(msg);
    logger.info(`✅ Confirmation email sent successfully to ${opts.to}`);
    return true;
  } catch (error: any) {
    logger.error("❌ Error sending confirmation email:", error.message);
    if (error.response) {
      logger.error("Status code:", error.response.statusCode);
      logger.error("Body:", error.response.body);
    }
    return false;
  }
}
