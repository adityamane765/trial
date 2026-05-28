/** Plain-language strings for the marketing landing page. */

export const hero = {
  lede:
    "Darknyx is a private order book on Solana. You deposit tokens into a shielded balance, place orders without broadcasting them to the whole network, and withdraw when you're done — while the chain can still verify that every trade was fair.",
  aside:
    "Built for traders who want discretion, and for auditors who need math — not trust.",
};

export const plainBand = {
  eyebrow: "In plain terms",
  title: "Privacy where it matters. Proof where it counts.",
  points: [
    {
      title: "Orders stay off the public tape",
      body: "What you want to buy or sell, and at what price, never hits the open mempool. Matching happens in a protected environment, then only the batch outcome is shared.",
    },
    {
      title: "Balances always reconcile",
      body: "Money in equals money out. Every settlement is checked with cryptography so no one can print tokens or skip paying the other side.",
    },
    {
      title: "You can still verify the system",
      body: "The protocol publishes enough on-chain evidence for anyone to audit that rules were followed — without revealing individual order details before a match.",
    },
  ],
};

export const features = {
  eyebrow: "What Nyx gives you",
  title: "A darkpool you can audit",
  titleMuted: "without compromising privacy.",
  lede:
    "Think of Nyx as a dark pool on Solana: you trade against other participants in periodic batches, not in a glass house. Below is what that means in practice — the deep technical map lives on the architecture page.",
  cards: [
    {
      eyebrow: "01 · Hidden intent",
      title: "Your orders don't\nhit the public mempool.",
      sub: "Side, size, and price stay private until a batch clears.",
      tech: "Private matching",
    },
    {
      eyebrow: "02 · Verifiable settlement",
      title: "Every fill comes\nwith a proof.",
      sub: "The chain checks that settlement was valid — you don't have to take anyone's word for it.",
      tech: "On-chain proofs",
    },
    {
      eyebrow: "03 · Attested executor",
      title: "A trusted operator\nruns the match.",
      sub: "An attested service signs outcomes; Solana enforces them atomically.",
      tech: "TEE attestation",
    },
    {
      eyebrow: "04 · Shielded balances",
      title: "Tokens move as\nprivate notes.",
      sub: "Deposits and withdrawals use encrypted bookkeeping — only you control your keys.",
      tech: "UTXO vault",
    },
  ],
};

export const flow = {
  eyebrow: "How it works",
  title: "Three steps from wallet to withdrawal.",
  titleMuted: "No jargon required.",
  lede:
    "You never hand custody to a black box. You sign with your wallet, trade inside the private batch, and settle back on Solana when a match is ready.",
  stages: [
    {
      title: "Join & fund",
      body: "Create your trading identity in the browser and move tokens into Darknyx's vault. Your balance is represented as a private note — not a public wallet label everyone can watch.",
    },
    {
      title: "Trade in the batch",
      body: "Submit buy or sell intent directly into the TEE matcher. The matcher pairs orders at a single clearing price. Other participants never see your individual quote on-chain.",
    },
    {
      title: "Settle & cash out",
      body: "When the batch closes, settlement lands on Solana with proofs attached. Withdraw to your wallet whenever you want — your keys, your exit.",
    },
  ],
  footnote:
    "Curious about PDAs, circuits, and instruction names? The architecture page walks through every layer.",
};

export const cta = {
  title: "Coming soon on mainnet",
  titleMuted: "Privacy without sacrificing auditability.",
  body: "Read the architecture page for how Darknyx works end to end — from private batching to on-chain settlement and withdrawal.",
};
