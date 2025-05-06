import mailchimp from '@mailchimp/mailchimp_marketing';
import crypto from 'crypto';

// Initialize Mailchimp with your API key and server prefix
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., 'us3'
});

/**
 * Mailchimp service for handling contact forms and subscriptions
 */
class MailchimpService {
  /**
   * Adds a subscriber to the Mailchimp audience
   * @param email Email address to subscribe
   * @param firstName First name of the subscriber (optional)
   * @param lastName Last name of the subscriber (optional)
   * @returns Promise that resolves with the Mailchimp response
   */
  async addSubscriber(email: string, firstName = 'Subscriber', lastName = '') {
    // Parse name if provided as full name
    if (firstName.includes(' ') && !lastName) {
      const nameParts = firstName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    
    return mailchimp.lists.addListMember(
      process.env.MAILCHIMP_AUDIENCE_ID as string,
      {
        email_address: email,
        status: 'subscribed', // Use 'pending' if you want double opt-in
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName
        }
      }
    );
  }

  /**
   * Logs a form submission in Mailchimp
   * This creates a note/tag on the subscriber's record in Mailchimp
   * @param email Email of the contact
   * @param name Name of the contact
   * @param formType Type of form (contact/contribution)
   * @param details Additional details from the form
   */
  async logFormSubmission(email: string, name: string, formType: string, details: any) {
    try {
      // First, make sure the person is in the audience list
      await this.addSubscriber(email, name);
      
      // Then, add tags to the subscriber to identify the form submission
      const subscriberHash = this.getSubscriberHash(email);
      
      // Add a tag based on form type
      await mailchimp.lists.updateListMemberTags(
        process.env.MAILCHIMP_AUDIENCE_ID as string,
        subscriberHash,
        {
          tags: [
            {
              name: `Form: ${formType}`,
              status: 'active'
            }
          ]
        }
      );
      
      // Create an event for the form submission
      const eventDetails = Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
      
      await mailchimp.lists.createListMemberEvent(
        process.env.MAILCHIMP_AUDIENCE_ID as string,
        subscriberHash,
        {
          name: `${formType} Form Submission`,
          properties: {
            ...details,
            summary: eventDetails,
            submitted_at: new Date().toISOString()
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Mailchimp form submission error:', error);
      throw error;
    }
  }
  
  /**
   * Generates a Mailchimp subscriber hash from an email address
   * @param email The email address to hash
   * @returns MD5 hash of the lowercase email address
   */
  getSubscriberHash(email: string): string {
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }
}

// Export a singleton instance
export const mailchimpService = new MailchimpService();