import { RiReactjsLine } from "react-icons/ri";
import { TbBrandNextjs, TbBrandTypescript } from "react-icons/tb";
import { PiFileCppDuotone } from "react-icons/pi";
import { GrJava } from "react-icons/gr";
import { SiMongodb, SiPytorch, SiTensorflow, SiUnrealengine, SiNestjs } from "react-icons/si";
import { FaNodeJs, FaRust, FaGitAlt } from "react-icons/fa";
import { FaGolang } from "react-icons/fa6";
import { DiPython, DiDocker, DiPostgresql } from "react-icons/di";
import { LiaAws } from "react-icons/lia";
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
      transition={{duration:1.2}}
      className="my-20 text-4xl text-center">Technologies</motion.h2>
      <motion.div 
        whileInView={{opacity:1,x:0}}
        initial={{opacity:0,x:-100}}
        transition={{duration:1.5}}
        className="flex flex-wrap items-center justify-center gap-5">

        {/* Programming Languages */}
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <DiPython className="text-blue-500 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <FaGolang className="text-7xl text-cyan-500" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <PiFileCppDuotone className="text-blue-700 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <TbBrandTypescript className="text-blue-600 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <GrJava className="text-red-600 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <FaRust className="text-orange-600 text-7xl" />          
        </motion.div>

        {/* Unreal Engine */}
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiUnrealengine className="text-white text-7xl" />          
        </motion.div>
        
        {/* Machine Learning */}
        <motion.div 
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiTensorflow className="text-yellow-600 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(6)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiPytorch className="text-red-600 text-7xl" />          
        </motion.div> 

        {/* Web Development */}
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
          <TbBrandNextjs className="text-white text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(3)}
          initial="initial"
          animate="animate" 
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiNestjs className="text-red-600 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(5)}
          initial="initial"
          animate="animate" 
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiMongodb className="text-green-500 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(5)}
          initial="initial"
          animate="animate" 
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <DiPostgresql className="text-blue-500 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(2)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <FaNodeJs className="text-green-500 text-7xl" />          
        </motion.div>

        <motion.div 
          variants={iconVariants(2)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <LiaAws className="text-orange-500 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(2)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <FaGitAlt className="text-red-600 text-7xl" />          
        </motion.div>
        <motion.div 
          variants={iconVariants(2)}
          initial="initial"
          animate="animate"
          className="p-4 border-4 border-neutral-800 rounded-2xl">
          <DiDocker className="text-blue-600 text-7xl" />          
        </motion.div>
        
      </motion.div>       
    </div>
  )
}

export default Technologies;