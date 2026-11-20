import prisma from "../config/db.js";

const guestRepository = {
  async findByInviteToken(token) {
    return prisma.guests.findUnique({
      where: { invite_token: token },
      include: {
        weddings: {
          select: {
            title: true,
            wedding_date: true,
            venue_name: true,
            venue_address: true,
          },
        },
        guest_groups: {
          select: {
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
    });
  },

  async findByWeddingId(weddingId) {
    return prisma.guests.findMany({
      where: { wedding_id: weddingId },
      orderBy: { full_name: "asc" },
    });
  },
};

export default guestRepository;