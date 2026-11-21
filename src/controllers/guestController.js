import guestService from "../services/guestService.js";
import {
  createGuestSchema,
  updateGuestSchema,
  filterGuestQuerySchema,
  rsvpResponseSchema,
} from "../dtos/guestDto.js";
import AppError from "../utils/AppError.js";

const guestController = {
  async createGuest(req, res, next) {
    try {
      const validatedData = createGuestSchema.parse(req.body);
      const { wedding_id, ...guestData } = validatedData;

      const newGuest = await guestService.createGuest(
        wedding_id,
        guestData,
        req.user,
      );

      res.status(201).json({
        success: "success",
        message: "Tạo khách mời thành công.",
        data: newGuest,
      });
    } catch (err) {
      next(err);
    }
  },

  async getGuests(req, res, next) {
    try {
      const validatedQuery = filterGuestQuerySchema.parse(req.query);
      const result = await guestService.getGuests(
        validatedQuery.wedding_id,
        validatedQuery,
        req.user,
      );

      res.status(200).json({
        success: "success",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const { wedding_id } = req.query;
      if (!wedding_id) {
        throw new AppError("Thông tin đám cưới không hợp lệ", 400);
      }

      const stats = await guestService.getStats(wedding_id, req.user);

      res.status(200).json({
        success: "success",
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  },

  async getGuestById(req, res, next) {
    try {
      const { id } = req.params;
      const guest = await guestService.getGuestById(id, req.user);

      res.status(200).json({
        success: "success",
        data: guest,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateGuest(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateGuestSchema.parse(req.body);

      const updatedGuest = await guestService.updateGuest(
        id,
        validatedData,
        req.user,
      );

      res.status(200).json({
        success: "success",
        message: "Cập nhật thông tin khách mời thành công.",
        data: updatedGuest,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteGuest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await guestService.deleteGuest(id, req.user);

      res.status(200).json({
        success: "success",
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  async getGuestByToken(req, res, next) {
    try {
      const { token } = req.params;
      const guest = await guestService.getUserByToken(token);

      res.status(200).json({
        success: "success",
        data: { guest },
      });
    } catch (err) {
      next(err);
    }
  },

  async respondRsvp(req, res, next) {
    try {
      const { token } = req.params;
      const validatedData = rsvpResponseSchema.parse(req.body);

      const updatedGuest = await guestService.respondRsvp(token, validatedData);

      res.status(200).json({
        success: "success",
        message: "Xác nhận tham dự thành công! Cảm ơn bạn.",
        data: updatedGuest,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default guestController;
