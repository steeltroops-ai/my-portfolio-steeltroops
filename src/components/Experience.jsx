import { EXPERIENCES } from "../constants";
import { motion } from "framer-motion";

const Experience = () => {
  return (
    <div id="experience" className="pb-8 sm:pb-12 lg:pb-4 border-b border-neutral-800 scroll-mt-20">
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-8 sm:my-12 lg:my-20 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-thin tracking-tight text-center"
      >
        My <span className="text-neutral-500">Experience</span>
      </motion.h2>
      <div className="space-y-8 sm:space-y-10 lg:space-y-8">
        {EXPERIENCES.map((experience, index) => (
          <div
            key={index}
            className="flex flex-wrap lg:justify-center"
          >
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="w-full lg:w-1/4"
            >
              <p className="mb-4 lg:mb-6 text-xs sm:text-sm font-mono text-neutral-500">
                {experience.year}
              </p>
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 100 }}
              transition={{ duration: 1 }}
              className="w-full max-w-xl lg:w-3/4"
            >
              <h6 className="mb-2 text-base sm:text-lg font-semibold text-neutral-100">{experience.role}</h6>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base text-purple-400">{experience.company}</p>
              <div className="mb-4 text-sm sm:text-base text-justify lg:text-left text-neutral-200 font-light space-y-2">
                {experience.description.split('\n').map((line, i) => (
                  line.trim() && <p key={i}>{line}</p>
                ))}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
