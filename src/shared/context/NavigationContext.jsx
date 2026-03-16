import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { scrollToElement, isGlobalNavigating } from '../utils/scrollHelper';
import { NAV_IDS } from '../../constants/navigation';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState("hero");
  const isAutomaticScrollRef = useRef(false);
  const timeoutRef = useRef(null);

  const updateActiveSection = useCallback((id) => {
    if (id && id !== activeSection) {
      setActiveSection(id);
    }
  }, [activeSection]);

  const handleNavClick = useCallback((sectionId) => {
    isAutomaticScrollRef.current = true;
    updateActiveSection(sectionId);

    scrollToElement(sectionId, {
      offset: 80,
      onComplete: () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          isAutomaticScrollRef.current = false;
        }, 150);
      },
    });

    // Side effects (Contact trigger)
    if (sectionId === "contact") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("contact-autofill-trigger"));
      }, 1500);
    }
  }, [updateActiveSection]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -25% 0px", // Focus on center 50%
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      if (isGlobalNavigating() || isAutomaticScrollRef.current) return;

      // Bottom-of-page check (high priority for contact)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
      if (atBottom) {
        updateActiveSection("contact");
        return;
      }

      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        // Sort by top position to find the one we are actually looking at
        const topmost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        updateActiveSection(topmost.target.id);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const observe = () => {
      NAV_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    };

    observe();

    // Re-observe on DOM changes (important for lazy loading)
    const mutations = new MutationObserver(observe);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [updateActiveSection]);

  return (
    <NavigationContext.Provider value={{ activeSection, handleNavClick }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
