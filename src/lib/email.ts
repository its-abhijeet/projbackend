// src/lib/email.ts
import fs       from "fs";
import path     from "path";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import dotenv   from "dotenv";
import logger from '../logger';

dotenv.config();

// 1) create transporter as before
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2) utility to load & compile an HTML template
function loadTemplate(templateName: string, context: Record<string, any>) {
  const filePath = path.join(process.cwd(), "templates", `${templateName}.html`);
  const source   = fs.readFileSync(filePath, "utf8");
  const template = Handlebars.compile(source);
  return template(context);
}

export interface MailOptions {
  to: string;
  subject: string;
  template?: string;           // name of template file (without .html)
  context?: Record<string, any>; // data for placeholders
}

export async function sendEmail(opts: MailOptions) {
  let html: string | undefined;
  if (opts.template) {
    html = loadTemplate(opts.template, opts.context || {});
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: opts.to,
    subject: opts.subject,
    html,
  });

  logger.info(`Email sent to ${opts.to} with subject "${opts.subject}"`);
}


export async function sendConfirmationEmail(opts: MailOptions, token: string) {
  const confirmUrl = `https://backend.velebitgreen.com/confirm?token=${encodeURIComponent(
    token
  )}`;
  //   const confirmUrl = `http://localhost:8000/confirm?token=${encodeURIComponent(
  //   token
  // )}`;
  
  opts.context = {
    ...opts.context,
    confirmUrl, // add confirmation URL to context
  };

  let html: string | undefined;
  if (opts.template) {
    html = loadTemplate(opts.template, opts.context || {});
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: opts.to,
    subject: 'Confirm your Email Address | VelebitGreen',
    html,
  };

  await transporter.sendMail(mailOptions);
}