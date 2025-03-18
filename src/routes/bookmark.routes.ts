import { Hono } from "hono";
import {
  getYourBookmarks,
  addBookmark,
  removeBookmark
} from "../controllers/bookmark.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = new Hono();

// Protected routes
router.get("/your", auth, getYourBookmarks);
router.post("/add/:id", auth, addBookmark);
router.delete("/remove/:id", auth, removeBookmark);

export default router;