
import { db } from "@repo/db";
import { verification } from "@repo/db/schema";
import { eq, desc } from "drizzle-orm";

const email = process.argv[2];

if (!email) {
  console.error("Usage: tsx scripts/get-otp.ts <email>");
  process.exit(1);
}

async function main() {
  const records = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, email))
    .orderBy(desc(verification.createdAt))
    .limit(1);

  if (records.length === 0) {
    console.log("No OTP found");
  } else {
    console.log(records[0].value);
  }
  process.exit(0);
}

main();
