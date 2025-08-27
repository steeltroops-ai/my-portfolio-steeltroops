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
    <div className="pb-4 border-b border-neutral-900 lg:mb-3">
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/2">
          <div className="flex flex-col items-center lg:items-start">
            <motion.h1
              variants={container(0)}
              initial="hidden"
              animate="visible"
              className="pb-16 text-6xl font-thin tracking-tight lg:mt-16 lg:text-8xl"
            >
              Mayank Pratap Singh
            </motion.h1>
            <motion.span
              variants={container(0.3)}
              initial="hidden"
              animate="visible"
              className="py-2 text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-500 via-slate-500"
            >
              Full Stack Web Dev & <br />
              Machine Learning Engineer
            </motion.span>
            <motion.p
              variants={container(0.6)}
              initial="hidden"
              animate="visible"
              className="max-w-xl py-6 my-2 font-light tracking-tight text-justify"
            >
              {HERO_CONTENT}
            </motion.p>
          </div>
        </div>
        <div className="w-full lg:w-1/2 lg:p-10">
          <div className="flex justify-center">
            <motion.img
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              src={profilePic}
              className="rounded-3xl"
              alt="Mayank Pratap Singh"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
