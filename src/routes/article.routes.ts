import { Hono } from "hono";
import { 
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} from "../controllers/article.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { validateArticle, validateArticleUpdate } from "../validators/article.validator.js";

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

// Protected routes
router.post("/create", auth, validateArticle, createArticle);
router.patch("/edit/:id", auth, validateArticleUpdate, updateArticle);
router.delete("/delete/:id", auth, deleteArticle);

export default router;