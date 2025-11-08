import { HERO_CONTENT } from "../constants";
import profilePic from "../assets/hodakaprofile.jpg";
import { motion } from "framer-motion";


const container = (delay) => ({
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: delay },
  },
});

const Hero = () => {
  return (
    <div id="hero" className="pb-4 border-b border-neutral-800 lg:mb-3 scroll-mt-20">
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:pr-8">
          <div className="flex flex-col">
            <motion.h1
              variants={container(0)}
              initial="hidden"
              animate="visible"
              className="pb-4 text-4xl sm:text-5xl lg:text-6xl xl:text-8xl font-thin tracking-tight lg:mt-16"
              style={{ textAlign: 'left' }}
            >
              Mayank Pratap Singh
            </motion.h1>
            <motion.span
              variants={container(0.3)}
              initial="hidden"
              animate="visible"
              className="pb-4 text-2xl sm:text-3xl lg:text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-500 via-slate-500"
              style={{ textAlign: 'left' }}
            >
              Full Stack, Robotics & <br />
              Machine Learning Engineer
            </motion.span>
            <motion.p
              variants={container(0.6)}
              initial="hidden"
              animate="visible"
              className="pt-2 font-light tracking-tight text-sm sm:text-base max-w-xl text-neutral-400"
              style={{ textAlign: 'left' }}
            >
              {HERO_CONTENT}
            </motion.p>
          </div>
        </div>
        <div className="w-full lg:w-1/2 lg:p-10 mt-8 lg:mt-0">
          <div className="flex justify-center">
            <motion.img
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              src={profilePic}
              className="rounded-3xl max-w-full h-auto"
              alt="Mayank Pratap Singh"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
