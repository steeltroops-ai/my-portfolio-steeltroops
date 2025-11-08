import { HERO_CONTENT } from "../constants";
import profilePic from "../assets/hodakaprofile.jpg";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
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
      delay: 0.3
    }
  }
};

const Hero = () => {
  return (
    <section id="hero" className="pb-4 border-b border-neutral-800 lg:mb-3 scroll-mt-20">
      <div className="flex flex-wrap">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-1/2 lg:pr-8"
        >
          <div className="flex flex-col space-y-4 lg:space-y-6">
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-8xl font-thin tracking-tight lg:mt-16 leading-tight text-left"
            >
              Mayank Pratap Singh
            </motion.h1>
            <motion.div
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight leading-snug text-left"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-500 via-slate-500">
                Full Stack, Robotics &<br />
                Machine Learning Engineer
              </span>
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base font-light leading-relaxed max-w-xl text-neutral-200 text-left"
            >
              {HERO_CONTENT}
            </motion.p>
          </div>
        </motion.div>
        <div className="w-full lg:w-1/2 lg:p-10 mt-8 lg:mt-0">
          <div className="flex justify-center">
            <motion.img
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              src={profilePic}
              className="rounded-3xl max-w-full h-auto"
              alt="Mayank Pratap Singh"
              loading="eager"
              fetchpriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
