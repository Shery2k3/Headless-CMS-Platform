import { Hono } from "hono";
import { register, login, updateUserDetails, changePassword } from "../controllers/auth.controller.js";
import { validateLogin, validatePasswordChange, validateRegister, validateUserUpdate } from "../validators/auth.validator.js";
import { auth } from "../middleware/auth.middleware.js";

const router = new Hono();

router.post("/signup", validateRegister, register);
router.post("/login", validateLogin, login);

router.patch("/update-profile", auth, validateUserUpdate, updateUserDetails)
router.patch("/change-password", auth, validatePasswordChange, changePassword)

export default router;