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
  const { offset = 80, duration = 1.4, behavior = "smooth" } = options;

  // Signal that we are navigating (can be used by lazy loaders)
  isNavigating = true;

  // Clear any existing timeout
  if (navigationTimeout) clearTimeout(navigationTimeout);

  window.dispatchEvent(
    new CustomEvent("portfolio-navigation-start", { detail: { targetId: id } })
  );

  const performScroll = () => {
    if (id === "hero" || id === "top") {
      window.scrollTo({ top: 0, behavior });
    } else {
      const element = document.getElementById(id);
      if (element) {
        // Calculate exact position
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        // Use native scroll - Lenis usually intercepts this if 'root' is true
        window.scrollTo({
          top: offsetPosition,
          behavior,
        });

        // SECOND PASS: Layout shifts from lazy-loaded content can move the target.
        // We do a "correction" pass after a short delay when the CSS transition is likely finished.
        setTimeout(() => {
          const correctedElement = document.getElementById(id);
          if (correctedElement) {
            const newPos =
              correctedElement.getBoundingClientRect().top +
              window.pageYOffset -
              offset;
            // Only correct if shift is significant
            if (Math.abs(window.scrollY - newPos) > 15) {
              window.scrollTo({ top: newPos, behavior });
            }
          }
        }, 800);

        // Final sanity check even later
        setTimeout(() => {
          const finalElement = document.getElementById(id);
          if (finalElement) {
            const finalPos =
              finalElement.getBoundingClientRect().top +
              window.pageYOffset -
              offset;
            if (Math.abs(window.scrollY - finalPos) > 10) {
              window.scrollTo({ top: finalPos, behavior: "auto" }); // Instant fix at the end
            }
          }
        }, 1500);
      } else {
        console.warn(`[ScrollHelper] Element with id "${id}" not found.`);
      }
    }

    // Reset navigation flag after a generous buffer
    navigationTimeout = setTimeout(
      () => {
        isNavigating = false;
        window.dispatchEvent(new CustomEvent("portfolio-navigation-end"));
        navigationTimeout = null;
      },
      duration * 1000 + 600
    );
  };

  // Give the browser a frame to handle any immediate state updates
  requestAnimationFrame(performScroll);
};

export const isGlobalNavigating = () => isNavigating;
