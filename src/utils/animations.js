/**
 * Animation utilities for consistent motion across the app
 */

// Apple-style easing curves
export const appleEasing = {
  // Snappy entrance
  easeOut: [0, 0, 0.2, 1],
  // Smooth exit
  easeIn: [0.4, 0, 1, 1],
  // Natural movement
  easeInOut: [0.4, 0, 0.2, 1],
  // Bouncy effect
  spring: { type: "spring", stiffness: 300, damping: 30 },
  // Gentle spring
  gentleSpring: { type: "spring", stiffness: 100, damping: 20 },
};

// Viewport settings for scroll-triggered animations
export const viewportSettings = {
  once: true,
  margin: "-100px",
  amount: 0.3,
};

// Fade in animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: appleEasing.easeOut,
    },
  },
};

// Slide up animation variants
export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: appleEasing.easeOut,
    },
  },
};

// Stagger children animation
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Scale animation variants
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: appleEasing.easeOut,
    },
  },
};
