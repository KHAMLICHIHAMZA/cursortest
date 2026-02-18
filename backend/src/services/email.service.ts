import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

const logger = new Logger('EmailService');

const resendApiKey = process.env.RESEND_API_KEY;
const useResend = !!resendApiKey;

const resend = useResend ? new Resend(resendApiKey) : null;

const transporter = !useResend
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })
  : null;

const getFromAddress = () => {
  if (useResend) return 'MalocAuto <onboarding@resend.dev>';
  return process.env.SMTP_FROM || 'noreply@malocauto.com';
};

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (useResend && resend) {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
  } else if (transporter) {
    await transporter.sendMail({ from: getFromAddress(), to, subject, html });
  } else {
    throw new Error('No email provider configured');
  }
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3E7BFA;">Bienvenue sur MalocAuto, ${name} !</h2>
      <p>Votre compte a été créé avec succès.</p>
      <p>Pour définir votre mot de passe et accéder à votre espace, cliquez sur le lien ci-dessous :</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3E7BFA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Configurer mon mot de passe
      </a>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas demandé ce compte, vous pouvez ignorer cet email.</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Bienvenue sur MalocAuto - Configuration de votre compte', html);
    logger.log(`Welcome email sent to ${email} via ${useResend ? 'Resend' : 'SMTP'}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string,
  resetBaseUrl?: string,
): Promise<void> => {
  const baseUrl = resetBaseUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3E7BFA;">Réinitialisation de mot de passe</h2>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3E7BFA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Réinitialiser mon mot de passe
      </a>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Réinitialisation de votre mot de passe MalocAuto', html);
    logger.log(`Password reset email sent to ${email} via ${useResend ? 'Resend' : 'SMTP'}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
  }
};
