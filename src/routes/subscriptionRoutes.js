import { Router } from "express";
import subscriptionController from "../controllers/subscriptionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/plans", subscriptionController.getPublicPlans);

router.use(authenticate);

router.get("/me", subscriptionController.getMySubscription);
router.post("/free", subscriptionController.activateFreePlan);
router.post("/orders", subscriptionController.createOrder);
router.post("/orders/:id/confirm", subscriptionController.confirmOrderPayment);

export default router;

