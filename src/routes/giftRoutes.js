import { Router } from "express";
import giftController from "../controllers/giftController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", giftController.listByWedding);
router.post("/", giftController.createGift);
router.patch("/:id", giftController.updateGift);
router.delete("/:id", giftController.deleteGift);
router.put("/accounts", giftController.upsertBankAccount);

export default router;

