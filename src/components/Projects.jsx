import { PROJECTS } from "../constants";
import { motion } from "framer-motion";

const Projects = () => {
  return (
    <div id="projects" className="pb-4 border-b border-neutral-900 scroll-mt-20">
      <motion.h2 className="my-12 lg:my-20 text-3xl lg:text-4xl text-center">Projects</motion.h2>
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
              <h6 className="mb-2 font-semibold">{project.title}</h6>
              <p className="mb-4 text-justify text-neutral-400">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, techIndex) => (
                  <span
                    key={`${tech}-${techIndex}`}
                    className="px-2 py-1 text-sm font-medium text-purple-900 rounded bg-neutral-900"
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
