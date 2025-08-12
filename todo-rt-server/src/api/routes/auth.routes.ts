import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));

router.post("/logout", authenticateToken, authController.logout.bind(authController) as any);


export default router;
