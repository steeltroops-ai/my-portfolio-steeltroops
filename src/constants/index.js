import project1 from "@/assets/projects/project-1.jpg";
import project2 from "@/assets/projects/project-2.jpg";
import project3 from "@/assets/projects/project-3.jpg";
import project4 from "@/assets/projects/project-4.jpg";
import project5 from "@/assets/projects/project-5.jpg";
import blackhole from "@/assets/projects/blackhole.jpg";
import blackhole1 from "@/assets/projects/blackhole1.jpg";

// Brand & Profile Images
import logo from "@/assets/mps.png";
import about from "@/assets/about.jpg";
import hodakabout from "@/assets/hodakabout.jpg";

export const IMAGES = {
  logo,
  profile: "/hodakaprofile.jpg", // Static path for immediate LCP discoverability (matches index.html preload)
  profileMobile: "/hodakaprofile_mobile.jpg",
  about,
  aboutAlt: hodakabout,
};

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
export const SITE_META = {
  title:
    "Mayank Pratap Singh (@steeltroops) | Production Engineer | Full Stack, ML & Robotics",
  description:
    "Building high-performance production systems. Expert in distributed backends, scalable ML pipelines (RAG, MLOps), and autonomous robotics (ROS2, SLAM). Shipped systems for healthcare, aerospace, and autonomous navigation.",
  keywords:
    "Mayank Pratap Singh, steeltroops, Software Engineer, Production Backend, Machine Learning, Robotics Engineer, Distributed Systems, Next.js, Python, ROS2, SLAM, RAG, MLOps, Trajectory Optimization, Medical Robotics, India, Tech Lead",
  siteUrl: "https://steeltroops.vercel.app",
  ogImage: "https://steeltroops.vercel.app/hodakaprofile.jpg",
};

// =====================================================
// HERO CONTENT
// =====================================================
export const HERO_CONTENT = [
  "I build production systems. Full stack, ML pipelines, robotics. The kind of work where 'it mostly works' isn't good enough.",
  "I've shipped across healthcare, aerospace, and autonomous systems. I pick hard problems, figure them out, and deliver something that actually holds up.",
  "If it needs to scale, think, not break or move, I've probably shipped it.",
];
// =====================================================
// ABOUT TEXT
// =====================================================
export const ABOUT_TEXT = [
  "I'm an engineer who builds across the full picture. Known across the community as @steeltroops, I work from frontend to backend to ML to hardware. I don't stop where my job title ends.",
  "I've led teams, started a company, and worked in rooms where I was the least experienced person. The last one taught me the most.",
  "I care about architecture. Not the buzzword kind. The kind where your system still works six months later when traffic doubles and nobody remembers how it was built.",
  "I learn fast, build faster, and I'm honest about what I don't know. That last part saves more time than most people realize.",
  "Most engineers pick a lane. I picked a problem space and learned whatever was needed to solve it. That's how you end up building ML pipelines on Monday and debugging ROS2 sensor nodes on Thursday.",
];
// =====================================================
// STATS - Key highlights
// =====================================================
export const HIGHLIGHT_STATS = [
  { label: "Experience", value: "2+ Years" },
  { label: "Systems Shipped", value: "15+" },
  { label: "Uptime", value: "99.3%" },
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
    imageAlt:
      "MediLens Clinical Intelligence Dashboard showing medical imaging and speech biomarker data",
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
    imageAlt:
      "RAG LLM Fact Checker interface for research paper semantic search and hallucination detection",
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
    imageAlt:
      "AI-Powered Drug Research Platform for molecule generation and protein interaction visualization",
    images: ["https://drug-research.vercel.app/molecule-bank"],
    url: "https://drug-research.vercel.app/",
    github: "",
    description: [
      "Architected a collaborative research platform for molecule generation and protein interaction visualization using LLM-driven prompt pipelines.",
      "Implemented multi-service backend architecture with real-time updates, experiment logging and secure access control for distributed research teams.",
    ],
    technologies: ["Next.js", "TypeScript", "MongoDB", "Nvidia NeMo", "RDKit"],
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
  {
    title: "Black Hole Simulation",
    image: "",
    images: [blackhole, blackhole1],
    url: "https://blackhole-simulation.vercel.app/",
    github: "https://github.com/steeltroops-ai/blackhole-simulation",
    description: [
      "Developed a real-time, interactive WebGL simulation of Schwarzschild/Kerr black holes using General Relativistic Ray Marching and GLSL.",
      "Implemented physically accurate gravitational lensing, volumetric accretion disks with Doppler beaming, and optimized adaptive step sizing for high-performance rendering.",
    ],
    technologies: ["Next.js", "WebGL", "GLSL", "TypeScript", "React"],
  },
  {
    title: "Robotics Telemetry Intelligence System",
    image: project4,
    images: [
      "https://res.cloudinary.com/canonical/image/fetch/f_auto,q_auto,fl_sanitize,c_fill,w_1600/https%3A%2F%2Fubuntu.com%2Fwp-content%2Fuploads%2F587d%2Fimage-1.png",
    ],
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
    github: "https://github.com/steeltroops-ai/Neza",
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
    images: [
      "https://t3.ftcdn.net/jpg/13/75/28/26/360_F_1375282680_4evcXpRfIBSe5Wi4ISRIPHwFuSiEqY40.jpg",
    ],
    url: "",
    github: "",
    description: [
      "Automated classification of dataset citations in scientific literature using NLP and ensemble ML with SciBERT and classical models.",
      "Classifies references as primary, secondary, or missing with detailed performance metrics and comprehensive evaluation framework.",
    ],
    technologies: ["Python", "SciBERT", "Ensemble Methods", "NLP"],
  },
  {
    title: "Pytorch Transformer Implementation",
    image: project5,
    images: [
      "https://image.slidesharecdn.com/paperpresentationmaroua-200416144727/75/Attention-Is-All-You-Need-presented-by-Maroua-Maachou-Veepee-1-2048.jpg",
    ],
    url: "",
    github: "https://github.com/steeltroops-ai/Pytorch-Transformer",
    description: [
      "Built the 'Attention is All You Need' transformer architecture from scratch, including self-attention, positional encodings, and beam search for sequence-to-sequence modeling.",
      "Created reproducible training pipelines with configuration management and attention map visualizations to improve interpretability of transformer layers.",
    ],
    technologies: ["Python", "PyTorch", "Transformers", "NLP"],
  },
  {
    title: "Finance Management App",
    image: project1,
    images: ["https://banking-jet.vercel.app/sign-in"],
    url: "https://banking-jet.vercel.app/sign-in",
    github: "https://github.com/steeltroops-ai/finanace-management-banking-app",
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
    url: "",
    github: "",
    description: [
      "Developed a lightweight robotic arm with custom PID controllers and inverse kinematics for precise motion; integrated real-time ROS2 nodes for sensor fusion, adaptive actuation, and closed-loop feedback.",
      "Designed and 3D-printed modular mechanical components optimized for joint torque, response latency, and high precision manipulation tasks.",
    ],
    technologies: ["ROS2", "C++", "Python", "PID Control", "3D Printing"],
  },
  {
    title: "Niryo LLM Robotic Arm Integration",
    image: project3,
    images: [
      "https://www.tegakari.net/wp-content/uploads/2020/05/niryo_ecosystem_img.jpg",
    ],
    url: "",
    github: "https://github.com/steeltroops-ai/Niryo-llm-robo",
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
    images: [
      "https://repository-images.githubusercontent.com/399864768/481a8c17-7750-4025-9b0d-a15ede469cf0",
    ],
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
    images: [
      "https://miro.medium.com/v2/resize:fit:1400/1*CfdC88fMxquhEFfWXlbtTA.jpeg",
      "https://miro.medium.com/1*NiK9cocmfSWmGYLmOGRwyg.png",
    ],
    url: "",
    github:
      "https://github.com/steeltroops-ai/House-Price-Prediction-with-MLOps",
    description: [
      "Developed an end-to-end ML pipeline for house price prediction, including data ingestion, preprocessing, feature engineering, and model training with log transformations, scaling, and one-hot encoding.",
      "Implemented multimodal model evaluation using RMSE, R², cross-validation, and set up workflow monitoring to track pipeline performance and ensure reproducibility.",
    ],
    technologies: ["Python", "Scikit-learn", "ZenML", "MLflow"],
  },
];
