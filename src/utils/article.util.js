"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCloudinaryUrls = exports.getResourceType = exports.extractCloudinaryPublicId = exports.calculateReadTime = void 0;
/**
 * Calculate the estimated reading time for article content
 * @param content The article content
 * @returns Formatted reading time string (e.g., "1 min" or "3 mins")
 */
var calculateReadTime = function (content) {
    // Average reading speed: 265 words per minute
    var readTime = content.split(" ").length / 265;
    // Round up to the nearest 0.5
    var roundedTime = Math.ceil(readTime * 2) / 2;
    if (roundedTime <= 1) {
        return "1 min";
    }
    else {
        return roundedTime + " mins";
    }
};
exports.calculateReadTime = calculateReadTime;
/**
 * Extract the public ID from a Cloudinary URL
 * @param url Cloudinary URL
 * @returns Public ID with folder path if present
 */
var extractCloudinaryPublicId = function (url) {
    if (!url)
        return '';
    // Check if URL contains a folder path like 'karyawan-articles/'
    var folderMatch = url.match(/\/([^/]+\/[^/]+)\.[\w]+$/);
    if (folderMatch && folderMatch[1]) {
        return folderMatch[1];
    }
    // Otherwise just get the filename without extension
    var fileMatch = url.match(/\/([^/]+)\.[\w]+$/);
    return fileMatch ? fileMatch[1] : '';
};
exports.extractCloudinaryPublicId = extractCloudinaryPublicId;
/**
 * Determine the resource type (image or video) based on URL or explicit flag
 * @param url URL to the resource
 * @param isVideo Optional flag to override detection
 * @returns Resource type string for Cloudinary API
 */
var getResourceType = function (url, isVideo) {
    if (isVideo === true)
        return 'video';
    if (isVideo === false)
        return 'image';
    // Try to determine from URL
    var videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    return videoExtensions.some(function (ext) { return url.toLowerCase().includes(ext); }) ? 'video' : 'image';
};
exports.getResourceType = getResourceType;
/**
 * Extract all Cloudinary image URLs from HTML content
 * @param content HTML content
 * @returns Array of Cloudinary URLs
 */
var extractCloudinaryUrls = function (content) {
    if (!content)
        return [];
    var cloudinaryDomain = 'res.cloudinary.com';
    var urls = [];
    // Regular expression to match image tags with Cloudinary URLs
    var imgRegex = /<img[^>]+src=["']([^"']+res\.cloudinary\.com[^"']+)["'][^>]*>/gi;
    var match;
    while ((match = imgRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes(cloudinaryDomain)) {
            urls.push(match[1]);
        }
    }
    return urls;
};
exports.extractCloudinaryUrls = extractCloudinaryUrls;
