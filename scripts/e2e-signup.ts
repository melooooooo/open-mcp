
import "dotenv/config";
import { chromium } from "playwright";
import { db } from "@repo/db";
import { verification, user } from "@repo/db/schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  const timestamp = Date.now();
  const email = `e2e_single_${timestamp}@example.com`;
  const password = "Password123!";

  console.log(`🚀 Starting E2E Test for email: ${email}`);

  // Headless: false usually for debugging, but we use true for script unless debug
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Go to Signup Page
    console.log("Navigating to signup page...");
    await page.goto("http://localhost:30001/auth/sign-up");

    // 2. Fill Form
    console.log("Filling form...");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    // 3. Click Send OTP
    console.log("Clicking 'Get Verification Code'...");
    const sendButton = page.locator('button:has-text("获取验证码")');
    await sendButton.click();

    // 4. Wait for countdown
    console.log("Waiting for countdown...");
    await page.waitForTimeout(2000);

    // 5. Query DB for OTP
    console.log("Querying DB for OTP...");
    let code = "";
    for (let i = 0; i < 10; i++) {
      const records = await db
        .select()
        .from(verification)
        .where(eq(verification.identifier, email))
        .orderBy(desc(verification.createdAt))
        .limit(1);

      if (records.length > 0) {
        code = records[0].value;
        console.log(`Found OTP: ${code}`);
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!code) {
      throw new Error("OTP not found in DB after 10 seconds");
    }

    // 6. Enter OTP (into the InputOTP visible on page)
    console.log("Entering OTP...");
    // Shadcn InputOTP structure finding
    const firstSlot = page.locator('div[data-input-otp-slot]').first();
    await firstSlot.click();

    // Type digit by digit
    for (const char of code) {
      await page.keyboard.type(char, { delay: 150 });
    }

    // Wait for state to settle
    await page.waitForTimeout(1000);

    // 7. Click Register (Logic changed: Verification is part of Register button now)
    console.log("Clicking '立即注册'...");
    const registerButton = page.locator('button:has-text("立即注册")');
    await registerButton.click();

    // 8. Wait for Success/Redirect
    console.log("Waiting for navigation to home...");
    await page.waitForURL("http://localhost:30001/", { timeout: 15000 });

    console.log("✅ Verification Successful! Redirected to Home.");

    // Verify DB Status
    const u = await db.query.user.findFirst({
      where: eq(user.email, email)
    });
    if (u && u.emailVerified) {
      console.log("✅ DB Check: User created and emailVerified=true");
    } else {
      console.error("❌ DB Check Failed: User not found or not verified");
    }

  } catch (error) {
    console.error("❌ Test Failed:", error);
    await page.screenshot({ path: `error_single_${timestamp}.png` });
  } finally {
    await browser.close();
    process.exit(0);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
