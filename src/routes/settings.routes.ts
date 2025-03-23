import { Hono } from "hono";
import { updateFeaturedArticle, updateTopPickArticles } from "../controllers/settings.controller.js";
import { admin } from "../middleware/auth.middleware.js";

const router = new Hono();

router.put('/featured-article/:articleId', admin, updateFeaturedArticle);
router.put('/top-pick-articles', admin, updateTopPickArticles);

export default router;