import { randomBytes } from "crypto";
import { db } from "../server/db";
import { membershipApplications, users } from "../shared/schema";
import { eq, isNull, and, or } from "drizzle-orm";

function unguessablePasswordHash(): string {
  const hash = randomBytes(64).toString("hex");
  const salt = randomBytes(16).toString("hex");
  return `${hash}.${salt}`;
}

async function main() {
  const approved = await db
    .select()
    .from(membershipApplications)
    .where(eq(membershipApplications.status, "approved"));

  const existingUsers = await db.select().from(users);
  const linkedAppIds = new Set(
    existingUsers
      .map((u) => u.memberApplicationId)
      .filter((id): id is string => Boolean(id))
  );
  const existingUsernames = new Set(
    existingUsers.map((u) => u.username.toLowerCase())
  );

  const missing = approved.filter((a) => !linkedAppIds.has(a.id));

  console.log(`Approved applications: ${approved.length}`);
  console.log(`Already linked to a user: ${approved.length - missing.length}`);
  console.log(`Missing user accounts: ${missing.length}`);

  if (missing.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const app of missing) {
    const baseUsername = (app.email || "").trim().toLowerCase();
    if (!baseUsername) {
      console.log(`  SKIP application ${app.id}: no email`);
      skipped++;
      continue;
    }

    let username = baseUsername;
    let suffix = 1;
    while (existingUsernames.has(username)) {
      suffix++;
      username = `${baseUsername}+${suffix}`;
    }

    await db.insert(users).values({
      username,
      password: unguessablePasswordHash(),
      isAdmin: false,
      isBoardMember: app.isBoardMember ?? false,
      isActive: true,
      memberApplicationId: app.id,
    });
    existingUsernames.add(username);
    created++;
    console.log(`  CREATE ${username}  (board=${app.isBoardMember ?? false})`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
