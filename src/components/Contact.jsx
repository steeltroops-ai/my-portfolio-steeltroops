import { CONTACT } from "../constants";
import { motion } from "framer-motion";

const Contact = () => {
  return (
    <div className='pt-0 pb-6 border-5 border-neutral-900'>
      <motion.h1 
        className='my-10 text-4xl text-center'>Get In Touch</motion.h1>
      <div className='tracking-tighter text-center border-b-transparent'>        
        <motion.p 
          whileInView={{opacity:1,x:0}}
          initial={{opacity:0, x:-100}}
          transition={{duration:0.9}}
          className='my-4'>{CONTACT.phoneNo}</motion.p>
        <motion.p
          whileInView={{opacity:1,x:0}}
          initial={{opacity:0, x:100}}
          transition={{duration:0.9}}
          className='my-4'>
          <a href={`mailto:${CONTACT.email}`} className='px-2 py-1  mr-2 text-sm -font-medium rounded bg-neutral-900 text-purple-700 '>
            {CONTACT.email}
          </a>
        </motion.p>        
      </div>
    </div>
  );
};

export default Contact;