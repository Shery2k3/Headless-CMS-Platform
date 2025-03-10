import { Hono } from "hono";
import { register, login } from "../controllers/auth.controller.js";
import { validateLogin, validateRegister } from "../validators/auth.validator.js";

const router = new Hono();

router.post("/signup", validateRegister, register);
router.post("/login", validateLogin, login);

export default router;