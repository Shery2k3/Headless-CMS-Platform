/**
 * Calculate the estimated reading time for article content
 * @param content The article content
 * @returns Formatted reading time string (e.g., "1 min" or "3 mins")
 */
export const calculateReadTime = (content: string): string => {
  // Average reading speed: 265 words per minute
  const readTime = content.split(" ").length / 265;
  // Round up to the nearest 0.5
  const roundedTime = Math.ceil(readTime * 2) / 2;

  if (roundedTime <= 1) {
    return "1 min";
  } else {
    return roundedTime + " mins";
  }
};

/**
 * Extract the public ID from a Cloudinary URL
 * @param url Cloudinary URL
 * @returns Public ID with folder path if present
 */
export const extractCloudinaryPublicId = (url: string): string => {
  if (!url) return '';
  
  // Check if URL contains a folder path like 'karyawan-articles/'
  const folderMatch = url.match(/\/([^/]+\/[^/]+)\.[\w]+$/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  
  // Otherwise just get the filename without extension
  const fileMatch = url.match(/\/([^/]+)\.[\w]+$/);
  return fileMatch ? fileMatch[1] : '';
};

/**
 * Determine the resource type (image or video) based on URL or explicit flag
 * @param url URL to the resource
 * @param isVideo Optional flag to override detection
 * @returns Resource type string for Cloudinary API
 */
export const getResourceType = (url: string, isVideo?: boolean): 'image' | 'video' | 'raw' => {
  if (isVideo === true) return 'video';
  if (isVideo === false) return 'image';
  
  // Try to determine from URL
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ? 'video' : 'image';
};

/**
 * Extract all Cloudinary image URLs from HTML content
 * @param content HTML content
 * @returns Array of Cloudinary URLs
 */
export const extractCloudinaryUrls = (content: string): string[] => {
  if (!content) return [];

  const cloudinaryDomain = 'res.cloudinary.com';
  const urls: string[] = [];
  
  // Regular expression to match image tags with Cloudinary URLs
  const imgRegex = /<img[^>]+src=["']([^"']+res\.cloudinary\.com[^"']+)["'][^>]*>/gi;
  
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1] && match[1].includes(cloudinaryDomain)) {
      urls.push(match[1]);
    }
  }
  
  return urls;
};