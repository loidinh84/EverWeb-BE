import prisma from "../config/db.js";

const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });
  },

  async create(data) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
      },
    });
  },

  async updatePassword(id, newPassword) {
    return prisma.user.update({
      where: { id },
      data: {
        password_hash: newPassword,
      },
    });
  },



};

export default userRepository;
