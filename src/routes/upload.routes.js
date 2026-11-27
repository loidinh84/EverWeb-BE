import { Router } from "express";
import { uploadImage } from "../middlewares/upload.middleware.js";
import {
  getCloudinaryImages,
  removeImage,
  uploadSingleImage,
} from "../controllers/upload.controller.js";

const router = Router();

router.get("/images", getCloudinaryImages);
router.post("/image", uploadImage.single("image"), uploadSingleImage);
router.delete("/image", removeImage);

export default router;
