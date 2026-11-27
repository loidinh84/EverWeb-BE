import prisma from "../config/db.js";
import weddingRepository from "../repositories/weddingRepository.js";
import AppError from "../utils/AppError.js";

async function assertWeddingAccess(weddingId, user) {
  if (!weddingId) {
    throw new AppError("Thiếu thông tin đám cưới (wedding_id).", 400);
  }
  const wedding = await weddingRepository.findById(weddingId);
  if (!wedding) {
    throw new AppError("Không tìm thấy hồ sơ đám cưới.", 404);
  }
  if (user?.role === "admin" || wedding.owner_id === user?.id) {
    return wedding;
  }
  const isMember = await weddingRepository.isMember(weddingId, user?.id);
  if (!isMember) {
    throw new AppError("Bạn không có quyền truy cập đám cưới này.", 403);
  }
  return wedding;
}

function serializeGift(row) {
  return {
    id: row.id,
    wedding_id: row.wedding_id,
    guest_id: row.guest_id,
    giver_name: row.giver_name,
    amount: Number(row.amount || 0),
    message: row.message || "",
    status: row.status,
    created_at: row.created_at,
  };
}

const giftService = {
  async listByWedding(weddingId, user) {
    await assertWeddingAccess(weddingId, user);
    const [gifts, accounts] = await Promise.all([
      prisma.gifts.findMany({
        where: { wedding_id: weddingId },
        orderBy: { created_at: "desc" },
      }),
      prisma.gift_accounts.findMany({
        where: { wedding_id: weddingId },
      }),
    ]);

    return {
      gifts: gifts.map(serializeGift),
      accounts,
    };
  },

  async createGift(payload, user) {
    const { wedding_id, guest_id = null, giver_name, amount, message = "", status = "confirmed" } = payload;
    await assertWeddingAccess(wedding_id, user);

    if (!giver_name || !String(giver_name).trim()) {
      throw new AppError("Vui lòng nhập tên người gửi quà mừng.", 400);
    }
    const numericAmount = Number(amount) || 0;
    if (numericAmount < 0) {
      throw new AppError("Số tiền mừng không hợp lệ.", 400);
    }

    const safeStatus = status === "pending" ? "pending" : "confirmed";

    const created = await prisma.gifts.create({
      data: {
        wedding_id,
        guest_id: guest_id || null,
        giver_name: String(giver_name).trim().slice(0, 255),
        amount: numericAmount,
        message: message ? String(message).trim() : null,
        status: safeStatus,
      },
    });

    return serializeGift(created);
  },

  async updateGift(id, payload, user) {
    const existing = await prisma.gifts.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Không tìm thấy khoản mừng cưới.", 404);
    }
    await assertWeddingAccess(existing.wedding_id, user);

    const data = {};
    if (payload.status !== undefined) {
      data.status = payload.status === "pending" ? "pending" : "confirmed";
    }
    if (payload.message !== undefined) {
      data.message = payload.message ? String(payload.message).trim() : null;
    }

    const updated = await prisma.gifts.update({ where: { id }, data });
    return serializeGift(updated);
  },

  async deleteGift(id, user) {
    const existing = await prisma.gifts.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Không tìm thấy khoản mừng cưới.", 404);
    }
    await assertWeddingAccess(existing.wedding_id, user);
    await prisma.gifts.delete({ where: { id } });
    return { id };
  },

  async upsertBankAccount(payload, user) {
    const {
      wedding_id,
      bank_code,
      account_number,
      account_name,
      is_enabled = true,
    } = payload;
    await assertWeddingAccess(wedding_id, user);

    if (!bank_code || !account_number || !account_name) {
      throw new AppError("Vui lòng nhập đầy đủ mã ngân hàng, số tài khoản và tên chủ tài khoản.", 400);
    }

    const cleanBank = String(bank_code).trim().toUpperCase().slice(0, 20);
    const cleanAcc = String(account_number).trim().slice(0, 30);
    const cleanName = String(account_name).trim().toUpperCase().slice(0, 255);
    const qrImage = `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png`;

    const existing = await prisma.gift_accounts.findFirst({
      where: { wedding_id },
    });

    if (existing) {
      return prisma.gift_accounts.update({
        where: { id: existing.id },
        data: {
          bank_code: cleanBank,
          account_number: cleanAcc,
          account_name: cleanName,
          qr_image: qrImage,
          is_enabled: Boolean(is_enabled),
        },
      });
    }

    return prisma.gift_accounts.create({
      data: {
        wedding_id,
        bank_code: cleanBank,
        account_number: cleanAcc,
        account_name: cleanName,
        qr_image: qrImage,
        is_enabled: Boolean(is_enabled),
      },
    });
  },
};

export default giftService;

