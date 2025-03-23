import { Settings } from '../models/Settings.js';
import { successResponse, errorResponse } from "../utils/response.util.js";
import type { Context } from 'hono';
import mongoose from 'mongoose';

export const updateFeaturedArticle = async (c: Context) => {
  try {
    const { articleId } = c.req.param();

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return errorResponse(c, 400, "Invalid article ID format");
    }

    const settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({ featuredArticle: articleId });
      return successResponse(c, 200, "Featured article changed successfully");
    }

    // Convert the string to ObjectId before assignment
    settings.featuredArticle = new mongoose.Types.ObjectId(articleId);
    await settings.save();

    return successResponse(c, 200, "Featured article changed successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}

export const updateTopPickArticles = async (c: Context) => {
  try {
    const { articleIds } = await c.req.json();

    if (!Array.isArray(articleIds)) {
      return errorResponse(c, 400, "Invalid article IDs format");
    }

    const settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({ topPickArticles: articleIds });
      return successResponse(c, 200, "Top pick articles changed successfully");
    }

    // Convert the strings to ObjectIds before assignment
    settings.topPickArticles = articleIds.map((id: string) => new mongoose.Types.ObjectId(id));
    await settings.save();

    return successResponse(c, 200, "Top pick articles changed successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}