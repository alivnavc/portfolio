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
  ],
};
