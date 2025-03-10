import { Hono } from "hono";
import { register, login } from "../controllers/auth.controller.js";

const router = new Hono();

router.post("/signup", register);
router.post("/login", login);

export default router;