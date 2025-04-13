import { Settings } from '../models/Settings.js';
import { User } from '../models/User.js';
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
    const { articleIds, displayOrders } = await c.req.json();

    if (!Array.isArray(articleIds)) {
      return errorResponse(c, 400, "Invalid article IDs format");
    }

    // Create array of objects with article ID and display order
    const topPicksData = articleIds.map((id: string, index: number) => ({
      article: new mongoose.Types.ObjectId(id),
      displayOrder: displayOrders ? displayOrders[index] : index + 1
    }));

    const settings = await Settings.findOne();
    if (!settings) {
      // Create new settings document with top pick articles
      await Settings.create({ topPickArticles: topPicksData });
      return successResponse(c, 200, "Top pick articles changed successfully");
    }

    // Use set method instead of direct assignment to handle the type issues
    settings.set({ topPickArticles: topPicksData });
    await settings.save();

    return successResponse(c, 200, "Top pick articles changed successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}

export const getAllUsers = async (c: Context) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    if (!users) {
      return errorResponse(c, 404, "No users found");
    }
    return successResponse(c, 200, "Users retrieved successfully", users);

  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}

export const makeAdmin = async (c: Context) => {
  try {
    const { userId } = c.req.param();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse(c, 400, "Invalid user ID format");
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(c, 404, "User not found");
    }

    user.admin = true;
    await user.save();

    return successResponse(c, 200, "User made admin successfully", user);

  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}

export const removeAdmin = async (c: Context) => {
  try {
    const { userId } = c.req.param();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse(c, 400, "Invalid user ID format");
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(c, 404, "User not found");
    }

    user.admin = false;
    await user.save();

    return successResponse(c, 200, "User admin status removed successfully", user);

  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}