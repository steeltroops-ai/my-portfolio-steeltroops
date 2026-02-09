import { EXPERIENCES } from "@/constants";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useInView,
} from "framer-motion";
import { useState, useRef } from "react";
import { FaBriefcase, FaCalendarAlt, FaCode } from "react-icons/fa";

const ExperienceCard = ({ experience, index, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);

  // Reading zone detection
  const isInView = useInView(cardRef, {
    margin: "-40% 0px -40% 0px",
    once: false,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[140px_auto_1fr] gap-x-4 lg:gap-x-12 group last:pb-0 pb-16">
      {/* Column 1: Date (Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="hidden lg:flex flex-col items-end pt-4"
      >
        <span className="text-2xl font-black text-white/90 tracking-tighter title-font">
          {experience.year.includes(" - ")
            ? experience.year.split(" - ")[1]
            : "Present"}
        </span>
        <span className="text-[10px] font-black font-mono text-purple-400/60 uppercase tracking-[0.2em] mt-1">
          {experience.year.split(" - ")[0]}
        </span>
      </motion.div>

      {/* Column 2: The Interactive Timeline */}
      <div className="hidden lg:flex flex-col items-center relative">
        {/* The Connector Node */}
        <div className="relative z-10 mt-5">
          <div
            className={`w-4 h-4 rounded-full border-2 transition-all duration-700 
             ${
               isInView
                 ? "bg-purple-500 border-white shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-125"
                 : "bg-neutral-900 border-neutral-700 scale-100"
             }`}
          />
          {isInView && (
            <motion.div
              layoutId={`ping-${index}`}
              className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20"
            />
          )}
        </div>

        {/* The Line Segment */}
        {!isLast && (
          <div className="w-[1px] h-full bg-gradient-to-b from-neutral-800 via-neutral-800 to-transparent mt-2" />
        )}
      </div>

      {/* Column 3: The Card Content */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: index * 0.1 }}
        className="relative"
      >
        {/* Mobile-only Date Header */}
        <div className="flex items-center gap-4 lg:hidden mb-6">
          <FaCalendarAlt className="text-purple-500/60 text-xs" />
          <span className="text-[10px] font-black text-purple-200/80 tracking-[0.3em] uppercase">
            {experience.year}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>

        {/* The Liquid Glass Card */}
        <div
          ref={cardRef}
          className={`liquid-glass rounded-[2rem] transition-all duration-700 border
            ${
              isInView
                ? "border-purple-500/30 bg-white/[0.03] shadow-[0_20px_50px_rgba(0,0,0,0.4)] scale-[1.02]"
                : "border-white/5 bg-white/[0.01] hover:border-white/10"
            }`}
        >
          {/* MobileNav Highlights Reproduced */}
          <div className="liquid-glass-highlight" />
          <div className="liquid-glass-top-line" />

          {/* Card Body */}
          <div className="p-6 sm:p-10 relative z-20">
            {/* Header: Role & Company */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <FaBriefcase className="text-[10px]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                    Professional Brief
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white title-font tracking-tighter">
                  {experience.role}
                </h3>
                <p className="text-lg font-bold text-neutral-400 tracking-tight">
                  @{experience.company}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {experience.technologies.slice(0, 3).map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-purple-300 uppercase tracking-tighter backdrop-blur-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Split: Description & Insights (Bento Style on Large screens) */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
              {/* Main Contributions */}
              <div className="xl:col-span-3 space-y-6">
                <ul className="space-y-4">
                  {experience.description.map((point, i) => (
                    <li key={i} className="flex gap-4 group/item">
                      <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-transform group-hover/item:scale-150" />
                      <p className="text-neutral-300 font-light leading-relaxed text-sm sm:text-base opacity-80 group-hover/item:opacity-100 transition-opacity">
                        {point}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sidebar: Tech & Highlight */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-inner">
                  <div className="flex items-center gap-2 mb-4 text-white/40">
                    <FaCode className="text-xs" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                      Full Stack Utilization
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {experience.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-neutral-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-xs text-neutral-500 font-light italic leading-loose">
                      Engineering impactful solutions using{" "}
                      {experience.technologies[0]} and{" "}
                      {experience.technologies[1]}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Experience = () => {
  const containerRef = useRef(null);

  return (
    <div
      id="experience"
      className="border-b border-neutral-900 pb-24 lg:pb-32 overflow-hidden"
    >
      {/* Title */}
      <div className="pt-24 pb-16 lg:pb-24 text-center">
        <motion.h2
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="section-title font-black uppercase tracking-tighter"
        >
          Work <span>Experience</span>
        </motion.h2>
      </div>

      <div
        className="container mx-auto px-4 max-w-6xl relative"
        ref={containerRef}
      >
        {/* Center Progress Line (Global) */}
        <div className="absolute left-[23px] lg:left-[147px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-purple-500/40 via-neutral-800 to-transparent opacity-20 hidden lg:block" />

        <div className="space-y-4">
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
