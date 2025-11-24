import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../../index";
import { account, user } from "../../schema";

/**
 * Fetch user by email.
 *
 * @param email - The user's email address.
 * @returns The user or null if not found.
 */
export async function getUserByEmail(email: string) {
  try {
    return await db.query.user.findFirst({
      where(fields, operators) {
        return operators.eq(fields.email, email);
      },
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw new Error("Could not fetch user by email");
  }
}

/**
 * Fetch user by ID.
 *
 * @param id - The user's ID.
 * @returns The user or null if not found.
 */
export async function getUserById(id: string) {
  try {
    return await db.query.user.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, id);
      },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw new Error("Could not fetch user by ID");
  }
}

/**
 * Verify the user's email.
 *
 * @param id - The user's ID.
 * @param email - The new email to set (optional).
 */
export async function verifyUserEmail(
  id: string,
  email?: string
): Promise<void> {
  console.info("[users.ts] [verifyUserEmail] 开始验证");
  const now = new Date();
  try {
    await db
      .update(user)
      .set({
        emailVerified: sql`now()`,
        email: email ? email : undefined,
      })
      .where(eq(user.id, id));
    console.info("[users.ts] [verifyUserEmail] 验证成功");
  } catch (error) {
    console.error("[users.ts] [verifyUserEmail] 验证失败", error);
    // throw new Error("Could not verify user email");
  }
}

/**
 * Create a new user.
 *
 * @param user - The user data.
 * @returns The newly created user or null if not created.
 */
export async function createUser(user: {
  email: string;
  password: string;
  name: string;
}) {
  const now = new Date();
  const [newUser] = await db
    .insert(user)
    .values({
      id: createId(),
      ...user,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning();
  return newUser ?? null;
}

export async function createUserByPhone(user: {
  phone: string;
  password: string;
  name: string;
}) {
  const now = new Date();
  const [newUser] = await db
    .insert(user)
    .values({
      id: createId(),
      name: user.name,
      password: user.password,
      phoneNumber: user.phone,
      email: `${createId()}@placeholder.com`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning();
  return newUser ?? null;
}

/**
 * Update user's password.
 *
 * @param email - The user's email address.
 * @param password - The new password.
 */
export async function updateUserPassword(
  email: string,
  password: string
): Promise<void> {
  await db
    .update(user)
    .set({ password })
    .where(eq(user.email, email))
    .execute();
}

/**
 * Check if a user exists by ID.
 *
 * @param userId - The user's ID.
 * @returns True if user exists, otherwise false.
 */
export async function userExists(userId: string): Promise<boolean> {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  return foundUser !== null;
}

/**
 * Delete user and associated account data.
 *
 * @param userId - The user's ID.
 */
export async function deleteUserWithData(userId: string): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(account).where(eq(account.userId, userId));
      await tx.delete(user).where(eq(user.id, userId));
    });
  } catch (error) {
    console.error("Error deleting user with data:", error);
    throw new Error("Could not delete user with data");
  }
}

/**
 * Fetch user by phone number.
 *
 * @param phone - The user's phone number.
 * @returns The user or null if not found.
 */
export async function getUserByPhone(phone: string) {
  try {
    return await db.query.user.findFirst({
      where(fields, operators) {
        return operators.eq(fields.phoneNumber, phone);
      },
    });
  } catch (error) {
    console.error("Error fetching user by phone:", error);
    throw new Error("Could not fetch user by phone");
  }
}