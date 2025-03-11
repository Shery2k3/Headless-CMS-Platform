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
router.get("/all", getAllArticles);
router.get("/get/:id", getArticleById);

// Protected routes
router.post("/create", auth, validateArticle, createArticle);
router.patch("/edit/:id", auth, validateArticleUpdate, updateArticle);
router.delete("/delete/:id", auth, deleteArticle);

export default router;