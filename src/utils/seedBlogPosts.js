import { supabase } from '../lib/supabase.js';
import { initialBlogPosts } from '../data/initialBlogPosts.js';

export const seedBlogPosts = async () => {
  try {
    console.log('Starting to seed blog posts...');
    
    // Check if posts already exist
    const { data: existingPosts, error: checkError } = await supabase
      .from('blog_posts')
      .select('slug')
      .in('slug', initialBlogPosts.map(post => post.slug));
    
    if (checkError) {
      console.error('Error checking existing posts:', checkError);
      return { success: false, error: checkError };
    }
    
    const existingSlugs = existingPosts?.map(post => post.slug) || [];
    const newPosts = initialBlogPosts.filter(post => !existingSlugs.includes(post.slug));
    
    if (newPosts.length === 0) {
      console.log('All blog posts already exist in the database.');
      return { success: true, message: 'No new posts to add' };
    }
    
    console.log(`Adding ${newPosts.length} new blog posts...`);
    
    // Insert new posts
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(newPosts.map(post => ({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        tags: post.tags,
        featured_image_url: post.featured_image_url,
        meta_description: post.meta_description,
        published: post.published,
        author: post.author,
        read_time: Math.ceil(post.content.split(' ').length / 200) // Estimate reading time
      })))
      .select();
    
    if (error) {
      console.error('Error inserting blog posts:', error);
      return { success: false, error };
    }
    
    console.log(`Successfully added ${data.length} blog posts!`);
    return { success: true, data, count: data.length };
    
  } catch (error) {
    console.error('Unexpected error seeding blog posts:', error);
    return { success: false, error };
  }
};

// Function to run seeding from browser console
export const runSeedFromConsole = async () => {
  console.log('🌱 Seeding blog posts...');
  const result = await seedBlogPosts();
  
  if (result.success) {
    console.log('✅ Blog posts seeded successfully!');
    if (result.count) {
      console.log(`📝 Added ${result.count} new posts`);
    }
  } else {
    console.error('❌ Failed to seed blog posts:', result.error);
  }
  
  return result;
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.seedBlogPosts = runSeedFromConsole;
}
