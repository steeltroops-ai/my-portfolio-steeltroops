import { EXPERIENCES } from "@/constants";
import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";

const ExperienceCard = ({ experience, index, isLast }) => {
  const cardRef = useRef(null);

  // Reading zone detection
  const isInView = useInView(cardRef, {
    margin: "-30% 0px -30% 0px",
    once: false,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[140px_auto_1fr] gap-x-4 lg:gap-x-12 group pb-12 lg:pb-16 last:pb-0">
      {/* Column 1: Date (Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="hidden lg:flex flex-col items-end pt-5"
      >
        <span className="text-xl font-light text-white tracking-tight">
          {experience.year.includes(" - ")
            ? experience.year.split(" - ")[1]
            : "Present"}
        </span>
        <span className="text-[10px] font-light text-purple-300 uppercase tracking-widest mt-1">
          {experience.year.split(" - ")[0]}
        </span>
      </motion.div>

      {/* Column 2: The Timeline Infrastructure */}
      <div className="hidden lg:flex flex-col items-center relative">
        {/* The Connection Line - Advanced Gradient & Pulse */}
        {!isLast && (
          <div
            className="absolute w-[2px] pointer-events-none overflow-hidden"
            style={{
              top: "2.75rem",
              bottom: "0",
              background:
                "linear-gradient(to bottom, var(--brand-purple) 0%, rgba(168,85,247,0.1) 20%, rgba(168,85,247,0.05) 100%)",
            }}
          >
            {/* Animated Data Pulse traveling down the line */}
            {isInView && (
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: "400%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-full h-1/4 bg-gradient-to-b from-transparent via-white/40 to-transparent"
              />
            )}
          </div>
        )}

        {/* The Node - Refined Scifi Core */}
        <div className="relative z-20 mt-6 flex items-center justify-center">
          {/* Outer Pulsing Ring - Smaller & Subtle */}
          <motion.div
            animate={
              isInView ? { scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] } : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute w-5 h-5 rounded-full border border-purple-500/20 blur-[1px] ${isInView ? "block" : "hidden"}`}
          />

          {/* Main Node Housing - Resized to w-3 */}
          <div
            className={`w-3 h-3 rounded-full border transition-all duration-700 relative flex items-center justify-center
             ${
               isInView
                 ? "border-purple-400 bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                 : "bg-neutral-900 border-neutral-700"
             }
             group-hover:scale-110 group-hover:border-white group-hover:bg-purple-500`}
          >
            {/* Inner Core - Micro Dot */}
            <div
              className={`w-0.5 h-0.5 rounded-full ${isInView ? "bg-white" : "bg-neutral-800"}`}
            />
          </div>

          {/* Horizontal Connector Stem to Card */}
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "1.5rem" } : { width: 0 }}
            className="absolute left-3.5 h-px bg-gradient-to-r from-purple-500/40 to-transparent pointer-events-none"
          />
        </div>
      </div>

      {/* Column 3: The Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="relative"
      >
        {/* Mobile-only Advanced Timeline */}
        <div className="flex items-center gap-3 lg:hidden mb-6">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-3 h-3 rounded-full border border-purple-500/50 bg-purple-500/20 ${isInView ? "animate-pulse" : ""}`}
            />
            <div className="absolute inset-0 blur-[4px] bg-purple-500/30 rounded-full" />
          </div>
          <span className="text-[10px] font-light text-neutral-400 tracking-widest uppercase">
            {experience.year}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 via-neutral-800 to-transparent" />
        </div>

        {/* Liquid Glass Card - Compact Horizontal */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl transition-all duration-500 bg-transparent border-0 shadow-none group/card"
        >
          {/* Liquid Glass Outline - Apple Style Refraction */}
          <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none z-30"></div>

          {/* Internal Glass Highlight (Specular) */}
          <div className="absolute inset-[1px] rounded-[calc(1rem-1.5px)] border border-white/5 pointer-events-none z-30"></div>

          {/* MobileNav-inspired Glass Architecture (Pure Transparency, No Blur) */}
          <div className="absolute inset-0 bg-white/[0.005] rounded-2xl pointer-events-none z-0" />

          {/* Glossy Depth Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none z-0"></div>

          {/* Premium Liquid Accents - Enhanced Apple Edge Brilliance */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-80 group-hover/card:opacity-100 transition-opacity z-40"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none z-30"></div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
              <h3 className="text-lg text-white tracking-tight title-font">
                {experience.role}
              </h3>
              <span className="text-xs font-light text-white/70">
                {experience.company}
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              {experience.description.map((point, i) => (
                <li key={i} className="flex gap-3 group/item">
                  <div className="mt-2 h-1 w-1 rounded-full bg-[var(--color-bullet-bg)] group-hover/item:bg-[var(--color-bullet-hover)] transition-colors shrink-0" />
                  <p className="text-[var(--text-description)] font-light leading-relaxed text-sm">
                    {point}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
              {experience.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-[var(--color-tag-bg)] border border-[var(--color-tag-border)] text-[10px] font-light text-[var(--color-tag-text)] uppercase tracking-tighter"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Experience = () => {
  return (
    <div id="experience" className="border-b border-neutral-900 pb-24 lg:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.h2
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="my-12 sm:my-16 lg:my-24 section-title"
        >
          My <span>Experience</span>
        </motion.h2>

        <div className="relative space-y-4">
          {EXPERIENCES.map((experience, index) => (
            <ExperienceCard
              key={index}
              experience={experience}
              index={index}
              isLast={index === EXPERIENCES.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Experience;
