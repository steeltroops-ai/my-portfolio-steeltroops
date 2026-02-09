import { HERO_CONTENT, PERSONAL } from "@/constants";
import profilePic from "@/assets/hodakaprofile.jpg";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const imageVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      delay: 0.3,
    },
  },
};

const Hero = () => {
  return (
    <section
      id="hero"
      className="pb-8 sm:pb-12 lg:pb-4 border-b border-neutral-800 lg:mb-3 scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl lg:py-16">
        <div className="flex flex-wrap items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full lg:w-1/2 lg:pr-8"
          >
            <div className="flex flex-col items-center lg:items-start space-y-4 sm:space-y-5 lg:space-y-5">
              <motion.h1
                variants={itemVariants}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-thin tracking-tight mt-4 sm:mt-8 lg:mt-0 leading-none text-center lg:text-left"
              >
                {PERSONAL.name}
              </motion.h1>
              <motion.div
                variants={itemVariants}
                className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-light tracking-tight leading-snug sm:leading-snug md:leading-snug lg:leading-snug text-center lg:text-left"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-slate-300 to-purple-400">
                  Full Stack, Robotics &<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>Machine Learning Engineer
                </span>
              </motion.div>
              <motion.p
                variants={itemVariants}
                className="text-sm sm:text-base lg:text-base font-light leading-relaxed sm:leading-relaxed lg:leading-relaxed max-w-lg md:max-w-xl text-neutral-200 text-justify mx-auto lg:mx-0 px-4 sm:px-8 lg:px-0"
              >
                {HERO_CONTENT}
              </motion.p>
            </div>
          </motion.div>
          <div className="w-full lg:w-1/2 lg:pl-8 mt-8 sm:mt-10 lg:mt-0">
            <div className="flex justify-center lg:justify-end">
              <motion.img
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                src={profilePic}
                className="rounded-3xl w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-full h-auto"
                alt="Mayank Pratap Singh"
                loading="eager"
                fetchpriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
