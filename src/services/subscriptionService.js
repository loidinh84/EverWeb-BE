import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";

const BILLING_CYCLES = {
  event: { id: "event", label: "Theo 1 Sự kiện", multiplier: 1, durationDays: 180 },
  lifetime: {
    id: "lifetime",
    label: "Lưu trữ Vĩnh viễn",
    multiplier: 1.45,
    durationDays: null,
  },
};

const PLANS = {
  free: { id: "free", name: "Cơ Bản", basePrice: 0 },
  pro: { id: "pro", name: "Pro — Mùa Cưới", basePrice: 499000 },
  vip: { id: "vip", name: "VIP — Trọn Gói", basePrice: 999000 },
};

const PROMO_CODES = {
  MUACUOI25: { code: "MUACUOI25", discountPercent: 25, label: "Ưu đãi mùa cưới (-25%)" },
  EVERWEB10: { code: "EVERWEB10", discountPercent: 10, label: "Mã bạn bè (-10%)" },
};

function computePricing(planId, cycleId, promoCode) {
  const plan = PLANS[planId];
  if (!plan) {
    throw new AppError("Gói dịch vụ không hợp lệ.", 400);
  }
  const cycle = BILLING_CYCLES[cycleId] || BILLING_CYCLES.event;
  const originalAmount =
    plan.basePrice === 0
      ? 0
      : Math.round((plan.basePrice * cycle.multiplier) / 1000) * 1000;

  let appliedPromo = null;
  if (promoCode && String(promoCode).trim()) {
    const normalized = String(promoCode).trim().toUpperCase();
    appliedPromo = PROMO_CODES[normalized] || null;
    if (!appliedPromo) {
      throw new AppError(`Mã ưu đãi "${normalized}" không hợp lệ.`, 400);
    }
  }

  const discountPercent = appliedPromo ? appliedPromo.discountPercent : 0;
  const finalAmount =
    originalAmount === 0
      ? 0
      : Math.round((originalAmount * (1 - discountPercent / 100)) / 1000) * 1000;

  return {
    plan,
    cycle,
    appliedPromo,
    discountPercent,
    originalAmount,
    finalAmount,
  };
}

function buildVietQrUrl(finalAmount, transferNote) {
  return `https://img.vietqr.io/image/VCB-1028472918-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(
    transferNote
  )}&accountName=${encodeURIComponent("EVERWEB VIETNAM")}`;
}

function serializeOrder(order) {
  return {
    id: order.id,
    order_code: order.order_code,
    plan_id: order.plan_id,
    cycle_id: order.cycle_id,
    promo_code: order.promo_code,
    discount_percent: order.discount_percent,
    original_amount: Number(order.original_amount),
    final_amount: Number(order.final_amount),
    payment_method: order.payment_method,
    transfer_note: order.transfer_note,
    status: order.status,
    paid_at: order.paid_at,
    created_at: order.created_at,
    qr_url: buildVietQrUrl(Number(order.final_amount), order.transfer_note),
  };
}

function serializeSubscription(sub) {
  if (!sub) {
    return {
      planId: "free",
      planName: PLANS.free.name,
      cycleId: "event",
      status: "active",
      expiresAt: null,
    };
  }
  const plan = PLANS[sub.plan_id] || PLANS.free;
  return {
    id: sub.id,
    planId: sub.plan_id,
    planName: plan.name,
    cycleId: sub.cycle_id,
    weddingId: sub.wedding_id,
    status: sub.status,
    startedAt: sub.started_at,
    expiresAt: sub.expires_at,
    updatedAt: sub.updated_at,
  };
}

const subscriptionService = {
  getPublicPlans() {
    return {
      plans: Object.values(PLANS),
      cycles: Object.values(BILLING_CYCLES),
      defaultPromo: PROMO_CODES.MUACUOI25,
    };
  },

  async getMySubscription(userId) {
    const [subscription, orders] = await Promise.all([
      prisma.subscriptions.findUnique({ where: { user_id: userId } }),
      prisma.subscription_orders.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 10,
      }),
    ]);

    return {
      subscription: serializeSubscription(subscription),
      orders: orders.map(serializeOrder),
    };
  },

  async activateFreePlan(userId, { cycleId = "event", weddingId = null } = {}) {
    const existing = await prisma.subscriptions.findUnique({
      where: { user_id: userId },
    });

    if (existing && existing.plan_id !== "free" && existing.status === "active") {
      return serializeSubscription(existing);
    }

    const sub = await prisma.subscriptions.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        wedding_id: weddingId || null,
        plan_id: "free",
        cycle_id: BILLING_CYCLES[cycleId] ? cycleId : "event",
        status: "active",
        expires_at: null,
      },
      update: {
        wedding_id: weddingId || existing?.wedding_id || null,
        plan_id: "free",
        status: "active",
      },
    });

    return serializeSubscription(sub);
  },

  async createOrder(userId, { planId, cycleId = "event", promoCode, weddingId = null }) {
    if (!planId || planId === "free") {
      throw new AppError("Vui lòng chọn gói Pro hoặc VIP để tạo đơn nâng cấp.", 400);
    }

    const pricing = computePricing(planId, cycleId, promoCode);
    const shortCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderCode = `EW-${shortCode}`;
    const transferNote = `EVERWEB ${pricing.plan.id.toUpperCase()} ${shortCode}`;

    const order = await prisma.subscription_orders.create({
      data: {
        order_code: orderCode,
        user_id: userId,
        wedding_id: weddingId || null,
        plan_id: pricing.plan.id,
        cycle_id: pricing.cycle.id,
        promo_code: pricing.appliedPromo?.code || null,
        discount_percent: pricing.discountPercent,
        original_amount: pricing.originalAmount,
        final_amount: pricing.finalAmount,
        payment_method: "vietqr",
        transfer_note: transferNote,
        status: "pending",
      },
    });

    return serializeOrder(order);
  },

  async confirmOrderPayment(userId, orderId) {
    const order = await prisma.subscription_orders.findUnique({
      where: { id: orderId },
    });

    if (!order || order.user_id !== userId) {
      throw new AppError("Không tìm thấy đơn hàng hợp lệ.", 404);
    }

    const cycle = BILLING_CYCLES[order.cycle_id] || BILLING_CYCLES.event;
    const expiresAt = cycle.durationDays
      ? new Date(Date.now() + cycle.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder =
        order.status === "paid"
          ? order
          : await tx.subscription_orders.update({
              where: { id: order.id },
              data: {
                status: "paid",
                paid_at: new Date(),
              },
            });

      const subscription = await tx.subscriptions.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          wedding_id: order.wedding_id || null,
          plan_id: order.plan_id,
          cycle_id: order.cycle_id,
          status: "active",
          started_at: new Date(),
          expires_at: expiresAt,
        },
        update: {
          wedding_id: order.wedding_id || undefined,
          plan_id: order.plan_id,
          cycle_id: order.cycle_id,
          status: "active",
          started_at: new Date(),
          expires_at: expiresAt,
        },
      });

      return { updatedOrder, subscription };
    });

    return {
      order: serializeOrder(result.updatedOrder),
      subscription: serializeSubscription(result.subscription),
    };
  },
};

export default subscriptionService;

