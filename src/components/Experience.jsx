import { EXPERIENCES } from "../constants";
import { motion } from "framer-motion";

const Experience = () => {
  return (
    <div id="experience" className="pb-4 border-b border-neutral-800 scroll-mt-20">
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-12 lg:my-20 text-3xl lg:text-4xl xl:text-5xl font-thin tracking-tight text-center"
      >
        My <span className="text-neutral-500">Experience</span>
      </motion.h2>
      <div>
        {EXPERIENCES.map((experience, index) => (
          <div
            key={index}
            className="flex flex-wrap mb-8 lg:justify-center"
          >
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="w-full lg:w-1/4"
            >
              <p className="mb-6 text-sm font-mono text-neutral-500">
                {experience.year}
              </p>
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 100 }}
              transition={{ duration: 1 }}
              className="w-full max-w-xl lg:w-3/4"
            >
              <h6 className="mb-2 font-semibold text-neutral-100">{experience.role}</h6>
              <p className="mb-4 text-purple-400">{experience.company}</p>
              <div className="mb-4 text-justify text-neutral-200 font-light space-y-2">
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
