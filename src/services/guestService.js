import guestRepository from "../repositories/guestRepository.js";

import { generateSecureGuestToken } from "../utils/tokenGenerator.js";
import AppError from "../utils/AppError.js";
import { empty } from "@prisma/client/runtime/library";

const guestService = {
  async createGuest(weddingId, guestData) {
    let invite_token;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      invite_token = generateSecureGuestToken();

      const existing = await guestRepository.findByInviteToken(invite_token);

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      throw new AppError("Không thể tạo mã mời, vui lòng thử lại!", 500);
    }

    const newGuest = await guestRepository.create({
      wedding_id: weddingId,
      full_name: guestData.full_name,
      phone: guestData.phone || null,
      email: guestData.email || null,
      group_id: guestData.group_id || null,
      max_companions: guestData.max_companions || 0,
      invite_token: invite_token,
      rsvp_status: "pending",
    });

    return newGuest;
  },

  async getUserByToken(token) {
    if (!token) {
      throw new AppError("Mã thiệp mời không hợp lệ!", 400);
    }

    const guest = await guestRepository.findByInviteToken(token);

    if (!guest) {
      throw new AppError("Không tìm thấy thiệp mời!", 404);
    }

    return guest;
  },
};

export default guestService;
