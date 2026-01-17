// Shared components exports

// Layout
export { default as Navbar } from './components/layout/Navbar';
export { default as Footer } from './components/layout/Footer';
export { default as MobileNav } from './components/layout/MobileNav';
export { default as ScrollspyNav } from './components/layout/ScrollspyNav';

// UI
export { default as SEOHead } from './components/ui/SEOHead';
export { default as SocialLinks } from './components/ui/SocialLinks';
export { default as SocialShare, InlineSocialShare } from './components/ui/SocialShare';
export { default as FloatingChatButton } from './components/ui/FloatingChatButton';

// Feedback
export { default as ErrorBoundary } from './components/feedback/ErrorBoundary';
export { default as NotFound } from './components/feedback/NotFound';
export { default as ReadingProgress, BlogReadingProgress, useReadingProgress } from './components/feedback/ReadingProgress';

// Media
export { default as OptimizedImage, BlogImage } from './components/media/OptimizedImage';
export { default as ImageUpload } from './components/media/ImageUpload';
export { default as MarkdownEditor } from './components/media/MarkdownEditor';

// Hooks
export * from './hooks/useContactQueries';

// Services
export * from './services/NeonContactService';
export * from './services/StorageService';
