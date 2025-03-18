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

export const userUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Password change validation schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters")
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
});

export const validateUserUpdate = zValidator("json", userUpdateSchema, (result, c) => {
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

// Validator middleware for password change
export const validatePasswordChange = zValidator("json", passwordChangeSchema, (result, c) => {
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