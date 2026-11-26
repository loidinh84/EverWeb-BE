import subscriptionService from "../services/subscriptionService.js";

const subscriptionController = {
  getPublicPlans(req, res, next) {
    try {
      const data = subscriptionService.getPublicPlans();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  },

  async getMySubscription(req, res, next) {
    try {
      const data = await subscriptionService.getMySubscription(req.user.id);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  },

  async activateFreePlan(req, res, next) {
    try {
      const subscription = await subscriptionService.activateFreePlan(
        req.user.id,
        req.body || {}
      );
      res.status(200).json({
        status: "success",
        message: "Đã kích hoạt Gói Cơ Bản.",
        data: subscription,
      });
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req, res, next) {
    try {
      const order = await subscriptionService.createOrder(
        req.user.id,
        req.body || {}
      );
      res.status(201).json({
        status: "success",
        message: "Đã tạo đơn nâng cấp gói.",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  async confirmOrderPayment(req, res, next) {
    try {
      const data = await subscriptionService.confirmOrderPayment(
        req.user.id,
        req.params.id
      );
      res.status(200).json({
        status: "success",
        message: "Thanh toán & kích hoạt gói thành công!",
        data,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default subscriptionController;

