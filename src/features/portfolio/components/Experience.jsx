import { EXPERIENCES } from "@/constants";
import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";

const ExperienceCard = ({ experience, index, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);

  // Detect if the card is in the vertical center of the screen (the "reading zone")
  const isInCenter = useInView(cardRef, {
    margin: "-45% 0px -45% 0px", // Only triggers when card is in the middle 10% of viewport
    once: false,
  });

  const isFocused = isInCenter || isExpanded;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[120px_auto_1fr] gap-x-4 lg:gap-x-8 group">
      {/* Column 1: Date (Desktop) - Right aligned */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="hidden lg:flex flex-col items-end pt-2"
      >
        <span className="text-xl font-bold text-white tracking-tight">
          {experience.year.includes(" - ")
            ? experience.year.split(" - ")[1]
            : "Present"}
        </span>
        <span className="text-[10px] font-mono font-medium text-purple-300/80 uppercase tracking-wider bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 transition-all duration-500 group-hover:text-purple-300 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]">
          {experience.year.split(" - ")[0]}
        </span>
      </motion.div>

      {/* Column 2: The Circuit Line (Desktop Only) */}
      <div className="hidden lg:flex flex-col items-center relative gap-y-2">
        {/* Continuous Vertical Line - Static, no glow */}
        <div
          className="absolute top-0 w-[2px] bg-neutral-800"
          style={{ bottom: isLast ? "0" : "-3rem" }}
        />

        {/* The Connector Node - Glows on CARD hover */}
        <div className="relative z-10 mt-3 w-4 h-4 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border-2 border-purple-500/30 transition-all duration-500 group-hover:border-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] group-hover:scale-110"></div>
        </div>

        {/* Horizontal Connector to Card - Faint */}
        <div className="absolute left-1/2 top-[1.15rem] w-8 h-[1px] bg-gradient-to-r from-purple-500/20 to-transparent -translate-y-1/2" />
      </div>

      {/* Column 3: The Module Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="relative lg:pl-0"
      >
        {/* Mobile Header (Date) - Scifi Capsule Style */}
        <div className="flex items-center gap-4 lg:hidden mb-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-neutral-800 to-purple-500/40" />
          <span className="px-3 py-1 text-[10px] font-mono font-bold text-purple-200/90 whitespace-nowrap tracking-[0.2em] uppercase rounded-full border border-purple-500/20 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            {experience.year}
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-neutral-800 to-purple-500/40" />
        </div>

        {/* Glass Card - Ultra Compact on Mobile */}
        <div
          ref={cardRef}
          className={`relative overflow-hidden p-4 sm:p-6 md:p-5 lg:p-8 rounded-2xl transition-all duration-700 border
            ${
              isFocused
                ? "bg-white/[0.02] border-white/10 shadow-[10px_10px_30px_-5px_rgba(168,85,247,0.15)]"
                : "bg-white/[0.01] border-white/5 shadow-none"
            } 
            group-hover:bg-white/[0.02] group-hover:shadow-[10px_10px_30px_-5px_rgba(168,85,247,0.15)] group-hover:border-white/10`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-2 lg:mb-4 gap-1 relative z-10">
            <h3
              className="text-lg sm:text-xl title-font group-hover:text-[var(--heading-sub-accent)] transition-colors"
              style={{ color: "var(--heading-sub-main)" }}
            >
              {experience.role}
            </h3>
            <span
              className="text-[12px] sm:text-sm font-medium bg-purple-500/5 px-2.5 py-0.5 rounded-full border border-purple-500/10 w-fit"
              style={{ color: "var(--text-accent-purple)" }}
            >
              {experience.company}
            </span>
          </div>

          {/* Full List: Visible on Tablet and Desktop */}
          <ul className="hidden md:block space-y-2.5 md:space-y-1.5 lg:space-y-2.5 mb-6 md:mb-4 lg:mb-6 relative z-10">
            {experience.description.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm font-light leading-relaxed"
                style={{ color: "var(--text-body-main)" }}
              >
                <span className="mt-2 min-w-[5px] h-[5px] rounded-full bg-purple-500/40" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {/* Mobile View: Inline Read More - Highly Compact */}
          <div className="md:hidden mb-4 relative z-10">
            {isExpanded ? (
              <div className="space-y-3">
                <ul className="space-y-2">
                  {experience.description.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm font-light leading-relaxed"
                      style={{ color: "var(--text-body-main)" }}
                    >
                      <span className="mt-2 min-w-[5px] h-[5px] rounded-full bg-purple-500/40" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-sm font-bold text-purple-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  Show Less <span className="text-[10px]">▲</span>
                </button>
              </div>
            ) : (
              <div
                className="flex items-start gap-2.5 text-sm font-light leading-relaxed"
                style={{ color: "var(--text-body-main)" }}
              >
                <span className="mt-1.5 min-w-[5px] h-[5px] rounded-full bg-purple-400/50 shrink-0" />
                <span>
                  {experience.description[0].length > 160
                    ? experience.description[0].slice(0, 160) + "..."
                    : experience.description[0]}
                  {(experience.description.length > 1 ||
                    experience.description[0].length > 160) && (
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="ml-1 text-purple-300 font-bold hover:text-white transition-colors"
                    >
                      Read More
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-2 sm:pt-3 md:pt-3 lg:pt-4 border-t border-white/5 relative z-10">
            {experience.technologies.map((tech, i) => (
              <span
                key={i}
                className="px-1.5 py-0 sm:px-2 sm:py-0.5 text-[9px] sm:text-[11px] font-medium text-white/90 bg-purple-500/5 border border-purple-500/10 rounded-full transition-all duration-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Experience = () => {
  return (
    <div id="experience" className="border-b border-neutral-900 pb-24 lg:pb-32">
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-8 sm:my-12 lg:my-20 section-title"
      >
        My <span>Experience</span>
      </motion.h2>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="relative ml-3 lg:ml-0 space-y-12">
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
