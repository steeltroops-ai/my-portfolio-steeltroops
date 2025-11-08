import aboutImg from "../assets/about.jpg";
import { ABOUT_TEXT } from "../constants";
import { motion } from "framer-motion";

const About = () => {
  return (
    <section id="about" className="pb-4 border-b border-neutral-900 lg:mb-3 scroll-mt-20 lg:-ml-10">
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:p-10 mt-8 lg:mt-0">
          <div className="flex justify-center">
            <motion.img
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="rounded-3xl max-w-full h-auto"
              src={aboutImg}
              alt="about"
              loading="lazy"
            />
          </div>
        </div>
        <motion.div
          whileInView={{ opacity: 1, x: 0 }}
          initial={{ opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
          className="w-full lg:w-1/2 lg:pl-8"
        >
          <div className="flex flex-col items-center lg:items-start">
            <motion.h2
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="pb-8 lg:pb-16 text-3xl lg:text-4xl xl:text-5xl font-thin tracking-tight lg:mt-16"
            >
              About <span className="text-neutral-500">Me</span>
            </motion.h2>
            <p className="max-w-xl py-4 lg:py-6 my-2 font-light tracking-tight text-justify text-sm sm:text-base">
              {ABOUT_TEXT}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
