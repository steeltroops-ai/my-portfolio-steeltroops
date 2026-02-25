import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    console.log("--- Checking blog_posts table ---");

    // Check columns
    const columns =
      await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'blog_posts'`;
    console.log("COLUMNS DETAILS:");
    columns.forEach((c) =>
      console.log(
        `- ${c.column_name}: ${c.data_type} (Nullable: ${c.is_nullable}, Default: ${c.column_default})`
      )
    );

    // Check post count and published status
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN published = true THEN 1 END) as live,
        COUNT(CASE WHEN published = false THEN 1 END) as draft,
        COUNT(CASE WHEN published IS NULL THEN 1 END) as null_published
      FROM blog_posts
    `;
    console.log("Stats:", stats[0]);

    // List all posts with their titles and published status
    const posts =
      await sql`SELECT id, title, slug, published FROM blog_posts ORDER BY created_at DESC`;
    console.log("\nRaw Post Statuses:");
    posts.forEach((p) => {
      console.log(`- Title: ${p.title}`);
      console.log(`  Slug: ${p.slug}`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Published: ${p.published}`);
    });
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

check();
