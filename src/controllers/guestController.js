import guestService from "../services/guestService.js";
import { createGuestSchema } from "../dtos/guestDto.js";

const guestController = {
  async createGuest(req, res, next) {
    try {
      const validatedData = createGuestSchema.parse(req.body);
      const { wedding_id, ...guestData } = validatedData;

      const newGuest = await guestService.createGuest(wedding_id, guestData);

      res.status(201).json({
        success: "success",
        message: "Tạo khách mời thành công.",
        data: newGuest,
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
};

export default guestController;
