import { HERO_CONTENT, PERSONAL, HIGHLIGHT_STATS, IMAGES } from "@/constants";
import { m } from "framer-motion";
import { scrollToElement } from "@/shared/utils/scrollHelper";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const imageVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
    },
  },
};

const Hero = () => {
  return (
    <section
      id="hero"
      className="pb-8 sm:pb-12 lg:pb-4 border-b border-neutral-800 lg:mb-3 scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl lg:py-16">
        <div className="flex flex-wrap items-center lg:items-start">
          <m.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full lg:w-1/2 lg:pr-8"
          >
            <div className="flex flex-col items-center lg:items-start space-y-4 sm:space-y-5 lg:space-y-5">
              <m.h1
                variants={itemVariants}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-thin tracking-tight mt-4 sm:mt-8 lg:mt-0 leading-none text-center lg:text-left"
              >
                {PERSONAL.name}
              </m.h1>
              <m.div
                variants={itemVariants}
                className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-light tracking-tight leading-snug sm:leading-snug md:leading-snug lg:leading-snug text-center lg:text-left"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-slate-200 to-sky-300">
                  Full Stack, Robotics &<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>Machine Learning Engineer
                </span>
              </m.div>
              <m.div
                variants={itemVariants}
                className="space-y-4 w-full mx-auto lg:mx-0 px-4 sm:px-8 lg:px-0"
              >
                {HERO_CONTENT.map((paragraph, index) => (
                  <div key={index} className="flex gap-3 group/item">
                    <div className="mt-2 h-1 w-1 rounded-full bg-[var(--color-bullet-bg)] group-hover/item:bg-[var(--color-bullet-hover)] transition-colors shrink-0" />
                    <p className="text-[var(--text-description)] text-sm sm:text-base lg:text-base font-light leading-relaxed tracking-tight text-justify lg:text-left">
                      {paragraph}
                    </p>
                  </div>
                ))}
              </m.div>

              <div className="flex flex-col items-center lg:items-start gap-6 pt-6 sm:pt-8">
                {/* 3 Main Highlight Reels */}
                <m.div
                  variants={itemVariants}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6"
                >
                  {HIGHLIGHT_STATS.map((stat, i) => (
                    <m.div key={i} className="relative group cursor-default">
                      <div className="relative px-4 py-1.5 rounded-xl overflow-hidden transition-all duration-700 bg-white/[0.02] border border-white/10 ring-1 ring-white/5 flex flex-col items-center lg:items-start min-w-[95px] sm:min-w-[115px] group-hover:bg-purple-950/30 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        <span className="relative z-10 text-xl sm:text-2xl font-mono tracking-tighter text-purple-300 group-hover:text-white transition-colors duration-500">
                          {stat.value}
                        </span>
                        <span className="relative z-10 text-[8px] sm:text-[9px] text-white font-light tracking-[0.2em] uppercase leading-none transition-colors duration-500 group-hover:text-purple-100">
                          {stat.label}
                        </span>
                      </div>
                    </m.div>
                  ))}
                </m.div>

                {/* Hire Me Button - Centered Below */}
                <m.div
                  variants={itemVariants}
                  className="flex justify-center lg:justify-start w-full"
                >
                  <m.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      scrollToElement("contact", { offset: 80 });
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("contact-autofill-trigger")
                        );
                      }, 600);
                    }}
                    className="relative group cursor-pointer touch-manipulation"
                  >
                    <div className="relative px-10 py-1 sm:px-14 sm:py-1.5 rounded-2xl overflow-hidden transition-all duration-700 bg-white/[0.02] border border-purple-400/50 ring-1 ring-white/10 flex flex-col items-center min-w-[220px] sm:min-w-[260px] group-hover:bg-purple-500/20 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/5 via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                      <span className="relative z-10 text-xl sm:text-2xl font-mono tracking-widest text-purple-300 group-hover:text-white transition-colors duration-500">
                        Hire Me
                      </span>
                      <div className="relative z-10 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] text-white/50 font-light tracking-[0.3em] uppercase transition-colors duration-500 group-hover:text-purple-300">
                          Available
                        </span>
                      </div>
                    </div>
                  </m.div>
                </m.div>
              </div>
            </div>
          </m.div>
          <div className="w-full lg:w-1/2 lg:pl-8 mt-8 sm:mt-10 lg:mt-0">
            <div className="flex justify-center lg:justify-end lg:mt-[1.5rem]">
              <m.img
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                src={IMAGES.profile}
                srcSet={`${IMAGES.profileMobile} 480w, ${IMAGES.profile} 1024w`}
                sizes="(max-width: 640px) 280px, 600px"
                className="rounded-3xl w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-full h-auto"
                alt="Mayank Pratap Singh (@steeltroops) - Production Engineer"
                width={600}
                height={600}
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
