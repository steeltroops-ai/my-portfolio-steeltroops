import { EXPERIENCES } from "../constants";
import { motion } from "framer-motion";

const Experience = () => {
  return (
    <div id="experience" className="border-b border-neutral-800 py-24 scroll-mt-20">
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.5 }}
        className="mb-20 text-center text-4xl font-light tracking-tight"
      >
        Experience
      </motion.h2>
      <div className="max-w-4xl mx-auto space-y-16">
        {EXPERIENCES.map((experience, index) => (
          <motion.div
            key={index}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="flex flex-col lg:flex-row gap-8 lg:gap-24 group justify-center"
          >
            <div className="lg:w-40 flex-shrink-0 lg:text-right">
              <p className="text-sm font-mono text-neutral-500 group-hover:text-purple-400 transition-colors">
                {experience.year}
              </p>
            </div>
            <div className="flex-1 space-y-3 max-w-xl">
              <div>
                <h3 className="text-xl font-semibold text-neutral-100 group-hover:text-white transition-colors">
                  {experience.role}
                </h3>
                <p className="text-base text-purple-400 mt-1">{experience.company}</p>
              </div>
              <div className="text-neutral-400 leading-relaxed space-y-2">
                {experience.description.split('\n').map((line, i) => (
                  line.trim() && <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
