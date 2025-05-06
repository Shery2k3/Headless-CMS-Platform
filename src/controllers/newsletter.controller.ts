import type { Context } from 'hono';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { errorResponse, successResponse } from '../utils/response.util.js';

// Initialize Mailchimp with your API key and server prefix
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., 'us1'
});

export const subscribeToNewsletter = async (c: Context) => {
  const { email } = await c.req.json();

  if (!email) {
    return errorResponse(c, 400, "Email is required");
  }

  // Basic email validation on server side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return errorResponse(c, 400, "Please enter a valid email address");
  }

  try {
    // Add the subscriber to your Mailchimp audience list
    const response = await mailchimp.lists.addListMember(
      process.env.MAILCHIMP_AUDIENCE_ID as string,
      {
        email_address: email,
        status: 'subscribed', // Use 'pending' if you want double opt-in
        merge_fields: {
          FNAME: "Subscriber" // Default value for required FNAME field
        }
      }
    );

    return successResponse(
      c,
      200,
      'Successfully subscribed to the newsletter'
    );
  } catch (error: any) {
    console.error('Mailchimp subscription error:', error);

    // Handle existing subscribers gracefully
    if (error.response?.body?.title === 'Member Exists') {
      return successResponse(c, 200, "You are already subscribed to our newsletter");
    }
    
    // Handle fake/invalid email errors from Mailchimp
    if (error.response?.body?.detail?.includes('looks fake or invalid')) {
      return errorResponse(c, 400, "This email appears to be invalid. Please use a different email address.");
    }
    
    // Handle other Mailchimp errors
    const errorMessage = error.response?.body?.detail || "Failed to subscribe";
    return errorResponse(c, 500, errorMessage);
  }
};