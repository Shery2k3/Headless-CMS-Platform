import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Register validation schema
export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

// Validator middleware for registration
export const validateRegister = zValidator("json", registerSchema, (result, c) => {
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

// Validator middleware for login
export const validateLogin = zValidator("json", loginSchema, (result, c) => {
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