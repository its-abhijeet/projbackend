// src/lib/sendgridEmail.ts
import fs from "fs";
import path from "path";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import dotenv from "dotenv";
import logger from '../logger';

dotenv.config();

// Set SendGrid API key
const apiKey = process.env.SENDGRID_API_KEY || '';
sgMail.setApiKey(apiKey);

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

    // Use a verified sender email that's verified in SendGrid
    const fromEmail = 'ujjwalkumar0149@gmail.com'; // Verified email in SendGrid
    
    // Simplified message format - exactly like our successful test
    const msg = {
      to: opts.to,
      from: fromEmail,
      subject: opts.subject,
      text: html ? html.replace(/<[^>]*>/g, '') : '',
      html: html || ''
    };

    // Send without any type casting
    const response = await sgMail.send(msg);
    logger.info(`Email sent to ${opts.to} with subject "${opts.subject}" and status code ${response[0].statusCode}`);
    return true;
  } catch (error: any) {
    logger.error('Error sending email via SendGrid:', error);
    
    // Enhanced error logging
    logger.error('Error message:', error.message);
    logger.error('Error code:', error.code);
    
    if (error.response) {
      logger.error(`SendGrid API Error Status: ${error.response.status}`);
      logger.error(`SendGrid API Error Body:`, error.response.body);
    }
    
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

    // Use the verified sender email from SendGrid
    const fromEmail = 'ujjwalkumar0149@gmail.com'; // This email is verified in SendGrid
    
    logger.info(`Sending confirmation email from: ${fromEmail} to: ${opts.to}`);
    
    // Simplified message format - exactly like our successful test
    const msg = {
      to: opts.to,
      from: fromEmail,
      subject: 'Confirm your Email Address | Green Cycle Hub',
      text: html ? html.replace(/<[^>]*>/g, '') : '',
      html: html || ''
    };

    // Send without any type casting
    const response = await sgMail.send(msg);
    logger.info(`Confirmation email sent to ${opts.to} with status code ${response[0].statusCode}`);
    return true;
  } catch (error: any) {
    logger.error('Error sending confirmation email via SendGrid:', error);
    
    // Enhanced error logging
    logger.error('Error message:', error.message);
    logger.error('Error code:', error.code);
    
    if (error.response) {
      logger.error(`SendGrid API Error Status: ${error.response.status}`);
      logger.error(`SendGrid API Error Body:`, error.response.body);
    }
    
    return false;
  }
}
