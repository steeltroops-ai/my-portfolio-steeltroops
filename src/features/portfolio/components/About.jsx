import aboutImg from "@/assets/about.jpg";
import { ABOUT_TEXT, PERSONAL } from "@/constants";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15
    }
  }
};

const headingVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const About = () => {
  return (
    <section id="about" className="pb-8 sm:pb-12 lg:pb-4 border-b border-neutral-800 lg:mb-3 scroll-mt-20 lg:-ml-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="flex flex-wrap items-center"
      >
        <div className="w-full lg:w-1/2 lg:p-10 mt-8 sm:mt-10 lg:mt-0 order-2 lg:order-1">
          <div className="flex justify-center lg:justify-start">
            <motion.img
              variants={imageVariants}
              className="rounded-3xl w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-full h-auto"
              src={aboutImg}
              alt="About Mayank Pratap Singh"
              loading="lazy"
            />
          </div>
        </div>
        <motion.div
          variants={contentVariants}
          className="w-full lg:w-1/2 lg:pl-8 order-1 lg:order-2"
        >
          <div className="flex flex-col items-center lg:items-start space-y-4 sm:space-y-5 lg:space-y-8">
            <motion.h2
              variants={headingVariants}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-thin tracking-tight mt-4 sm:mt-8 lg:mt-16 leading-tight"
            >
              About <span className="text-neutral-500">Me</span>
            </motion.h2>
            <motion.p
              variants={contentVariants}
              className="text-sm sm:text-base lg:text-base font-light leading-relaxed max-w-xl text-neutral-200 text-center lg:text-left"
            >
              {ABOUT_TEXT}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default About;
