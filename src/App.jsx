// Portfolio components (Critical)
import Hero from "@/features/portfolio/components/Hero";

// Shared layout components (Critical)
import Navbar from "@/shared/components/layout/Navbar";
import ScrollspyNav from "@/shared/components/layout/ScrollspyNav";
import SEOHead from "@/shared/components/ui/SEOHead";
import { lazy, Suspense } from "react";

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

// Minimal loading placeholder for sections
const SectionLoader = () => (
  <div className="py-20 flex justify-center items-center">
    <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
  </div>
);

const App = () => {
  return (
    <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
      {/* SEO Optimization */}
      <SEOHead
        title="Mayank Pratap Singh | Full Stack & ML Engineer"
        description="Full Stack Developer specializing in React, Node.js, Next.js, and AI/ML solutions. Building modern web applications, robotics systems, and machine learning solutions."
        type="website"
      />

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
          <Suspense fallback={<SectionLoader />}>
            <About />
            <Technologies />
            <Experience />
            <Projects />
            <Contact />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
      <ScrollspyNav />
    </div>
  );
};

export default App;
