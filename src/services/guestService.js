import prisma from "../config/db.js";
import guestRepository from "../repositories/guestRepository.js";
import { generateSecureGuestToken } from "../utils/tokenGenerator.js";
import AppError from "../utils/AppError.js";

const assertWeddingAccess = async (weddingId, user) => {
  if (user.role === "admin") return;

  const wedding = await prisma.weddings.findUnique({
    where: { id: weddingId },
    include: {
      wedding_members: {
        select: { user_id: true, member_role: true },
      },
    },
  });

  if (!wedding) {
    throw new AppError("Không tìm thấy thông tin đám cưới!", 404);
  }

  const isOwner = wedding.owner_id === user.id;
  const isMember = wedding.wedding_members.some((m) => m.user_id === user.id);

  if (!isOwner && !isMember) {
    throw new AppError(
      "Bạn không có quyền quản trị khách mời của đám cưới này!",
      403,
    );
  }
};

const guestService = {
  async createGuest(weddingId, guestData, user) {
    await assertWeddingAccess(weddingId, user);

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

  async getGuests(weddingId, queryParams, user) {
    await assertWeddingAccess(weddingId, user);

    return guestRepository.findAll({
      weddingId,
      groupId: queryParams.group_id,
      rsvpStatus: queryParams.rsvp_status,
      search: queryParams.search,
      page: queryParams.page,
      limit: queryParams.limit,
    });
  },

  async getGuestById(id, user) {
    const guest = await guestRepository.findById(id);
    if (!guest) {
      throw new AppError("Không tìm thấy khách mời!", 404);
    }

    await assertWeddingAccess(guest.wedding_id, user);
    return guest;
  },

  async updateGuest(id, updateData, user) {
    const guest = await guestRepository.findById(id);
    if (!guest) {
      throw new AppError("Không tìm thấy khách mời!", 404);
    }

    await assertWeddingAccess(guest.wedding_id, user);

    return guestRepository.update(id, updateData);
  },

  async deleteGuest(id, user) {
    const guest = await guestRepository.findById(id);
    if (!guest) {
      throw new AppError("Không tìm thấy khách mời!", 404);
    }

    await assertWeddingAccess(guest.wedding_id, user);

    await guestRepository.delete(id);
    return { id, message: "Xóa khách mời thành công." };
  },

  async getStats(weddingId, user) {
    await assertWeddingAccess(weddingId, user);
    return guestRepository.getStats(weddingId);
  },

  async getUserByToken(token) {
    if (!token) {
      throw new AppError("Mã thiệp mời không hợp lệ!", 400);
    }

    const guest = await guestRepository.findByInviteToken(token);
    if (!guest) {
      throw new AppError("Không tìm thấy thiệp mời tương ứng!", 404);
    }

    return guest;
  },

  async respondRsvp(token, rsvpData) {
    if (!token) {
      throw new AppError("Mã thiệp mời không hợp lệ!", 400);
    }

    const guest = await guestRepository.findByInviteToken(token);
    if (!guest) {
      throw new AppError("Không tìm thấy thiệp mời tương ứng!", 404);
    }

    const isAttending = rsvpData.rsvp_status === "attending";
    const attendingCount = isAttending ? rsvpData.attending_count || 1 : 0;

    if (isAttending && attendingCount > guest.max_companions + 1) {
      throw new AppError(
        `Số người tham dự (${attendingCount}) vượt quá giới hạn cho phép của thiệp (${guest.max_companions + 1} người)!`,
        400,
      );
    }

    const updated = await guestRepository.update(guest.id, {
      rsvp_status: rsvpData.rsvp_status,
      attending_count: attendingCount,
      dietary_note: rsvpData.dietary_note || null,
      wish_message: rsvpData.wish_message || null,
      responded_at: new Date(),
    });

    return updated;
  },
};

export default guestService;
