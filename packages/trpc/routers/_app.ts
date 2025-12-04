import { router } from "../trpc";
import { apiKeysAppRouter } from "./apiKeys";
import { mcpTagsRouter } from "./web/mcp-tags";
import { mcpAdsRouter } from "./web/mcp-ads";
import { mcpCategoriesRouter } from "./web/mcp-categories";
import { mcpRelatedAppsRouter } from "./web/mcp-related-apps";
import { mcpappRouter } from "./web/mcp-apps";
import { mcpAppSubmissionsRouter } from "./web/mcp-app-submissions";
import { mcpClaimsRouter } from "./web/mcp-app-claims";
import { mcpDashboardRouter } from "./web/mcp-dashboard";
import { mcpSuggestionsRouter } from "./web/mcp-suggestions";
import { mcpSearchRouter } from "./web/mcp-search";
import { mcpRecommendationsRouter } from "./web/mcp-recommendation";
import { paymentsRouter } from "./admin/payments";
import { dashboardRouter } from "./admin/dashboard";
import { adsRouter } from "./admin/ads";
import { claimsRouter } from "./admin/claims";
import { appsRouter } from "./admin/apps";
import { tagsRouter } from "./admin/tags";
import { rankingsRouter } from "./admin/rankings";
import { rankingRecordsRouter } from "./admin/ranking-records";
import { suggestionsRouter } from "./admin/suggestions";
import { recommendationsRouter } from "./admin/recommendations";
import { relatedAppsRouter } from "./admin/related-apps";
import { recommendationAppsRouter } from "./admin/recommendation-apps";
import { appAnalysisHistoryRouter } from "./admin/app-analysis-history";
import { appRssRouter } from "./admin/app-rss";
import { rssItemsRouter } from "./admin/rss-items";
import { appSubmissionsRouter } from "./admin/app-submissions";
import { emailSubscriptionsRouter } from "./admin/email-subscriptions";
import { invoicesRouter } from "./admin/invoices";
import { usersRouter } from "./admin/users";
import { categoriesRouter } from "./admin/categories";
import { mcpSubscriptionsRouter } from "./web/mcp-subscriptions";
import { mcpRankingsRouter } from "./web/mcp-rankings";
import { mcpSnapshotsRouter } from "./web/mcp-snapshots";
import { experiencesRouter } from "./web/experiences";

export const appRouter = router({
  apiKeys: apiKeysAppRouter,

  payments: paymentsRouter,
  dashboard: dashboardRouter,
  ads: adsRouter,
  claims: claimsRouter,
  apps: appsRouter,
  categories: categoriesRouter,
  tags: tagsRouter,
  suggestions: suggestionsRouter,
  recommendations: recommendationsRouter,
  recommendationApps: recommendationAppsRouter,
  relatedApps: relatedAppsRouter,
  invoices: invoicesRouter,
  appAnalysisHistory: appAnalysisHistoryRouter,
  emailSubscriptions: emailSubscriptionsRouter,
  appRss: appRssRouter,
  rssItems: rssItemsRouter,
  appSubmissions: appSubmissionsRouter,
  users: usersRouter,
  rankings: rankingsRouter,
  rankingRecords: rankingRecordsRouter,

  // web trpc routers
  mcpApps: mcpappRouter,
  mcpCategories: mcpCategoriesRouter,
  mcpAds: mcpAdsRouter,
  mcpRelatedApps: mcpRelatedAppsRouter,
  mcpRecommendations: mcpRecommendationsRouter,
  mcpSuggestions: mcpSuggestionsRouter,
  mcpSearch: mcpSearchRouter,
  mcpSubmit: mcpAppSubmissionsRouter,
  mcpClaims: mcpClaimsRouter,
  mcpDashboard: mcpDashboardRouter,
  mcpTags: mcpTagsRouter,
  mcpRankings: mcpRankingsRouter,
  mcpSubscriptions: mcpSubscriptionsRouter,
  mcpSnapshots: mcpSnapshotsRouter,
  experiences: experiencesRouter,
});

export type AppRouter = typeof appRouter;
