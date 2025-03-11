import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Article creation validation schema (all fields required)
export const articleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  timeToRead: z.string().min(1, "Time to read is required"),
  category: z.string().min(1, "Category is required"),
  src: z.string().optional()
});

// Article update validation schema (all fields optional)
export const articleUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  content: z.string().min(10, "Content must be at least 10 characters").optional(),
  timeToRead: z.string().min(1, "Time to read is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  src: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Validator middleware for article creation
export const validateArticle = zValidator("json", articleSchema, (result, c) => {
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

// Validator middleware for article updates
export const validateArticleUpdate = zValidator("json", articleUpdateSchema, (result, c) => {
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