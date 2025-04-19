"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtml = void 0;
/**
 * Sanitize HTML content to prevent XSS while preserving safe image tags
 */
var sanitizeHtml = function (content) {
    // This is a simple implementation. Consider using a library like DOMPurify in a real app.
    if (!content)
        return '';
    // Allow specific tags and attributes only
    var allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'img', 'br'];
    var allowedAttributes = {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height']
    };
    // Very simplified sanitization logic
    // Replace script tags
    var sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Replace event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\son\w+\s*=/gi, ' data-removed=');
    // Ensure all img tags have proper src attributes (must be https and from trusted domains)
    var imgRegex = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    sanitized = sanitized.replace(imgRegex, function (match, src) {
        // Check if image is from Cloudinary or other trusted sources
        if (src.startsWith('https://res.cloudinary.com/')) {
            return match;
        }
        // Replace untrusted sources
        return '<img src="" alt="Removed image" />';
    });
    return sanitized;
};
exports.sanitizeHtml = sanitizeHtml;
