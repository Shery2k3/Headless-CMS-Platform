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
    return c.json({
      success: false,
      message: 'Email is required'
    }, 400);
  }

  try {
    // Add the subscriber to your Mailchimp audience list
    const response = await mailchimp.lists.addListMember(
      process.env.MAILCHIMP_AUDIENCE_ID as string,
      {
        email_address: email,
        status: 'subscribed', // Use 'pending' if you want double opt-in
        // You can add additional fields like this:
        // merge_fields: {
        //   FNAME: firstName,
        //   LNAME: lastName,
        // }
      }
    );

    return successResponse(
      c,
      200,
      'Successfully subscribed to the newsletter',
    )
  } catch (error: any) {
    console.error('Mailchimp subscription error:', error);

    // Handle existing subscribers gracefully
    if (error.response && error.response.body && error.response.body.title === 'Member Exists') {
      return errorResponse(c, 401, "Member Exists");
    }

    return errorResponse(c, 500, "Failed to subscribe");
  }
};