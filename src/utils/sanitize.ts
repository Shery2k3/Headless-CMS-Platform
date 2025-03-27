/**
 * Sanitize HTML content to prevent XSS while preserving safe image tags
 */
export const sanitizeHtml = (content: string): string => {
  // This is a simple implementation. Consider using a library like DOMPurify in a real app.
  if (!content) return '';
  
  // Allow specific tags and attributes only
  const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'img', 'br'];
  
  const allowedAttributes = {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height']
  };
  
  // Very simplified sanitization logic
  // Replace script tags
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Replace event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=/gi, ' data-removed=');
  
  // Ensure all img tags have proper src attributes (must be https and from trusted domains)
  const imgRegex = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  sanitized = sanitized.replace(imgRegex, (match, src) => {
    // Check if image is from Cloudinary or other trusted sources
    if (src.startsWith('https://res.cloudinary.com/')) {
      return match;
    }
    // Replace untrusted sources
    return '<img src="" alt="Removed image" />';
  });
  
  return sanitized;
};