import type { Context, Next } from 'hono';
import { uploadToCloudinary } from '../config/uploads/index.js';

export const handleFileUpload = async (c: Context, next: Next) => {
  const contentType = c.req.header('content-type') || '';

  // Only process as form data if it's multipart
  if (contentType.includes('multipart/form-data')) {
    // Store the original json method
    const originalJson = c.req.json.bind(c.req);

    // Override the json method to handle file uploads
    c.req.json = (async <T>() => {
      const formData = await c.req.formData();
      const body: Record<string, any> = {};

      // Process all form fields
      for (const [key, value] of formData.entries()) {
        // Handle file uploads - check if it's a Blob or has arrayBuffer method instead of checking for File
        if (value instanceof Blob || (typeof value === 'object' && value !== null && 'arrayBuffer' in value)) {
          try {
            // Convert File/Blob to Buffer
            const buffer = Buffer.from(await (value as Blob).arrayBuffer());
            
            // Determine resource type based on type property (if available) or mimetype
            const valueType = (value as any).type || '';
            const resourceType = valueType.startsWith('video/') ? 'video' : 'image';

            // Upload to Cloudinary
            const uploadedFile = await uploadToCloudinary(buffer, 
              (value as any).name || `upload-${Date.now()}`, 
              {
                resource_type: resourceType as 'image' | 'video' | 'auto'
              });

            // Add the URL to the body
            body[key] = uploadedFile.path;

            // For article src field, add additional metadata
            if (key === 'src') {
              body.videoArticle = valueType.startsWith('video/');
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
  }

  // Continue with the next middleware
  await next();
};