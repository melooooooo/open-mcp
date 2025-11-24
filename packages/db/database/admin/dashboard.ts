import { and, eq, sql } from "drizzle-orm";
import { db } from "../../index";
import { activities, ads, apps, claims, payments, suggestions, user } from "../../schema";

export const dashboardDataAccess = {
  getDashboardStats: async () => {
    const [
      usersCount,
      appsCount,
      adsCount,
      revenueResult
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user).execute(),
      db.select({ count: sql<number>`count(*)` }).from(apps).execute(),
      db.select({ count: sql<number>`count(*)` }).from(ads).where(eq(ads.status, "active")).execute(),
      db.select({ total: sql<number>`sum(amount)` }).from(payments).where(eq(payments.status, "completed")).execute()
    ]);

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [
      currentMonthUsers, lastMonthUsers,
      currentMonthApps, lastMonthApps,
      currentMonthAds, lastMonthAds,
      currentMonthRevenue, lastMonthRevenue
    ] = await Promise.all([
      // 用户增长
      db.select({ count: sql<number>`count(*)` })
        .from(user)
        .where(sql`created_at >= ${lastMonth.toISOString()}`)
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(user)
        .where(and(
          sql`created_at >= ${twoMonthsAgo.toISOString()}`,
          sql`created_at < ${lastMonth.toISOString()}`
        ))
        .execute(),
      // 应用增长
      db.select({ count: sql<number>`count(*)` })
        .from(apps)
        .where(sql`created_at >= ${lastMonth.toISOString()}`)
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(apps)
        .where(and(
          sql`created_at >= ${twoMonthsAgo.toISOString()}`,
          sql`created_at < ${lastMonth.toISOString()}`
        ))
        .execute(),
      // 广告增长
      db.select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(and(
          eq(ads.status, "active"),
          sql`created_at >= ${lastMonth.toISOString()}`
        ))
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(and(
          eq(ads.status, "active"),
          sql`created_at >= ${twoMonthsAgo.toISOString()}`,
          sql`created_at < ${lastMonth.toISOString()}`
        ))
        .execute(),
      // 收入增长
      db.select({ total: sql<number>`sum(amount)` })
        .from(payments)
        .where(and(
          eq(payments.status, "completed"),
          sql`created_at >= ${lastMonth.toISOString()}`
        ))
        .execute(),
      db.select({ total: sql<number>`sum(amount)` })
        .from(payments)
        .where(and(
          eq(payments.status, "completed"),
          sql`created_at >= ${twoMonthsAgo.toISOString()}`,
          sql`created_at < ${lastMonth.toISOString()}`
        ))
        .execute()
    ]);

    const calculateChange = (current: number, last: number) => {
      if (last === 0) return 0;
      return ((current - last) / last) * 100;
    };

    return {
      users: {
        total: usersCount[0]?.count || 0,
        change: calculateChange(
          currentMonthUsers[0]?.count || 0,
          lastMonthUsers[0]?.count || 0
        ),
        increasing: (currentMonthUsers[0]?.count || 0) > (lastMonthUsers[0]?.count || 0)
      },
      apps: {
        total: appsCount[0]?.count || 0,
        change: calculateChange(
          currentMonthApps[0]?.count || 0,
          lastMonthApps[0]?.count || 0
        ),
        increasing: (currentMonthApps[0]?.count || 0) > (lastMonthApps[0]?.count || 0)
      },
      ads: {
        total: adsCount[0]?.count || 0,
        change: calculateChange(
          currentMonthAds[0]?.count || 0,
          lastMonthAds[0]?.count || 0
        ),
        increasing: (currentMonthAds[0]?.count || 0) > (lastMonthAds[0]?.count || 0)
      },
      revenue: {
        total: revenueResult[0]?.total || 0,
        change: calculateChange(
          currentMonthRevenue[0]?.total || 0,
          lastMonthRevenue[0]?.total || 0
        ),
        increasing: (currentMonthRevenue[0]?.total || 0) > (lastMonthRevenue[0]?.total || 0)
      }
    };
  },
  getPendingItems: async () => {
    const [
      pendingApps,
      pendingClaims,
      pendingSuggestions,
      pendingAds,
      pendingPayments
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(apps)
        .where(eq(apps.status, "pending"))
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(claims)
        .where(eq(claims.status, "pending"))
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(suggestions)
        .where(eq(suggestions.status, "pending"))
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(eq(ads.status, "pending"))
        .execute(),
      db.select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(eq(payments.status, "pending"))
        .execute()
    ]);

    return {
      apps: pendingApps[0]?.count || 0,
      claims: pendingClaims[0]?.count || 0,
      suggestions: pendingSuggestions[0]?.count || 0,
      ads: pendingAds[0]?.count || 0,
      payments: pendingPayments[0]?.count || 0
    };
  },
  getRecentActivities: async () => {
    return await db.query.activities.findMany({
      with: {
        user: true
      },
      limit: 10,
      orderBy: (activities, { desc }) => [desc(activities.createdAt)]
    });
  }
}
