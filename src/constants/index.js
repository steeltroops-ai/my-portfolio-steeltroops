import project1 from "@/assets/projects/project-1.jpg";
import project2 from "@/assets/projects/project-2.jpg";
import project3 from "@/assets/projects/project-3.jpg";
import project4 from "@/assets/projects/project-4.jpg";
import project5 from "@/assets/projects/project-5.jpg";

// =====================================================
// PERSONAL INFO - Easy to change
// =====================================================
export const PERSONAL = {
  name: "Mayank Pratap Singh",
  username: "@steeltroops",
  tagline: "Building things that matter.",
  role: "Full Stack, Robotics & ML Dev",
  location: "India",
  university: "GLA University",
  degree: "B.Tech in Computer Science Engineering (AI & ML)",
  cgpa: "8.3/10",
};

// =====================================================
// SOCIAL LINKS - All social media profiles
// =====================================================
export const SOCIALS = {
  twitter: "https://x.com/steeltroops_ai",
  github: "https://github.com/steeltroops-ai",
  instagram: "https://instagram.com/steeltroops_ai",
  linkedin: "https://linkedin.com/in/steeltroops-ai",
  bento: "https://bento.me/steeltroops",
};

// =====================================================
// CONTACT INFO
// =====================================================
export const CONTACT = {
  email: "steeltroops.ai@gmail.com",
  phoneNo: "+91 82734-83469",
  address: "India",
};

// =====================================================
// SITE META - SEO & Branding
// =====================================================
export const SITE_META = {
  title: "Mayank Pratap Singh | Full Stack & ML Engineer",
  description:
    "Full Stack Developer specializing in React, Node.js, Next.js, and AI/ML solutions. Building modern web applications and machine learning solutions.",
  keywords:
    "Mayank Pratap Singh, Full Stack Developer, React Developer, Node.js, Next.js, AI, Machine Learning, Web Development, JavaScript, TypeScript, Python, Robotics, ROS2, Portfolio",
  siteUrl: "https://steeltroops.vercel.app",
  ogImage: "https://steeltroops.vercel.app/profiletop.png",
};

// =====================================================
// HERO CONTENT
// =====================================================
export const HERO_CONTENT = [
  "Passionate Full Stack Developer and AI/ML enthusiast specializing in building robust, scalable web applications.",
  "Expertise in React 18, Next.js 14, and Vue 3, integrated with powerful backends like Node.js, Express, and FastAPI.",
  "Driven by a goal to leverage software engineering and machine learning to create innovative, impact-driven solutions.",
];

// =====================================================
// ABOUT TEXT
// =====================================================
export const ABOUT_TEXT = [
  "Dedicated and versatile Full Stack Developer with a passion for creating efficient, user-friendly experiences. Currently pursuing B.Tech in Computer Science (AI & ML) at GLA University with a CGPA of 8.3/10.",
  "My journey spans web development, robotics, and aerospace simulations—from co-founding a VR startup in Unreal Engine 5 to building production-ready web platforms with modern tech stacks.",
  "I thrive in collaborative environments, having led teams of 10+ members and secured victories in over 8 hackathons. When not coding, I'm contributing to open-source or exploring the next frontier of tech.",
];

// =====================================================
// STATS - Key highlights
// =====================================================
export const HIGHLIGHT_STATS = [
  { label: "Experience", value: "2+ Years" },
  { label: "Projects", value: "40+" },
  { label: "Technologies", value: "15+" },
];

// =====================================================
// EXPERIENCES
// =====================================================
export const EXPERIENCES = [
  {
    year: "Oct 2024 - Nov 2025",
    role: "Software Engineer, Backend & Integration",
    company: "SS Innovations, India",
    description: [
      "Designed multi-service architecture separating telemetry ingestion (Node.js), processing (Python/MLflow), and visualization (Next.js/PostgreSQL) layers to support 10x data volume growth with horizontal scaling capabilities.",
      "Led architecture decisions including schema design for time-series medical data, service boundary definitions, caching strategies with Redis, and observability pipelines using structured logging and CloudWatch integration.",
      "Built production ML pipelines for surgical anomaly detection with MLflow experiment tracking, achieving 99.2% uptime through comprehensive monitoring and rapid incident response during on-call rotations.",
      "Participated in production monitoring, logging and incident response to maintain continuous system availability.",
    ],
    technologies: [
      "Node.js",
      "Python",
      "MLflow",
      "Next.js",
      "PostgreSQL",
      "Redis",
      "CloudWatch",
    ],
  },
  {
    year: "Jul 2023 - Dec 2023",
    role: "Research Intern - Flight Dynamics & Simulation",
    company: "Orbitx India Aerospace, India",
    description: [
      "Designed trajectory optimization simulation systems using PPO and DDPG reinforcement learning models, improving algorithm convergence efficiency by 48% through modular architecture redesign and hyperparameter experimentation.",
      "Built structured experimentation pipelines with reproducible evaluation metrics and version-controlled models to support scalable aerospace research validation.",
      "Applied numerical methods, system modeling, and performance optimization to large-scale simulation workloads processing millions of trajectory calculations.",
    ],
    technologies: [
      "Python",
      "PPO",
      "DDPG",
      "Reinforcement Learning",
      "Numerical Methods",
    ],
  },
  {
    year: "Oct 2022 - May 2024",
    role: "Founder & Tech Lead",
    company: "Inexia, India",
    description: [
      "Led development of a VR-based research and simulation platform using Unreal Engine 5 for interactive experimentation, integrated with cloud dashboards built in Next.js and PostgreSQL to support experiment logging and real-time collaboration for 50+ users.",
      "Translated user feedback and product discovery discussions into technical feature implementations, shipping 8 validated iterations over 6 months in a fast-moving student startup environment.",
      "Designed modular backend services and structured data schemas for experiment tracking, while establishing documentation, version control workflows, and basic unit testing standards across a 10-member distributed student team.",
    ],
    technologies: [
      "Unreal Engine 5",
      "C++",
      "Next.js",
      "PostgreSQL",
      "Unit Testing",
    ],
  },
  {
    year: "Sep 2022 - Mar 2024",
    role: "Vice President & Robotics Team lead",
    company: "Droid Robotics Club, GLAU",
    description: [
      "Designed modular robotics architectures using ROS2, integrating perception, planning, and control stacks across distributed nodes with real-time pub/sub communication patterns.",
      "Implemented autonomous navigation pipelines including SLAM, RRT* path planning, sensor fusion (LiDAR/IMU), and state estimation for multi-sensor environments.",
      "Mentored 20+ engineering students on distributed systems debugging, ROS graph optimization, and software architecture best practices for production robotics.",
    ],
    technologies: [
      "ROS2",
      "SLAM",
      "Path Planning",
      "Sensor Fusion",
      "Distributed Systems",
    ],
  },
];

// =====================================================
// PROJECTS
// =====================================================
export const PROJECTS = [
  {
    title: "MediLens Clinical Intelligence Platform",
    image: "",
    images: [
      "https://medilenss.vercel.app/",
      "https://medilenss.vercel.app/dashboard",
      "https://medilenss.vercel.app/dashboard/speech",
    ],
    url: "https://medilenss.vercel.app/",
    github: "https://github.com/steeltroops-ai/medilens",
    description: [
      "Designed a distributed clinical research platform integrating medical imaging, speech biomarkers and structured patient data into unified dashboards for reproducible evaluation workflows.",
      "Implemented model serving pipelines with experiment tracking (MLflow), RBAC security, and reproducible evaluation workflows achieving <200ms inference latency for real-time clinical application.",
    ],
    technologies: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL", "PyTorch"],
  },
  {
    title: "RAG LLM Fact Checker",
    image: "",
    images: ["https://llm-fact-checker.vercel.app/"],
    url: "https://llm-fact-checker.vercel.app/",
    github: "https://github.com/steeltroops-ai/llm-fact-checker",
    description: [
      "Built production retrieval-augmented generation system indexing research papers with semantic search, achieving <200ms query latency through optimized embedding strategies and caching.",
      "Designed scalable chunking strategies (512-token overlapping windows), pgvector indexing, and context-aware LLM summarization with hallucination detection and source attribution.",
    ],
    technologies: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Vector Embeddings",
      "LLM APIs",
    ],
  },
  {
    title: "AI-Powered Drug Research Platform",
    image: project3,
    images: [project3],
    url: "",
    github: "",
    description: [
      "Architected a collaborative research platform for molecule generation and protein interaction visualization using LLM-driven prompt pipelines.",
      "Implemented multi-service backend architecture with real-time updates, experiment logging and secure access control for distributed research teams.",
    ],
    technologies: ["Next.js", "TypeScript", "MongoDB", "Nvidia NeMo", "RDKit"],
  },
  {
    title: "Robotics Telemetry Intelligence System",
    image: project4,
    images: [project4],
    url: "",
    github: "",
    description: [
      "Developed scalable services to ingest and analyze real-time surgical robotics telemetry using anomaly detection and time-series optimization models.",
      "Built structured logging, monitoring and reproducible ML pipelines to ensure production reliability and research traceability.",
    ],
    technologies: ["Next.js", "Node.js", "PostgreSQL", "Python", "MLFlow"],
  },
  {
    title: "Research Knowledge Graph & Semantic Explorer",
    image: project5,
    images: [project5],
    url: "",
    github: "",
    description: [
      "Designed a structured knowledge graph mapping researchers, publications and datasets into relational and semantic models and indexed 2k+ research papers using embedding-based semantic search with optimized chunking and retrieval reranking.",
      "Integrated LLM-based entity extraction and embedding pipelines to automate metadata enrichment and enable relationship mapping.",
    ],
    technologies: ["TypeScript", "PostgreSQL", "LLM APIs", "Embeddings"],
  },
  {
    title: "Neza Digital Marketplace",
    image: project1,
    images: [project1],
    url: "",
    github: "",
    description: [
      "Developed a digital service marketplace connecting households and businesses with local service providers.",
      "Implemented multi-user architecture, secure authentication, real-time service listing, and provider management.",
      "Integrated payment workflows via Razorpay, role-based access control, and responsive design, ensuring seamless transactions and optimal user experience.",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "Razorpay",
      "Authentication",
    ],
  },
  {
    title: "MDC Dataset Citation Classification",
    image: project2,
    images: [project2],
    url: "",
    github: "",
    description: [
      "Automated classification of dataset citations in scientific literature using NLP and ensemble ML with SciBERT and classical models.",
      "Classifies references as primary, secondary, or missing with detailed performance metrics and comprehensive evaluation framework.",
    ],
    technologies: ["Python", "SciBERT", "Ensemble Methods", "NLP"],
  },
  {
    title: "NeuraLens Neurological Assessment",
    image: project4,
    images: [project4],
    url: "",
    github: "",
    description: [
      "Built a multimodal neurological assessment platform integrating speech analysis, retinal imaging, motor evaluation, and cognitive testing into a unified dashboard.",
      "Implemented real-time data analysis, secure data management, and responsive visualization for clinical use.",
    ],
    technologies: ["Next.js", "TypeScript", "Python", "ML Frameworks"],
  },
  {
    title: "Transformer Model Implementation",
    image: project5,
    images: [project5],
    url: "https://transformer-viz.vercel.app/",
    github: "https://github.com/steeltroops-ai/transformer-implementation",
    description: [
      "Built the 'Attention is All You Need' transformer architecture from scratch, including self-attention, positional encodings, and beam search for sequence-to-sequence modeling.",
      "Created reproducible training pipelines with configuration management and attention map visualizations to improve interpretability of transformer layers.",
    ],
    technologies: ["Python", "PyTorch", "Transformers", "NLP"],
  },
  {
    title: "Finance Management App",
    image: project1,
    images: [project1],
    url: "https://finance-manage.vercel.app/",
    github: "https://github.com/steeltroops-ai/finance-app",
    description: [
      "Built a finance management platform enabling secure multi-bank linking, real-time fund tracking, and seamless transfers.",
      "Implemented server-side rendering (SSR) authentication, responsive dashboards, and categorized spending insights for a smooth, dynamic user experience.",
    ],
    technologies: ["Next.js", "TypeScript", "Plaid", "Dwolla", "Appwrite"],
  },
  {
    title: "Robot Bionic Arm",
    image: project2,
    images: [project2],
    url: "https://bionic-arm-sim.vercel.app/",
    github: "https://github.com/steeltroops-ai/robot-bionic-arm",
    description: [
      "Developed a lightweight robotic arm with custom PID controllers and inverse kinematics for precise motion; integrated real-time ROS2 nodes for sensor fusion, adaptive actuation, and closed-loop feedback.",
      "Designed and 3D-printed modular mechanical components optimized for joint torque, response latency, and high precision manipulation tasks.",
    ],
    technologies: ["ROS2", "C++", "Python", "PID Control", "3D Printing"],
  },
  {
    title: "Niryo LLM Robotic Arm Integration",
    image: project3,
    images: [project3],
    url: "",
    github: "",
    description: [
      "Integrated Niryo Ned2 robotic arm with computer vision and Large Language Model capabilities for intelligent object manipulation and task execution.",
      "Developed natural language interface allowing users to command robotic operations through conversational AI with real time task interpretation.",
    ],
    technologies: ["Python", "ROS2", "Computer Vision", "LLM"],
  },
  {
    title: "VR Firefighting & Flood Training Simulator",
    image: project4,
    images: [project4],
    url: "",
    github: "",
    description: [
      "Built a fully interactive physics-based VR simulator in UE5 for firefighter training in multi-hazard flood/fire scenarios, including dynamic hazard propagation and environment response.",
      "Implemented immersive VR interaction systems in C++ for real-time collision detection, hazard-triggered events, and scenario-based rescue simulations.",
    ],
    technologies: ["Unreal Engine 5", "C++", "Physics Simulation", "VR"],
  },
  {
    title: "Maze-Bot ROS2 Navigation Platform",
    image: project5,
    images: [project5],
    url: "",
    github: "",
    description: [
      "Developed comprehensive ROS2-based autonomous navigation platform featuring advanced algorithms, SLAM integration, and professional-grade testing framework for robotics research.",
      "Implemented sophisticated path planning algorithms including A*, RRT, and dynamic window approach for optimal navigation in complex environments.",
    ],
    technologies: ["ROS2", "C++", "SLAM", "Path Planning"],
  },
  {
    title: "House Price Prediction Model with MLOps",
    image: project1,
    images: [project1],
    url: "",
    github: "",
    description: [
      "Developed an end-to-end ML pipeline for house price prediction, including data ingestion, preprocessing, feature engineering, and model training with log transformations, scaling, and one-hot encoding.",
      "Implemented multimodal model evaluation using RMSE, R², cross-validation, and set up workflow monitoring to track pipeline performance and ensure reproducibility.",
    ],
    technologies: ["Python", "Scikit-learn", "ZenML", "MLflow"],
  },
  {
    title: "Hiregeist Job Platform",
    image: "",
    images: ["https://hiregeist.vercel.app/"],
    url: "https://hiregeist.vercel.app/",
    github: "https://github.com/steeltroops-ai/Hiregeist",
    description: [
      "Architected modern job placement platform designed to transform how students discover opportunities and companies find talent.",
      "Implemented intelligent matching algorithms and comprehensive user management system with real-time communication features.",
    ],
    technologies: ["Next.js 15", "React 19", "TypeScript"],
  },
];
