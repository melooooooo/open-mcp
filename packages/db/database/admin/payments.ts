import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "../../index";
import { user as users, payments, invoices } from "../../schema";
import { zCreatePaymentSchema, zUpdatePaymentSchema, zSearchPaymentsSchema, PaymentStatus } from "../../types";

// 支付数据访问模块
export const paymentsDataAccess = {
  // 创建支付
  create: async (data: typeof zCreatePaymentSchema._type) => {
    const [payment] = await db.insert(payments).values({
      userId: data.userId,
      type: data.type,
      relatedId: data.relatedId,
      amount: data.amount,
      currency: data.currency,
      method: data.method,
      status: data.status,
      transactionId: data.transactionId, cd ~/.codex/superpowers
    }).returning();
  if(!payment) throw new Error("Failed to create payment");
  return payment;
},

  // 更新支付
  update: async (id: string, data: typeof zUpdatePaymentSchema._type) => {
    const [payment] = await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    if (!payment) throw new Error("Failed to update payment");
    return payment;
  },

    // 获取支付
    getById: async (id: string) => {
      const [result] = await db
        .select({
          payment: payments,
          user: users,
          invoice: invoices,
        })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .leftJoin(invoices, eq(payments.id, invoices.paymentId))
        .where(eq(payments.id, id));
      return result;
    },

      // 搜索支付
      search: async (params: typeof zSearchPaymentsSchema._type) => {
        const { query, page = 1, limit = 10, field, order, status, userId, type, method } = params;
        const conditions = [];

        if (query) {
          conditions.push(or(like(payments.id, `%${query}%`), like(payments.transactionId, `%${query}%`), like(payments.invoiceNumber, `%${query}%`)));
        }

        if (status) {
          conditions.push(eq(payments.status, status));
        }

        if (userId) {
          conditions.push(eq(payments.userId, userId));
        }

        if (type) {
          conditions.push(eq(payments.type, type));
        }

        if (method) {
          conditions.push(eq(payments.method, method));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(payments)
          .where(whereClause);

        const total = countResult?.count ?? 0;

        const offset = (page - 1) * limit;

        const orderByClause = [];

        if (field && order) {
          switch (field) {
            case "id":
              orderByClause.push(order === "asc" ? asc(payments.id) : desc(payments.id));
              break;
            case "amount":
              orderByClause.push(order === "asc" ? asc(payments.amount) : desc(payments.amount));
              break;
            case "status":
              orderByClause.push(order === "asc" ? asc(payments.status) : desc(payments.status));
              break;
            case "createdAt":
              orderByClause.push(order === "asc" ? asc(payments.createdAt) : desc(payments.createdAt));
              break;
            case "updatedAt":
              orderByClause.push(order === "asc" ? asc(payments.updatedAt) : desc(payments.updatedAt));
              break;
          }
        }

        orderByClause.push(desc(payments.createdAt));

        const results = await db
          .select({
            payment: payments,
            user: users,
            invoice: invoices,
          })
          .from(payments)
          .leftJoin(users, eq(payments.userId, users.id))
          .leftJoin(invoices, eq(payments.id, invoices.paymentId))
          .where(whereClause)
          .orderBy(...orderByClause)
          .limit(limit)
          .offset(offset);

        return {
          data: results,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      },

        // 删除支付
        delete: async (id: string): Promise<void> => {
          await db.delete(payments).where(eq(payments.id, id));
        },

          updateStatus: async (id: string, status: PaymentStatus): Promise<void> => {
            await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.id, id));
          },

            getPaymentsByUserId: async (userId: string) => {
              return await db.query.payments.findMany({
                where: eq(payments.userId, userId),
              });
            },

              getPaymentsCountByUserId: async (userId: string) => {
                const [result] = await db
                  .select({ count: sql<number>`count(*)` })
                  .from(payments)
                  .where(eq(payments.userId, userId));
                return result?.count ?? 0;
              }
}; 
