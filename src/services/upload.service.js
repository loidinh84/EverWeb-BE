import cloudinary, { configureCloudinary } from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";

const ensureConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError("Chưa cấu hình đầy đủ biến môi trường Cloudinary", 500);
  }
  configureCloudinary();
};

/**
 * Upload buffer ảnh trực tiếp lên Cloudinary (không lưu file tạm ra ổ đĩa).
 */
export const uploadImageBuffer = (buffer, { folder = "everweb" } = {}) => {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(`Upload ảnh thất bại: ${error.message}`, 502)
          );
        }
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Xoá ảnh trên Cloudinary theo publicId.
 */
export const deleteImage = async (publicId) => {
  ensureConfigured();
  if (!publicId) {
    throw new AppError("Thiếu publicId của ảnh cần xoá", 400);
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

/**
 * Lấy danh sách ảnh từ một thư mục trên Cloudinary (mặc định: everweb/images).
 */
export const listImagesByFolder = async (folder = "everweb/images") => {
  ensureConfigured();
  const res = await cloudinary.api.resources_by_asset_folder(folder, {
    max_results: 100,
  });

  return (res.resources || [])
    .sort((a, b) => a.public_id.localeCompare(b.public_id))
    .map((item) => ({
      publicId: item.public_id,
      url: item.secure_url,
      width: item.width,
      height: item.height,
      format: item.format,
    }));
};
