import { PROJECTS } from "@/constants";
import { motion } from "framer-motion";
import { FaGithub } from "react-icons/fa";

const Projects = () => {
  return (
    <div
      id="projects"
      className="pb-8 sm:pb-12 lg:pb-4 border-b border-neutral-800 scroll-mt-20"
    >
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-8 sm:my-12 lg:my-20 section-title"
      >
        My <span>Projects</span>
      </motion.h2>
      <div className="space-y-8 sm:space-y-10 lg:space-y-8">
        {PROJECTS.map((project, index) => (
          <div
            key={`${project.title}-${index}`}
            className="flex flex-wrap md:justify-center mb-10 md:mb-8"
          >
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="w-full md:w-1/4 mb-4 md:mb-0 flex justify-center md:block"
            >
              {project.url ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <img
                    src={`https://image.thum.io/get/width/400/crop/800/noanimate/${project.url}`}
                    width={150}
                    height={150}
                    alt={project.title}
                    className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[150px] h-auto rounded transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = project.image;
                    }}
                  />
                </a>
              ) : (
                <img
                  src={project.image}
                  width={150}
                  height={150}
                  alt={project.title}
                  className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[150px] h-auto rounded"
                />
              )}
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 100 }}
              transition={{ duration: 1 }}
              className="w-full max-w-xl md:w-3/4 mx-auto md:mx-0"
            >
              <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-3 gap-2 px-4 md:px-0">
                <h6
                  className="text-base sm:text-lg title-font text-center md:text-left"
                  style={{ color: "var(--heading-sub-main)" }}
                >
                  {project.title}
                </h6>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-300 rounded-full bg-neutral-900/60 backdrop-blur-md border border-neutral-700/50 shadow-lg hover:bg-neutral-800/70 hover:border-neutral-600/60 hover:text-white hover:shadow-neutral-900/40 transition-all duration-300 group flex-shrink-0"
                  >
                    <FaGithub className="text-xs group-hover:scale-110 transition-transform" />
                    <span>View</span>
                  </a>
                )}
              </div>
              <div className="mb-4 text-justify md:text-left px-6 sm:px-10 md:px-0">
                {Array.isArray(project.description) ? (
                  <ul className="list-disc list-outside space-y-2 ml-4">
                    {project.description.map((point, i) => (
                      <li
                        key={i}
                        className="text-sm sm:text-base font-light pl-2 marker:text-purple-500"
                        style={{ color: "var(--text-body-main)" }}
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className="text-sm sm:text-base font-light"
                    style={{ color: "var(--text-body-main)" }}
                  >
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 px-4 md:px-0">
                {project.technologies.map((tech, techIndex) => (
                  <span
                    key={`${tech}-${techIndex}`}
                    className="px-2.5 sm:px-3 py-1 text-xs font-medium text-purple-300 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-400/30 shadow-lg hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
