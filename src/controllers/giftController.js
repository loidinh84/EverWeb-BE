import giftService from "../services/giftService.js";

const giftController = {
  async listByWedding(req, res, next) {
    try {
      const data = await giftService.listByWedding(req.query.wedding_id, req.user);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  },

  async createGift(req, res, next) {
    try {
      const gift = await giftService.createGift(req.body || {}, req.user);
      res.status(201).json({
        status: "success",
        message: "Đã ghi nhận quà mừng cưới.",
        data: gift,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateGift(req, res, next) {
    try {
      const gift = await giftService.updateGift(
        req.params.id,
        req.body || {},
        req.user
      );
      res.status(200).json({ status: "success", data: gift });
    } catch (err) {
      next(err);
    }
  },

  async deleteGift(req, res, next) {
    try {
      const data = await giftService.deleteGift(req.params.id, req.user);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  },

  async upsertBankAccount(req, res, next) {
    try {
      const account = await giftService.upsertBankAccount(
        req.body || {},
        req.user
      );
      res.status(200).json({
        status: "success",
        message: "Đã lưu tài khoản nhận mừng cưới VietQR.",
        data: account,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default giftController;

