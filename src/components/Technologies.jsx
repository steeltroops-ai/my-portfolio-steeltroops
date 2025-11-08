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
import { motion } from "framer-motion";

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

const iconVariants = (duration) => ({
  initial: { y: -10 },
  animate: {
    y: [10, -10],
    transition: {
      duration: duration,
      ease: "linear",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
});

// Technology icon component with accessibility features
const TechnologyIcon = ({ tech, duration, index }) => {
  const IconComponent = tech.icon;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      // Could trigger a modal or tooltip with more information
      console.log(`Learn more about ${tech.name}`);
    }
  };

  return (
    <motion.div
      variants={iconVariants(duration)}
      initial="initial"
      animate="animate"
      className="relative group"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${tech.name} - ${tech.description}`}
    >
      <div className="p-4 border-4 border-neutral-800 rounded-2xl min-w-[88px] min-h-[88px] flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out hover:scale-110 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black group-hover:bg-neutral-800/30">
        <IconComponent
          className={`${tech.color} text-7xl transition-all duration-200 group-hover:drop-shadow-lg`}
        />
      </div>

      {/* Tooltip */}
      <div className="absolute z-10 px-3 py-2 mb-2 text-sm text-white transition-opacity duration-200 transform -translate-x-1/2 border rounded-lg opacity-0 pointer-events-none bottom-full left-1/2 bg-black/90 group-hover:opacity-100 group-focus:opacity-100 whitespace-nowrap border-neutral-700">
        <div className="font-medium">{tech.name}</div>
        <div className="text-xs text-neutral-300">{tech.category}</div>
        {/* Tooltip arrow */}
        <div className="absolute transform -translate-x-1/2 border-4 border-transparent top-full left-1/2 border-t-black/90"></div>
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
      className="pb-12 lg:pb-24 border-b border-neutral-800 scroll-mt-20"
      aria-labelledby="technologies-heading"
    >
      <motion.h2
        id="technologies-heading"
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-12 lg:my-20 text-3xl lg:text-4xl text-center"
      >
        Tech Stack
      </motion.h2>

      <motion.div
        whileInView={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: -100 }}
        transition={{ duration: 1.5 }}
        className="flex flex-wrap items-center justify-center gap-5"
        role="grid"
        aria-label="Technology skills showcase"
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
