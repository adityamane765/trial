import {
  buildLockNoteInstruction,
  buildSettleBatchedIx,
  buildCloseBatchValidityMarkerIx,
  buildEd25519VerifyIx,
  canonicalPayloadHash,
  decodeBatchResults,
  deriveSpendingKey,
  noteCommitment,
  nullifier,
  vaultConfigPda,
  batchValidityMarkerPda,
  noteLockPda,
  RELOCK_ORDER_ID_NONE,
  ZERO_COMMITMENT,
  type MatchResultPayload,
} from "@nyx/sdk";
import {
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";

import { actorSeed } from "@/lib/dapp/persona-client";
import {
  be32ToBigInt,
  deriveBlinding,
  deriveNonce,
  matchIdToPayloadBytes,
  TRADE_ROLE_BUYER,
  TRADE_ROLE_SELLER,
} from "@/lib/dapp/change-note-derive";
import { collectVaultLeavesOrdered } from "@/lib/dapp/vault-leaf-history";
import { MerkleShadow } from "@/lib/dapp/merkle-shadow";
import { landVerifyMatchBatch } from "./verify-match-batch.js";
import {
  merkleInclusionPath,
  type MatchSlotWitness,
} from "./match-batch-prover.js";
import { sendSettleV0 } from "./settle-v0.js";

function isZero32(b: Uint8Array): boolean {
  return b.every((x) => x === 0);
}

function isRelockNone(id: Uint8Array): boolean {
  return id.length === 16 && id.every((x) => x === 0);
}

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
  /** Phantom-derived master seed (for user spending key + nullifier). */
  userMasterSeed: Uint8Array;
  userQuoteNoteCommitment: Uint8Array;
  userOrderId: Uint8Array;
  userExpirySlot: bigint;
  makerNoteCommitment: Uint8Array;
  makerOrderId: Uint8Array;
  makerExpirySlot: bigint;
  /** The static settle ALT created at devnet-setup time. */
  settleLookupTable: PublicKey;
  /** Repo root for snarkjs circuit artifact resolution. */
  repoRoot: string;
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

export async function runTradeL1Settle(ctx: TradeL1SettleContext): Promise<TradeL1SettleResult> {
  const { l1, vaultProgramId, baseMint, quoteMint, batchPda, tee, maker, userMasterSeed } = ctx;

  const brAcct = await l1.getAccountInfo(batchPda, "confirmed");
  if (!brAcct?.data) throw new Error("BatchResults account missing on L1");
  const brView = decodeBatchResults(brAcct.data);

  const userQuoteBuf = Buffer.from(ctx.userQuoteNoteCommitment);
  const makerNoteBuf = Buffer.from(ctx.makerNoteCommitment);
  const mr = brView.results.find(
    (r) =>
      r.status === 1 &&
      Buffer.from(r.noteBuyer).equals(userQuoteBuf) &&
      Buffer.from(r.noteSeller).equals(makerNoteBuf),
  );
  if (!mr) {
    const cb = brView.lastCircuitBreakerTripped;
    const twap = brView.lastPythTwap;
    const lastP = brView.lastClearingPrice;
    const lastN = brView.lastMatchCount;
    const writeCursor = brView.writeCursor;
    const hint = cb
      ? `Circuit breaker tripped (last clearing price ${lastP} deviated > circuit_breaker_bps from oracle TWAP ${twap}). ` +
        "Set NEXT_PUBLIC_DEMO_EXCHANGE_QUOTE_PER_BASE close to the mock-oracle TWAP (default 100) so the clearing price stays within the 5% band."
      : `last_match_count=${lastN}, last_clearing_price=${lastP}, twap=${twap}, write_cursor=${writeCursor}. ` +
        "run_batch may not have crossed any orders for this market — check that maker submit_order succeeded and prices crossed.";
    throw new Error(`No FILLED MatchResult for this run. ${hint}`);
  }

  if (mr.buyerFeeAmt !== 0n || mr.sellerFeeAmt !== 0n) {
    throw new Error(
      "Demo L1 settle + BASE withdraw currently requires zero protocol fees on the match " +
        `(buyer_fee=${mr.buyerFeeAmt}, seller_fee=${mr.sellerFeeAmt}). The dapp's pre-flight should have ` +
        "auto-zeroed vault.fee_rate_bps before run_batch — try the trade flow again from step 4.",
    );
  }

  const [vaultPda] = vaultConfigPda(vaultProgramId);
  const vcPre = await l1.getAccountInfo(vaultPda, "confirmed");
  if (!vcPre?.data) throw new Error("vault_config missing");
  const leafBeforeSettle = new DataView(
    vcPre.data.buffer,
    vcPre.data.byteOffset + 104,
    8,
  ).getBigUint64(0, true);

  const userSpending = deriveSpendingKey(userMasterSeed);
  const makerSeed = actorSeed("maker", maker);
  const makerSpending = deriveSpendingKey(makerSeed);

  const nullA = await nullifier(userSpending, mr.noteBuyer);
  const nullB = await nullifier(makerSpending, mr.noteSeller);

  const ucBuyer = be32ToBigInt(mr.userCommitmentBuyer);
  const ucSeller = be32ToBigInt(mr.userCommitmentSeller);

  const nonceC = deriveNonce(mr.matchId, TRADE_ROLE_BUYER);
  const blindC = deriveBlinding(mr.matchId, TRADE_ROLE_BUYER);
  const noteCcommitment = await noteCommitment({
    tokenMint: baseMint.toBytes(),
    amount: mr.baseAmt,
    ownerCommitment: ucBuyer,
    nonce: be32ToBigInt(nonceC),
    blindingR: be32ToBigInt(blindC),
  });

  const nonceD = deriveNonce(mr.matchId, TRADE_ROLE_SELLER);
  const blindD = deriveBlinding(mr.matchId, TRADE_ROLE_SELLER);
  const noteDcommitment = await noteCommitment({
    tokenMint: quoteMint.toBytes(),
    amount: mr.quoteAmt,
    ownerCommitment: ucSeller,
    nonce: be32ToBigInt(nonceD),
    blindingR: be32ToBigInt(blindD),
  });

  const noteE = isZero32(mr.noteEcommitment) ? ZERO_COMMITMENT : mr.noteEcommitment;
  const noteF = isZero32(mr.noteFcommitment) ? ZERO_COMMITMENT : mr.noteFcommitment;

  const payload: MatchResultPayload = {
    matchId: matchIdToPayloadBytes(mr.matchId),
    noteAcommitment: mr.noteBuyer,
    noteBcommitment: mr.noteSeller,
    noteCcommitment: noteCcommitment,
    noteDcommitment: noteDcommitment,
    noteEcommitment: noteE,
    noteFcommitment: noteF,
    nullifierA: nullA,
    nullifierB: nullB,
    orderIdA: ctx.userOrderId,
    orderIdB: ctx.makerOrderId,
    baseAmount: mr.baseAmt,
    quoteAmount: mr.quoteAmt,
    buyerChangeAmt: mr.buyerChangeAmt,
    sellerChangeAmt: mr.sellerChangeAmt,
    buyerFeeAmt: mr.buyerFeeAmt,
    sellerFeeAmt: mr.sellerFeeAmt,
    noteFeeCommitment: ZERO_COMMITMENT,
    buyerRelockOrderId: isRelockNone(mr.buyerRelockOrderId) ? RELOCK_ORDER_ID_NONE : mr.buyerRelockOrderId,
    buyerRelockExpiry: mr.buyerRelockExpiry,
    sellerRelockOrderId: isRelockNone(mr.sellerRelockOrderId) ? RELOCK_ORDER_ID_NONE : mr.sellerRelockOrderId,
    sellerRelockExpiry: mr.sellerRelockExpiry,
    clearingPrice: mr.price,
    batchSlot: mr.batchSlot,
  };

  const canonicalHash = canonicalPayloadHash(payload);
  const sigTee = nacl.sign.detached(canonicalHash, tee.secretKey);

  // ── Step 1: lock both notes ──────────────────────────────────────────────
  const lockTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    buildLockNoteInstruction({
      programId: vaultProgramId,
      teeAuthority: tee.publicKey,
      noteCommitment: mr.noteBuyer,
      orderId: ctx.userOrderId,
      expirySlot: ctx.userExpirySlot,
      amount: mr.buyerNoteValue,
    }),
    buildLockNoteInstruction({
      programId: vaultProgramId,
      teeAuthority: tee.publicKey,
      noteCommitment: mr.noteSeller,
      orderId: ctx.makerOrderId,
      expirySlot: ctx.makerExpirySlot,
      amount: mr.sellerNoteValue,
    }),
  );
  const lockSig = await sendAndConfirmTransaction(l1, lockTx, [tee], { commitment: "confirmed" });

  // ── Step 2: build MatchSlotWitness for the real match ───────────────────
  const realSlot: MatchSlotWitness = {
    noteAcommitment: mr.noteBuyer,
    noteBcommitment: mr.noteSeller,
    noteCcommitment,
    noteDcommitment,
    noteEcommitment: noteE,
    noteFcommitment: noteF,
    quoteMint: quoteMint.toBytes(),
    baseMint: baseMint.toBytes(),
    baseAmount: mr.baseAmt,
    quoteAmount: mr.quoteAmt,
    buyerChangeAmt: mr.buyerChangeAmt,
    sellerChangeAmt: mr.sellerChangeAmt,
    buyerFeeAmt: mr.buyerFeeAmt,
    sellerFeeAmt: mr.sellerFeeAmt,
    batchSlot: mr.batchSlot,
    aOwnerCommit: ucBuyer,
    bOwnerCommit: ucSeller,
    aAmount: mr.buyerNoteValue,
    bAmount: mr.sellerNoteValue,
    aNonce: be32ToBigInt(mr.noteBuyer.slice(0, 32)),
    aBlinding: 1n,
    bNonce: be32ToBigInt(mr.noteSeller.slice(0, 32)),
    bBlinding: 1n,
    cNonce: be32ToBigInt(nonceC),
    cBlinding: be32ToBigInt(blindC),
    dNonce: be32ToBigInt(nonceD),
    dBlinding: be32ToBigInt(blindD),
    eNonce: 0n,
    eBlinding: 0n,
    fNonce: 0n,
    fBlinding: 0n,
    clearingPrice: mr.price,
  };

  // ── Step 3: prove + land verify_match_batch ──────────────────────────────
  const batchResult = await landVerifyMatchBatch({
    connection: l1,
    vaultProgramId,
    teeKeypair: tee,
    realSlots: [realSlot],
    repoRoot: ctx.repoRoot,
  });

  // ── Step 4: compute Merkle inclusion path for slot 0 ────────────────────
  const inclusion = await merkleInclusionPath(batchResult.leaves, 0);

  // ── Step 5: per-batch ALT for the 5 derivable PDAs ──────────────────────
  const [lockA] = noteLockPda(vaultProgramId, payload.noteAcommitment);
  const [lockB] = noteLockPda(vaultProgramId, payload.noteBcommitment);
  const [lockEpda] = noteLockPda(vaultProgramId, payload.noteEcommitment ?? new Uint8Array(32));
  const [lockFpda] = noteLockPda(vaultProgramId, payload.noteFcommitment ?? new Uint8Array(32));
  const [batchMarker] = batchValidityMarkerPda(vaultProgramId, batchResult.merkleRoot);

  const blockhashCtx = await l1.getLatestBlockhashAndContext("confirmed");
  const slotForAlt = blockhashCtx.context.slot;
  const [createAltIx, batchAlt] = AddressLookupTableProgram.createLookupTable({
    authority: tee.publicKey,
    payer: tee.publicKey,
    recentSlot: slotForAlt,
  });
  const extendAltIx = AddressLookupTableProgram.extendLookupTable({
    payer: tee.publicKey,
    authority: tee.publicKey,
    lookupTable: batchAlt,
    addresses: [lockA, lockB, lockEpda, lockFpda, batchMarker],
  });
  const altTx = new Transaction().add(createAltIx, extendAltIx);
  const altSig = await sendAndConfirmTransaction(l1, altTx, [tee], { commitment: "confirmed" });

  // Wait one slot for ALT to be usable
  for (let attempt = 0; attempt < 30; attempt++) {
    const now = await l1.getSlot("confirmed");
    if (now > slotForAlt) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  // ── Step 6: tee_forced_settle_batched via v0 + stacked ALTs ─────────────
  const settleSig = await sendSettleV0({
    connection: l1,
    signer: tee,
    altPubkey: ctx.settleLookupTable,
    extraAltPubkeys: [batchAlt],
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      buildEd25519VerifyIx({
        teePubkey: tee.publicKey.toBytes(),
        signature: sigTee,
        message: canonicalHash,
      }),
      buildSettleBatchedIx({
        programId: vaultProgramId,
        teeAuthority: tee.publicKey,
        payload,
        matchIndex: 0,
        merkleProof: [
          inclusion.siblings[0],
          inclusion.siblings[1],
          inclusion.siblings[2],
          inclusion.siblings[3],
        ],
        merkleRoot: batchResult.merkleRoot,
      }),
    ],
  });

  // ── Step 7: close BatchValidityMarker to reclaim rent ───────────────────
  const closeTx = new Transaction().add(
    buildCloseBatchValidityMarkerIx({
      programId: vaultProgramId,
      authority: tee.publicKey,
      payer: tee.publicKey,
      merkleRoot: batchResult.merkleRoot,
    }),
  );
  const closeSig = await sendAndConfirmTransaction(l1, closeTx, [tee], { commitment: "confirmed" });

  const vcPost = await l1.getAccountInfo(vaultPda, "confirmed");
  if (!vcPost?.data) throw new Error("vault_config missing after settle");
  const leafAfter = new DataView(
    vcPost.data.buffer,
    vcPost.data.byteOffset + 104,
    8,
  ).getBigUint64(0, true);

  // Best-effort post-settle Merkle replay
  const cHex = Buffer.from(noteCcommitment).toString("hex");
  try {
    const leaves = await collectVaultLeavesOrdered(l1, vaultProgramId, Number(leafAfter), {
      maxSignatures: 2000,
    });
    const shadow = await MerkleShadow.create();
    for (const leaf of leaves) {
      await shadow.append(leaf);
    }
    const noteCLeaf = Number(leafBeforeSettle);
    const w = await shadow.witness(noteCLeaf);
    const onChainRoot = vcPost.data.subarray(112, 144);
    if (Buffer.compare(Buffer.from(w.root), Buffer.from(onChainRoot)) !== 0) {
      console.warn(
        "[run-trade-l1-settle] shadow Merkle root != vault current_root — RPC leaf replay may be incomplete.",
      );
    }
    const leafBytes = leaves[noteCLeaf];
    if (leafBytes && Buffer.compare(Buffer.from(leafBytes), Buffer.from(noteCcommitment)) !== 0) {
      console.warn(
        "[run-trade-l1-settle] replayed leaf at note_c index does not match derived note_c commitment.",
      );
    }
  } catch (e) {
    console.warn(
      "[run-trade-l1-settle] post-settle Merkle replay skipped:",
      e instanceof Error ? e.message : String(e),
    );
  }

  return {
    lockSettleSignatures: [
      { label: "lock_note ×2 (L1)", signature: lockSig, cluster: "l1" },
      { label: "verify_match_batch (L1)", signature: batchResult.txSig, cluster: "l1" },
      { label: "per-batch ALT create+extend (L1)", signature: altSig, cluster: "l1" },
      { label: "Ed25519 + tee_forced_settle_batched (L1)", signature: settleSig, cluster: "l1" },
      { label: "close_batch_validity_marker (L1)", signature: closeSig, cluster: "l1" },
    ],
    buyerBaseNote: {
      matchId: mr.matchId.toString(),
      leafIndex: leafBeforeSettle.toString(),
      amount: mr.baseAmt.toString(),
      nonce: be32ToBigInt(nonceC).toString(),
      blindingR: be32ToBigInt(blindC).toString(),
      commitmentHex: cHex,
      tokenMintBase58: baseMint.toBase58(),
      vaultLeafCountAfter: leafAfter.toString(),
    },
  };
}
