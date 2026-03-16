/**
 * Enhanced scroll utility to handle layout shifts and Lenis compatibility.
 */

// Global flag to track if we are in a programmatic scroll
let isNavigating = false;
let navigationTimeout = null;

/**
 * Robust scroll to an element by ID
 * @param {string} id - The target element ID
 * @param {object} options - Scroll options
 */
export const scrollToElement = (id, options = {}) => {
  const { offset = 80, duration = 1.2, behavior = "smooth", onComplete = null } = options;

  // Signal that we are navigating (can be used by lazy loaders)
  isNavigating = true;

  // Clear any existing timeout
  if (navigationTimeout) clearTimeout(navigationTimeout);

  window.dispatchEvent(
    new CustomEvent("portfolio-navigation-start", { detail: { targetId: id } })
  );

  const performScroll = () => {
    const cleanup = () => {
      navigationTimeout = setTimeout(
        () => {
          isNavigating = false;
          window.dispatchEvent(new CustomEvent("portfolio-navigation-end"));
          if (onComplete) onComplete();
          navigationTimeout = null;
        },
        duration * 1000 + 100
      );
    };

    if (id === "hero" || id === "top") {
      window.scrollTo({ top: 0, behavior });
      cleanup();
    } else {
      const element = document.getElementById(id);
      if (element) {
        // Calculate exact position
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        // Use native scroll - Lenis intercepts this if 'root' is true
        window.scrollTo({
          top: offsetPosition,
          behavior,
        });

        // Correction pass for lazy-loaded content shifts
        setTimeout(() => {
          const correctedElement = document.getElementById(id);
          if (correctedElement) {
            const rect = correctedElement.getBoundingClientRect();
            const currentTop = rect.top;
            
            if (Math.abs(currentTop - offset) > 40) {
              const finalPos = currentTop + window.pageYOffset - offset;
              window.scrollTo({ top: finalPos, behavior: "smooth" });
            }
          }
        }, duration * 1000 + 200);
        
        cleanup();
      } else {
        // Fallback cleanup if element is missing
        isNavigating = false;
        if (onComplete) onComplete();
      }
    }
  };

  // Immediate frame execution
  requestAnimationFrame(performScroll);
};

export const isGlobalNavigating = () => isNavigating;
