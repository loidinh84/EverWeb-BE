import weddingService from "../services/weddingService.js";
import weddingFeatureService from "../services/weddingFeatureService.js";

const weddingController = {
  async createWedding(req, res, next) {
    try {
      const wedding = await weddingService.createWedding(req.body, req.user);
      res.status(201).json({
        status: "success",
        message: "Tạo hồ sơ đám cưới thành công",
        data: wedding,
      });
    } catch (err) {
      next(err);
    }
  },

  async getWeddings(req, res, next) {
    try {
      const result = await weddingService.getWeddings(req.query, req.user);
      res.status(200).json({
        status: "success",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  async getWeddingById(req, res, next) {
    try {
      const wedding = await weddingService.getWeddingById(
        req.params.id,
        req.user
      );
      res.status(200).json({
        status: "success",
        data: wedding,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateWedding(req, res, next) {
    try {
      const wedding = await weddingService.updateWedding(
        req.params.id,
        req.body,
        req.user
      );
      res.status(200).json({
        status: "success",
        message: "Cập nhật hồ sơ đám cưới thành công",
        data: wedding,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteWedding(req, res, next) {
    try {
      await weddingService.deleteWedding(req.params.id, req.user);
      res.status(200).json({
        status: "success",
        message: "Đã xoá hồ sơ đám cưới",
      });
    } catch (err) {
      next(err);
    }
  },

  async getMembers(req, res, next) {
    try {
      const data = await weddingService.getMembers(req.params.id, req.user);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  },

  async addMember(req, res, next) {
    try {
      const member = await weddingService.addMember(
        req.params.id,
        req.body,
        req.user
      );
      res.status(201).json({
        status: "success",
        message: "Đã mời cộng tác viên thành công",
        data: member,
      });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      await weddingService.removeMember(
        req.params.id,
        req.params.userId,
        req.user
      );
      res.status(200).json({
        status: "success",
        message: "Đã gỡ quyền cộng tác viên",
      });
    } catch (err) {
      next(err);
    }
  },

  async getFeatures(req, res, next) {
    try {
      const data = await weddingFeatureService.getFeatures(
        req.params.id,
        req.user
      );
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  },

  async updateFeatureSection(req, res, next) {
    try {
      const data = await weddingFeatureService.updateFeatureSection(
        req.params.id,
        req.params.section,
        req.body,
        req.user
      );
      res.status(200).json({
        status: "success",
        message: "Đã lưu cấu hình lên hệ thống",
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  async sendEmail(req, res, next) {
    try {
      const result = await weddingFeatureService.sendWeddingEmail(
        req.params.id,
        req.body,
        req.user
      );
      res.status(200).json({
        status: "success",
        message: `Đã gửi email thành công tới ${result.sentCount} địa chỉ`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async getPublicContactForm(req, res, next) {
    try {
      const data = await weddingFeatureService.getPublicContactForm(
        req.params.slug
      );
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  async submitPublicContactForm(req, res, next) {
    try {
      const data = await weddingFeatureService.submitPublicContactForm(
        req.params.slug,
        req.body
      );
      res.status(201).json({
        status: "success",
        message: "Đã gửi thông tin liên hệ thành công!",
        data,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default weddingController;
