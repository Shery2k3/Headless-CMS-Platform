import type { Context, Next } from 'hono';
import { uploadToCloudinary } from '../config/uploads/index.js';

export const handleFileUpload = async (c: Context, next: Next) => {
  // Store the original json method
  const originalJson = c.req.json.bind(c.req);
  
  // Override the json method to handle file uploads
  c.req.json = (async <T>() => {
    const formData = await c.req.formData();
    const body: Record<string, any> = {};
    
    // Process all form fields
    for (const [key, value] of formData.entries()) {
      // Handle file uploads
      if (value instanceof File) {
        try {
          // Convert File to Buffer
          const buffer = Buffer.from(await value.arrayBuffer());
          
          // Determine resource type based on mimetype
          const resourceType = value.type.startsWith('video/') ? 'video' : 'image';
          
          // Upload to Cloudinary
          const uploadedFile = await uploadToCloudinary(buffer, value.name, {
            resource_type: resourceType as 'image' | 'video' | 'auto'
          });
          
          // Add the URL to the body
          body[key] = uploadedFile.path;
          
          // For article src field, add additional metadata
          if (key === 'src') {
            body.videoArticle = resourceType === 'video';
          }
        } catch (error) {
          console.error('Upload error:', error);
          throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Handle normal form fields - try to parse JSON strings
        try {
          body[key] = JSON.parse(value.toString());
        } catch {
          body[key] = value.toString();
        }
      }
    }
    
    return body as T;
  }) as typeof c.req.json;
  
  // Continue with the next middleware
  await next();
};