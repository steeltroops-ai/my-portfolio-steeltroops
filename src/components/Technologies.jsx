import { RiReactjsLine } from "react-icons/ri";
import { TbBrandNextjs } from "react-icons/tb";
import { SiMongodb } from "react-icons/si";
import { FaNodeJs } from "react-icons/fa6";
import { SiPytorch } from "react-icons/si";
import { DiPython } from "react-icons/di";
import { motion } from "framer-motion";

const iconVariants = (duration) => ({
    initials:{y:-10},
    animate:{
        y:[10,-10],
        transition:{
            duration:duration,
            ease:"linear",
            repeat:Infinity,
            repeatType: "reverse",
        }
    }  
});

const Technologies = () => {
  return (
    <div className="pb-24 border-b border-neutral-800">
      <motion.h2 
      whileInView={{opacity:1,y:0}}
      initial={{opacity:0,y:-100}}
      transition={{duration:1.5}}
      className="my-20 text-4xl text-center">Technologies</motion.h2>
      <motion.div 
        whileInView={{opacity:1,x:0}}
        initial={{opacity:0,x:-100}}
        transition={{duration:1.5}}
        className="flex flex-wrap items-center justify-center gap-4">
        <motion.div 
          variants={iconVariants(2.5)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <RiReactjsLine className="text-7xl text-cyan-400" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(3)}
          initial="initial"
          animate="animate" 
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <TbBrandNextjs className="text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(5)}
          initial="initial"
          animate="animate" 
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiMongodb className="text-green-500 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(2)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <FaNodeJs className="text-green-500 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(6)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiPytorch className="text-orange-400 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <DiPython className="text-7xl text-fuchsia-600" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <DiPython className="text-7xl text-fuchsia-600" />          
        </motion.div>
      </motion.div>
      
    </div>
  )
}

export default Technologies;