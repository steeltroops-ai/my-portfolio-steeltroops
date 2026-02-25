import { useState, useEffect, useRef } from "react";

/**
 * Intelligent Lazy Section Wrapper
 * Defers rendering of heavy components until they are near the viewport.
 * Adheres to Portfolio Performance Standard 2.3 & 7.
 */
export const LazySection = ({
  children,
  threshold = 0.1,
  rootMargin = "100px",
  placeholderHeight = "200px",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{ minHeight: !isVisible ? placeholderHeight : "auto" }}
    >
      {isVisible ? children : null}
    </div>
  );
};

export default LazySection;
