import { Hono } from "hono";
import { 
  getArticleComments,
  getCommentReplies,
  addComment,
  updateComment,
  deleteComment
} from "../controllers/comment.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { validateComment } from "../validators/comment.validator.js";

const router = new Hono();

// Public routes
router.get("/article/:articleId", getArticleComments);
router.get("/replies/:commentId", getCommentReplies);

// Protected routes
router.post("/article/:articleId", auth, validateComment, addComment);
router.patch("/:commentId", auth, validateComment, updateComment);
router.delete("/:commentId", auth, deleteComment);

export default router;