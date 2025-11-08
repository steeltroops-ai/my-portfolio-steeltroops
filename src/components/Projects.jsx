import { PROJECTS } from "../constants";
import { motion } from "framer-motion";
import { FaGithub } from "react-icons/fa";

const Projects = () => {
  return (
    <div id="projects" className="pb-4 border-b border-neutral-800 scroll-mt-20">
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-12 lg:my-20 text-3xl lg:text-4xl xl:text-5xl font-thin tracking-tight text-center"
      >
        My <span className="text-neutral-500">Projects</span>
      </motion.h2>
      <div>
        {PROJECTS.map((project, index) => (
          <div
            key={`${project.title}-${index}`}
            className="flex flex-wrap mb-8 lg:justify-center"
          >
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="w-full lg:w-1/4"
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
                    className="mb-6 rounded transition-transform group-hover:scale-105"
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
                  className="mb-6 rounded"
                />
              )}
            </motion.div>
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 100 }}
              transition={{ duration: 1 }}
              className="w-full max-w-xl lg:w-3/4"
            >
              <div className="flex items-center justify-between mb-2">
                <h6 className="font-semibold text-neutral-100">{project.title}</h6>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-300 rounded-full bg-neutral-900/60 backdrop-blur-md border border-neutral-700/50 shadow-lg hover:bg-neutral-800/70 hover:border-neutral-600/60 hover:text-white hover:shadow-neutral-900/40 transition-all duration-300 group"
                  >
                    <FaGithub className="text-xs group-hover:scale-110 transition-transform" />
                    <span>View</span>
                  </a>
                )}
              </div>
              <p className="mb-4 text-justify text-neutral-200 font-light">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, techIndex) => (
                  <span
                    key={`${tech}-${techIndex}`}
                    className="px-3 py-1 text-xs font-medium text-purple-300 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-400/30 shadow-lg hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300"
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
