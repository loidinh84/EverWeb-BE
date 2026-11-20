import { Router } from "express";
import guestController from "../controllers/guestController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/invitation/:token", guestController.getGuestByToken);
router.post("/", authenticate, guestController.createGuest);

export default router;
