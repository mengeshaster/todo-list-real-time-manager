import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", TaskController.list);
router.get("/:id", TaskController.findById);
router.post("/", TaskController.create);
router.put("/:id", TaskController.update);
router.delete("/:id", TaskController.remove);

router.patch("/:id/toggle", TaskController.toggleStatus);
router.get("/status/:status", TaskController.findByStatus);
router.get("/priority/:priority", TaskController.findByPriority);

export default router;
