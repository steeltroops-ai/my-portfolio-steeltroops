import React from 'react';
import aboutImg from "../assets/hodakabout.jpg";
import { ABOUT_TEXT } from "../assets/constants";
import { motion } from "framer-motion";

const About = () => {
  return (
    <section className="pb-4 border-b lg:mb-3 border-neutral-900">
      <h2 className="my-20 text-4xl text-center">
        About <span className="text-neutral-500">Me</span>
      </h2>
      <div className="flex flex-wrap">
        <motion.div 
          whileInView={{ opacity: 1, x: 0 }}
          initial={{ opacity: 0, x: -100 }}
          transition={{ duration: 1 }}
          className="w-full lg:w-1/2 lg:p-16"
        >
          <div className="flex flex-col items-center justify-center lg:items-start">
            <img 
              className="h-auto max-w-full rounded-3xl" 
              src={aboutImg} 
              alt="about" 
              loading="lazy"
            />
          </div>
        </motion.div>
        <motion.div 
          whileInView={{ opacity: 1, x: 0 }}
          initial={{ opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
          className="w-full lg:w-1/2"
        >
          <div className="flex justify-center lg:justify-start">
            <p className="max-w-xl py-12 my-4 text-justify">{ABOUT_TEXT}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;