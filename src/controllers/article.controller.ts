import type { Context } from "hono";
import { Article } from "../models/Article.js";
import { Settings } from "../models/Settings.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import mongoose from "mongoose";
import {
  calculateReadTime,
  extractCloudinaryPublicId,
  extractCloudinaryUrls,
  getResourceType,
} from "../utils/article.util.js";
import { deleteFromCloudinary } from "../config/uploads/index.js";
import { sanitizeHtml } from "../utils/sanitize.js";

// Get all articles (public)
export const getAllArticles = async (c: Context) => {
  try {
    const query = c.req.query();

    // Build filter object
    const filter: Record<string, any> = {};

    // Filter by category
    if (query.category) {
      filter.category = query.category;
    }

    // Filter by author (if provided)
    if (query.author && mongoose.Types.ObjectId.isValid(query.author)) {
      filter.author = query.author;
    }

    // Filter by title (partial match)
    if (query.title) {
      filter.title = { $regex: query.title, $options: "i" }; // case-insensitive
    }

    // Search term for titles
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' }; // case-insensitive
    }

    // Video article or not
    if (query.type === "video") {
      filter.videoArticle = true;
    } else if (query.type === "article") {
      filter.videoArticle = false;
    }

    // Build sort options
    let sortOptions: Record<string, any> = { createdAt: -1 }; // Default: newest first

    if (query.sort) {
      const sortField = query.sort.startsWith("-")
        ? query.sort.substring(1)
        : query.sort;
      const sortOrder = query.sort.startsWith("-") ? -1 : 1;

      // Only allow sorting by valid fields
      if (
        ["title", "createdAt", "timeToRead", "category"].includes(sortField)
      ) {
        sortOptions = { [sortField]: sortOrder };
      }
    }

    // Pagination
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Execute query with filters, sorting and pagination
    const articles = await Article.find(filter)
      .populate("author", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination metadata
    const total = await Article.countDocuments(filter);

    return successResponse(c, 200, "Articles retrieved successfully", {
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, `Server Error - ${error}`);
  }
};

// Get single article by ID (public)
export const getArticleById = async (c: Context) => {
  try {
    const { id } = c.req.param();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(c, 400, "Invalid article ID");
    }

    const article = await Article.findById(id).populate("author", "name email");

    if (!article) {
      return errorResponse(c, 404, "Article not found");
    }

    article.timesViewed += 1;
    await article.save();

    return successResponse(c, 200, "Article retrieved successfully", article);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Get your articles (protected)
export const getYourArticles = async (c: Context) => {
  try {
    const user = c.get("user");

    const articles = await Article.find({ author: user._id })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return successResponse(
      c,
      200,
      "Your articles retrieved successfully",
      articles
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Create new article (protected)
export const createArticle = async (c: Context) => {
  try {
    const user = c.get("user");
    const { title, content, category, src, videoArticle } = await c.req.json();

    const timeToRead = calculateReadTime(content);

    const sanitizedContent = sanitizeHtml(content);

    const article = await Article.create({
      title,
      content: sanitizedContent,
      timeToRead,
      category: category.toLowerCase(),
      src,
      videoArticle,
      author: user._id,
    });

    return successResponse(c, 201, "Article created successfully", article);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, `Server Error - ${error}`);
  }
};

// Update article (protected)
export const updateArticle = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const user = c.get("user");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(c, 400, "Invalid article ID");
    }

    // Find the article and check ownership
    const article = await Article.findById(id);

    if (!article) {
      return errorResponse(c, 404, "Article not found");
    }

    if (!user.admin) {
      return errorResponse(
        c,
        403,
        "You are not authorized to update this article"
      );
    }

    // Get the fields to update (only include fields that are provided)
    const updates = await c.req.json();

    // Create an update object with only the fields that are provided
    const updateFields: Record<string, any> = {};

    if (updates.title !== undefined) updateFields.title = updates.title;
    if (updates.content !== undefined && updates.content !== article.content) {
      // Clean up deleted images by comparing old and new content
      const oldImageUrls = extractCloudinaryUrls(article.content);
      const newImageUrls = extractCloudinaryUrls(updates.content);

      // Find images that were in the old content but not in the new content
      const deletedImageUrls = oldImageUrls.filter(
        (url) => !newImageUrls.includes(url)
      );

      // Delete each removed image
      for (const url of deletedImageUrls) {
        try {
          const publicId = extractCloudinaryPublicId(url);
          if (publicId) {
            await deleteFromCloudinary(publicId, "image");
          }
        } catch (imgError) {
          console.error(`Failed to delete removed image (${url}):`, imgError);
        }
      }

      // Update the content field
      updateFields.content = sanitizeHtml(updates.content);
      updateFields.timeToRead = calculateReadTime(updates.content);
    }
    if (updates.category !== undefined)
      updateFields.category = updates.category.toLowerCase();

    //? Delete the old image or video from Cloudinary if the src field is updated
    if (
      updates.src !== undefined &&
      article.src &&
      updates.src !== article.src
    ) {
      try {
        const publicId = extractCloudinaryPublicId(article.src);
        const resourceType = getResourceType(article.src, article.videoArticle);

        if (publicId) {
          await deleteFromCloudinary(publicId, resourceType);
        }
      } catch (cloudinaryError) {
        console.error("Failed to delete from Cloudinary:", cloudinaryError);
        // Continue with update even if Cloudinary deletion fails
      }

      updateFields.src = updates.src;
    }

    if (updates.videoArticle !== undefined)
      updateFields.videoArticle = updates.videoArticle;

    // Make sure there's at least one field to update
    if (Object.keys(updateFields).length === 0) {
      return errorResponse(c, 400, "No fields provided for update");
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return successResponse(
      c,
      200,
      "Article updated successfully",
      updatedArticle
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, `Server Error - ${error}`);
  }
};

// Delete article (protected)
export const deleteArticle = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const user = c.get("user");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(c, 400, "Invalid article ID");
    }

    // Find the article and check ownership
    const article = await Article.findById(id);

    if (!article) {
      return errorResponse(c, 404, "Article not found");
    }

    if (!user.admin) {
      return errorResponse(
        c,
        403,
        "You are not authorized to delete this article"
      );
    }

    // // Check if user is the author
    // if (article.author.toString() !== user._id.toString()) {
    //   return errorResponse(c, 403, "You can only delete your own articles");
    // }

    // 1. Delete the main image/video from Cloudinary if it exists
    if (article.src) {
      try {
        const publicId = extractCloudinaryPublicId(article.src);
        const resourceType = getResourceType(article.src, article.videoArticle);

        if (publicId) {
          await deleteFromCloudinary(publicId, resourceType);
        }
      } catch (error) {
        console.error("Failed to delete main image from Cloudinary:", error);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    // 2. Extract and delete all embedded Cloudinary images from content
    if (article.content) {
      try {
        const imageUrls = extractCloudinaryUrls(article.content);

        // console.log(`Deleting ${imageUrls.length} embedded images...`);

        // Delete each image from Cloudinary
        const deletionPromises = imageUrls.map(async (url: string) => {
          try {
            const publicId = extractCloudinaryPublicId(url);
            // console.log(publicId)
            if (publicId) {
              // Assume all embedded images are of type 'image'
              await deleteFromCloudinary(publicId, "image");
            }
          } catch (imgError) {
            console.error(
              `Failed to delete embedded image (${url}):`,
              imgError
            );
          }
        });

        // Wait for all image deletions to complete
        await Promise.all(deletionPromises);
      } catch (contentError) {
        console.error("Failed to process embedded images:", contentError);
        // Continue with article deletion even if image cleanup fails
      }
    }

    // Delete the article from the database
    await Article.findByIdAndDelete(id);

    return successResponse(c, 200, "Article deleted successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, `Server Error - ${error}`);
  }
};

// Get trending artcles given days (public)
export const getTrendingArticles = async (c: Context) => {
  try {
    const { days } = c.req.query();
    const daysNum = parseInt(days as string) || 7; //? Default to 7 days if parsing fails

    const articles = await Article.find({
      updatedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
      videoArticle: false,
    })
      .populate("author", "name email")
      .sort({ timesViewed: -1 });

    return successResponse(
      c,
      200,
      "Trending articles retrieved successfully",
      articles
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Get top categories (public)
export const getTopCategories = async (c: Context) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const categories = await Article.aggregate([
      // First match to filter out video articles
      { $match: { videoArticle: false } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          articles: { $push: "$$ROOT" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          category: "$_id",
          count: 1,
          articles: {
            $slice: ["$articles", skip, limit],
          },
          _id: 0,
        },
      },
    ]);

    // Populate author information for articles
    for (let category of categories) {
      category.articles = await Article.populate(category.articles, {
        path: "author",
        select: "name email",
      });

      // Add pagination metadata for each category
      category.pagination = {
        total: category.count,
        page,
        limit,
        pages: Math.ceil(category.count / limit),
      };
    }

    return successResponse(
      c,
      200,
      "Top categories retrieved successfully",
      categories
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Get all categories (public)
export const getAllCategories = async (c: Context) => {
  try {
    // Get distinct categories
    const allCategories = await Article.distinct("category");

    // Aggregate to get category counts and random image
    const categoriesData = await Article.aggregate([
      {
        $group: {
          _id: "$category",
          articleCount: {
            $sum: { $cond: [{ $eq: ["$videoArticle", false] }, 1, 0] },
          },
          videoCount: {
            $sum: { $cond: [{ $eq: ["$videoArticle", true] }, 1, 0] },
          },
          // Get all images from the category
          images: {
            $push: {
              $cond: [{ $ne: ["$src", null] }, "$src", "$$REMOVE"],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          articleCount: 1,
          videoCount: 1,
          // Pick a random image from the images array
          randomImage: {
            $arrayElemAt: [
              "$images",
              { $floor: { $multiply: [{ $rand: {} }, { $size: "$images" }] } },
            ],
          },
        },
      },
    ]);

    // Convert to a map for easy lookup
    const categoryMap = new Map(
      categoriesData.map((cat) => [
        cat._id,
        {
          articleCount: cat.articleCount,
          videoCount: cat.videoCount,
          image: cat.randomImage,
        },
      ])
    );

    // Ensure all categories are included
    const formattedCategories = allCategories.map((category) => ({
      category,
      articleCount: categoryMap.get(category)?.articleCount || 0,
      videoCount: categoryMap.get(category)?.videoCount || 0,
      totalCount:
        (categoryMap.get(category)?.articleCount || 0) +
        (categoryMap.get(category)?.videoCount || 0),
      image: categoryMap.get(category)?.image || null,
    }));

    return successResponse(
      c,
      200,
      "Categories retrieved successfully",
      formattedCategories
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

export const getFeaturedArticle = async (c: Context) => {
  try {
    const settings = await Settings.findOne()
      .select("-topPickArticles")
      .populate({
        path: "featuredArticle",
        populate: {
          path: "author",
          select: "name email",
        },
      });

    return successResponse(
      c,
      200,
      "Featured article retrieved successfully",
      settings
    );
  } catch (error) {
    return errorResponse(c, 500, "Server Error");
  }
};

export const getTopPickArticles = async (c: Context) => {
  try {
    const settings = await Settings.findOne({ videpoArticle: false })
      .select("-featuredArticle")
      .populate({
        path: "topPickArticles",
        populate: {
          path: "author",
          select: "name email",
        },
      });

    return successResponse(
      c,
      200,
      "Top pick articles retrieved successfully",
      settings
    );
  } catch (error) {
    return errorResponse(c, 500, "Server Error");
  }
};

export const uploadArticleImage = async (c: Context) => {
  try {
    const { image } = await c.req.json();

    if (!image) {
      return errorResponse(c, 400, "No image provided");
    }

    return successResponse(c, 200, "Image uploaded successfully", {
      path: image,
    });
  } catch (error) {
    return errorResponse(c, 500, "Server Error");
  }
};
