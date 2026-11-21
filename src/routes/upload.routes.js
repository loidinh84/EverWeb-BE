import { Router } from "express";
import { uploadImage } from "../middlewares/upload.middleware.js";
import {
  removeImage,
  uploadSingleImage,
} from "../controllers/upload.controller.js";

const router = Router();

router.post("/image", uploadImage.single("image"), uploadSingleImage);
router.delete("/image", removeImage);

export default router;
