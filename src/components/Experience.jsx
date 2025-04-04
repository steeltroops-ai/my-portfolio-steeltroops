import { EXPERIENCES } from "../constants";
import { motion } from "framer-motion";

const Experience = () => {
    return (
        <div className="pb-4 border-b border-neutral-900">
            <motion.h2 
                className="my-20 text-4xl text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                Experience
            </motion.h2>
            <div>
                {EXPERIENCES.map(({ id, year, role, company, description, technologies }) => (
                    <div key={id} className="flex flex-wrap mb-8 lg:justify-center">
                        <motion.div 
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: -100 }}
                            transition={{ duration: 1.2 }}
                            className="w-full lg:w-1/4"
                        >
                            <p className="mb-2 text-sm text-neutral-400">{year}</p>
                        </motion.div>
                        <motion.div 
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: 100 }}
                            transition={{ duration: 1 }}
                            className="w-full max-w-xl lg:w-3/4"
                        >
                            <h6 className="mb-2 font-semibold">
                                {role} - <span className="text-sm text-purple-100">{company}</span>
                            </h6>
                            <p className="mb-4 text-justify text-neutral-400">{description}</p>
                            <div className="flex flex-wrap">
                                {technologies.map((tech) => (
                                    <span 
                                        key={tech} 
                                        className="px-2 py-1 mt-4 mr-2 text-sm font-medium text-purple-800 rounded bg-neutral-900"
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

export default Experience;