# Mayank's Portfolio with Supabase Blog System

A modern, responsive portfolio website built with React, Vite, and Tailwind CSS, featuring a complete blog management system powered by Supabase.

## 🚀 Features

### Portfolio Features
- **Modern Design**: Clean, professional design with dark theme
- **Responsive Layout**: Fully responsive across all devices
- **Interactive Animations**: Smooth animations using Framer Motion
- **Contact Form**: Functional contact form with validation
- **Social Links**: Links to social media profiles

### Blog System Features
- **Rich Text Editor**: Markdown editor with live preview and syntax highlighting
- **Image Upload**: Drag-and-drop image upload with automatic compression
- **SEO Optimized**: Meta tags, Open Graph, and structured data
- **Social Sharing**: Built-in social sharing buttons
- **Tag System**: Categorize posts with tags
- **Search & Filter**: Search posts and filter by tags
- **Pagination**: Efficient pagination for large numbers of posts
- **Draft System**: Save drafts and publish when ready
- **Admin Dashboard**: Complete admin interface for managing posts

### Technical Features
- **Supabase Backend**: PostgreSQL database with Row Level Security
- **Authentication**: Secure admin authentication
- **Error Handling**: Comprehensive error boundaries and loading states
- **Performance**: Optimized images and lazy loading
- **TypeScript Ready**: Easy to migrate to TypeScript

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Styling**: Tailwind CSS with custom animations
- **Rich Text**: React Quill, React Markdown
- **Icons**: React Icons (Feather, Font Awesome)
- **SEO**: React Helmet Async
- **Routing**: React Router DOM v7

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/steeltroops-ai/my-portfolio-steeltroops.git
   cd my-portfolio-steeltroops
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Admin Credentials (change these!)
   VITE_ADMIN_USERNAME=admin
   VITE_ADMIN_PASSWORD=your_secure_password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Supabase Setup

### Database Schema

The blog system uses the following database structure:

```sql
-- Blog posts table
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author VARCHAR(100) DEFAULT 'Mayank',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  featured_image_url TEXT,
  meta_description TEXT,
  read_time INTEGER DEFAULT 5
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Authenticated users can manage posts" ON blog_posts
  FOR ALL USING (auth.role() = 'authenticated');
```

### Storage Setup

Create a storage bucket for blog images:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Storage policies
CREATE POLICY "Public can view blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
```

## 🚀 Usage

### Admin Access

1. **Login to Admin Panel**
   - Navigate to `/admin/login`
   - Use the credentials from your `.env` file
   - Access the dashboard at `/admin/dashboard`

2. **Creating Blog Posts**
   - Click "New Post" in the admin dashboard
   - Use the rich text editor with markdown support
   - Upload featured images and inline images
   - Add tags for categorization
   - Save as draft or publish immediately

3. **Managing Posts**
   - View all posts in the admin dashboard
   - Edit existing posts
   - Toggle publish/unpublish status
   - Delete posts
   - Search and filter posts

### Blog Features

- **Public Blog**: Visit `/blog` to see all published posts
- **Individual Posts**: SEO-friendly URLs like `/blog/post-slug`
- **Search**: Search posts by title, content, or tags
- **Filtering**: Filter posts by tags
- **Social Sharing**: Share posts on social media
- **Responsive Design**: Optimized for all devices

## 📁 Project Structure

```
src/
├── components/
│   ├── Blog.jsx              # Blog listing page
│   ├── BlogPost.jsx          # Individual blog post
│   ├── BlogEditor.jsx        # Rich text editor for posts
│   ├── AdminDashboard.jsx    # Admin dashboard
│   ├── AdminLogin.jsx        # Admin login form
│   ├── MarkdownEditor.jsx    # Markdown editor component
│   ├── ImageUpload.jsx       # Image upload component
│   ├── SocialShare.jsx       # Social sharing buttons
│   ├── SEOHead.jsx           # SEO meta tags component
│   ├── ErrorBoundary.jsx     # Error boundary component
│   └── ...                   # Other portfolio components
├── services/
│   ├── SupabaseBlogService.js    # Blog CRUD operations
│   ├── SupabaseStorageService.js # Image upload service
│   └── SupabaseAuthService.js    # Authentication service
├── lib/
│   └── supabase.js           # Supabase client configuration
└── ...
```

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update CSS classes in components for different styling
- Add custom animations in Tailwind configuration

### Content
- Update personal information in portfolio components
- Modify social media links in navigation
- Customize the contact form and footer

### Blog Configuration
- Adjust pagination settings in `Blog.jsx`
- Modify the rich text editor toolbar in `MarkdownEditor.jsx`
- Update SEO defaults in `SEOHead.jsx`

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (with defaults)
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=admin123
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Netlify

1. **Connect your repository to Netlify**
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Add environment variables** in Netlify dashboard

### Other Platforms

The project builds to static files in the `dist` directory and can be deployed to any static hosting service.

## 🔒 Security

- **Row Level Security**: Supabase RLS policies protect data
- **Environment Variables**: Sensitive data stored in environment variables
- **Input Validation**: Form validation and sanitization
- **Error Handling**: Comprehensive error boundaries
- **Authentication**: Secure admin authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **React** and **Vite** for the development experience
- **Framer Motion** for smooth animations

## 📞 Support

If you have any questions or need help with setup, please:

1. Check the [Issues](https://github.com/steeltroops-ai/my-portfolio-steeltroops/issues) page
2. Create a new issue if your problem isn't already addressed
3. Contact me on [Twitter](https://twitter.com/steeltroops_ai) or [LinkedIn](https://linkedin.com/in/steeltroops-ai)

---

**Built with ❤️ by [Mayank](https://github.com/steeltroops-ai)**
```
