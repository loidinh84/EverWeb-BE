import prisma from "../config/db.js";
import weddingRepository from "../repositories/weddingRepository.js";
import AppError from "../utils/AppError.js";

const buildSlug = (text = "") =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const assertOwnership = (wedding, user) => {
  if (user?.role === "admin") return;
  if (wedding.owner_id !== user?.id) {
    throw new AppError("Bạn không có quyền truy cập hồ sơ đám cưới này", 403);
  }
};

const normalizeWriteData = (payload = {}) => {
  const data = {};

  if (payload.title !== undefined) data.title = String(payload.title).trim();
  if (payload.bride_name !== undefined) {
    data.bride_name = payload.bride_name ? String(payload.bride_name).trim() : null;
  }
  if (payload.groom_name !== undefined) {
    data.groom_name = payload.groom_name ? String(payload.groom_name).trim() : null;
  }
  if (payload.venue_name !== undefined) {
    data.venue_name = payload.venue_name ? String(payload.venue_name).trim() : null;
  }
  if (payload.venue_address !== undefined) {
    data.venue_address = payload.venue_address
      ? String(payload.venue_address).trim()
      : null;
  }
  if (payload.wedding_date !== undefined) {
    data.wedding_date = payload.wedding_date
      ? new Date(payload.wedding_date)
      : null;
  }
  if (payload.total_budget !== undefined) {
    data.total_budget = Number(payload.total_budget) || 0;
  }
  if (payload.status !== undefined) {
    const rawStatus = String(payload.status).trim().toLowerCase();
    data.status = rawStatus === "planning" || !rawStatus ? "draft" : rawStatus;
  }
  if (payload.slug !== undefined && payload.slug) {
    data.slug = buildSlug(payload.slug);
  }

  return data;
};

const weddingService = {
  async createWedding(payload, user) {
    const data = normalizeWriteData(payload);

    if (!data.title) {
      if (data.groom_name && data.bride_name) {
        data.title = `${data.groom_name} & ${data.bride_name}`;
      } else {
        throw new AppError("Vui lòng nhập tên hồ sơ đám cưới", 400);
      }
    }

    if (!data.slug) {
      const base = buildSlug(data.title) || "dam-cuoi";
      data.slug = `${base}-${Date.now().toString(36).slice(-4)}`;
    } else {
      const existing = await weddingRepository.findBySlug(data.slug);
      if (existing) {
        data.slug = `${data.slug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    data.owner_id = user.id;
    return weddingRepository.create(data);
  },

  async getWeddings(query, user) {
    const ownerId = user?.role === "admin" ? query.ownerId : user.id;
    return weddingRepository.findAll({
      ownerId,
      status: query.status,
      search: query.search,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: query.page,
      limit: query.limit,
    });
  },

  async getWeddingById(id, user) {
    const wedding = await weddingRepository.findByIdOrThrow(id);
    assertOwnership(wedding, user);
    return wedding;
  },

  async updateWedding(id, payload, user) {
    const existing = await weddingRepository.findByIdOrThrow(id);
    assertOwnership(existing, user);

    const data = normalizeWriteData(payload);
    if (Object.keys(data).length === 0) {
      throw new AppError("Cần ít nhất một trường để cập nhật", 400);
    }

    if (data.slug && data.slug !== existing.slug) {
      const conflict = await weddingRepository.findBySlug(data.slug);
      if (conflict && conflict.id !== id) {
        throw new AppError("Slug này đã được sử dụng", 409);
      }
    }

    return weddingRepository.updateById(id, data);
  },

  async deleteWedding(id, user) {
    const existing = await weddingRepository.findByIdOrThrow(id);
    assertOwnership(existing, user);
    return weddingRepository.deleteById(id);
  },

  async getMembers(weddingId, user) {
    const wedding = await weddingRepository.findByIdOrThrow(weddingId);
    assertOwnership(wedding, user);

    const [owner, members] = await Promise.all([
      prisma.user.findUnique({
        where: { id: wedding.owner_id },
        select: { id: true, email: true, full_name: true },
      }),
      prisma.wedding_members.findMany({
        where: { wedding_id: weddingId },
        include: {
          users: { select: { id: true, email: true, full_name: true } },
        },
      }),
    ]);

    return {
      owner,
      collaborators: members.map((m) => ({
        userId: m.user_id,
        email: m.users.email,
        fullName: m.users.full_name,
        role: m.member_role,
      })),
    };
  },

  async addMember(weddingId, { email, role = "editor" }, user) {
    const wedding = await weddingRepository.findByIdOrThrow(weddingId);
    assertOwnership(wedding, user);

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError("Vui lòng nhập email cộng tác viên", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, full_name: true },
    });

    if (!targetUser) {
      throw new AppError(
        "Không tìm thấy tài khoản với email này. Người được mời cần đăng ký EverWed trước.",
        404
      );
    }

    if (targetUser.id === wedding.owner_id) {
      throw new AppError("Email này đã là chủ sở hữu sự kiện", 400);
    }

    const existingMember = await prisma.wedding_members.findUnique({
      where: {
        wedding_id_user_id: {
          wedding_id: weddingId,
          user_id: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new AppError("Người này đã là cộng tác viên của sự kiện", 409);
    }

    const memberRole = role === "viewer" ? "viewer" : "editor";
    const created = await prisma.wedding_members.create({
      data: {
        wedding_id: weddingId,
        user_id: targetUser.id,
        member_role: memberRole,
      },
    });

    return {
      userId: created.user_id,
      email: targetUser.email,
      fullName: targetUser.full_name,
      role: created.member_role,
    };
  },

  async removeMember(weddingId, memberUserId, user) {
    const wedding = await weddingRepository.findByIdOrThrow(weddingId);
    assertOwnership(wedding, user);

    await prisma.wedding_members.delete({
      where: {
        wedding_id_user_id: {
          wedding_id: weddingId,
          user_id: memberUserId,
        },
      },
    });
  },
};

export default weddingService;
