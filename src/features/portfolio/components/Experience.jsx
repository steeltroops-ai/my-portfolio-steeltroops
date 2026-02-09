import { EXPERIENCES } from "@/constants";
import { motion } from "framer-motion";
import { useState } from "react";

const ExperienceCard = ({ experience, index, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        {/* Mobile Header (Date) */}
        <div className="flex items-center gap-3 lg:hidden mb-4">
          <div className="w-2 h-2 rounded-full bg-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]" />
          <span className="text-sm font-mono font-bold text-purple-300/90">
            {experience.year}
          </span>
          <div className="h-[1px] flex-1 bg-neutral-800" />
        </div>

        {/* Glass Card with Directional Glow (Tech Stack Style) */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-white/[0.01] border border-white/5 transition-all duration-500 group-hover:bg-white/[0.02] group-hover:shadow-[10px_10px_30px_-5px_rgba(168,85,247,0.15)] group-hover:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 relative z-10">
            <h3 className="text-xl font-bold text-neutral-200 tracking-tight group-hover:text-purple-200 transition-colors">
              {experience.role}
            </h3>
            <span className="text-sm font-medium text-purple-300/90 bg-purple-500/5 px-3 py-1 rounded-full border border-purple-500/10 w-fit">
              {experience.company}
            </span>
          </div>

          {/* Desktop View: Full List */}
          <ul className="hidden lg:block space-y-2.5 mb-6 relative z-10">
            {experience.description.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-neutral-400/90 font-light leading-relaxed"
              >
                <span className="mt-2 min-w-[5px] h-[5px] rounded-full bg-purple-500/40" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {/* Mobile View: Inline Read More */}
          <div className="lg:hidden mb-6 relative z-10">
            {isExpanded ? (
              <div className="space-y-4">
                <ul className="space-y-2.5">
                  {experience.description.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-neutral-400/90 font-light leading-relaxed"
                    >
                      <span className="mt-2 min-w-[5px] h-[5px] rounded-full bg-purple-500/40" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs font-bold text-purple-300 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                >
                  Show Less <span className="text-[10px]">▲</span>
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm text-neutral-400/90 font-light leading-relaxed">
                <span className="mt-1.5 min-w-[5px] h-[5px] rounded-full bg-purple-400/50 shrink-0" />
                <span>
                  {experience.description[0].length > 100
                    ? experience.description[0].slice(0, 100) + "..."
                    : experience.description[0]}
                  {(experience.description.length > 1 ||
                    experience.description[0].length > 100) && (
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="ml-2 text-purple-300 font-bold hover:text-white transition-colors uppercase text-xs tracking-wide"
                    >
                      Read More
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5 relative z-10">
            {experience.technologies.map((tech, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[11px] font-medium text-purple-300/70 bg-purple-500/5 border border-purple-500/10 rounded-full transition-all duration-300"
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
        className="my-8 sm:my-12 lg:my-20 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-thin tracking-tight text-center"
      >
        My <span className="text-neutral-500">Experience</span>
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
