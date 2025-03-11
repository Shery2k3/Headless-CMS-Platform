import type { Context } from "hono";
import { Article } from "../models/Article.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import mongoose from "mongoose";

// Get all articles (public)
export const getAllArticles = async (c: Context) => {
  try {
    const articles = await Article.find().populate("author", "name email");
    return successResponse(c, 200, "Articles retrieved successfully", articles);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
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
    
    return successResponse(c, 200, "Article retrieved successfully", article);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Create new article (protected)
export const createArticle = async (c: Context) => {
  try {
    const user = c.get("user");
    const { title, content, timeToRead, category, src } = await c.req.json();
    
    const article = await Article.create({
      title,
      content,
      timeToRead,
      category,
      src,
      author: user._id
    });
    
    return successResponse(c, 201, "Article created successfully", article);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
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
    
    // Check if user is the author
    if (article.author.toString() !== user._id.toString()) {
      return errorResponse(c, 403, "You can only update your own articles");
    }
    
    // Get the fields to update (only include fields that are provided)
    const updates = await c.req.json();
    
    // Create an update object with only the fields that are provided
    const updateFields: Record<string, any> = {};
    
    if (updates.title !== undefined) updateFields.title = updates.title;
    if (updates.content !== undefined) updateFields.content = updates.content;
    if (updates.timeToRead !== undefined) updateFields.timeToRead = updates.timeToRead;
    if (updates.category !== undefined) updateFields.category = updates.category;
    if (updates.src !== undefined) updateFields.src = updates.src;
    
    // Make sure there's at least one field to update
    if (Object.keys(updateFields).length === 0) {
      return errorResponse(c, 400, "No fields provided for update");
    }
    
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );
    
    return successResponse(c, 200, "Article updated successfully", updatedArticle);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
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
    
    // Check if user is the author
    if (article.author.toString() !== user._id.toString()) {
      return errorResponse(c, 403, "You can only delete your own articles");
    }
    
    await Article.findByIdAndDelete(id);
    
    return successResponse(c, 200, "Article deleted successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};