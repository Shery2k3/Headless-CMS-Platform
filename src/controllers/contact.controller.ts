import type { Context } from 'hono';
import { emailService } from '../utils/email.util.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Controller handling contact-related routes
 */
export class ContactController {
  /**
   * Handles contact form submissions
   * @param c Hono context
   * @returns Response with status information
   */
  async submitContactForm(c: Context) {
    try {
      // Parse request body
      const { name, email, phone, subject, message } = await c.req.json();

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return successResponse(c, 200, 'Please provide all required fields: name, email, subject, and message');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(c, 404, 'Please provide a valid email address');
      }

      // Send the contact form email
      await emailService.sendContactFormEmail(name, email, phone, subject, message);

      return successResponse(c, 200, 'Your message has been sent successfully!');
    } catch (error) {
      console.error('Contact form submission error:', error);
      return errorResponse(c, 400, 'Failed to send your message. Please try again later.');
    }
  }

  /**
   * Handles contribution/pitch form submissions
   * @param c Hono context
   * @returns Response with status information
   */
  async submitContributionForm(c: Context) {
    try {
      // Parse request body
      const { name, email, idea } = await c.req.json();

      // Validate required fields
      if (!name || !email || !idea) {
        return errorResponse(c, 400, 'Please provide all required fields: name, email, and idea');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(c, 400, 'Please provide a valid email address');
      }

      // Send the contribution form email
      await emailService.sendContributionFormEmail(name, email, idea);

      return successResponse(c, 200, 'Your pitch has been submitted successfully!');
    } catch (error) {
      console.error('Contribution form submission error:', error);
      return errorResponse(c, 400, 'Failed to submit your pitch. Please try again later.');
    }
  }
}