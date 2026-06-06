/* ============================================================
   PROFILE — Naveen Chowdary Aliveli. Edit freely.
   (Email only by request; phone intentionally omitted.)
   ============================================================ */
window.PROFILE = {
  name: "Naveen Chowdary Aliveli",
  initials: "NA",
  role: "AI Engineer — LLM Systems & Agentic AI",
  location: "California, USA",
  badge: "Production LLM systems & agentic AI",
  tagline:
    "I build production-grade LLM systems — multi-agent architectures, RAG pipelines, " +
    "and fine-tuned models that ship at scale.",
  bio:
    "I'm an AI Engineer who turns research into production. For 5+ years I've designed " +
    "agentic and multi-agent systems, built retrieval-augmented pipelines, and fine-tuned " +
    "and served large language models in the real world. I care about systems that are fast, " +
    "reliable, and genuinely understood — which is why I also build interactive explainers " +
    "that show exactly how these models work, with every number computed live.",
  email: "anaveen0908@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/alivnavc" },
  ],
  github: "https://github.com/alivnavc",

  // quick numbers for the about hero
  stats: [
    { v: "5+", l: "Years in AI/ML" },
    { v: "$1M", l: "Annual savings delivered" },
    { v: "70B", l: "Largest model fine-tuned" },
    { v: "1M+", l: "Docs processed / day" },
  ],

  experience: [
    {
      company: "SonicJobs", role: "AI Engineer", location: "California", period: "Jan 2026 – Present",
      points: [
        "Architected a multi-agent browser-automation system (LangGraph) that auto-completes job-application workflows across multiple ATS platforms, cutting manual execution by 60%.",
        "Designed a Mixture-of-Agents architecture (specialised sub-agents + a meta-agent) improving task completion ~34%, plus ReAct and Plan-and-Execute reasoning (+20%).",
        "Built Model Context Protocol (MCP) servers from scratch with custom tools, powering enterprise integrations including ChatGPT and Claude connectors.",
        "Saved $1M/year by migrating CV/resume extraction to a self-hosted SLM pipeline on A100 GPUs, improving data-quality accuracy by 40%.",
        "Built ESCO & O*NET classification with JobBERT embeddings on Hugging Face TEI processing 1M+ documents daily, and an agentic RAG search with hybrid retrieval (+25% NDCG@10).",
      ],
    },
    {
      company: "Flexon Technologies", role: "AI Applied Engineer", location: "California", period: "Feb 2024 – Dec 2025",
      points: [
        "Built an Interview Agent (multimodal, LangChain/LangGraph, MCP) that shortened the recruitment lifecycle by 40%.",
        "Shipped a real-time voice-agent pipeline (Deepgram + GPT-4o + Silero) at 650 ms latency.",
        "Fine-tuned LLaMA-3.1 70B with QLoRA + DeepSpeed (+25% domain accuracy) and made inference 3× faster via GPTQ 4-bit + vLLM.",
        "Served LLaMA-3.1 70B at 350 ms with vLLM and built FastAPI REST APIs (~200 ms) on ECS with zero-downtime blue-green deploys.",
      ],
    },
    {
      company: "Catholic Guardian Services", role: "Machine Learning Engineer", location: "New York", period: "Sep 2023 – Dec 2023",
      points: [
        "Built a RAG chatbot (Weaviate + BM25 reranking) that lifted customer satisfaction by 35%.",
        "Fine-tuned GPT-3 (ROUGE 93%, P99 ~2 s) and processed 5M+ records with PySpark + KNN imputation (+15% quality).",
        "Trained XGBoost on 1.5M records (F1 0.78) with Ray, deployed via MLflow at 175 ms / 40K req/s, and provisioned AWS EKS with Terraform.",
      ],
    },
    {
      company: "TCS — General Electric (Baker Hughes)", role: "Machine Learning Engineer", location: "India", period: "Jul 2019 – Jul 2022",
      points: [
        "Optimised Transformer models (BART) for Q&A and summarisation (+15% accuracy) and fine-tuned domain Transformers with PyTorch FSDP, reducing hallucinations 18%.",
        "Built XGBoost/LightGBM + Ray pipelines on SageMaker (−35% latency) and processed 750k+ records/day in Databricks (PySpark).",
        "Standardised inference with Triton (+25% deploy efficiency); hybrid Pipeline-Parallel + DDP across 16 GPUs (3× batch size) and INT8/FP16 quantization (2.5× faster).",
      ],
    },
  ],

  techStack: [
    { group: "Languages", items: ["Python", "SQL", "PL/SQL", "Git"] },
    { group: "Frameworks", items: ["PyTorch", "TensorFlow", "LangChain", "LangGraph", "LangSmith", "Hugging Face", "Triton", "ONNX", "Bitsandbytes"] },
    { group: "Inference & Training", items: ["vLLM", "DeepSpeed", "FSDP / ZeRO", "DDP", "SGLang", "TensorRT", "Ray", "Distributed Training", "LoRA", "QLoRA", "SFT"] },
    { group: "Generative AI", items: ["Agentic AI", "RAG", "MCP", "Model Profiling"] },
    { group: "Classical ML", items: ["Linear Regression", "Logistic Regression", "Decision Trees", "Random Forest", "Gradient Boosting", "XGBoost", "LightGBM", "CatBoost", "SVM", "Naive Bayes", "KNN", "K-Means", "DBSCAN", "Hierarchical Clustering", "PCA", "t-SNE"] },
    { group: "Deep Learning", items: ["Transformers", "CNN", "RNN", "LSTM", "ANN"] },
    { group: "Big Data & Processing", items: ["Spark", "PySpark", "Hadoop", "Databricks"] },
    { group: "Databases & Vector Stores", items: ["MySQL", "MongoDB", "Qdrant", "Pinecone", "Chroma", "Weaviate"] },
    { group: "Cloud & MLOps", items: ["AWS", "Azure", "Kubernetes", "Docker", "CI/CD", "MLflow", "FastAPI", "Streamlit"] },
  ],

  projects: [
    {
      title: "AI Multi-Agent Investment Strategist",
      desc: "A multi-agent system that researches markets and assembles investment strategies — specialised agents coordinate analysis, risk and recommendations.",
      tags: ["Multi-agent", "Finance", "LLM"],
      href: "https://github.com/alivnavc/AI-Multi-Agent-Investment-Strategist",
    },
    {
      title: "Multi-Agent Travel Assistant (custom MCP)",
      desc: "A travel-planning assistant built on a from-scratch Model Context Protocol server, with collaborating agents for search, itinerary and booking flows.",
      tags: ["MCP", "Multi-agent", "LangGraph"],
      href: "https://github.com/alivnavc/Gen-AI-Travel-Agent",
    },
    {
      title: "Autonomous Pentest Agent — SQLi (RL/DPO)",
      desc: "An autonomous multi-agent system for SQL-injection pentesting, trained with an RL / DPO-style preference loop to sharpen its exploit strategy.",
      tags: ["Security", "RL / DPO", "Agents"],
      href: "https://github.com/alivnavc/autonomous-pentest-SQLi--agent",
    },
    {
      title: "Microsoft Teams Meetings MCP Server",
      desc: "An MCP server to schedule, reschedule, cancel and manage Teams meetings via the Microsoft Graph API — JSON-RPC tools, timezone-aware events, Docker & PyPI.",
      tags: ["MCP", "Microsoft Graph", "PyPI"],
      href: "https://github.com/alivnavc/Microsoft-Teams-Meetings-MCP-Server",
      featured: true,
      highlight: "Open-source · 6.5k+ PyPI downloads",
      pypi: "https://pypi.org/project/microsoft-teams-mcp/",
    },
    {
      title: "Structured Synthetic Data with CTGAN",
      desc: "Generates high-quality structured synthetic data with CTGAN, preserving column distributions and correlations for safe model training and sharing.",
      tags: ["CTGAN", "Synthetic data", "Tabular"],
      href: "https://github.com/alivnavc/Synthetic-Data-Generation-CTGAN",
    },
    {
      title: "AI Financial News Assistant (RAG)",
      desc: "A retrieval-augmented, multi-agent assistant for financial news — instrumented with LangSmith tracing and evaluated with RAGAS.",
      tags: ["RAG", "Multi-agent", "RAGAS"],
      href: "https://github.com/alivnavc/AI-Financial-News-Assistant-RAG",
    },
    {
      title: "Interactive Transformer Explainers",
      desc: "This site's blog — decoder-only, encoder-only and encoder–decoder transformers taken apart layer by layer, with live matrices you can hover for the exact math behind every value.",
      tags: ["Transformers", "Visualisation", "Education"],
      href: "index.html",
    },
  ],

  education: [
    {
      school: "Yeshiva University", location: "United States",
      degree: "M.S. in Machine Learning & Data Analytics", period: "Aug 2022 – Dec 2023",
      detail: "GPA 3.8 / 4.0 · Coursework: Deep Learning, AI Algorithms, NLP, Data Science, Statistics, AWS.",
    },
  ],

  certifications: [
    { title: "Microsoft Teams MCP — 6.5k+ PyPI downloads", org: "Open-source · pypi.org/project/microsoft-teams-mcp" },
    { title: "AWS Certified Machine Learning — Specialty", org: "Amazon Web Services" },
    { title: "AWS Certified Solutions Architect", org: "Amazon Web Services" },
    { title: "Generative AI Hackathon — Winner", org: "Google Developers" },
  ],
};
