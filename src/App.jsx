// Portfolio components (Critical - Above the fold)
import Hero from "@/features/portfolio/components/Hero";

// Shared layout components (Critical)
import Navbar from "@/shared/components/layout/Navbar";
import ScrollspyNav from "@/shared/components/layout/ScrollspyNav";
import SEOHead from "@/shared/components/ui/SEOHead";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

// Lazy load non-critical sections below the fold
const About = lazy(() => import("@/features/portfolio/components/About"));
const Technologies = lazy(
  () => import("@/features/portfolio/components/Technologies")
);
const Experience = lazy(
  () => import("@/features/portfolio/components/Experience")
);
const Projects = lazy(() => import("@/features/portfolio/components/Projects"));
const Contact = lazy(() => import("@/features/portfolio/components/Contact"));
const Footer = lazy(() => import("@/shared/components/layout/Footer"));

// Intersection Observer wrapper for lazy loading sections
const LazySection = ({
  children,
  id,
  threshold = 0.01,
  rootMargin = "1000px",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Standard Intersection Observer
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

    // Force load if this section is targeted by navigation
    const handleNavStart = (e) => {
      if (e.detail?.targetId === id) {
        setIsVisible(true);
      }
    };

    window.addEventListener("portfolio-navigation-start", handleNavStart);

    return () => {
      observer.disconnect();
      window.removeEventListener("portfolio-navigation-start", handleNavStart);
    };
  }, [id, threshold, rootMargin]);

  return (
    <div
      ref={sectionRef}
      id={id}
      className="scroll-mt-20 w-full"
      style={{ minHeight: isVisible ? "auto" : "500px" }}
    >
      {isVisible ? children : <div className="h-[500px]" />}
    </div>
  );
};

const App = () => {
  return (
    <LazyMotion features={domAnimation}>
      <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
        {/* SEO Optimization */}
        <SEOHead type="website" />

        <div className="fixed top-0 w-full h-full -z-10">
          <div className="relative w-full h-full bg-black">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
          </div>
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <Navbar />
          <main id="main-content">
            <Hero />

            {/* Load below-fold sections only when scrolling near them */}
            {/* IDs are moved to the wrapper to ensure navigation work even if section is not yet loaded */}
            <LazySection id="about">
              <Suspense fallback={null}>
                <About />
              </Suspense>
            </LazySection>

            <LazySection id="technologies">
              <Suspense fallback={null}>
                <Technologies />
              </Suspense>
            </LazySection>

            <LazySection id="experience">
              <Suspense fallback={null}>
                <Experience />
              </Suspense>
            </LazySection>

            <LazySection id="projects">
              <Suspense fallback={null}>
                <Projects />
              </Suspense>
            </LazySection>

            <LazySection id="contact">
              <Suspense fallback={null}>
                <Contact />
              </Suspense>
            </LazySection>

            <Suspense fallback={null}>
              <Footer />
            </Suspense>
          </main>
          <ScrollspyNav />
        </div>
      </div>
    </LazyMotion>
  );
};

export default App;
