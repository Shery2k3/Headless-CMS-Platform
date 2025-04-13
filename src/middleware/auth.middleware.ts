import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { User } from "../models/User.js";
import { errorResponse } from "../utils/response.util.js";
import 'dotenv/config'
import { Settings } from "../models/Settings.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const auth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(c, 401, "Unauthorized: No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return errorResponse(c, 401, "Unauthorized: Invalid token");
    }

    c.set("user", user);
    await next();

  } catch (error) {
    console.error(error);
    return errorResponse(c, 401, "Unauthorized: Invalid token");
  }
};

export const admin = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(c, 401, "Unauthorized: No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return errorResponse(c, 401, "Unauthorized: Invalid token");
    }

    if (user.admin !== true) {
      return errorResponse(c, 403, "Forbidden: Admin access required");
    }

    c.set("user", user);
    await next();

  } catch (error) {
    console.error(error);
    return errorResponse(c, 401, "Unauthorized: Invalid token");
  }
}

export const superAdmin = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(c, 401, "Unauthorized: No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return errorResponse(c, 401, "Unauthorized: Invalid token");
    }

    if (user.superAdmin !== true) {
      return errorResponse(c, 403, "Forbidden: Super admin access required");
    }

    c.set("user", user);
    await next();

  } catch (error) {
    console.error(error);
    return errorResponse(c, 401, "Unauthorized: Invalid token");
  }
}