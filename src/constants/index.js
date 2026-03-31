
import blackhole from "@/assets/projects/blackhole.jpg?as=srcset&w=800;1200;1600;2400&format=webp";
import blackhole1 from "@/assets/projects/blackhole1.jpg?as=srcset&w=800;1200;1600;2400&format=webp";
import robot_bionic_arm from "@/assets/projects/robot_bionic_arm.png?as=srcset&w=800;1200;1600;2400&format=webp";
import maze_bot from "@/assets/projects/maze_bot.png?as=srcset&w=800;1200;1600;2400&format=webp";
import vr_firefighting from "@/assets/projects/vr_firefighting.png?as=srcset&w=800;1200;1600;2400&format=webp";
import debris_guard from "@/assets/projects/debris_guard.png?as=srcset&w=800;1200;1600;2400&format=webp";
import metro_quant from "@/assets/projects/metro_quant.png?as=srcset&w=800;1200;1600;2400&format=webp";
import alyx_hep from "@/assets/projects/alyx_hep.png?as=srcset&w=800;1200;1600;2400&format=webp";
import ai_drug_research from "@/assets/projects/ai_drug_research.png?as=srcset&w=800;1200;1600;2400&format=webp";
import niryo_robotic_arm from "@/assets/projects/niryo_robotic_arm.png?as=srcset&w=800;1200;1600;2400&format=webp";
import blackhole_cpp from "@/assets/projects/blackhole_cpp.png?as=srcset&w=800;1200;1600;2400&format=webp";
import pytorch_transformer from "@/assets/projects/pytorch_transformer.png?as=srcset&w=800;1200;1600;2400&format=webp";
import mdc_citation from "@/assets/projects/mdc_citation.png?as=srcset&w=800;1200;1600;2400&format=webp";
import ros2_robot_stack from "@/assets/projects/ros2_robot_stack.png?as=srcset&w=800;1200;1600;2400&format=webp";
import knowledge_graph from "@/assets/projects/knowledge_graph.png?as=srcset&w=800;1200;1600;2400&format=webp";
import neza_marketplace from "@/assets/projects/neza_marketplace.png?as=srcset&w=800;1200;1600;2400&format=webp";

// Brand & Profile Images
import logo from "@/assets/logo.webp";
import about from "@/assets/about.jpg";
import hodakabout from "@/assets/about1.webp";
import mpsLogo from "@/assets/mps.png";

// Placeholder for missing images to prevent broken UI
const PLACEHOLDER_PROJECT =
  "https://images.unsplash.com/photo-1620641788421-7f1c91ade633?q=80&w=800";

export const IMAGES = {
  logo,
  adminLogo: mpsLogo,
  profile: "/profile.webp", // WebP for modern browsers (index.html preloads this)
  profileJpg: "/profile.jpg", // Fallback/OG Image
  profileMobile: "/profile.webp",
  favicon: "/favicon-32x32.png",
  about,
  aboutAlt: hodakabout,

  robot_bionic_arm,
  maze_bot,
  vr_firefighting,
  debris_guard,
  metro_quant,
  alyx_hep,
  ai_drug_research,
  niryo_robotic_arm,
  blackhole_cpp,
  pytorch_transformer,
  mdc_citation,
  ros2_robot_stack,
  knowledge_graph,
  neza_marketplace,
};

// =====================================================
// PERSONAL INFO - Easy to change
// =====================================================
export const PERSONAL = {
  name: "Mayank Pratap Singh",
  username: "@steeltroops",
  tagline1: "Builds Production Grade Systems.",
  tagline2: "Software, Intelligence & Hardware.",
  role: "Full Stack, Robotics & ML Engineer",
  location: "India",
  university: "GLA University",
  degree: "B.Tech, Computer Science (AI & ML)",
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
  bento: "https://own.page/steeltroops",
};

// =====================================================
// CONTACT INFO
// =====================================================
export const CONTACT = {
  email: "steeltroops.ai@gmail.com",
  phoneNo: "+91 not-available",
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
  ogImage: "https://steeltroops.vercel.app/profile.jpg", // JPG for better social compatibility
};

// =====================================================
// HERO CONTENT
// =====================================================
export const HERO_CONTENT = [
  "I build production systems. Full stack, ML pipelines, robotics. The kind of work where 'it mostly works' isn't good enough.",
  "I've shipped across healthcare, aerospace, and autonomous systems. I pick hard problems, figure them out, and deliver something that actually holds up.",
  "If it needs to move in the real world or scale in the cloud and survive production traffic, I've probably shipped it.",
];
// =====================================================
// ABOUT TEXT
// =====================================================
export const ABOUT_TEXT = [
  "I'm an engineer who builds across the full picture. Known across the community as @steeltroops, I work from frontend to backend to ML to hardware. I don't stop where my job title ends.",
  "I've led teams, founded a startup, and worked in rooms where I was the least experienced person. The last one taught me the most.",
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
  { label: "Uptime", value: "99%" },
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
// PROJECTS — steeltroops-ai
// Last updated: March 2026
// Source: github.com/steeltroops-ai + live portfolio
// Order: strategic — most technically impressive first
// =====================================================

export const PROJECTS = [
  // ─────────────────────────────────────────────────
  // TIER 1 — FLAGSHIP
  // ─────────────────────────────────────────────────

  {
    title: "Black Hole Simulation",
    categories: ["Flagship"],
    image: blackhole,
    imageAlt:
      "Real-time Kerr black hole ray-marching simulation with gravitational lensing, accretion disk and Doppler shifting rendered via WebGPU",
    images: [blackhole, blackhole1],
    url: "https://blackhole-simulation.vercel.app/",
    github: "https://github.com/steeltroops-ai/blackhole-simulation",
    description: [
      "Real-time relativistic ray-marching engine in the browser, solves Null Geodesic Equations in Kerr spacetime to render gravitational lensing, Doppler beaming, and volumetric accretion disk physics at interactive framerates. Rust physics kernel compiled to WASM; GLSL/WGSL shaders with WebGPU primary and WebGL 2.0 fallback.",
      "Production rendering pipeline: custom TAA with Variance Clipping, 9-tap Gaussian bloom pyramid, NaN/Inf shielding and Riccati-clamping for numerical stability, exponential transmittance integration for flicker-free sampling.",
      "Adaptive RKF45 (Rust/CPU) and Velocity Verlet (GPU) ODE solvers. WIP Neural Radiance Surrogate (NRS) training bridge for pre-computing celestial backgrounds.",
    ],
    technologies: [
      "Next.js 14",
      "WebGPU / WebGL 2.0",
      "Rust + WASM",
      "GLSL / WGSL",
      "TypeScript",
      "React Three Fiber",
      "Bun",
    ],
  },

  {
    title: "OmniContext - Semantic Code Context Engine for AI Agents",
    categories: ["Flagship", "Fullstack", "ML"],
    image: null,
    imageAlt:
      "OmniContext MCP server architecture showing hybrid HNSW vector search, tree-sitter AST extraction across 16 languages and zero-config AI IDE integration",
    images: ["https://omnicontextt.vercel.app/"],
    url: "https://omnicontextt.vercel.app/",
    github: "https://github.com/steeltroops-ai/omnicontext",
    description: [
      "Natively compiled Rust MCP server that exposes structured codebase abstraction to AI agents, AST parsing via tree-sitter across 16 languages, local semantic embeddings via CodeRankEmbed (ONNX runtime), hybrid SQLite index with HNSW vector search + BM25 full-text reranking. Zero cloud API calls.",
      "Auto-injects the MCP manifest into Claude Desktop, Cursor, Windsurf, Cline, Kiro, and Claude Code CLI on install. Zero-config binary distributed via VS Code Marketplace, Open VSX, Homebrew, Scoop, WinGet, and Cargo.",
      "Apache 2.0. Cross-platform: Windows, macOS, Linux.",
    ],
    technologies: [
      "Rust",
      "TypeScript",
      "MCP (Model Context Protocol)",
      "tree-sitter",
      "ONNX Runtime",
      "HNSW",
      "SQLite",
      "VS Code Extension",
    ],
  },

  {
    title: "MediLens - Clinical AI Intelligence Platform",
    categories: ["Flagship", "Fullstack", "ML"],
    image: null,
    imageAlt:
      "MediLens multimodal AI clinical dashboard showing medical imaging, speech biomarkers, and diagnostic modules with accuracy metrics",
    images: [
      "https://medilenss.vercel.app/",
      "https://medilenss.vercel.app/dashboard",
      "https://medilenss.vercel.app/dashboard/speech",
    ],
    url: "https://medilenss.vercel.app/",
    github: "https://github.com/steeltroops-ai/MediLens",
    description: [
      "Production multimodal AI diagnostics platform with 10 clinical modules across vision, audio, and structured data. Accuracy: RetinaScan 93.0%, ChestXplorer 97.8%, CardioPredict 99.8%, SpeechMD 95.2%, SkinSense 94.5%, Motor 93.5%, Cognitive 92.1%, NeuroScan 91.4%, RespiRate 93.2%, NRI Fusion 97.2%.",
      "Distributed FastAPI inference layer with sub-200ms latency, MLflow experiment tracking, RBAC with audit logging, and Amazon Polly speech synthesis.",
      "HIPAA-compliant, FDA-ready architecture. PostgreSQL + Redis backend designed for horizontal scaling. Deployed and live.",
    ],
    technologies: [
      "Next.js 16",
      "TypeScript",
      "FastAPI",
      "PyTorch",
      "PostgreSQL",
      "MLflow",
      "Amazon Polly",
      "Redis",
    ],
  },

  {
    title: "MedScribe AI - Agentic Clinical Documentation (MedGemma)",
    categories: ["Flagship", "Fullstack", "ML"],
    image: null,
    imageAlt:
      "MedScribe AI ReAct agent dashboard showing cognitive routing loop, HAI-DEF tool calls, SOAP note generation and FHIR R4 output with SSE streaming",
    images: ["https://medscribbe.vercel.app/"],
    url: "https://medscribbe.vercel.app/",
    github: "https://github.com/steeltroops-ai/med-gemma",
    description: [
      "ReAct cognitive loop where MedGemma 27B reasons over clinical context and dispatches 5 Google HAI-DEF models as tools: MedASR, MedSigLIP-448 (image triage), MedGemma-4B (SOAP + ICD-10), TxGemma-2B (drug interactions), FHIR R4 compiler. 14s mean latency; 128ms deterministic fallback.",
      "Drug safety check runs entirely in-browser via WebGPU (Gemma 2B q4f16_1), PHI never leaves the device. LoRA fine-tuned MedGemma 4B on 54 SOAP pairs (r=16, alpha=32). Agent reasoning streams live via SSE.",
      "FastAPI on HuggingFace Spaces. 10-scenario synthetic eval framework, per-agent telemetry, C4 architecture docs. Competition project. Python 3.12, CC BY 4.0.",
    ],
    technologies: [
      "Python 3.12",
      "MedGemma 27B / 4B",
      "TxGemma 2B",
      "MedSigLIP-448",
      "MedASR",
      "LoRA Fine-tuning",
      "FastAPI",
      "Next.js 16",
      "WebGPU",
      "FHIR R4",
      "HuggingFace Spaces",
      "SSE",
    ],
  },

  {
    title: "ROS2 Robot Stack - Online Robotics Personal Lab",
    categories: ["Flagship", "Fullstack", "ML", "Robotics"],
    image: ros2_robot_stack,
    imageAlt:
      "ROS2 Robot Stack 3D operator dashboard showing real-time robot telemetry, AMR navigation and AI perception overlay",
    images: [ros2_robot_stack],
    url: "https://omniiverse.vercel.app/",
    github: "https://github.com/steeltroops-ai/ros2-robot-stack",
    description: [
      "Full-stack multi-robot fleet management platform: ROS 2 Humble (Nav2, MoveIt2, Gazebo) bridged to the web via Fastify + rclnodejs + Socket.IO backend, with a Next.js 16 / React Three Fiber 3D dashboard rendering real-time telemetry and sensor overlays.",
      "FastAPI + PyTorch + YOLOv8 ML perception service for computer vision and autonomy. Monorepo: frontend, backend, ML service, robotics workspace, independent services under Docker with shared TypeScript contracts.",
      "Phase 1 (AMR sim, telemetry, 2D map) complete. Roadmap: Nav2, 6-DOF arm, LLM commanding, 10+ robot swarm. Deployed on HuggingFace Spaces via Docker.",
    ],
    technologies: [
      "ROS 2 Humble",
      "Next.js 16",
      "React Three Fiber",
      "Fastify",
      "Socket.IO",
      "rclnodejs",
      "FastAPI",
      "PyTorch",
      "YOLOv8",
      "Nav2",
      "MoveIt2",
      "Gazebo",
      "Docker",
    ],
  },

  {
    title: "NeuraForge - AI-Native Research Operating System",
    categories: ["Flagship", "Fullstack", "ML"],
    image: null,
    imageAlt:
      "NeuraForge research OS dashboard showing multi-agent collaboration, semantic workspace, and AI peer review simulation",
    images: ["https://neuraaforge.vercel.app/"],
    url: "https://neuraaforge.vercel.app/",
    github: "https://github.com/steeltroops-ai/NeuraForge",
    description: [
      "AI-agent-native research OS, orchestrates domain-specialized agents (math, coding, physics, biology, policy) in parallel, each maintaining long-context reasoning memory and persistent knowledge graphs. Turborepo monorepo: Next.js 14, Fastify + Socket.IO, PostgreSQL + Prisma, Clerk.",
      "Research workflow suite: semantic canvas with live agent commentary, automated citation engine, AI co-authorship pipeline, cross-lab knowledge federation.",
      "Peer-review simulation (agents as domain reviewers) and structured debate arena for hypothesis testing. Designed as Decentralized Research Infrastructure (DRI). Live.",
    ],
    technologies: [
      "Next.js 14",
      "TypeScript",
      "Fastify",
      "Socket.IO",
      "Turborepo",
      "PostgreSQL",
      "Prisma",
      "Clerk",
      "Bun",
    ],
  },

  // ─────────────────────────────────────────────────
  // TIER 2 — STRONG TECHNICAL
  // ─────────────────────────────────────────────────

  {
    title: "My Portfolio - Agentic Full-Stack Personal Ecosystem",
    categories: ["Flagship", "Fullstack", "ML"],
    image: null,
    imageAlt:
      "OmniVerse portfolio dashboard showing real-time analytics, AI-automated blog generation workspace, and secure message management system",
    images: ["https://steeltroops.vercel.app/"],
    url: "https://steeltroops.vercel.app/",
    github: "https://github.com/steeltroops-ai/my-portfolio-steeltroops",
    description: [
      "Production-grade personal ecosystem featuring an AI-automated blog generation engine with automated data collection, SEO optimization, and an integrated admin workspace for content orchestration.",
      "Live analytics dashboard for visitor tracking, interaction telemetry, and lead-gen message management with secure end-to-end communication channels.",
      "Built with high-performance Next.js 15, React 19, and Framer Motion for premium aesthetics. Backend integrated with secure database layers for persistence and real-time updates.",
    ],
    technologies: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "AI Block Generation",
      "Admin Analytics",
      "Bun",
    ],
  },

  {
    title: "RAG LLM Fact Checker",
    categories: ["Fullstack", "ML"],
    image: null,
    imageAlt:
      "RAG LLM Fact Checker interface for semantic research paper search and hallucination detection",
    images: ["https://llm-fact-checker.vercel.app/"],
    url: "https://llm-fact-checker.vercel.app/",
    github: "https://github.com/steeltroops-ai/llm-fact-checker",
    description: [
      "Production RAG system that indexes research papers and delivers fact-checked LLM responses with source attribution. Sub-200ms query latency via pgvector indexing, 512-token overlapping chunks, and embedding cache warming.",
      "Hallucination detection layer cross-references generated claims against retrieved source chunks before responding, significantly tighter than naive RAG.",
      "FastAPI async serving, PostgreSQL + Redis caching. Deployed and live.",
    ],
    technologies: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "pgvector",
      "LLM APIs",
      "Vector Embeddings",
      "Redis",
    ],
  },

  {
    title: "PaperForge-rs - Rust Semantic Research Retrieval Microservice",
    categories: ["Fullstack", "ML"],
    image: null,
    imageAlt:
      "PaperForge-rs hexagonal Rust microservice crates with pgvector HNSW hybrid search and Prometheus observability",
    images: ["https://paperforge-rs.vercel.app/"],
    url: "https://paperforge-rs.vercel.app/",
    github: "https://github.com/steeltroops-ai/paperforge-rs",
    description: [
      "Production async Rust microservice for academic paper indexing and retrieval. Hexagonal architecture (Tokio, Axum) across a multi-crate workspace: gateway, search, ingestion, context, embedding-worker. Sea-ORM + raw SQLx for vector ops.",
      "Hybrid search: pgvector cosine similarity + BM25 full-text ranking over HNSW indices. Sub-millisecond retrieval; async concurrent ingestion pipeline.",
      "Prometheus /metrics, JSON structured logging, Docker Compose + Kubernetes HPA manifests. Designed for AWS ECS Fargate + RDS PostgreSQL. Next.js frontend on Vercel.",
    ],
    technologies: [
      "Rust",
      "Tokio",
      "Axum",
      "PostgreSQL",
      "pgvector",
      "Sea-ORM",
      "HNSW",
      "Prometheus",
      "Docker",
      "Next.js",
    ],
  },

  {
    title: "Metro-Quant - Adaptive Algorithmic Trading Bot (HackaTUM 2025)",
    categories: ["ML"],
    image: metro_quant,
    imageAlt:
      "Metro-Quant IMC Munich ETF trading bot dashboard showing live signal generation from Munich city data, regime detection and real-time PnL tracking",
    images: [metro_quant],
    url: "",
    github: "https://github.com/steeltroops-ai/Metro-Quant",
    description: [
      "Adaptive algorithmic trading bot built for the IMC Munich ETF Challenge at HackaTUM 2025, discovers alpha in live Munich city data (weather, air quality, flights) and trades on IMC's simulated exchange. Signal generation uses engineered features with Kalman filtering for noise reduction, producing [-1.0, 1.0] strength scores.",
      "Real-time market regime detection (trending, mean-reverting, high/low volatility) drives adaptive strategy adjustment. Risk management: 20% per-position limit, 80% total exposure cap, 15% drawdown reduction threshold, 25% emergency shutdown.",
      "Full async Python architecture with < 100ms data-to-order latency. Streamlit real-time dashboard (PnL, signal viz, regime status). Backtesting engine with Hypothesis property-based tests. Sharpe target > 1.5, max drawdown < 20%.",
    ],
    technologies: [
      "Python",
      "Async I/O",
      "Kalman Filter",
      "Regime Detection",
      "Streamlit",
      "Hypothesis",
      "Prometheus",
      "Numba JIT",
    ],
  },

  {
    title: "ALYX - Distributed High-Energy Physics Analysis Orchestrator",
    categories: ["Fullstack"],
    image: alyx_hep,
    imageAlt:
      "ALYX distributed HEP analysis dashboard with Three.js 3D particle trajectory visualization, job scheduler and Monaco Editor notebooks",
    images: [alyx_hep],
    url: "",
    github: "https://github.com/steeltroops-ai/ALYX",
    description: [
      "Distributed analysis orchestrator for high-energy physics, processes collision events at petabyte scale, modeled on ALICE experiment workflows. Spring Boot 3.2 / Spring Cloud microservices: job scheduler, data router, result aggregator, ML resource optimizer, and real-time collaboration service.",
      "React + Three.js 3D particle trajectory visualization, Monaco Editor analysis notebooks, visual query builder. Apache Spark for distributed processing; Apache Kafka for real-time event streaming.",
      "Targets 50K+ events/second, 400+ concurrent users, sub-second response for 99% of queries. JUnit 5 + QuickCheck (backend); Vitest + fast-check (frontend).",
    ],
    technologies: [
      "Java",
      "Spring Boot 3.2",
      "Spring Cloud",
      "Apache Spark",
      "Apache Kafka",
      "React",
      "TypeScript",
      "Three.js",
      "Monaco Editor",
      "PostgreSQL",
    ],
  },

  {
    title: "CORE - Research-to-Commercialization Intelligence Platform",
    categories: ["Fullstack", "ML"],
    image: null,
    imageAlt:
      "CORE platform transforming research papers into startup evaluations, VC summaries and GTM strategies via AI agents",
    images: ["https://core-five-phi.vercel.app/"],
    url: "https://core-five-phi.vercel.app/",
    github: "https://github.com/steeltroops-ai/CORE",
    description: [
      "Hackathon platform (Track 1: Tech Transfer) that transforms research inputs into commercial intelligence, startup feasibility, VC investment summaries, and GTM strategy via AI pipelines.",
      "FastAPI backend with Logic Mill, Beyond Presence, and ElevenLabs narration stubs. Next.js App Router frontend: research ingestor, insight tabs, agent console, narration controls.",
      "Full-stack TypeScript + Python. Render backend, Vercel frontend. Live.",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "FastAPI",
      "Python",
      "LLM APIs",
      "Render",
    ],
  },

  {
    title: "MemeCoin Casino - Provably Fair Solana DEX Casino",
    categories: ["Fullstack"],
    image: null,
    imageAlt:
      "MemeCoin Casino decentralized Solana casino showing SPL token betting, liquidity pool creation and on-chain provably fair game results",
    images: ["https://memecoin-casino.vercel.app/"],
    url: "https://memecoin-casino.vercel.app/",
    github: "https://github.com/steeltroops-ai/memecoin-casino",
    description: [
      "Decentralized provably fair casino on Solana (Anchor framework) supporting any SPL token, uses Solana blockhashes for transparent on-chain randomness with a complete proof trail per game.",
      "Users can become the house by creating SPL liquidity pools and earning house edge. Coin flip at 1.96x (2% edge); max bet gated at 1% of pool liquidity. Dice roll and roulette on roadmap.",
      "Rust smart contracts, Next.js + TypeScript frontend, Solana wallet adapter. Full anchor test suite.",
    ],
    technologies: [
      "Rust",
      "Solana",
      "Anchor Framework",
      "Next.js",
      "TypeScript",
      "Solana Wallet Adapter",
      "Tailwind CSS",
    ],
  },

  {
    title: "Hiregeist - AI Job Placement Platform",
    categories: ["Fullstack", "ML"],
    image: null,
    imageAlt:
      "Hiregeist job placement platform dashboard with AI-powered candidate matching and real-time communication",
    images: ["https://hiregeist.vercel.app/"],
    url: "https://hiregeist.vercel.app/",
    github: "https://github.com/steeltroops-ai/Hiregeist",
    description: [
      "Full-stack job placement platform on Next.js 15 / React 19 with a zero-trust security model, AI-powered candidate-to-role matching and real-time WebSocket communication.",
      "Multi-role user management (students, companies, admins), wellbeing features embedded in the product flow, and enterprise-grade RBAC.",
      "TypeScript end-to-end. Deployed and live.",
    ],
    technologies: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "WebSockets",
      "Zero-trust Auth",
    ],
  },

  {
    title: "AI-Powered Drug Research Platform",
    categories: ["Fullstack", "ML"],
    image: ai_drug_research,
    imageAlt:
      "AI Drug Research Platform showing molecule generation, protein folding visualization and collaborative researcher workspace",
    images: [ai_drug_research, "https://drug-research.vercel.app/molecule-bank"],
    url: "https://drug-research.vercel.app/",
    github: "",
    description: [
      "Collaborative computational drug research platform, AI-driven molecule generation and 2D protein folding visualization via Nvidia NeMo + RDKit cheminformatics pipelines.",
      "Real-time collaborative editing, experiment logging, and RBAC via NextAuth. LLM prompt pipelines translate natural language queries into molecule generation jobs.",
      "MongoDB-backed research state. Deployed and live.",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "MongoDB",
      "Nvidia NeMo",
      "RDKit",
      "NextAuth",
      "LLM APIs",
    ],
  },

  {
    title: "Research Knowledge Graph & Semantic Explorer",
    categories: ["Fullstack", "ML"],
    image: knowledge_graph,
    imageAlt:
      "Research knowledge graph mapping 2000+ indexed papers, researchers and datasets via semantic embedding search",
    images: [knowledge_graph],
    url: "",
    github: "",
    description: [
      "Structured knowledge graph mapping researchers, publications, and datasets, 2,000+ papers indexed with embedding-based semantic search, pgvector indexing, and retrieval reranking.",
      "LLM-based entity extraction for automated metadata enrichment: author disambiguation, institution linking, topic classification.",
      "Core knowledge layer underlying NeuraForge's literature mining. FastAPI, PostgreSQL + pgvector.",
    ],
    technologies: [
      "TypeScript",
      "PostgreSQL",
      "pgvector",
      "LLM APIs",
      "Vector Embeddings",
      "FastAPI",
    ],
  },

  // ─────────────────────────────────────────────────
  // TIER 3 — ROBOTICS & HARDWARE
  // ─────────────────────────────────────────────────

  {
    title: "Niryo LLM Robotic Arm Integration",
    categories: ["ML", "Robotics"],
    image: niryo_robotic_arm,
    imageAlt:
      "Niryo Ned2 robotic arm executing natural language commanded manipulation tasks via LLM and computer vision",
    images: [
      niryo_robotic_arm,
      "https://www.tegakari.net/wp-content/uploads/2020/05/niryo_ecosystem_img.jpg",
    ],
    url: "",
    github: "https://github.com/steeltroops-ai/Niryo-llm-robo",
    description: [
      "Niryo Ned2 physical arm controlled via natural language, LLM interprets intent, plans pick-and-place sequences, executes through ROS2 action servers in real time.",
      "OpenCV object detection and pose estimation, LLM prompt engineering for action sequence decomposition, closed-loop re-planning on execution failure.",
      "Full natural language to physical robot action stack, the core pattern for LLM-enabled general-purpose robotics.",
    ],
    technologies: [
      "Python",
      "ROS2",
      "Computer Vision",
      "LLM APIs",
      "Niryo SDK",
      "OpenCV",
    ],
  },

  {
    title: "Robot Bionic Arm",
    categories: ["Robotics"],
    image: robot_bionic_arm,
    imageAlt:
      "Custom 5-DOF robotic bionic arm with 3D printed modular joints, ROS2 sensor fusion and PID control",
    images: [robot_bionic_arm],
    url: "",
    github: "",
    description: [
      "5-DOF robotic arm from first principles, custom PID per joint, IK solver for Cartesian task control, ROS2 sensor fusion from joint encoders and force sensors at 100Hz.",
      "3D-printed modular joints optimized for torque distribution and end-effector precision.",
      "Trajectory planning (Python), control execution (C++), sensor I/O (ROS2) decoupled into DDS nodes, standard industrial robotics pattern implemented from hardware up.",
    ],
    technologies: [
      "ROS2",
      "C++",
      "Python",
      "PID Control",
      "Inverse Kinematics",
      "3D Printing",
      "Sensor Fusion",
    ],
  },

  {
    title: "Maze-Bot - ROS2 Autonomous Navigation Platform",
    categories: ["ML", "Robotics"],
    image: maze_bot,
    imageAlt:
      "Maze-Bot ROS2 autonomous navigation with SLAM, A-star and RRT path planning",
    images: [
      maze_bot,
      "https://repository-images.githubusercontent.com/399864768/481a8c17-7750-4025-9b0d-a15ede469cf0",
    ],
    url: "",
    github: "",
    description: [
      "ROS2 autonomous navigation research platform integrating SLAM, multi-algorithm path planning, and a clean benchmarking framework.",
      "Implemented and benchmarked A*, RRT, and DWA with comparative performance evaluation across maze configurations.",
      "SLAM pipeline: LiDAR scan matching and occupancy grid mapping for real-time environment modeling in Gazebo.",
    ],
    technologies: [
      "ROS2",
      "C++",
      "SLAM",
      "Nav2",
      "A* / RRT / DWA",
      "LiDAR",
      "Gazebo",
    ],
  },

  {
    title: "VR Firefighting & Flood Training Simulator",
    categories: ["Robotics"],
    image: vr_firefighting,
    imageAlt:
      "Unreal Engine 5 VR training simulator with dynamic hazard propagation and physics simulation",
    images: [vr_firefighting],
    url: "",
    github: "",
    description: [
      "Physics-based VR training simulator in Unreal Engine 5 for firefighter and flood emergency response, dynamic fire spread, water physics, structural response, and procedurally generated scenarios. Built at Inexia.",
      "C++ VR interaction systems: collision detection, hazard-triggered physics, grab/carry mechanics for rescue equipment, scored mission logic with debrief.",
      "Chaos Physics with custom material response systems. OpenXR for cross-platform VR headset support.",
    ],
    technologies: [
      "Unreal Engine 5",
      "C++",
      "Chaos Physics",
      "VR (OpenXR)",
      "Blueprints",
    ],
  },

  // ─────────────────────────────────────────────────
  // TIER 4 — ML / RESEARCH / SYSTEMS
  // ─────────────────────────────────────────────────

  {
    title: "Black Hole Simulation — Native C++ / OpenGL Engine",
    categories: ["Fullstack"],
    image: blackhole_cpp,
    imageAlt:
      "C++ OpenGL desktop black hole renderer with Schwarzschild metric geodesics at 60+ FPS",
    images: [blackhole_cpp],
    url: "",
    github: "https://github.com/steeltroops-ai/blackhole-sim",
    description: [
      "Native desktop black hole renderer in C++17 / OpenGL 3.3, Schwarzschild metric, geodesic motion, real-time gravitational lensing. Standalone desktop counterpart to the WebGPU browser simulation.",
      "GLFW + GLAD windowing, CMake build, custom GLSL lensing shaders. 60+ FPS on consumer hardware.",
      "Cross-platform: Windows, Linux, macOS.",
    ],
    technologies: [
      "C++17",
      "OpenGL 3.3",
      "GLFW",
      "GLAD",
      "CMake",
      "GLSL",
    ],
  },

  {
    title: "DebrisGuard — AI Space Debris Tracking System",
    categories: ["Fullstack", "ML"],
    image: debris_guard,
    imageAlt:
      "DebrisGuard AI space debris tracking interface showing TLE ingestion, orbital trajectory prediction and collision probability scoring",
    images: [debris_guard],
    url: "",
    github: "https://github.com/steeltroops-ai/DebrisGuard",
    description: [
      "AI-powered space debris tracking system, TLE/SGP4 ingestion, orbital trajectory simulation, and ML-based collision probability scoring for active satellite operators.",
      "Full-stack: Python backend, JavaScript frontend, Kubernetes deployment manifests. Operator intervention interface for high-risk conjunction events.",
      "Informed by OrbitX India aerospace research internship. Orbital mechanics + AI trajectory prediction stack.",
    ],
    technologies: [
      "Python",
      "JavaScript",
      "Orbital Mechanics",
      "TLE / SGP4",
      "Kubernetes",
      "AI Trajectory Prediction",
    ],
  },

  {
    title: "PyTorch Transformer — Attention Is All You Need",
    categories: ["ML"],
    image: pytorch_transformer,
    imageAlt:
      "PyTorch Transformer implementation showing self-attention, multi-head attention and positional encoding",
    images: [
      pytorch_transformer,
      "https://image.slidesharecdn.com/paperpresentationmaroua-200416144727/75/Attention-Is-All-You-Need-presented-by-Maroua-Maachou-Veepee-1-2048.jpg",
    ],
    url: "",
    github: "https://github.com/steeltroops-ai/Pytorch-Transformer",
    description: [
      "Transformer architecture from Vaswani et al. 2017 implemented from scratch, multi-head self-attention, positional encoding, encoder-decoder stacks, layer normalization, beam search decoding.",
      "Reproducible training: YAML config, gradient clipping, warmup scheduling, attention map visualizations for interpretability analysis.",
      "Clean, heavily documented reference implementation for understanding the architecture underlying modern LLMs.",
    ],
    technologies: [
      "Python",
      "PyTorch",
      "Transformers",
      "NLP",
      "Jupyter Notebook",
      "Matplotlib",
    ],
  },

  {
    title: "MDC Dataset Citation Classification",
    categories: ["ML"],
    image: mdc_citation,
    imageAlt:
      "MDC citation classification NLP pipeline categorizing scientific dataset references as primary, secondary or missing",
    images: [
      mdc_citation,
      "https://t3.ftcdn.net/jpg/13/75/28/26/360_F_1375282680_4evcXpRfIBSe5Wi4ISRIPHwFuSiEqY40.jpg",
    ],
    url: "",
    github: "",
    description: [
      "Ensemble ML system classifying dataset citations in scientific literature, SciBERT contextual embeddings combined with gradient boosting and SVM classifiers, trained on annotated papers.",
      "Ensemble voting outperformed standalone SciBERT on minority class recall, directly addressing citation dataset class imbalance.",
      "Per-class precision/recall, confusion matrix analysis, and cross-validation stability testing.",
    ],
    technologies: [
      "Python",
      "SciBERT",
      "Scikit-learn",
      "Ensemble Methods",
      "NLP",
      "Hugging Face",
    ],
  },

  // ─────────────────────────────────────────────────
  // TIER 5 — FULLSTACK / PRODUCT
  // ─────────────────────────────────────────────────

  {
    title: "Eidolon - AI-Powered Knowledge Graph",
    categories: ["Fullstack", "ML"],
    image: null,
    imageAlt:
      "Eidolon AI knowledge management system with interactive force-directed graph and Gemini-powered chat assistant",
    images: ["https://eidolon-two.vercel.app/"],
    url: "https://eidolon-two.vercel.app/",
    github: "https://github.com/steeltroops-ai/Eidolon",
    description: [
      "Personal knowledge management system that visualizes ideas as an interactive force-directed graph, nodes linked by semantic relationships, Gemini 2.5 Flash AI assistant for contextual queries. Next.js 16, React 19, TypeScript 5, Bun, Tailwind CSS 4 glass-morphism.",
      "Text, voice, and quick-note capture modes; public/private sharing; community interest matching; chronological and relevance-based graph layouts.",
      "Custom hooks architecture (useNodes, useChat, useCapture) with lazy-loaded Suspense views. Jest + React Testing Library test suite. Deployed on Vercel.",
    ],
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Google Gemini 2.5",
      "Tailwind CSS 4",
      "Bun",
      "Jest",
    ],
  },

  {
    title: "GreenTwin - AI Carbon Footprint Digital Twin",
    categories: ["Fullstack", "ML"],
    image: null,
    imageAlt:
      "GreenTwin AI climate platform with carbon twin dashboard, Gemini AI coach, predictive interventions and Chrome MV3 extension",
    images: ["https://green-twin.vercel.app/"],
    url: "https://green-twin.vercel.app/",
    github: "https://github.com/steeltroops-ai/GreenTwin",
    description: [
      "AI carbon footprint digital twin, Gemini 1.5 Pro coaching with predictive emission forecasting and smart intervention nudges. Passive tracking via Chrome MV3 extension (background service worker across Amazon, Kayak, news sites). Hackathon project.",
      "Climate misinformation fact-checking, gamified achievements, anonymous leaderboards, grid-aware energy optimization. Enterprise rate limiting: 60/min, 1K/hour, 10K/day.",
      "Next.js 15, TypeScript, Clerk, WebSocket, Bun. Vercel deployment. Projected: 1M users = 500K tons CO2/year reduction.",
    ],
    technologies: [
      "Next.js 15",
      "TypeScript",
      "Google Gemini 1.5 Pro",
      "Chrome Extension (MV3)",
      "Clerk",
      "WebSocket",
      "Bun",
    ],
  },

  {
    title: "FlowBot - Visual Chatbot Flow Builder",
    categories: ["Fullstack"],
    image: null,
    imageAlt:
      "FlowBot drag-and-drop chatbot flow builder with 12+ node types, 7-tab settings panel and real-time auto-save",
    images: ["https://flowbott.vercel.app/"],
    url: "https://flowbott.vercel.app/",
    github: "https://github.com/steeltroops-ai/FlowBot",
    description: [
      "Professional visual flow builder for designing conversational chatbot flows, drag-and-drop canvas with 12+ node types (messages, logic, input, integration, utility, action) and smooth animations.",
      "7-tab settings panel with real-time preview and validation. Intelligent auto-save with visual status indicators. Zustand state management with flowStore and uiStore separation.",
      "React 18 + TypeScript + ReactFlow + Tailwind CSS. Vite build toolchain. Deployed and live.",
    ],
    technologies: [
      "React 18",
      "TypeScript",
      "ReactFlow",
      "Zustand",
      "Tailwind CSS",
      "Vite",
    ],
  },

  {
    title: "Finance Management App",
    categories: ["Fullstack"],
    image: null,
    imageAlt:
      "Finance management app with multi-bank account linking, real-time balance tracking and spending insights",
    images: ["https://banking-jet.vercel.app/sign-in"],
    url: "https://banking-jet.vercel.app/sign-in",
    github:
      "https://github.com/steeltroops-ai/finanace-management-banking-app",
    description: [
      "Full-stack finance platform with Plaid multi-bank account linking, real-time balance tracking, Dwolla inter-account transfers, and categorized spending analytics. SSR authentication with Appwrite BaaS.",
      "Server-side rendering for all auth routes (no client-side token exposure). Responsive transaction feeds and time-series spending breakdowns.",
      "PCI-aware API proxying and encrypted token storage patterns throughout.",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Plaid API",
      "Dwolla",
      "Appwrite",
      "SSR Auth",
    ],
  },

  {
    title: "Neza Digital Marketplace",
    categories: ["Fullstack"],
    image: neza_marketplace,
    imageAlt:
      "Neza B2C marketplace connecting households with local service providers via Razorpay payments",
    images: [neza_marketplace],
    url: "",
    github: "https://github.com/steeltroops-ai/Neza",
    description: [
      "B2C service marketplace connecting households with verified local providers, multi-role architecture (consumer, provider, admin), real-time availability management, Razorpay payment gateway with webhook confirmation.",
      "Role-based dashboards, provider onboarding and verification flow, booking management with status tracking.",
      "Mobile-first UI, PostgreSQL, TypeScript end-to-end.",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "Razorpay",
      "RBAC",
      "PostgreSQL",
    ],
  },

  {
    title: "House Price Prediction - End-to-End MLOps Pipeline",
    categories: ["ML"],
    image: null,
    imageAlt:
      "MLOps pipeline with ZenML orchestration, MLflow experiment tracking and model evaluation metrics",
    images: [
      "https://miro.medium.com/v2/resize:fit:1400/1*CfdC88fMxquhEFfWXlbtTA.jpeg",
      "https://miro.medium.com/1*NiK9cocmfSWmGYLmOGRwyg.png",
    ],
    url: "",
    github:
      "https://github.com/steeltroops-ai/House-Price-Prediction-with-MLOps",
    description: [
      "End-to-end ML pipeline with ZenML orchestration and MLflow experiment tracking, data ingestion, schema validation, feature engineering, training, and automated deployment gating.",
      "RMSE, R², and stratified cross-validation across price ranges for distribution shift detection. Artifact versioning, hyperparameter logging, environment snapshots per run.",
      "Pipeline versioning, model registry, and automated re-training triggers, standard production MLOps patterns.",
    ],
    technologies: [
      "Python",
      "Scikit-learn",
      "ZenML",
      "MLflow",
      "Pandas",
      "Feature Engineering",
    ],
  },
];