import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const assertValidUuid = (id, label = "ID đám cưới") => {
  if (!id || !UUID_REGEX.test(String(id))) {
    throw new AppError(`${label} không hợp lệ`, 400);
  }
};

const buildWhereClause = ({ ownerId, status, search, fromDate, toDate } = {}) => {
  const where = {};

  if (ownerId) {
    assertValidUuid(ownerId, "owner_id");
    where.owner_id = ownerId;
  }

  if (status) {
    where.status = status;
  }

  if (fromDate || toDate) {
    where.wedding_date = {};
    if (fromDate) where.wedding_date.gte = new Date(fromDate);
    if (toDate) where.wedding_date.lte = new Date(toDate);
  }

  if (search?.trim()) {
    const keyword = search.trim();
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { groom_name: { contains: keyword, mode: "insensitive" } },
      { bride_name: { contains: keyword, mode: "insensitive" } },
      { venue_name: { contains: keyword, mode: "insensitive" } },
    ];
  }

  return where;
};

/**
 * Tầng Repository đóng gói toàn bộ truy vấn Prisma cho bảng `weddings`.
 */
const weddingRepository = {
  /** Tạo mới một đám cưới */
  async create(data) {
    return prisma.weddings.create({ data });
  },

  /** Lấy danh sách đám cưới có lọc, tìm kiếm và phân trang */
  async findAll({
    ownerId,
    status,
    search,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    orderBy = { wedding_date: "asc" },
  } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const where = buildWhereClause({ ownerId, status, search, fromDate, toDate });

    const [items, total] = await Promise.all([
      prisma.weddings.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy,
        include: {
          _count: { select: { guests: true, tasks: true } },
        },
      }),
      prisma.weddings.count({ where }),
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

  /** Tìm đám cưới theo ID (trả về null nếu không có) */
  async findById(id) {
    assertValidUuid(id);
    return prisma.weddings.findUnique({
      where: { id },
      include: {
        invitations: true,
        _count: { select: { guests: true, tasks: true, expenses: true } },
      },
    });
  },

  /** Tìm đám cưới theo ID hoặc ném lỗi 404 */
  async findByIdOrThrow(id) {
    const wedding = await this.findById(id);
    if (!wedding) {
      throw new AppError("Không tìm thấy thông tin đám cưới", 404);
    }
    return wedding;
  },

  /** Tìm đám cưới theo slug (dùng cho trang công khai / thiệp mời) */
  async findBySlug(slug) {
    if (!slug?.trim()) return null;
    return prisma.weddings.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: { invitations: true },
    });
  },

  /** Cập nhật thông tin đám cưới theo ID */
  async updateById(id, data) {
    await this.findByIdOrThrow(id);
    return prisma.weddings.update({
      where: { id },
      data,
    });
  },

  /** Xoá đám cưới theo ID */
  async deleteById(id) {
    await this.findByIdOrThrow(id);
    return prisma.weddings.delete({
      where: { id },
    });
  },

  /** Đếm số lượng đám cưới */
  async count({ ownerId, status } = {}) {
    const where = buildWhereClause({ ownerId, status });
    return prisma.weddings.count({ where });
  },

  /** Thống kê tổng hợp phục vụ Dashboard quản trị */
  async getDashboardSummary({ ownerId } = {}) {
    const where = buildWhereClause({ ownerId });

    const [aggregate, statusGroups] = await Promise.all([
      prisma.weddings.aggregate({
        where,
        _count: { id: true },
        _sum: { total_budget: true },
      }),
      prisma.weddings.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
    ]);

    const countsByStatus = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count.id])
    );

    return {
      totalWeddings: aggregate._count.id || 0,
      totalBudget: Number(aggregate._sum.total_budget || 0),
      countsByStatus,
    };
  },
};

export default weddingRepository;
