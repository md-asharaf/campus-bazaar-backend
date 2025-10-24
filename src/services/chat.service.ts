import { Chat, ChatCreate, ChatCreateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class ChatService {
  async create(data: ChatCreate): Promise<Chat> {
    const validatedData = ChatCreateSchema.parse(data);
    return await db.chat.create({ data: validatedData });
  }

  async findById(id: string): Promise<Chat | null> {
    return await db.chat.findUnique({ where: { id } });
  }

  async findByUsers(user1_id: string, user2_id: string): Promise<Chat | null> {
    return await db.chat.findFirst({
      where: {
        OR: [
          { user1_id, user2_id },
          { user1_id: user2_id, user2_id: user1_id }
        ]
      },
      include: {
        user1: true,
        user2: true
      }
    });
  }

  async findByUserId(userId: string, options?: {
    page?: number;
    limit?: number;
    includeRelations?: boolean;
  }): Promise<{
    items: Chat[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, includeRelations = false } = options || {};

    // Build where clause
    const where = {
      OR: [
        { user1_id: userId },
        { user2_id: userId }
      ]
    };

    // Get total count
    const total = await db.chat.count({ where });

    // Get items
    const items = await db.chat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: includeRelations ? {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      } : undefined
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      totalPages,
      page,
      limit
    };
  }


  async findMany(params?: {
    user1_id?: string;
    user2_id?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeRelations?: boolean;
  }): Promise<{
    items: Chat[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    const {
      user1_id,
      user2_id,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      includeRelations = false
    } = params || {};

    // Build where clause
    const where: Prisma.ChatWhereInput = {};

    if (user1_id) where.user1_id = user1_id;
    if (user2_id) where.user2_id = user2_id;
    if (userId) {
      where.OR = [
        { user1_id: userId },
        { user2_id: userId }
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Get total count
    const total = await db.chat.count({ where });

    // Build query options
    const queryOptions: Prisma.ChatFindManyArgs = { where };

    // Pagination
    queryOptions.skip = (page - 1) * limit;
    queryOptions.take = limit;

    // Sorting
    const orderBy: Prisma.ChatOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.ChatOrderByWithRelationInput] = sortOrder;
    queryOptions.orderBy = orderBy;

    // Relations
    if (includeRelations) {
      queryOptions.include = {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      };
    }

    const items = await db.chat.findMany(queryOptions);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      totalPages,
      page,
      limit
    };
  }

  async delete(id: string): Promise<void> {
    await db.chat.delete({ where: { id } });
  }
}

export default new ChatService();