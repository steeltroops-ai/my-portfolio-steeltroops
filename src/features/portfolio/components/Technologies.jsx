import React from "react";
import { RiReactjsLine } from "react-icons/ri";
import { TbBrandNextjs, TbBrandTypescript } from "react-icons/tb";
import { PiFileCppDuotone } from "react-icons/pi";
import { GrJava } from "react-icons/gr";
import {
  SiMongodb,
  SiPytorch,
  SiTensorflow,
  SiUnrealengine,
  SiNestjs,
} from "react-icons/si";
import { FaNodeJs, FaRust, FaGitAlt } from "react-icons/fa";
import { FaGolang } from "react-icons/fa6";
import { DiPython, DiDocker, DiPostgresql } from "react-icons/di";
import { LiaAws } from "react-icons/lia";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { appleEasing, viewportSettings } from "@/utils/animations";

// Technology data with accessibility information
const technologies = [
  {
    name: "Python",
    icon: DiPython,
    color: "text-blue-500",
    category: "Programming Languages",
    description:
      "High-level programming language for AI/ML and web development",
  },
  {
    name: "Go",
    icon: FaGolang,
    color: "text-cyan-500",
    category: "Programming Languages",
    description: "Fast, statically typed language for backend development",
  },
  {
    name: "C++",
    icon: PiFileCppDuotone,
    color: "text-blue-700",
    category: "Programming Languages",
    description:
      "High-performance language for system programming and game development",
  },
  {
    name: "TypeScript",
    icon: TbBrandTypescript,
    color: "text-blue-600",
    category: "Programming Languages",
    description: "Typed superset of JavaScript for scalable applications",
  },
  {
    name: "Java",
    icon: GrJava,
    color: "text-red-600",
    category: "Programming Languages",
    description: "Enterprise-grade object-oriented programming language",
  },
  {
    name: "Rust",
    icon: FaRust,
    color: "text-orange-600",
    category: "Programming Languages",
    description: "Memory-safe systems programming language",
  },
  {
    name: "Unreal Engine",
    icon: SiUnrealengine,
    color: "text-white",
    category: "Game Development",
    description: "Advanced game engine for VR/AR and simulation development",
  },
  {
    name: "TensorFlow",
    icon: SiTensorflow,
    color: "text-yellow-600",
    category: "Machine Learning",
    description: "Open-source machine learning framework",
  },
  {
    name: "PyTorch",
    icon: SiPytorch,
    color: "text-red-600",
    category: "Machine Learning",
    description: "Deep learning framework for research and production",
  },
  {
    name: "React",
    icon: RiReactjsLine,
    color: "text-cyan-400",
    category: "Web Development",
    description: "JavaScript library for building user interfaces",
  },
  {
    name: "Next.js",
    icon: TbBrandNextjs,
    color: "text-white",
    category: "Web Development",
    description: "React framework for production-ready applications",
  },
  {
    name: "NestJS",
    icon: SiNestjs,
    color: "text-red-600",
    category: "Web Development",
    description:
      "Progressive Node.js framework for scalable server-side applications",
  },
  {
    name: "MongoDB",
    icon: SiMongodb,
    color: "text-green-500",
    category: "Databases",
    description: "NoSQL document database for modern applications",
  },
  {
    name: "PostgreSQL",
    icon: DiPostgresql,
    color: "text-blue-500",
    category: "Databases",
    description: "Advanced open-source relational database",
  },
  {
    name: "Node.js",
    icon: FaNodeJs,
    color: "text-green-500",
    category: "Runtime",
    description: "JavaScript runtime for server-side development",
  },
  {
    name: "AWS",
    icon: LiaAws,
    color: "text-orange-500",
    category: "Cloud Services",
    description: "Amazon Web Services cloud computing platform",
  },
  {
    name: "Git",
    icon: FaGitAlt,
    color: "text-red-600",
    category: "Version Control",
    description: "Distributed version control system",
  },
  {
    name: "Docker",
    icon: DiDocker,
    color: "text-blue-600",
    category: "DevOps",
    description: "Containerization platform for application deployment",
  },
];

// Apple-style smooth floating animation
const iconVariants = (duration) => ({
  initial: { y: 0, opacity: 0.9 },
  animate: {
    y: [8, -8],
    opacity: 1,
    transition: {
      y: {
        duration: duration,
        ease: appleEasing.easeInOut,
        repeat: Infinity,
        repeatType: "reverse",
      },
      opacity: {
        duration: 0.4,
        ease: appleEasing.easeOut,
      },
    },
  },
  // Static variant for reduced motion
  static: { y: 0, opacity: 1 },
});

// Technology icon component with accessibility features and performance optimization
const TechnologyIcon = ({ tech, duration }) => {
  const IconComponent = tech.icon;
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={iconVariants(duration)}
      initial="initial"
      animate={prefersReducedMotion ? "static" : (isInView ? "animate" : "initial")}
      className="relative group"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${tech.name} - ${tech.description}`}
    >
      <div className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl min-w-[70px] min-h-[70px] sm:min-w-[88px] sm:min-h-[88px] flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black bg-gradient-to-br from-white/5 via-white/3 to-transparent border border-white/10 shadow-2xl hover:from-white/10 hover:via-white/5 hover:border-white/20 hover:shadow-cyan-500/20">
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30"></div>
        <IconComponent
          className={`${tech.color} text-5xl sm:text-6xl lg:text-7xl transition-all duration-200 group-hover:drop-shadow-lg relative z-10`}
        />
      </div>

      {/* Compact Liquid Glass Tooltip */}
      <div className="absolute z-20 mb-2 transition-all duration-300 transform -translate-x-1/2 opacity-0 pointer-events-none bottom-full left-1/2 group-hover:opacity-100 group-focus:opacity-100 group-hover:translate-y-0 translate-y-1">
        {/* Glass container */}
        <div className="relative rounded-md overflow-hidden bg-white/5 border border-white/10 shadow-xl">
          {/* Subtle shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

          {/* Content - Compact & Centered */}
          <div className="relative px-3 py-1.5 text-center">
            <div className="font-medium text-white text-xs tracking-wide whitespace-nowrap">
              {tech.name}
            </div>
            <div className="text-[9px] text-neutral-400 font-light tracking-wider uppercase whitespace-nowrap">
              {tech.category}
            </div>
          </div>
        </div>

        {/* Simple Arrow */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-[1px]">
          <div className="w-1.5 h-1.5 rotate-45 bg-white/5 border-r border-b border-white/10"></div>
        </div>
      </div>
    </motion.div>
  );
};

const Technologies = () => {
  // Generate varied animation durations for visual interest
  const getDuration = (index) => {
    const durations = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
    return durations[index % durations.length];
  };

  return (
    <section
      id="technologies"
      className="pb-8 sm:pb-12 lg:pb-24 border-b border-neutral-800 scroll-mt-20"
      aria-labelledby="technologies-heading"
    >
      <motion.h2
        id="technologies-heading"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportSettings.standard}
        transition={{ duration: 0.7, ease: appleEasing.easeOut }}
        className="my-8 sm:my-12 lg:my-20 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-thin tracking-tight text-center"
      >
        Tech <span className="text-neutral-500">Stack</span>
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportSettings.standard}
        transition={{ duration: 0.8, ease: appleEasing.easeOut, delay: 0.1 }}
        className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-5"
        role="grid"
        aria-label="Technology skills showcase"
        style={{ willChange: "transform, opacity" }}
      >
        {technologies.map((tech, index) => (
          <TechnologyIcon
            key={tech.name}
            tech={tech}
            duration={getDuration(index)}
            index={index}
          />
        ))}
      </motion.div>

      {/* Screen reader only description */}
      <div className="sr-only">
        <h3>Technology Categories</h3>
        <ul>
          <li>
            Programming Languages: Python, Go, C++, TypeScript, Java, Rust
          </li>
          <li>Web Development: React, Next.js, NestJS, Node.js</li>
          <li>Machine Learning: TensorFlow, PyTorch</li>
          <li>Databases: MongoDB, PostgreSQL</li>
          <li>Game Development: Unreal Engine</li>
          <li>Cloud Services: AWS</li>
          <li>DevOps: Docker, Git</li>
        </ul>
      </div>
    </section>
  );
};

export default Technologies;
