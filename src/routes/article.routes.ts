import { Hono } from "hono";
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getTrendingArticles
} from "../controllers/article.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { validateArticle, validateArticleUpdate } from "../validators/article.validator.js";
import { handleFileUpload } from "../middleware/cloudinary.middleware.js";

const router = new Hono();


// Public routes

// GET /all - Supports query params:
// - category: Filter by category
// - author: Filter by author ID
// - title: Search in title (case-insensitive)
// - sort: Sort field (prefix with '-' for descending order, e.g. '-createdAt')
// - page: Page number (default: 1)
// - limit: Items per page (default: 10)
router.get("/all", getAllArticles);

router.get("/get/:id", getArticleById);

router.get("/trending/:days", getTrendingArticles);

// Protected routes
router.post("/create", auth, handleFileUpload, createArticle);
router.patch("/edit/:id", auth, handleFileUpload, updateArticle);
router.delete("/delete/:id", auth, deleteArticle);

export default router;