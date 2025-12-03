import { db } from "@repo/db";
import { jobListings, financeExperiences, cpJobSites } from "@repo/db/schema";
import { like } from "drizzle-orm";

async function testSearch() {
  try {
    console.log("Testing job_listings query...");
    const jobs = await db
      .select()
      .from(jobListings)
      .where(like(jobListings.companyName, "%交通银行%"))
      .limit(5);

    console.log("Jobs result:", JSON.stringify(jobs, null, 2));

    console.log("\nTesting finance_experiences query...");
    const experiences = await db
      .select()
      .from(financeExperiences)
      .where(like(financeExperiences.title, "%交通银行%"))
      .limit(5);

    console.log("Experiences result:", JSON.stringify(experiences, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

testSearch();
