/* ============================================================
   BLOG CATALOG — the writing / explainers live here.
   To add an article: add an entry to a topic's `articles`.
   To add a topic: add a topic object. `status`: "live" | "soon".
   ============================================================ */
window.SITE = {
  name: "Neural Codex",
  tagline: "Interactive AI explainers",
  blurb:
    "Long-form, interactive explainers that take a model apart layer by layer — " +
    "with live numbers you can poke and the exact equation behind every value.",

  topics: [
    {
      id: "llm-training",
      title: "LLM Training",
      kicker: "From raw text to production-ready LLMs",
      desc:
        "An eleven-part deep-dive into how large language models are built and run — pre-training on " +
        "trillions of tokens, scaling across GPU clusters, GPU architecture, quantization, " +
        "mixture-of-experts, fine-tuning and alignment, distillation, embeddings, reasoning models, " +
        "inference & serving, and keeping them safe in production.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="1.6"/><circle cx="19" cy="6" r="1.6"/><circle cx="5" cy="18" r="1.6"/><circle cx="19" cy="18" r="1.6"/><path d="M6.6 7 10 10.4M17.4 7 14 10.4M6.6 17 10 13.6M17.4 17 14 13.6"/></svg>',
      articles: [
        {
          title: "LLM Pre-Training",
          sub: "How language models learn from raw text",
          href: "LLM-PreTraining.html",
          desc: "BPE tokenization, batch shapes, teacher forcing, AdamW, cosine LR schedule, Chinchilla scaling laws, BF16 training, and evaluation — from bytes to a GPT-class model.",
          tags: ["pre-training", "BPE", "AdamW", "scaling laws", "tokenization"],
          steps: 13,
          status: "live",
        },
        {
          title: "Distributed Training",
          sub: "Data, tensor, and pipeline parallelism across GPU clusters",
          href: "Distributed-Training.html",
          desc: "Why a single H100 isn't enough, ZeRO/FSDP sharding, Megatron tensor parallelism, 1F1B pipeline schedules, 3D parallelism, frameworks (DeepSpeed/Megatron/FSDP), MFU validation, and debugging OOM/NaN.",
          tags: ["DDP", "FSDP", "ZeRO", "DeepSpeed", "Megatron", "tensor parallelism", "H100"],
          steps: 14,
          status: "live",
        },
        {
          title: "GPU Architecture",
          sub: "SMs, tensor cores, and memory — and how to optimize",
          href: "GPU-Architecture.html",
          desc: "How NVIDIA GPUs work: GPC→SM hierarchy, the streaming multiprocessor, threads/warps/blocks, the memory hierarchy and memory wall, tensor cores, how a matmul (GEMM) runs on-chip, the roofline model, Hopper features, A100/H100/B200 specs, and optimizing for training vs serving.",
          tags: ["GPU", "H100", "SM", "tensor cores", "memory hierarchy", "roofline", "CUDA"],
          steps: 13,
          status: "live",
        },
        {
          title: "Quantization",
          sub: "FP32 to INT4 — number formats and the accuracy tradeoff",
          href: "Quantization.html",
          desc: "FP32/FP16/BF16/FP8/INT8/INT4/NF4 bit layouts, affine quantization math, PTQ vs QAT, the outlier problem, GPTQ, AWQ, SmoothQuant, W4A16 vs W8A8, and how to measure quality loss.",
          tags: ["quantization", "FP8", "INT4", "GPTQ", "AWQ", "NF4"],
          steps: 11,
          status: "live",
        },
        {
          title: "Mixture of Experts",
          sub: "Sparse models — huge parameter counts, low compute",
          href: "Mixture-of-Experts.html",
          desc: "Routing math, top-k gating, load balancing (aux loss + DeepSeek's loss-free), expert capacity, Mixtral/DeepSeek-V3, fine-grained and shared experts, and expert parallelism.",
          tags: ["MoE", "routing", "sparse", "Mixtral", "DeepSeek", "load balancing"],
          steps: 10,
          status: "live",
        },
        {
          title: "Post-Training",
          sub: "CPT, SFT, LoRA, RLHF, and DPO explained",
          href: "Post-Training.html",
          desc: "Full LLM lifecycle — when to use CPT vs SFT vs LoRA vs QLoRA vs RLHF vs DPO with decision flowchart, tradeoffs table, LoRA math, reward models, PPO, DPO, and evaluation.",
          tags: ["SFT", "LoRA", "QLoRA", "RLHF", "DPO", "fine-tuning", "lifecycle"],
          steps: 14,
          status: "live",
        },
        {
          title: "Knowledge Distillation",
          sub: "Compressing a large teacher into a small student",
          href: "Knowledge-Distillation.html",
          desc: "Dark knowledge and soft targets, temperature loss, response/feature/relation types, white-box vs black-box, forward vs reverse KL, R1 reasoning distillation, and famous distilled models.",
          tags: ["distillation", "teacher-student", "soft targets", "DistilBERT", "compression"],
          steps: 10,
          status: "live",
        },
        {
          title: "Embedding Models",
          sub: "Turning text into vectors for search and RAG",
          href: "Embedding-Models.html",
          desc: "What embeddings are and why we need them, text-to-vector pipeline, bi-encoder vs cross-encoder, contrastive training (InfoNCE, hard negatives), fine-tuning on custom data, Matryoshka, and MTEB.",
          tags: ["embeddings", "semantic search", "RAG", "contrastive", "bi-encoder", "MTEB"],
          steps: 11,
          status: "live",
        },
        {
          title: "Reasoning Models",
          sub: "How o1, DeepSeek-R1, and GRPO produce chain-of-thought",
          href: "Reasoning-Models.html",
          desc: "Standard vs. reasoning LLMs, OpenAI o1 architecture, DeepSeek-R1 MoE design, GRPO algorithm, process vs. outcome reward models, test-time compute scaling, and pass@1/maj@k evaluation.",
          tags: ["o1", "DeepSeek-R1", "GRPO", "chain-of-thought", "reasoning", "PRM"],
          steps: 11,
          status: "live",
        },
        {
          title: "Inference & Serving",
          sub: "Serving LLMs in production — vLLM, TensorRT-LLM, Triton, scale",
          href: "Inference-Serving.html",
          desc: "Prefill vs decode, the KV cache, continuous batching, PagedAttention, vLLM/TensorRT-LLM/SGLang/Triton/ONNX, embedding serving, request-flow, TTFT/TPOT metrics, Kubernetes autoscaling and disaggregated serving, plus common pitfalls.",
          tags: ["inference", "vLLM", "TensorRT-LLM", "Triton", "KV cache", "batching", "Kubernetes"],
          steps: 14,
          status: "live",
        },
        {
          title: "Production & Safety",
          sub: "Hallucination, RAG, bias, prompt injection, and monitoring",
          href: "Production-Safety.html",
          desc: "Why LLMs hallucinate, RAG pipeline design, calibration, bias and debiasing, prompt injection (OWASP #1), jailbreak defenses, monitoring metrics, and quality/safety evaluation.",
          tags: ["hallucination", "RAG", "bias", "prompt injection", "safety", "monitoring"],
          steps: 11,
          status: "live",
        },
      ],
    },
    {
      id: "transformers",
      title: "Transformers",
      kicker: "Attention-based architectures",
      desc:
        "The architecture behind GPT, BERT and modern translation. Walk every matrix " +
        "from raw tokens to a predicted word.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="4.5" rx="1.2"/><rect x="3" y="9.75" width="18" height="4.5" rx="1.2"/><rect x="3" y="16.5" width="18" height="4.5" rx="1.2"/><path d="M7.5 7.5v2.25M16.5 7.5v2.25M7.5 14.25v2.25M16.5 14.25v2.25"/></svg>',
      articles: [
        {
          title: "Decoder-only Transformer",
          sub: "GPT-style next-token prediction",
          href: "Decoder-Only Transformer.html",
          desc: "Causal self-attention, the autoregressive loop, and how a prompt becomes the next word.",
          tags: ["GPT", "causal mask", "autoregressive"],
          steps: 17,
          status: "live",
        },
        {
          title: "Encoder-only Transformer",
          sub: "BERT-style bidirectional understanding",
          href: "Encoder-Only Transformer.html",
          desc: "No mask, full context both ways, masked-language modelling and [CLS] classification.",
          tags: ["BERT", "bidirectional", "MLM"],
          steps: 17,
          status: "live",
        },
        {
          title: "Encoder–Decoder Transformer",
          sub: "The original Transformer / T5",
          href: "Encoder-Decoder Transformer.html",
          desc: "Two stacks joined by cross-attention — the alignment bridge for translation and summarisation.",
          tags: ["T5", "cross-attention", "seq2seq"],
          steps: 10,
          status: "live",
        },
      ],
    },
    {
      id: "neural-networks",
      title: "Neural Networks",
      kicker: "Deep-learning foundations",
      desc:
        "The building blocks of deep learning — from a single neuron to convolutions and " +
        "recurrent memory. Every weight, sum and activation worked out live.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="1.8"/><circle cx="5" cy="12" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="12" cy="8" r="1.8"/><circle cx="12" cy="16" r="1.8"/><circle cx="19" cy="12" r="1.8"/><path d="M6.7 6.6 10.4 7.6M6.6 11.4 10.4 8.8M6.6 12.6 10.4 15.2M6.7 17.4 10.4 16.6M13.6 8.6 17.4 11.4M13.6 15.4 17.4 12.6"/></svg>',
      articles: [
        {
          title: "Neural Network (ANN / MLP)",
          sub: "The feed-forward foundation",
          href: "Neural Network (ANN).html",
          desc: "A single neuron to a full layer: weighted sums, ReLU, softmax, and how training finds the weights.",
          tags: ["MLP", "neuron", "ReLU", "softmax"],
          steps: 8,
          status: "live",
        },
        {
          title: "Convolutional Network (CNN)",
          sub: "How a network sees images",
          href: "Convolutional Network (CNN).html",
          desc: "Sliding a learned filter over pixels: convolution, ReLU, max-pooling, flatten and classify.",
          tags: ["CNN", "convolution", "pooling", "vision"],
          steps: 7,
          status: "live",
        },
        {
          title: "Recurrent Network (RNN)",
          sub: "Memory across a sequence",
          href: "Recurrent Network (RNN).html",
          desc: "Hidden-state recurrence unrolled step by step — and why long-range memory fades.",
          tags: ["RNN", "sequence", "hidden state"],
          steps: 7,
          status: "live",
        },
        {
          title: "LSTM Network",
          sub: "Gated long-term memory",
          href: "LSTM Network.html",
          desc: "The cell state plus forget / input / output gates that let a network remember over long ranges.",
          tags: ["LSTM", "gates", "cell state"],
          steps: 7,
          status: "live",
        },
        {
          title: "Optimizers",
          sub: "From SGD to AdamW",
          href: "Optimizers.html",
          desc: "How networks actually descend the loss — momentum, adaptive rates, Adam — with live descent-path visuals, math and when to use each.",
          tags: ["SGD", "momentum", "Adam", "AdamW"],
          steps: 9,
          status: "live",
        },
      ],
    },
    {
      id: "ml-regression",
      title: "Regression Algorithms",
      kicker: "Predicting continuous values",
      desc:
        "From a straight line to boosted trees — every regression algorithm walked step by step " +
        "with live data you can adjust and the exact math behind every prediction.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18 8 10l5 4 5-8"/><circle cx="8" cy="10" r="1.4"/><circle cx="13" cy="14" r="1.4"/><circle cx="18" cy="6" r="1.4"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      articles: [
        {
          title: "Linear Regression",
          sub: "Fitting a line to data",
          href: "Linear Regression.html",
          desc: "Weighted sums, MSE loss, gradient descent and the normal equation — the foundation of all supervised learning.",
          tags: ["MSE", "gradient descent", "normal equation"],
          steps: 11,
          status: "live",
        },
        {
          title: "Decision Tree (Regression)",
          sub: "Recursive variance splitting",
          href: "Decision Tree (Regression).html",
          desc: "Splitting a dataset by variance reduction to build a step-function predictor — with depth control and bias-variance tradeoff.",
          tags: ["variance", "splits", "pruning"],
          steps: 9,
          status: "live",
        },
        {
          title: "Random Forest (Regression)",
          sub: "Averaging many trees",
          href: "Random Forest (Regression).html",
          desc: "Bootstrap sampling + random feature subsets create decorrelated trees whose average beats any single tree.",
          tags: ["bagging", "ensemble", "OOB error"],
          steps: 9,
          status: "live",
        },
        {
          title: "KNN (Regression)",
          sub: "Averaging nearest neighbors",
          href: "KNN (Regression).html",
          desc: "No training phase — predict by averaging the k closest examples. Live k slider and distance visualization.",
          tags: ["lazy learner", "k neighbors", "distance"],
          steps: 9,
          status: "live",
        },
        {
          title: "SVM (Regression)",
          sub: "ε-insensitive tube fitting",
          href: "SVM (Regression).html",
          desc: "Fit a tube around the data — points inside incur no penalty. Support vectors, ε and C explained live.",
          tags: ["SVR", "epsilon tube", "kernel"],
          steps: 9,
          status: "live",
        },
        {
          title: "Gradient Boosting (Regression)",
          sub: "Sequential residual correction",
          href: "Gradient Boosting (Regression).html",
          desc: "Each tree fits the residuals of all previous trees. Watch MSE drop round by round with the nTrees slider.",
          tags: ["boosting", "residuals", "stumps"],
          steps: 10,
          status: "live",
        },
        {
          title: "XGBoost",
          sub: "Second-order gradient boosting with regularization",
          href: "XGBoost.html",
          desc: "How XGBoost improves on GBM: second-order gradients, L1/L2 regularization, built-in missing value handling, and why it dominates Kaggle tabular competitions.",
          tags: ["XGBoost", "hessian", "regularization", "Newton's method"],
          steps: 12,
          status: "live",
        },
      ],
    },
    {
      id: "ml-classification",
      title: "Classification Algorithms",
      kicker: "Predicting discrete categories",
      desc:
        "Every major classification algorithm — from Bayes' theorem to support vectors — with " +
        "interactive decision boundaries, probability outputs and step-by-step math.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/><path d="M3 21 9 15M15 9l6-6"/><line x1="12" y1="3" x2="12" y2="21" stroke-dasharray="2 3"/></svg>',
      articles: [
        {
          title: "Logistic Regression",
          sub: "Sigmoid-based binary classification",
          href: "Logistic Regression.html",
          desc: "The sigmoid function, binary cross-entropy, gradient descent — and why linear regression fails for classification.",
          tags: ["sigmoid", "BCE loss", "decision boundary"],
          steps: 11,
          status: "live",
        },
        {
          title: "Decision Tree (Classification)",
          sub: "Gini-based recursive splitting",
          href: "Decision Tree (Classification).html",
          desc: "Find the split that minimises Gini impurity, recurse, and trace any prediction through the tree live.",
          tags: ["Gini", "information gain", "feature importance"],
          steps: 10,
          status: "live",
        },
        {
          title: "Random Forest (Classification)",
          sub: "Majority vote of many trees",
          href: "Random Forest (Classification).html",
          desc: "Three bootstrapped trees vote on every prediction. See OOB error, feature importance and decorrelation.",
          tags: ["bagging", "voting", "OOB"],
          steps: 10,
          status: "live",
        },
        {
          title: "KNN (Classification)",
          sub: "Majority vote of nearest neighbors",
          href: "KNN (Classification).html",
          desc: "Move the query point with sliders and watch the k-radius circle, distance table and vote count update live.",
          tags: ["lazy learner", "Euclidean distance", "k"],
          steps: 10,
          status: "live",
        },
        {
          title: "SVM (Classification)",
          sub: "Maximum-margin hyperplane",
          href: "SVM (Classification).html",
          desc: "Find the hyperplane with the widest margin. Support vectors, kernel trick, soft margin — all visualised.",
          tags: ["margin", "kernel", "support vectors"],
          steps: 11,
          status: "live",
        },
        {
          title: "Naive Bayes",
          sub: "Probabilistic independence classifier",
          href: "Naive Bayes (Classification).html",
          desc: "Bayes' theorem + the independence assumption → a fast, surprisingly effective classifier for text and beyond.",
          tags: ["Bayes", "likelihood", "Laplace smoothing"],
          steps: 11,
          status: "live",
        },
        {
          title: "Gradient Boosting (Classification)",
          sub: "Log-loss gradient boosting",
          href: "Gradient Boosting (Classification).html",
          desc: "Sequential stumps trained on pseudo-residuals of the log-loss. Watch probabilities sharpen round by round.",
          tags: ["log-loss", "pseudo-residuals", "XGBoost"],
          steps: 10,
          status: "live",
        },
        {
          title: "XGBoost",
          sub: "Second-order gradient boosting",
          href: "XGBoost.html",
          desc: "XGBoost for classification: hessian-weighted splits, regularized leaf weights, and comparison with vanilla GBM.",
          tags: ["XGBoost", "log-loss", "regularization"],
          steps: 12,
          status: "live",
        },
      ],
    },
    {
      id: "ml-fundamentals",
      title: "ML Fundamentals",
      kicker: "The science behind every model",
      desc:
        "Core concepts that underpin every machine learning system — from end-to-end pipeline design " +
        "to dimensionality reduction and evaluation — with real-world examples and decision guides.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 3"/></svg>',
      articles: [
        {
          title: "ML Model Lifecycle",
          sub: "End-to-end from raw data to production",
          href: "ML Lifecycle.html",
          desc: "The full pipeline: data ingestion, EDA (missing values, outliers, imbalance), feature engineering, scaling, splitting, model selection, training, evaluation metrics, hyperparameter tuning, and production monitoring.",
          tags: ["EDA", "feature engineering", "evaluation", "pipeline", "production"],
          steps: 17,
          status: "live",
        },
        {
          title: "PCA",
          sub: "Principal Component Analysis",
          href: "PCA.html",
          desc: "Step-by-step PCA with a 6-student toy dataset: standardize → covariance matrix → eigendecomposition → explained variance → projection → reconstruction. When to use vs t-SNE, UMAP, LDA.",
          tags: ["PCA", "dimensionality reduction", "eigenvalues", "covariance"],
          steps: 10,
          status: "live",
        },
        {
          title: "Bias-Variance Tradeoff",
          sub: "Underfitting, overfitting, and how to fix both",
          href: "Bias-Variance.html",
          desc: "The fundamental tension in all of ML: bias² + variance + noise. Diagnose underfitting vs. overfitting with learning curves, then fix with regularization, dropout, early stopping, or more data.",
          tags: ["bias", "variance", "overfitting", "underfitting", "regularization"],
          steps: 12,
          status: "live",
        },
      ],
    },
    {
      id: "clustering",
      title: "Clustering Algorithms",
      kicker: "Finding structure in unlabeled data",
      desc:
        "Unsupervised algorithms that discover natural groupings — from centroid-based K-Means " +
        "to density-based DBSCAN and tree-building Hierarchical clustering.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><circle cx="5" cy="14" r="1.4"/><circle cx="9" cy="15" r="1.4"/><circle cx="15" cy="5" r="1.4"/><circle cx="19" cy="13" r="1.4"/></svg>',
      articles: [
        {
          title: "K-Means Clustering",
          sub: "Partition data into k clusters by minimizing WCSS",
          href: "K-Means.html",
          desc: "K-Means++ initialization, playable step-by-step animation, elbow method for choosing k, silhouette score, and failure modes — watch clusters form frame by frame.",
          tags: ["K-Means", "WCSS", "elbow method", "centroid", "unsupervised"],
          steps: 12,
          status: "live",
        },
        {
          title: "DBSCAN",
          sub: "Density-based clustering with noise detection",
          href: "DBSCAN.html",
          desc: "Playable ε-expansion animation. Watch core/border/noise classification happen step by step. Non-convex cluster discovery with interactive eps and min_samples sliders.",
          tags: ["DBSCAN", "density", "noise", "eps", "unsupervised"],
          steps: 11,
          status: "live",
        },
        {
          title: "Hierarchical Clustering",
          sub: "Build a dendrogram — no k required upfront",
          href: "Hierarchical.html",
          desc: "Playable merge animation. Watch 8 singleton clusters greedily merge one step at a time. Interactive dendrogram with Ward, complete, average, and single linkage.",
          tags: ["hierarchical", "dendrogram", "linkage", "Ward", "unsupervised"],
          steps: 11,
          status: "live",
        },
      ],
    },
    {
      id: "reference",
      title: "Quick Reference",
      kicker: "Cheatsheets & decision guides",
      desc:
        "Fast-access reference cards for every algorithm — hyperparameters, assumptions, " +
        "outlier & missing-value impact, and interview Q&A all in one searchable page.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
      articles: [
        {
          title: "ML Algorithm Cheatsheet",
          sub: "All algorithms in one searchable reference",
          href: "Cheatsheet.html",
          desc: "Hyperparameters, when to use/avoid, assumptions, outlier & missing-value impact, and 5 interview Q&As (including tricky ones) for every algorithm — Linear Regression to LSTM.",
          tags: ["cheatsheet", "hyperparameters", "interview", "assumptions", "all algorithms"],
          steps: 12,
          status: "live",
        },
      ],
    },
    {
      id: "mlops",
      title: "MLOps",
      kicker: "Production ML infrastructure",
      desc:
        "The infrastructure and practices that take models from notebooks to production — " +
        "feature management, deployment patterns, monitoring, and the hidden costs of scaling ML.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h2v5H7zM11 10h2v3h-2zM15 7h2v6h-2z"/></svg>',
      articles: [
        {
          title: "Feature Store",
          sub: "Unified feature management for training and serving",
          href: "Feature Store.html",
          desc: "How to design a feature store: offline store for training, online store for <5ms inference, point-in-time correct joins to prevent leakage, materialization pipelines, and when NOT to build one.",
          tags: ["feature store", "training-serving skew", "online store", "offline store", "MLOps"],
          steps: 12,
          status: "live",
        },
      ],
    },
  ],
};
