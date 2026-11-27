import AppError from "../utils/AppError.js";
import {
  deleteImage,
  listImagesByFolder,
  uploadImageBuffer,
} from "../services/upload.service.js";

export const uploadSingleImage = async (req, res) => {
  if (!req.file) {
    throw new AppError("Vui lòng chọn file ảnh để tải lên (field: image)", 400);
  }

  const folder = req.body?.folder?.trim() || "everweb/general";
  const result = await uploadImageBuffer(req.file.buffer, { folder });

  res.status(201).json({
    status: "success",
    message: "Tải ảnh lên thành công",
    data: result,
  });
};

export const removeImage = async (req, res) => {
  const publicId = req.body?.publicId?.trim();
  const result = await deleteImage(publicId);

  res.status(200).json({
    status: "success",
    message: "Đã xoá ảnh trên Cloudinary",
    data: result,
  });
};

export const getCloudinaryImages = async (req, res) => {
  const folder = req.query?.folder?.trim() || "everweb/images";
  const images = await listImagesByFolder(folder);

  res.status(200).json({
    status: "success",
    data: images,
  });
};
