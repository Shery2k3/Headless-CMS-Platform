import type { Context } from "hono";
import { sign } from "hono/jwt"
import { User } from "../models/User.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { OAuth2Client } from "google-auth-library";
import 'dotenv/config'
import crypto from "crypto";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string || "7d"

export const register = async (c: Context) => {
  try {
    const { firstName, lastName, email, password } = await c.req.json();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(c, 400, "User with this email already exists",);
    }

    // Create new user
    const user = await User.create({
      name: { firstName, lastName },
      email,
      password
    });

    // Generate token
    const token = await sign({ id: user._id }, JWT_SECRET, "HS256");

    return successResponse(
      c,
      201,
      "User registered successfully",
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      },
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error",);
  }
};

export const login = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(c, 402, "Invalid credentials",);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(c, 402, "Invalid credentials");
    }

    // Generate token
    const token = await sign({ id: user._id }, JWT_SECRET, "HS256");

    return successResponse(
      c,
      200,
      "Login successful",
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
        token
      },
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

export const updateUserDetails = async (c: Context) => {
  try {
    const user = c.get("user");
    const { firstName, lastName } = await c.req.json();

    // Create update object with only provided fields
    const updateData: any = { name: {} };

    if (firstName) {
      updateData.name.firstName = firstName;
    }

    if (lastName) {
      updateData.name.lastName = lastName;
    }

    // If neither field was provided
    if (!firstName && !lastName) {
      return errorResponse(c, 400, "No update data provided");
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return errorResponse(c, 404, "User not found");
    }

    return successResponse(
      c,
      200,
      "User details updated successfully",
      updatedUser
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

export const changePassword = async (c: Context) => {
  try {
    const user = c.get("user");
    const { currentPassword, newPassword } = await c.req.json();

    // Find user with password field
    const userWithPassword = await User.findById(user._id);
    if (!userWithPassword) {
      return errorResponse(c, 404, "User not found");
    }

    // Verify current password
    const isMatch = await userWithPassword.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(c, 400, "Current password is incorrect");
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save(); // This will trigger the pre-save hook to hash the password

    return successResponse(
      c,
      200,
      "Password changed successfully"
    );
  } catch (error) {
    console.error(error);
    return errorResponse(c, 500, "Server Error");
  }
};

export const googleAuth = async (c: Context) => {
  try {
    const { credential } = await c.req.json();

    if (!credential) {
      return errorResponse(c, 400, "No credential provided");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return errorResponse(c, 400, "Invalid Google token");
    }

    const { email, given_name, family_name, sub: googleId } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        name: {
          firstName: given_name || 'Google',
          lastName: family_name || 'User'
        },
        email,
        // Generate a secure random password since they won't use it
        password: crypto.randomBytes(16).toString('hex'),
        googleId // You might want to add this to your User model
      });
    }

    const token = await sign({ id: user._id }, JWT_SECRET, "HS256");

    return successResponse(
      c,
      200,
      user ? "Login successful" : "User registered successfully",
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
        token
      }
    );
  } catch (error) {
    console.error("Google Auth Error:", error);
    return errorResponse(c, 500, "Server Error");
  }
}