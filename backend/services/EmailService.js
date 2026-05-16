const nodemailer = require('nodemailer');

class EmailService {
  async getTransporter() {
    if (this.transporter) return this.transporter;

    let auth;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    } else {
      // Create ethereal account for testing
      const testAccount = await nodemailer.createTestAccount();
      auth = {
        user: testAccount.user,
        pass: testAccount.pass,
      };
      console.log('--- TEST EMAIL ACCOUNT CREATED ---');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
      console.log('----------------------------------');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth,
    });

    return this.transporter;
  }

  async sendEmail(options) {
    const transporter = await this.getTransporter();
    const mailOptions = {
      from: `${process.env.FROM_NAME || 'EduGenius'} <${process.env.FROM_EMAIL || 'noreply@edugenius.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL: %s', previewUrl);
      }
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded-lg: 1rem;">
        <h2 style="color: #2563eb;">Réinitialisation de votre mot de passe</h2>
        <p>Bonjour ${user.firstName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte EduGenius. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
        <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
        <p style="font-size: 12px; color: #71717a;">EduGenius - Plateforme d'apprentissage intelligente</p>
      </div>
    `;

    return this.sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe - EduGenius',
      message,
      html,
    });
  }
}

module.exports = new EmailService();
