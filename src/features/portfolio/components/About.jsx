import aboutImg from "@/assets/about.jpg";
import { ABOUT_TEXT, PERSONAL } from "@/constants";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
    },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const About = () => {
  return (
    <section
      id="about"
      className="pb-8 sm:pb-12 md:pb-12 lg:pb-4 border-b border-neutral-800 lg:mb-3 scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl md:py-12 lg:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap items-center"
        >
          <div className="w-full lg:w-1/2 lg:pr-8 mt-8 sm:mt-10 lg:mt-0 order-2 lg:order-1">
            <div className="flex justify-center lg:justify-start">
              <motion.img
                variants={imageVariants}
                className="rounded-3xl w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-full h-auto"
                src={aboutImg}
                alt="About Mayank Pratap Singh"
                width={500}
                height={600}
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
                className="my-8 sm:my-12 lg:my-0 section-title lg:text-left"
              >
                About <span>Me</span>
              </motion.h2>
              <motion.div
                variants={contentVariants}
                className="space-y-4 max-w-lg md:max-w-xl mx-auto lg:mx-0 px-4 sm:px-8 lg:px-0"
              >
                {ABOUT_TEXT.map((paragraph, index) => (
                  <div key={index} className="flex gap-3 group/item">
                    <div className="mt-2 h-1 w-1 rounded-full bg-[var(--color-bullet-bg)] group-hover/item:bg-[var(--color-bullet-hover)] transition-colors shrink-0" />
                    <p className="text-[var(--text-description)] text-sm sm:text-base lg:text-base font-light leading-relaxed tracking-tight text-justify lg:text-left">
                      {paragraph}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
