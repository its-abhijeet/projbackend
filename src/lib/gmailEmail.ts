// src/lib/gmailEmail.ts
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import dotenv from "dotenv";
import logger from '../logger';

dotenv.config();

// Create a transporter using Gmail with OAuth2
// This is more secure and reliable than password authentication
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'mailme.a.nigam@gmail.com', // Your Gmail address
    // For Gmail, we recommend using app passwords: https://support.google.com/accounts/answer/185833
    pass: 'qlzs yfqe qvtl lfgj' // App password generated for this application
  }
});

// Utility to load & compile an HTML template
function loadTemplate(templateName: string, context: Record<string, any>) {
  const filePath = path.join(process.cwd(), "templates", `${templateName}.html`);
  const source = fs.readFileSync(filePath, "utf8");
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
  try {
    let html: string | undefined;
    if (opts.template) {
      html = loadTemplate(opts.template, opts.context || {});
    }

    const mailOptions = {
      from: 'Green Cycle Hub <ujjwalks.interiit@gmail.com>',
      to: opts.to,
      subject: opts.subject,
      html: html || '',
      text: html ? html.replace(/<[^>]*>/g, '') : ''
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${opts.to} with subject "${opts.subject}"`);
    return true;
  } catch (error) {
    logger.error('Error sending email via Gmail:', error);
    return false;
  }
}

export async function sendConfirmationEmail(opts: MailOptions, token: string) {
  try {
    // Use localhost for development, otherwise use production URL
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction 
      ? 'https://backend.greencyclehub.com' 
      : 'http://localhost:8000';
    
    const confirmUrl = `${baseUrl}/confirm?token=${encodeURIComponent(token)}`;
    
    logger.info(`Generated confirmation URL: ${confirmUrl}`);
    
    opts.context = {
      ...opts.context,
      confirmUrl,
    };

    let html: string | undefined;
    if (opts.template) {
      html = loadTemplate(opts.template, opts.context || {});
      logger.info(`Loaded template: ${opts.template}`);
    }
    
    const mailOptions = {
      from: 'EcoFind <mailme.a.nigam@gmail.com>',
      to: opts.to,
      subject: 'Confirm your Email Address | Green Cycle Hub',
      html: html || '',
      text: html ? html.replace(/<[^>]*>/g, '') : ''
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Confirmation email sent to ${opts.to}`);
    return true;
  } catch (error) {
    logger.error('Error sending confirmation email via Gmail:', error);
    return false;
  }
}
