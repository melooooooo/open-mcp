import {
  adsDataAccess, appsDataAccess,
  appSubmissionData, claimsDataAccess, paymentsDataAccess,
  suggestionsDataAccess, usersDataAccess
} from "@repo/db/database/admin";
import { protectedProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const mcpDashboardRouter = router({
  // 获取用户信息
  getUserInfo: protectedProcedure.query(async ({ ctx }) => {
    const data = await usersDataAccess.getById(ctx.user.id);
    if (!data) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    return data;
  }),

  // 获取用户提交的应用
  getSubmittedApps: protectedProcedure.query(async ({ ctx }) => {
    console.warn("[getSubmittedApps] [ctx.id] authid ", ctx.user.id);
    const apps = await appSubmissionData.getSubmissionsByUserId(ctx.user.id);
    return apps;
  }),

  // 获取用户部署的服务
  getDeployedServices: protectedProcedure.query(async ({ ctx }) => {
    // const services = await deploymentData.getByUserId(ctx.id);
    // return services;
    return [];
  }),

  // 获取用户的广告
  getAds: protectedProcedure.query(async ({ ctx }) => {
    const ads = await adsDataAccess.getAdsByUserId(ctx.user.id);
    return ads;
  }),

  getAdStats: protectedProcedure.query(async ({ ctx }) => {
    const adStats = await adsDataAccess.getAdsByUserId(ctx.user.id);
    return adStats;
  }),

  // 获取用户的支付记录
  getPayments: protectedProcedure.query(async ({ ctx }) => {
    return await paymentsDataAccess.getPaymentsByUserId(ctx.user.id);
  }),

  // 获取用户的所有权申请
  getClaims: protectedProcedure.query(async ({ ctx }) => {
    return await claimsDataAccess.getClaimsByUserId(ctx.user.id);
  }),

  // 获取用户的建议
  getSuggestions: protectedProcedure.query(async ({ ctx }) => {
    return await suggestionsDataAccess.getSuggestionsByUserId(ctx.user.id);
  }),

  // 获取用户的统计信息
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // const [apps, services, claims, suggestions, ads] = await Promise.all([
    //   ctx.db.query.apps.findMany({
    //     where: (apps, { eq }) => eq(apps.userId, ctx.session.user.id),
    //   }),
    //   ctx.db.query.deployments.findMany({
    //     where: (deployments, { eq }) => eq(deployments.userId, ctx.session.user.id),
    //   }),
    //   ctx.db.query.claims.findMany({
    //     where: (claims, { eq }) => eq(claims.userId, ctx.session.user.id),
    //   }),
    //   ctx.db.query.suggestions.findMany({
    //     where: (suggestions, { eq }) => eq(suggestions.userId, ctx.session.user.id),
    //   }),
    //   ctx.db.query.ads.findMany({
    //     where: (ads, { eq }) => eq(ads.userId, ctx.session.user.id),
    //   }),
    // ]);
    // 用户提交的应用，而且被批准的
    const appsCount = await appsDataAccess.getSubmittedAppsCount(ctx.user.id);
    // 用户所有的提交，包括没有被批准通过的
    const submitionsCount = await appSubmissionData.getSubmittedAppsCount(ctx.user.id);
    const servicesCount = 0; //await deploymentDataAccess.getCountByUserId(ctx.id);
    const claimsCount = await claimsDataAccess.getClaimsCountByUserId(ctx.user.id);
    const suggestionsCount = await suggestionsDataAccess.getSuggestionsCountByUserId(ctx.user.id);
    const adsCount = await adsDataAccess.getAdsCountByUserId(ctx.user.id);
    return {
      apps: appsCount,
      submitions: submitionsCount,
      services: servicesCount,
      claims: claimsCount,
      suggestions: suggestionsCount,
      ads: adsCount,
    };
  }),
}); 

