import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@malocauto.com',
    to: email,
    subject: 'Bienvenue sur MalocAuto - Configuration de votre compte',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    // En développement, on peut continuer même si l'email échoue
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@malocauto.com',
    to: email,
    subject: 'Réinitialisation de votre mot de passe MalocAuto',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};




