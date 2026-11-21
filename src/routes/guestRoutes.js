import { Router } from "express";
import guestController from "../controllers/guestController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/invitation/:token", guestController.getGuestByToken);
router.patch("/rsvp/:token", guestController.respondRsvp);
router.use(authenticate);
router.get("/stats", guestController.getStats);
router.get("/", guestController.getGuests);
router.post("/", guestController.createGuest);
router.get("/:id", guestController.getGuestById);
router.put("/:id", guestController.updateGuest);
router.delete("/:id", guestController.deleteGuest);

export default router;
