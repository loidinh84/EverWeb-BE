import prisma from "../config/db.js";

const guestRepository = {
  async findById(id) {
    return prisma.guests.findUnique({
      where: { id },
      include: {
        guest_groups: {
          select: {
            id: true,
            name: true,
            side: true,
          },
        },
      },
    });
  },

  async findByInviteToken(token) {
    return prisma.guests.findUnique({
      where: { invite_token: token },
      include: {
        weddings: {
          select: {
            id: true,
            title: true,
            wedding_date: true,
            venue_name: true,
            venue_address: true,
          },
        },
        guest_groups: {
          select: {
            id: true,
            name: true,
            side: true,
          },
        },
      },
    });
  },

  async create(data) {
    return prisma.guests.create({
      data,
      include: {
        guest_groups: {
          select: {
            id: true,
            name: true,
            side: true,
          },
        },
      },
    });
  },

  async findAll({
    weddingId,
    groupId,
    rsvpStatus,
    search,
    page = 1,
    limit = 20,
    orderBy = { full_name: "asc" },
  } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      wedding_id: weddingId,
    };

    if (groupId) {
      where.group_id = groupId;
    }

    if (rsvpStatus) {
      where.rsvp_status = rsvpStatus;
    }

    if (search?.trim()) {
      const keyword = search.trim();
      where.OR = [
        { full_name: { contains: keyword, mode: "insensitive" } },
        { phone: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.guests.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy,
        include: {
          guest_groups: {
            select: {
              id: true,
              name: true,
              side: true,
            },
          },
        },
      }),
      prisma.guests.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  },

  async update(id, data) {
    return prisma.guests.update({
      where: { id },
      data,
      include: {
        guest_groups: {
          select: {
            id: true,
            name: true,
            side: true,
          },
        },
      },
    });
  },

  async delete(id) {
    return prisma.guests.delete({
      where: { id },
    });
  },

  async getStats(weddingId) {
    const [total, attending, declined, pending, attendingAggregate] =
      await Promise.all([
        prisma.guests.count({ where: { wedding_id: weddingId } }),
        prisma.guests.count({
          where: { wedding_id: weddingId, rsvp_status: "attending" },
        }),
        prisma.guests.count({
          where: { wedding_id: weddingId, rsvp_status: "declined" },
        }),
        prisma.guests.count({
          where: { wedding_id: weddingId, rsvp_status: "pending" },
        }),
        prisma.guests.aggregate({
          where: { wedding_id: weddingId, rsvp_status: "attending" },
          _sum: { attending_count: true },
        }),
      ]);

    return {
      totalGuests: total,
      attendingGuests: attending,
      declinedGuests: declined,
      pendingGuests: pending,
      totalAttendeesCount: attendingAggregate._sum.attending_count || 0,
    };
  },
};

export default guestRepository;
