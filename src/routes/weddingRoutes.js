import { Router } from "express";
import weddingController from "../controllers/weddingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/public/invitation", weddingController.getPublicInvitation);
router.get("/public/contact/:slug", weddingController.getPublicContactForm);
router.post("/public/contact/:slug", weddingController.submitPublicContactForm);

router.use(authenticate);

router.get("/", weddingController.getWeddings);
router.post("/", weddingController.createWedding);
router.get("/:id", weddingController.getWeddingById);
router.patch("/:id", weddingController.updateWedding);
router.put("/:id", weddingController.updateWedding);
router.delete("/:id", weddingController.deleteWedding);

router.get("/:id/members", weddingController.getMembers);
router.post("/:id/members", weddingController.addMember);
router.delete("/:id/members/:userId", weddingController.removeMember);

router.get("/:id/features", weddingController.getFeatures);
router.patch("/:id/features/:section", weddingController.updateFeatureSection);
router.put("/:id/features/:section", weddingController.updateFeatureSection);
router.post("/:id/send-email", weddingController.sendEmail);

export default router;
