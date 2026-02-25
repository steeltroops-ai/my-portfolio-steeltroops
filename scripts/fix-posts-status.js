import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("--- Normalizing published status for all posts ---");

    // 1. Set NULL published to false (default)
    const result1 =
      await sql`UPDATE blog_posts SET published = false WHERE published IS NULL`;
    console.log(`Updated NULL posts to false.`);

    // 2. Log final counts
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN published = true THEN 1 END) as live,
        COUNT(CASE WHEN published = false THEN 1 END) as draft
      FROM blog_posts
    `;
    console.log("Final Stats:", stats[0]);
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

run();
