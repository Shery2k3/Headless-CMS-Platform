import { Hono } from "hono";
import { getAllUsers, makeAdmin, removeAdmin, updateFeaturedArticle, updateTopPickArticles } from "../controllers/settings.controller.js";
import { admin, superAdmin } from "../middleware/auth.middleware.js";

const router = new Hono();

router.put('/featured-article/:articleId', admin, updateFeaturedArticle);
router.put('/top-pick-articles', admin, updateTopPickArticles);

router.get('/get-all-users', superAdmin, getAllUsers);

router.patch('/make-admin/:userId', superAdmin, makeAdmin);

router.patch('/remove-admin/:userId', superAdmin, removeAdmin);

export default router;