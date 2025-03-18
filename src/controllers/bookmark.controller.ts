import type { Context } from "hono";
import { Bookmark } from "../models/Bookmark.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import mongoose from "mongoose";

// Get your bookmarks (protected)
export const getYourBookmarks = async (c: Context) => {
  try {
    const user = c.get("user");

    const bookmarks = await Bookmark.find({ user: user._id })
      .populate("article", "title content")
      .sort({ createdAt: -1 });

    return successResponse(c, 200, "Your bookmarks retrieved successfully", bookmarks);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}

// Add a bookmark (protected)
export const addBookmark = async (c: Context) => {
  try {
    const user = c.get("user");
    const { id } = c.req.param();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(c, 400, "Invalid bookmark ID");
    }

    const bookmark = await Bookmark.create({
      article: id,
      user: user._id
    });

    return successResponse(c, 201, "Bookmark added successfully", bookmark);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}

// Remove a bookmark (protected)
export const removeBookmark = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const user = c.get("user");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(c, 400, "Invalid bookmark ID");
    }

    const bookmark = await Bookmark.findOneAndDelete({ _id: id, user: user._id });

    if (!bookmark) {
      return errorResponse(c, 404, "Bookmark not found");
    }

    return successResponse(c, 200, "Bookmark removed successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
}