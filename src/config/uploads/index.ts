import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import type { Context } from 'hono';
import 'dotenv/config';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true
});

// Types for uploads
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;  // Cloudinary URL
  size: number;
  filename: string;
  publicId: string;
}

interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'auto' | 'raw';
  allowed_formats?: string[];
  transformation?: any[];
}

// Default upload options
const defaultOptions: CloudinaryUploadOptions = {
  folder: 'karyawan-articles',
  resource_type: 'auto',
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm']
};

/**
 * Upload a file to Cloudinary
 * @param file - The file buffer to upload
 * @param options - Cloudinary upload options
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer, 
  filename: string,
  options: CloudinaryUploadOptions = {}
): Promise<UploadedFile> => {
  // Merge with default options
  const uploadOptions = { ...defaultOptions, ...options };
  
  try {
    return new Promise((resolve, reject) => {
      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: uploadOptions.folder,
          resource_type: uploadOptions.resource_type,
          allowed_formats: uploadOptions.allowed_formats,
          transformation: uploadOptions.transformation
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(error?.message || 'Upload failed'));
          }
          
          const uploadedFile: UploadedFile = {
            fieldname: 'file',
            originalname: filename,
            encoding: '7bit', // Default encoding
            mimetype: result.resource_type === 'video' ? 'video/mp4' : `image/${result.format}`,
            path: result.secure_url,
            size: result.bytes,
            filename: result.public_id,
            publicId: result.public_id
          };
          
          resolve(uploadedFile);
        }
      );
      
      uploadStream.write(fileBuffer);
      uploadStream.end();
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type (image, video, etc)
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};