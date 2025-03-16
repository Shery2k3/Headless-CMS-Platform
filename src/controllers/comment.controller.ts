import type { Context } from "hono";
import { Comment } from "../models/Comment.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import mongoose from "mongoose";

// Get all comments for an article
export const getArticleComments = async (c: Context) => {
  try {
    const { articleId } = c.req.param();
    
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return errorResponse(c, 400, "Invalid article ID");
    }
    
    // Get only top-level comments (not replies)
    const comments = await Comment.find({ 
      article: articleId,
      parentComment: { $exists: false } 
    })
    .populate("author", "name email")
    .sort({ createdAt: -1 });
    
    return successResponse(c, 200, "Comments retrieved successfully", comments);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Get replies to a specific comment
export const getCommentReplies = async (c: Context) => {
  try {
    const { commentId } = c.req.param();
    
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return errorResponse(c, 400, "Invalid comment ID");
    }
    
    const replies = await Comment.find({ parentComment: commentId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });
    
    return successResponse(c, 200, "Comment replies retrieved successfully", replies);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Add a comment to an article
export const addComment = async (c: Context) => {
  try {
    const { articleId } = c.req.param();
    const user = c.get("user");
    const { content, parentCommentId } = await c.req.json();
    
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return errorResponse(c, 400, "Invalid article ID");
    }
    
    const commentData: any = {
      content,
      article: articleId,
      author: user._id
    };
    
    // If it's a reply to another comment
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return errorResponse(c, 400, "Invalid parent comment ID");
      }
      
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return errorResponse(c, 404, "Parent comment not found");
      }
      
      commentData.parentComment = parentCommentId;
    }
    
    const comment = await Comment.create(commentData);
    await comment.populate("author", "name email");
    
    return successResponse(c, 201, "Comment added successfully", comment);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Update a comment
export const updateComment = async (c: Context) => {
  try {
    const { commentId } = c.req.param();
    const user = c.get("user");
    const { content } = await c.req.json();
    
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return errorResponse(c, 400, "Invalid comment ID");
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse(c, 404, "Comment not found");
    }
    
    // Check ownership
    if (comment.author.toString() !== user._id.toString()) {
      return errorResponse(c, 403, "You can only update your own comments");
    }
    
    comment.content = content;
    await comment.save();
    await comment.populate("author", "name email");
    
    return successResponse(c, 200, "Comment updated successfully", comment);
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

// Delete a comment
export const deleteComment = async (c: Context) => {
  try {
    const { commentId } = c.req.param();
    const user = c.get("user");
    
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return errorResponse(c, 400, "Invalid comment ID");
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse(c, 404, "Comment not found");
    }
    
    // Check ownership
    if (comment.author.toString() !== user._id.toString()) {
      return errorResponse(c, 403, "You can only delete your own comments");
    }
    
    // Delete the comment and its replies
    await Comment.deleteMany({ 
      $or: [
        { _id: commentId }, 
        { parentComment: commentId }
      ] 
    });
    
    return successResponse(c, 200, "Comment and its replies deleted successfully");
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};