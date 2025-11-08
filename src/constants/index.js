import project1 from "../assets/projects/project-1.jpg";
import project2 from "../assets/projects/project-2.jpg";
import project3 from "../assets/projects/project-3.jpg";
import project4 from "../assets/projects/project-4.jpg";
import project5 from "../assets/projects/project-5.jpg";

export const HERO_CONTENT = `I am a passionate full stack developer and AI/ML enthusiast with expertise in building robust and scalable web applications. I have honed my skills in modern frontend technologies like React 18, Next.js 14, and Vue 3, as well as backend technologies like Node.js, Express, FastAPI, and databases including PostgreSQL, MongoDB, and Redis. My goal is to leverage my expertise in software development and machine learning to create innovative solutions that drive impact and deliver exceptional user experiences.`;

export const ABOUT_TEXT = `I am a dedicated and versatile full stack developer with a passion for creating efficient and user-friendly web applications. Currently pursuing B.Tech in Computer Science Engineering with specialization in AI & ML at GLA University (CGPA: 8.3/10), I have hands-on experience working with cutting-edge technologies across web development, robotics, and aerospace simulations. My journey spans from developing VR training platforms and robotics prototypes to building production-ready web applications with modern tech stacks. I thrive in collaborative environments, have led teams of 10+ members, and won 8 hackathons by prototyping innovative solutions. Outside of coding, I enjoy exploring new technologies, contributing to open-source projects, and building tech communities.`;

export const EXPERIENCES = [
  {
    year: "Oct 2024 - Mar 2025",
    role: "Software & Integration Intern",
    company: "SS Innovations, India",
    description: `• Developed web application components using Next.js, TypeScript, and Node.js to integrate robotics and sensor data into centralized dashboards. Built RESTful APIs and real-time monitoring systems for medical device management.
• Designed responsive frontend interfaces and database schemas, ensuring seamless communication between heterogeneous systems and improving overall system reliability and user experience.`,
    technologies: ["Next.js", "TypeScript", "Node.js", "RESTful APIs", "Real-time Systems"],
  },
  {
    year: "Jun 2023 - Oct 2023",
    role: "Research Intern - Flight Dynamics & Simulation",
    company: "Orbitx India Aerospace, India",
    description: `• Contributed to research on flight dynamics and trajectory optimization for aerospace vehicle simulations, leveraging GNC frameworks for reusable launch systems.
• Developed and refined simulation models, enhancing algorithm efficiency by 48% and prediction accuracy, improvement over traditional methods using PPO and DDPG algorithms, and contributing actionable insights for aerospace R&D projects.`,
    technologies: ["Python", "PPO", "DDPG", "GNC Frameworks", "Simulation"],
  },
  {
    year: "Oct 2022 - May 2024",
    role: "Founder & Tech Lead",
    company: "Inexia, India",
    description: `• Co-founded a VR startup and developed VR prototypes and training platforms using Unreal Engine 5, C++ and Blender, creating immersive environments for early product testing and startup website.
• Led a 10-member team and prototype validation and testing workflows, balancing technical feasibility with user experience for VR gaming and training applications.`,
    technologies: ["Unreal Engine 5", "C++", "Blender", "VR Development"],
  },
  {
    year: "Sep 2022 - Mar 2024",
    role: "Vice President & Tech Head",
    company: "Droid Robotics Club, GLAU",
    description: `• Built 15+ robotics and IoT prototypes including autonomous robots, sensor-driven systems, and real-time dashboards, leveraging ROS2, Arduino, Raspberry Pi, Python, and C++.
• Contributed to system integration, hardware prototyping, and applied ML for robotics, while supporting peers through workshops and leading small R&D and hackathon projects.`,
    technologies: ["ROS2", "Arduino", "Raspberry Pi", "Python", "C++", "IoT"],
  },
];

export const PROJECTS = [
  {
    title: "Neza Digital Marketplace",
    image: project1,
    url: "",
    description:
      "Developed a digital service marketplace connecting households and businesses with local service providers. Implemented multi-user architecture, secure authentication, real-time service listing, and provider management. Integrated payment workflows via Razorpay, role-based access control, and responsive design, ensuring seamless transactions and optimal user experience.",
    technologies: ["Next.js", "TypeScript", "Node.js", "Razorpay", "Authentication"],
  },
  {
    title: "MDC Dataset Citation Classification",
    image: project2,
    url: "",
    description:
      "Automated classification of dataset citations in scientific literature using NLP and ensemble ML with SciBERT and classical models. Classifies references as primary, secondary, or missing with detailed performance metrics and comprehensive evaluation framework.",
    technologies: ["Python", "SciBERT", "Ensemble Methods", "NLP"],
  },
  {
    title: "AI-Powered Drug Research Platform",
    image: project3,
    url: "",
    description:
      "Developed an AI-driven platform for molecule generation and 2D protein folding, with real-time visualization for researchers. Enabled group collaboration, role-based access control, and secure authentication via NextAuth, backed by MongoDB based data storage and real-time messaging.",
    technologies: ["Next.js", "TypeScript", "MongoDB", "Nvidia NeMo", "RDKit"],
  },
  {
    title: "NeuraLens Neurological Assessment",
    image: project4,
    url: "",
    description:
      "Built a multimodal neurological assessment platform integrating speech analysis, retinal imaging, motor evaluation, and cognitive testing into a unified dashboard. Implemented real-time data analysis, secure data management, and responsive visualization for clinical use.",
    technologies: ["Next.js", "TypeScript", "Python", "ML Frameworks"],
  },
  {
    title: "Transformer Model Implementation",
    image: project5,
    url: "",
    github: "https://github.com/yourusername/transformer-implementation",
    description:
      "Built the 'Attention is All You Need' transformer architecture from scratch, including self-attention, positional encodings, and beam search for sequence-to-sequence modeling. Created reproducible training pipelines with configuration management and attention map visualizations to improve interpretability of transformer layers.",
    technologies: ["Python", "PyTorch", "Transformers", "NLP"],
  },
  {
    title: "Finance Management App",
    image: project1,
    url: "",
    github: "https://github.com/yourusername/finance-app",
    description:
      "Built a finance management platform enabling secure multi-bank linking, real-time fund tracking, and seamless transfers. Implemented server-side rendering (SSR) authentication, responsive dashboards, and categorized spending insights for a smooth, dynamic user experience.",
    technologies: ["Next.js", "TypeScript", "Plaid", "Dwolla", "Appwrite"],
  },
  {
    title: "Robot Bionic Arm",
    image: project2,
    url: "",
    github: "https://github.com/yourusername/robot-bionic-arm",
    description:
      "Developed a lightweight robotic arm with custom PID controllers and inverse kinematics for precise motion; integrated real-time ROS2 nodes for sensor fusion, adaptive actuation, and closed-loop feedback. Designed and 3D-printed modular mechanical components optimized for joint torque, response latency, and high precision manipulation tasks.",
    technologies: ["ROS2", "C++", "Python", "PID Control", "3D Printing"],
  },
  {
    title: "Niryo LLM Robotic Arm Integration",
    image: project3,
    url: "",
    description:
      "Integrated Niryo Ned2 robotic arm with computer vision and Large Language Model capabilities for intelligent object manipulation and task execution. Developed natural language interface allowing users to command robotic operations through conversational AI with real time task interpretation.",
    technologies: ["Python", "ROS2", "Computer Vision", "LLM"],
  },
  {
    title: "VR Firefighting & Flood Training Simulator",
    image: project4,
    url: "",
    description:
      "Built a fully interactive physics-based VR simulator in UE5 for firefighter training in multi-hazard flood/fire scenarios, including dynamic hazard propagation and environment response. Implemented immersive VR interaction systems in C++ for real-time collision detection, hazard-triggered events, and scenario-based rescue simulations.",
    technologies: ["Unreal Engine 5", "C++", "Physics Simulation", "VR"],
  },
  {
    title: "Maze-Bot ROS2 Navigation Platform",
    image: project5,
    url: "",
    description:
      "Developed comprehensive ROS2-based autonomous navigation platform featuring advanced algorithms, SLAM integration, and professional-grade testing framework for robotics research. Implemented sophisticated path planning algorithms including A*, RRT, and dynamic window approach for optimal navigation in complex environments.",
    technologies: ["ROS2", "C++", "SLAM", "Path Planning"],
  },
  {
    title: "House Price Prediction Model with MLOps",
    image: project1,
    url: "",
    description:
      "Developed an end-to-end ML pipeline for house price prediction, including data ingestion, preprocessing, feature engineering, and model training with log transformations, scaling, and one-hot encoding. Implemented multimodal model evaluation using RMSE, R², cross-validation, and set up workflow monitoring to track pipeline performance and ensure reproducibility.",
    technologies: ["Python", "Scikit-learn", "ZenML", "MLflow"],
  },
  {
    title: "Hiregeist Job Platform",
    image: project2,
    url: "",
    description:
      "Architected modern job placement platform designed to transform how students discover opportunities and companies find talent. Implemented intelligent matching algorithms and comprehensive user management system with real-time communication features.",
    technologies: ["Next.js 15", "React 19", "TypeScript"],
  },
];

export const CONTACT = {
  address: "©steeltroops🗼tokyo ²⁰²⁵",
  phoneNo: "+91 82734-83469",
  email: "steeltroops.ai@gmail.com",
};
