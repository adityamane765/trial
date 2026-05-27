import type { Connection, Keypair, PublicKey } from "@solana/web3.js";

export interface TradeL1SettleContext {
  l1: Connection;
  vaultProgramId: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  meProgramId: PublicKey;
  market: PublicKey;
  batchPda: PublicKey;
  tee: Keypair;
  maker: Keypair;
  userMasterSeed: Uint8Array;
  userQuoteNoteCommitment: Uint8Array;
  userOrderId: Uint8Array;
  userExpirySlot: bigint;
  makerNoteCommitment: Uint8Array;
  makerOrderId: Uint8Array;
  makerExpirySlot: bigint;
}

export interface TradeL1SettleResult {
  lockSettleSignatures: { label: string; signature: string; cluster: "l1" }[];
  buyerBaseNote: {
    matchId: string;
    leafIndex: string;
    amount: string;
    nonce: string;
    blindingR: string;
    commitmentHex: string;
    tokenMintBase58: string;
    vaultLeafCountAfter: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runTradeL1Settle(_ctx: TradeL1SettleContext): Promise<TradeL1SettleResult> {
  throw new Error("TEE settle not available in this deployment.");
}
