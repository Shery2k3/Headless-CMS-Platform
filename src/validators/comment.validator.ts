import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  parentCommentId: z.string().optional() // Optional for replies
});

export const validateComment = zValidator("json", commentSchema, (result, c) => {
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));
    
    return c.json({
      success: false,
      statusCode: 400,
      message: "Validation failed",
      error: errors
    }, 400);
  }
});