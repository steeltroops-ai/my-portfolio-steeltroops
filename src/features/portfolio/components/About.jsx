import { ABOUT_TEXT, PERSONAL, IMAGES } from "@/constants";
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
    <section className="pt-12 sm:pt-16 lg:pt-24 pb-12 sm:pb-16 lg:pb-20 border-b border-neutral-800 lg:mb-3 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap items-center lg:items-center"
        >
          <div className="w-full lg:w-1/2 lg:pr-8 mt-8 sm:mt-10 lg:mt-0 order-2 lg:order-1">
            <div className="flex justify-center lg:justify-start">
              <motion.img
                variants={imageVariants}
                className="rounded-3xl w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-full h-auto"
                src={IMAGES.about}
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
            <div className="flex flex-col items-center lg:items-start space-y-4 sm:space-y-5 lg:space-y-12">
              <motion.h2
                variants={headingVariants}
                className="mt-0 mb-8 lg:mb-0 lg:pb-6 section-title lg:text-left"
              >
                About <span>Me</span>
              </motion.h2>
              <motion.div
                variants={contentVariants}
                className="space-y-4 w-full mx-auto lg:mx-0 px-4 sm:px-8 lg:px-0"
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
