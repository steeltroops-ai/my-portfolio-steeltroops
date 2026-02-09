// Vercel API Route: /api/tags
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const posts = await sql`
      SELECT tags FROM blog_posts WHERE published = true AND tags IS NOT NULL
    `;

    const allTags = posts.flatMap(post => post.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();

    return res.status(200).json({ success: true, data: uniqueTags });
  } catch (error) {
    console.error('Tags API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
