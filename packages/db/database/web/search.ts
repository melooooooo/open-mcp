import { jobListings, financeExperiences, scrapedJobs } from "@repo/db/schema";
import { or, like, desc } from "drizzle-orm";
import { db } from "../../index";

export const searchDataAccess = {
  searchAll: async (query: string) => {
    const searchPattern = `%${query}%`;

    console.time("searchAll");
    try {
      console.log("Search pattern:", searchPattern);

      console.time("jobListings");
      const jobs = await db
        .select()
        .from(jobListings)
        .where(
          or(
            like(jobListings.jobTitle, searchPattern),
            like(jobListings.companyName, searchPattern)
          )
        )
        .orderBy(desc(jobListings.sourceUpdatedAt))
        .limit(20);
      console.timeEnd("jobListings");

      console.time("financeExperiences");
      const experiences = await db
        .select()
        .from(financeExperiences)
        .where(
          or(
            like(financeExperiences.title, searchPattern),
            like(financeExperiences.organizationName, searchPattern)
          )
        )
        .orderBy(desc(financeExperiences.publishTime))
        .limit(20);
      console.timeEnd("financeExperiences");

      console.time("scrapedJobs");
      const referrals = await db
        .select()
        .from(scrapedJobs)
        .where(
          or(
            like(scrapedJobs.title, searchPattern),
            like(scrapedJobs.companyName, searchPattern)
          )
        )
        .orderBy(desc(scrapedJobs.publishDate))
        .limit(20);
      console.timeEnd("scrapedJobs");

      // Convert to plain objects and ensure serializability
      console.time("mapping");
      const result = {
        jobListings: jobs.map(job => ({
          id: job.id,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          workLocation: job.workLocation,
          deadline: job.deadline,
          companyType: job.companyType,
          industryCategory: job.industryCategory,
          sourceUpdatedAt: job.sourceUpdatedAt,
        })),
        experiences: experiences.map(exp => ({
          id: exp.id,
          slug: exp.slug,
          title: exp.title,
          authorName: exp.authorName,
          organizationName: exp.organizationName,
          jobTitle: exp.jobTitle,
          tags: exp.tags || [],
          viewCount: exp.viewCount || 0,
          likeCount: exp.likeCount || 0,
          publishTime: exp.publishTime?.toISOString() || null,
          summary: exp.summary,
        })),
        jobSites: referrals.map(referral => ({
          id: referral.id,
          title: referral.title,
          description: referral.jobType || referral.location || "",
          location: referral.location || "",
          companyName: referral.companyName || "",
          publishDate: referral.publishDate || "",
          replyCount: referral.replyCount || 0,
          source: referral.source || "",
        }))
      };
      console.timeEnd("mapping");
      console.timeEnd("searchAll");
      return result;
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }
};
