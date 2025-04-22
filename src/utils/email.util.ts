import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Email service for sending emails using nodemailer
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a transporter with the email configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Sends an email using the configured transporter
   * @param options Email options including to, subject, text, and html
   * @returns Promise that resolves with the message info
   */
  async sendEmail(options: EmailOptions): Promise<nodemailer.SentMessageInfo> {
    try {
      const mailOptions = {
        from: `"Karyawan" <${process.env.EMAIL_SENDER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Sends a contact form email to the recipient
   * @param name Name of the sender
   * @param email Email of the sender
   * @param phone Phone number of the sender (optional)
   * @param subject Subject of the message
   * @param message Message content
   * @returns Promise that resolves with the message info
   */
  async sendContactFormEmail(
    name: string,
    email: string,
    phone: string | undefined,
    subject: string,
    message: string
  ): Promise<nodemailer.SentMessageInfo> {
    const htmlContent = `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      <p><strong>Subject:</strong> ${subject}</p>
      <h2>Message:</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    const textContent = `
      New Contact Form Submission\n
      Name: ${name}\n
      Email: ${email}\n
      ${phone ? `Phone: ${phone}\n` : ''}
      Subject: ${subject}\n
      Message:\n${message}
    `;

    return this.sendEmail({
      to: (process.env.EMAIL_RECIPIENT || process.env.EMAIL_SENDE) as string,
      subject: `Contact Form: ${subject}`,
      text: textContent,
      html: htmlContent,
    });
  }

  /**
   * Sends a contribution/pitch form email to the recipient
   * @param name Name of the contributor
   * @param email Email of the contributor
   * @param idea The pitch/idea submitted
   * @returns Promise that resolves with the message info
   */
  async sendContributionFormEmail(
    name: string,
    email: string,
    idea: string
  ): Promise<nodemailer.SentMessageInfo> {
    const htmlContent = `
      <h1>New Writing Contribution Submission</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <h2>Pitch/Idea:</h2>
      <p>${idea.replace(/\n/g, '<br>')}</p>
    `;

    const textContent = `
      New Writing Contribution Submission\n
      Name: ${name}\n
      Email: ${email}\n
      Pitch/Idea:\n${idea}
    `;

    return this.sendEmail({
      to: (process.env.EMAIL_RECIPIENT || process.env.EMAIL_SENDER) as string,
      subject: 'New Writing Contribution Submission',
      text: textContent,
      html: htmlContent,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();