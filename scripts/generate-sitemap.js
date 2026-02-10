import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = neon(process.env.DATABASE_URL);
const SITE_URL = "https://steeltroops.vercel.app";

async function generateSitemap() {
  console.log("🚀 Generating sitemap...");

  try {
    // 1. Fetch all published blog posts
    const posts = await sql`
      SELECT slug, updated_at 
      FROM blog_posts 
      WHERE published = true 
      ORDER BY updated_at DESC
    `;

    console.log(`📝 Found ${posts.length} published posts.`);

    // 2. Define static routes
    const staticRoutes = [
      { url: "/", priority: "1.0", changefreq: "monthly" },
      { url: "/blogs", priority: "0.8", changefreq: "weekly" },
    ];

    // 3. Build XML content
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static routes
    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${route.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic blog posts
    posts.forEach((post) => {
      const lastMod = new Date(post.updated_at).toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/blogs/${post.slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    // 4. Write to public folder
    const publicPath = path.join(__dirname, "..", "public", "sitemap.xml");
    fs.writeFileSync(publicPath, xml);

    console.log(`✅ Sitemap successfully saved to ${publicPath}`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error.message);
    process.exit(1);
  }
}

generateSitemap();
