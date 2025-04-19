import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB connection settings
const MONGODB_URI = process.env.MONGODB_URI;
console.log('Using connection string:', MONGODB_URI);

// MongoDB Article Schema - matching your BE model
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    timeToRead: { type: String, required: true },
    category: { type: String, required: true },
    src: { type: String },
    videoArticle: { type: Boolean, default: false },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    author: { type: String, default: "Anonymous" },
    timesViewed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create Article model
const Article = mongoose.model('Article', articleSchema);

// Function to calculate reading time 
const calculateReadTime = (content) => {
  // Remove HTML tags to count actual words
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(wordCount / 200);
  
  return minutes <= 1 ? "< 1 min read" : `${minutes} min read`;
};

// Helper function to get the appropriate category
const getCategory = () => {
  const categories = [
    "Education", 
    "Politics", 
    "Religion", 
    "Opinion", 
    "Economy", 
    "Lifestyle", 
    "Social", 
    "International",
    "Health",
    "Finance",
    "Environment",
    "Arts & Literature"
  ];
  
  return categories[Math.floor(Math.random() * categories.length)];
};

// Function to extract author name from HTML content
const extractAuthorFromContent = (content) => {
  // Look for author info in italic tags at the end of the content
  const authorRegex = /<em>([^<]+)<\/em>\s*$/i;
  const matches = content.match(authorRegex);
  
  if (matches && matches[1]) {
    // Extract the author's name - typically the first part before any positions or titles
    let authorText = matches[1].trim();
    // Try to get just the name part (before "is" or "holds" or commas)
    const nameMatch = authorText.match(/^([^,]+?)(?:\s+is|\s+holds|\s*,)/i);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
    
    // If we can't parse it well, just return the first 40 chars or so
    return authorText.length > 40 ? authorText.substring(0, 40) + '...' : authorText;
  }
  
  return "Anonymous"; // Default if no author found
};

// Function to extract a good featured image from content
const extractFeaturedImage = (content) => {
  // Use regex to find all img tags
  const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
  const matches = [...content.matchAll(imgRegex)];
  
  if (matches.length > 0) {
    // Get all image URLs from the content
    const imageUrls = matches.map(match => match[1]);
    
    // Filter out any images that are too small (e.g., icons, emoticons)
    // WordPress often has size info in the filename like "-300x200"
    const validImages = imageUrls.filter(url => {
      // Skip very small images or icons
      const sizeMatch = url.match(/-(\d+)x(\d+)\./);
      if (sizeMatch) {
        const width = parseInt(sizeMatch[1]);
        const height = parseInt(sizeMatch[2]);
        return width >= 300 || height >= 200; // Only consider reasonably sized images
      }
      return true; // Include images without size in the filename
    });
    
    // Prefer larger images that are likely featured images (not inline small images)
    const largeImages = validImages.filter(url => 
      url.includes('large') || 
      url.includes('full') || 
      url.includes('featured') ||
      !url.match(/-\d+x\d+\./) // Images without size indicators are often originals
    );
    
    // First image is often the featured one in blog posts
    if (largeImages.length > 0) return largeImages[0];
    if (validImages.length > 0) return validImages[0];
  }
  
  // Default placeholder image if none found
  return "https://res.cloudinary.com/dmmqlej8g/image/upload/v1745095227/KARYAWAN_TRANSPARENT_oohpnx.png";
};

// Function to determine category based on content
const determineCategoryFromContent = (title, content) => {
  const categories = {
    "Education": ["education", "school", "learning", "teaching", "student", "academic", "classroom", "preschool"],
    "Politics": ["politic", "governance", "election", "democracy", "parliament", "government", "minister"],
    "Religion": ["islam", "muslim", "faith", "religious", "spiritual", "belief", "worship", "prayer", "quran", "mosque"],
    "Opinion": ["opinion", "perspective", "viewpoint", "think", "believe", "reflect"],
    "Economy": ["economy", "economic", "finance", "market", "business", "trade", "industry", "investment"],
    "Lifestyle": ["lifestyle", "living", "fashion", "trend", "leisure", "hobby", "entertainment"],
    "Social": ["social", "society", "community", "relationship", "culture", "tradition"],
    "International": ["international", "global", "world", "foreign", "overseas", "abroad"],
    "Health": ["health", "medical", "disease", "wellness", "doctor", "hospital", "mental health", "physical"],
    "Environment": ["environment", "climate", "sustainable", "green", "ecology", "nature", "planet"],
    "Arts & Literature": ["art", "literature", "book", "novel", "poem", "creative", "cultural", "music", "film"]
  };
  
  // Combine title and content for analysis, convert to lowercase
  const text = (title + " " + content.replace(/<[^>]*>/g, ' ')).toLowerCase();
  
  // Count occurrences of keywords for each category
  const scores = {};
  
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        scores[category] += matches.length;
      }
    }
  }
  
  // Find the category with the highest score
  let bestCategory = "Opinion"; // Default category
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
};

// Main function to migrate WordPress posts
async function migrateWordPressPosts() {
  try {
    console.log('Starting WordPress to MongoDB migration...');
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Get a reference to the User model for postedBy field
    const User = mongoose.model('User', new mongoose.Schema({
      name: {
        firstName: String,
        lastName: String
      },
      email: String,
      admin: Boolean,
      password: String
    }));
    
    // Find an admin user to assign as the poster for all articles
    const adminUser = await User.findOne({ admin: true });
    
    if (!adminUser) {
      console.error('No admin user found in the database! Please create an admin user first.');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`Using admin user: ${adminUser.email} as the postedBy reference`);
    
    // Read the WordPress JSON file
    const dataPath = path.join(__dirname, '../data/wp_posts_all.json');
    console.log(`Reading data from: ${dataPath}`);
    
    const rawData = await fs.promises.readFile(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    if (!jsonData || !jsonData[2] || !jsonData[2].data) {
      console.error('Invalid JSON data format or empty data array');
      await mongoose.connection.close();
      return;
    }
    
    // Extract the posts from the JSON file
    const posts = jsonData[2].data;
    console.log(`Found ${posts.length} WordPress posts to process`);
    
    // Tracking statistics
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each WordPress post
    for (const post of posts) {
      try {
        // Skip non-published or empty posts
        if (post.post_status !== 'publish' || !post.post_content.trim()) {
          console.log(`Skipping post ID ${post.ID}: Not published or empty content`);
          skipped++;
          continue;
        }
        
        // Check if an article with the same title already exists
        const existingArticle = await Article.findOne({ title: post.post_title });
        
        if (existingArticle) {
          console.log(`Skipping post ID ${post.ID}: Article with title "${post.post_title}" already exists`);
          skipped++;
          continue;
        }
        
        // Extract author from content (if available)
        const author = extractAuthorFromContent(post.post_content);
        console.log(`Extracted author for post ${post.ID}: ${author}`);
        
        // Extract a good featured image from content
        const featuredImageUrl = extractFeaturedImage(post.post_content);
        console.log(`Using featured image for post ${post.ID}: ${featuredImageUrl}`);
        
        // Determine the most appropriate category for the article
        const category = determineCategoryFromContent(post.post_title, post.post_content);
        console.log(`Determined category for post ${post.ID}: ${category}`);
        
        // Create new article document
        const newArticle = new Article({
          title: post.post_title,
          content: post.post_content,
          timeToRead: calculateReadTime(post.post_content),
          category: category,
          src: featuredImageUrl,
          videoArticle: false,
          postedBy: adminUser._id,
          author: author,
          timesViewed: Math.floor(Math.random() * 100), // Random view count
          createdAt: new Date(post.post_date),
          updatedAt: new Date(post.post_modified)
        });
        
        // Save to MongoDB
        await newArticle.save();
        
        console.log(`Successfully imported: "${post.post_title}" (ID: ${post.ID})`);
        imported++;
      } catch (err) {
        console.error(`Error importing post ID ${post.ID}:`, err.message);
        errors++;
      }
    }
    
    // Display migration summary
    console.log('\n===== MIGRATION SUMMARY =====');
    console.log(`Total posts processed: ${posts.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('=============================\n');
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Execute the migration
migrateWordPressPosts()
  .then(() => {
    console.log('WordPress to MongoDB migration script finished');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration script error:', err);
    process.exit(1);
  });