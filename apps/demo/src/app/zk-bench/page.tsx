"use client";

import { useEffect, useRef, useState } from "react";
import { groth16 } from "snarkjs";
import { buildPoseidon } from "circomlibjs";

import { NyxNav } from "@/components/brand/nyx-nav";
import { NyxFooter } from "@/components/brand/nyx-footer";

// ---------------------------------------------------------------------------
// Poseidon helpers — built from bundled circomlibjs, identical to SDK
// ---------------------------------------------------------------------------
type PoseidonFn = ((inputs: bigint[]) => Uint8Array) & { F: { toObject: (x: Uint8Array) => bigint } };
let poseidonCache: PoseidonFn | null = null;

async function getPoseidon(): Promise<PoseidonFn> {
  if (poseidonCache) return poseidonCache;
  const p = await buildPoseidon();
  const fn = ((inputs: bigint[]) => p(inputs.map((i) => p.F.e(i)))) as PoseidonFn;
  fn.F = p.F;
  poseidonCache = fn;
  return fn;
}

const BN254_R = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function randFr(): bigint {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  let n = 0n;
  for (const b of buf) n = (n << 8n) | BigInt(b);
  return n % BN254_R;
}

// Split a 32-byte pubkey into [lo_u128, hi_u128] — mirrors pubkeyToFrPair in SDK
function pubkeyToFrPair(pk: Uint8Array): [bigint, bigint] {
  let lo = 0n, hi = 0n;
  for (let i = 0; i < 16; i++)  hi = (hi << 8n) | BigInt(pk[i]);
  for (let i = 16; i < 32; i++) lo = (lo << 8n) | BigInt(pk[i]);
  return [lo, hi];
}

function posH(p: PoseidonFn, ...args: bigint[]): bigint {
  return p.F.toObject(p(args));
}

// Build circuit inputs using the same derivation as devnet-trade-flow.test.ts
async function buildInputs(log: (s: string) => void) {
  const p = await getPoseidon();

  // --- VALID_WALLET_CREATE ---
  const spendingKey = randFr();
  const viewingKey  = randFr();
  const seed0 = BigInt(Math.floor(Math.random() * 0xFFFFFF));
  const r0 = seed0 + 1n;
  const r1 = seed0 + 2n;
  const r2 = seed0 + 3n;

  const rootKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const [rootKeyLo, rootKeyHi] = pubkeyToFrPair(rootKeyBytes);

  const rootHash   = posH(p, 10n, rootKeyLo, rootKeyHi, r0);
  const spendHash  = posH(p, 11n, spendingKey, r1);
  const viewHash   = posH(p, 12n, viewingKey,  r2);
  const leafPair   = posH(p, 13n, rootHash, spendHash);
  const userCommit = posH(p, 14n, leafPair, viewHash);

  const wcInputs: Record<string, string | string[]> = {
    userCommitment: userCommit.toString(),
    rootKey: [rootKeyLo.toString(), rootKeyHi.toString()],
    spendingKey: spendingKey.toString(),
    viewingKey:  viewingKey.toString(),
    r0: r0.toString(),
    r1: r1.toString(),
    r2: r2.toString(),
  };
  log(`WC inputs ready (rootKeyLo < 2^128, rootKeyHi < 2^128)`);

  // --- VALID_SPEND / VALID_INPUT shared witness ---
  const ownerBlinding = randFr();
  const nonce = randFr();
  const blindingR = randFr();
  const mintBytes = crypto.getRandomValues(new Uint8Array(32));
  const [mintLo, mintHi] = pubkeyToFrPair(mintBytes);
  const amount = 1000n;

  const ownerCommit = posH(p, 1n, spendingKey, ownerBlinding);
  const noteCommit  = posH(p, 2n, mintLo, mintHi, amount, ownerCommit, nonce, blindingR);
  const nullifierVal = posH(p, 3n, spendingKey, noteCommit);

  const zeroPath = Array(20).fill("0");
  const zeroIdx  = Array(20).fill("0");
  let root = noteCommit;
  for (let i = 0; i < 20; i++) root = posH(p, root, 0n);

  const spendInputs: Record<string, string | string[]> = {
    merkleRoot: root.toString(),
    nullifier: nullifierVal.toString(),
    tokenMint: [mintLo.toString(), mintHi.toString()],
    amount: amount.toString(),
    spendingKey: spendingKey.toString(),
    ownerCommitmentBlinding: ownerBlinding.toString(),
    nonce: nonce.toString(),
    blindingR: blindingR.toString(),
    merklePath: zeroPath,
    merkleIndices: zeroIdx,
  };
  const inputInputs: Record<string, string | string[]> = {
    merkleRoot: root.toString(),
    noteCommitment: noteCommit.toString(),
    tokenMint: [mintLo.toString(), mintHi.toString()],
    amount: amount.toString(),
    spendingKey: spendingKey.toString(),
    ownerCommitmentBlinding: ownerBlinding.toString(),
    nonce: nonce.toString(),
    blindingR: blindingR.toString(),
    merklePath: zeroPath,
    merkleIndices: zeroIdx,
  };

  return { wcInputs, spendInputs, inputInputs };
}

// ---------------------------------------------------------------------------
// IndexedDB cache helper
// ---------------------------------------------------------------------------
const IDB_NAME = "zk-bench-artifacts";
const IDB_STORE = "bufs";
const IDB_VERSION = 1;

function openArtifactDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<Uint8Array | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as Uint8Array | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function fetchBuf(
  url: string,
  db: IDBDatabase | null,
  onSource: (source: "idb" | "network") => void,
): Promise<Uint8Array> {
  if (db) {
    const cached = await idbGet(db, url);
    if (cached) {
      onSource("idb");
      return cached;
    }
  }
  onSource("network");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (db) {
    idbPut(db, url, buf).catch(() => {});
  }
  return buf;
}

// ---------------------------------------------------------------------------
// WASM module caching
// ---------------------------------------------------------------------------
const _wasmModuleCache = new Map<Uint8Array, WebAssembly.Module>();
const _origCompile = WebAssembly.compile.bind(WebAssembly);

function installWasmCompileCache() {
  (WebAssembly as unknown as Record<string, unknown>).compile = async function(
    bytes: BufferSource
  ): Promise<WebAssembly.Module> {
    if (bytes instanceof Uint8Array) {
      const cached = _wasmModuleCache.get(bytes);
      if (cached) return cached;
      const mod = await _origCompile(bytes);
      _wasmModuleCache.set(bytes, mod);
      return mod;
    }
    return _origCompile(bytes as ArrayBuffer);
  };
}

async function precompileWasm(wasmBuf: Uint8Array): Promise<void> {
  const ab = wasmBuf.buffer.slice(wasmBuf.byteOffset, wasmBuf.byteOffset + wasmBuf.byteLength) as ArrayBuffer;
  const mod = await _origCompile(ab);
  _wasmModuleCache.set(wasmBuf, mod);
}

// ---------------------------------------------------------------------------
// Benchmark constants
// ---------------------------------------------------------------------------
interface RunResult { label: string; elapsed: number; run: number; }

const V = "?v=3";
const CIRCUITS = [
  { 
    label: "VALID_WALLET_CREATE", 
    wasmUrl: `/circuits/valid_wallet_create/circuit.wasm${V}`, 
    zkeyUrl: `/circuits/valid_wallet_create/circuit.zkey${V}`, 
    inputsKey: "wcInputs" as const,
    size: "1.4MB",
    role: "Derives deterministically public user commitment from master spending and viewing seeds."
  },
  { 
    label: "VALID_INPUT",         
    wasmUrl: `/circuits/valid_input/circuit.wasm${V}`,         
    zkeyUrl: `/circuits/valid_input/circuit.zkey${V}`,         
    inputsKey: "inputInputs" as const,
    size: "5.2MB",
    role: "Proves that a state note commitment exists within the depth-20 incremental Merkle tree."
  },
  { 
    label: "VALID_SPEND",         
    wasmUrl: `/circuits/valid_spend/circuit.wasm${V}`,         
    zkeyUrl: `/circuits/valid_spend/circuit.zkey${V}`,         
    inputsKey: "spendInputs" as const,
    size: "5.4MB",
    role: "Consumes a note by revealing its spending nullifier on-chain without disclosing balance or owner identity."
  },
] as const;

const CIRCUIT_COLOR: Record<string, string> = {
  "VALID_WALLET_CREATE": "var(--nyx-accent)",
  "VALID_INPUT":         "#5fb85f",
  "VALID_SPEND":         "#d9a441",
};

export default function ZkBenchPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [averages, setAverages] = useState<Record<string, number> | null>(null);
  const [fetchMs, setFetchMs] = useState<number | null>(null);
  const [compileMs, setCompileMs] = useState<number | null>(null);
  const [fetchSources, setFetchSources] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [activeCircuit, setActiveCircuit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  async function startBench() {
    setLogs(["Building circuit inputs (Poseidon, same derivation as SDK)..."]);
    setRuns([]);
    setAverages(null);
    setFetchMs(null);
    setCompileMs(null);
    setFetchSources({});
    setError(null);
    setRunning(true);

    try {
      const inputs = await buildInputs(addLog);

      let db: IDBDatabase | null = null;
      try { db = await openArtifactDb(); } catch { addLog("IndexedDB unavailable — falling back to network only"); }

      addLog("Fetching circuit artifacts in parallel (IDB → network)...");

      const sources: Record<string, string> = {};
      const t0 = performance.now();
      setFetchSources({});
      const bufs = await Promise.all(
        CIRCUITS.map(c => Promise.all([
          fetchBuf(c.wasmUrl, db, s => { sources[c.label + ".wasm"] = s; }),
          fetchBuf(c.zkeyUrl, db, s => { sources[c.label + ".zkey"] = s; }),
        ]))
      );
      const fMs = Math.round(performance.now() - t0);
      setFetchMs(fMs);
      setFetchSources({...sources});
      bufs.forEach(([wasm, zkey], i) => {
        const l = CIRCUITS[i].label;
        const wasmSrc = sources[l + ".wasm"] === "idb" ? "idb ✓" : "network";
        const zkeySrc = sources[l + ".zkey"] === "idb" ? "idb ✓" : "network";
        addLog(`  ${l}: wasm=${wasm.length}B (${wasmSrc}) zkey=${zkey.length}B (${zkeySrc})`);
      });

      installWasmCompileCache();
      addLog("Pre-compiling wasm modules...");
      const tCompile = performance.now();
      await Promise.all(bufs.map(([wasm]) => precompileWasm(wasm)));
      const cMs = Math.round(performance.now() - tCompile);
      setCompileMs(cMs);
      addLog(`Wasm compiled in ${cMs}ms. Starting proofs (${CIRCUITS.length} circuits × 3 runs)...`);

      const results: RunResult[] = [];
      for (let ci = 0; ci < CIRCUITS.length; ci++) {
        const c = CIRCUITS[ci];
        const [wasmBuf, zkeyBuf] = bufs[ci];
        const circuitInputs = inputs[c.inputsKey];

        for (let i = 0; i < 3; i++) {
          addLog(`${c.label} run ${i + 1}...`);
          setActiveCircuit(c.label);
          const t = performance.now();
          await groth16.fullProve(circuitInputs, wasmBuf, zkeyBuf);
          const elapsed = Math.round(performance.now() - t);
          const r: RunResult = { label: c.label, elapsed, run: i + 1 };
          results.push(r);
          setRuns(prev => [...prev, r]);
          addLog(`  → ${elapsed}ms`);
        }
      }
      setActiveCircuit(null);

      const avg = (label: string) => {
        const times = results.filter(r => r.label === label).map(r => r.elapsed);
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      };
      const avgWC = avg("VALID_WALLET_CREATE");
      const avgIN = avg("VALID_INPUT");
      const avgSP = avg("VALID_SPEND");
      setAverages({ "VALID_WALLET_CREATE": avgWC, "VALID_INPUT": avgIN, "VALID_SPEND": avgSP });
      addLog(`Done. Wasm compile (one-time): ${cMs}ms`);
    } catch (e) {
      const msg = e instanceof Error ? e.message + (e.stack ? "\n" + e.stack : "") : String(e);
      setError(msg);
      setActiveCircuit(null);
    } finally {
      setRunning(false);
    }
  }

  const isCacheHit = Object.values(fetchSources).every(s => s === "idb");
  const isPartialHit = Object.values(fetchSources).some(s => s === "idb") && !isCacheHit;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-nyx-ink text-nyx-chalk">
      <NyxNav tone="ink" active={null} launchHref="/dapp" />

      <main className="flex-1 relative isolate border-b border-white/6 py-10 sm:py-16">
        {/* Subtle grid background */}
        <div className="nyx-aurora" />
        <div className="nyx-grid absolute inset-0 -z-10 opacity-60" />

        <div className="mx-auto max-w-4xl px-5 sm:px-7">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--nyx-accent)]">
              darknyx protocol · validator bench
            </span>
            <h1 className="nyx-display mt-2 text-[32px] sm:text-[42px] leading-tight">
              ZK Prover Benchmark
            </h1>
            <p className="mt-4 max-w-3xl text-[13px] text-nyx-fog leading-relaxed">
              Verify local zero-knowledge performance entirely client-side. This dashboard downloads standard BN254 Groth16 circuit blobs into a sandboxed in-memory space, precompiles the WebAssembly structure, and tracks raw computation metrics.
            </p>
          </div>

          {/* Interactive Circuits Map */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {CIRCUITS.map((c) => {
              const isActive = activeCircuit === c.label;
              const hasAvg = averages && averages[c.label];
              return (
                <div
                  key={c.label}
                  className="relative overflow-hidden rounded-xl border p-5 transition-all"
                  style={{
                    borderColor: isActive 
                      ? `${CIRCUIT_COLOR[c.label]}77` 
                      : "rgba(255,255,255,0.06)",
                    background: isActive ? "#0c0d10" : "#050608",
                    boxShadow: isActive 
                      ? `0 0 20px ${CIRCUIT_COLOR[c.label]}11` 
                      : "inset 0 1px 0 rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        background: `${CIRCUIT_COLOR[c.label]}15`,
                        color: CIRCUIT_COLOR[c.label],
                        border: `1px solid ${CIRCUIT_COLOR[c.label]}30`
                      }}
                    >
                      {c.size}
                    </span>
                    {isActive ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: CIRCUIT_COLOR[c.label] }}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: CIRCUIT_COLOR[c.label] }}></span>
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.label}</h3>
                  <p className="mt-2 text-[11px] text-nyx-slate leading-relaxed">{c.role}</p>

                  {hasAvg ? (
                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-baseline justify-between">
                      <span className="text-[10px] text-nyx-slate uppercase font-mono">avg speed</span>
                      <span className="text-[16px] font-bold" style={{ color: CIRCUIT_COLOR[c.label] }}>{averages[c.label]}ms</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-stretch mb-8">
            {/* Action panel */}
            <div className="flex-1 flex flex-col justify-between p-6 rounded-xl border border-white/[0.06] bg-[#050608]/80 backdrop-blur">
              <div>
                <h4 className="font-semibold text-[14px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Prover Executor</h4>
                <p className="mt-2 text-[11px] text-nyx-slate leading-relaxed">
                  Click below to instantiate Web Provers and run a 3-pass average trial for each Groth16 circuit.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 items-center">
                <button
                  onClick={startBench}
                  disabled={running}
                  className="group relative overflow-hidden rounded px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: running ? "rgba(255,255,255,0.04)" : "var(--nyx-accent-soft)",
                    border: running ? "1px solid rgba(255,255,255,0.1)" : "1px solid oklch(0.62 0.14 260 / 0.4)",
                    color: running ? "#6b6b74" : "var(--nyx-accent)",
                  }}
                >
                  {running ? "● Proving in background..." : "▶ Run benchmark"}
                </button>
              </div>
            </div>

            {/* Performance stats */}
            {averages ? (
              <div className="w-full md:w-80 flex flex-col gap-3">
                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#050608]/80 backdrop-blur flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-nyx-slate block">Cache status</span>
                    <span className="text-[12px] font-semibold mt-1 block">
                      {isCacheHit ? `IndexedDB Cache Hit (${fetchMs ?? 0}ms)` : isPartialHit ? `Partial Cache (${fetchMs ?? 0}ms)` : `Cold Network (${fetchMs ?? 0}ms)`}
                    </span>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${isCacheHit ? "bg-nyx-signal-green" : isPartialHit ? "bg-nyx-signal-amber" : "bg-nyx-slate"} shadow`}></div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#050608]/80 backdrop-blur flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-nyx-slate block">One-time WASM Precompile</span>
                    <span className="text-[14px] font-bold mt-0.5 block">{compileMs ?? 0}ms</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#050608]/80 backdrop-blur flex justify-between items-center" style={{ borderColor: "oklch(0.62 0.14 260 / 0.2)" }}>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-nyx-slate block" style={{ color: "var(--nyx-accent)" }}>Estimated transaction delay</span>
                    <span className="text-[12px] text-nyx-fog mt-0.5 block">
                      VALID_INPUT + VALID_SPEND
                    </span>
                  </div>
                  <span className="text-[20px] font-extrabold text-[var(--nyx-accent)]">{averages["VALID_INPUT"] + averages["VALID_SPEND"]}ms</span>
                </div>
              </div>
            ) : (
              <div className="w-full md:w-80 p-5 rounded-xl border border-white/[0.04] bg-[#050608]/40 flex flex-col justify-center items-center text-center">
                <span className="font-mono text-[10px] text-nyx-slate uppercase tracking-widest">no metrics available</span>
                <span className="text-[11px] text-nyx-slate mt-2">Run proving sequence to collect live system statistics.</span>
              </div>
            )}
          </div>

          {/* Live Progress Bar Section */}
          {runs.length > 0 ? (
            <div className="mb-8 p-6 rounded-xl border border-white/[0.06] bg-[#050608]/80 backdrop-blur">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-nyx-slate mb-4">Prover Execution Graph</h4>
              <div className="space-y-4">
                {runs.map((r, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.02] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CIRCUIT_COLOR[r.label] }} />
                      <span className="font-mono text-[11px] tracking-wide w-44">{r.label}</span>
                      <span className="font-mono text-[10px] text-nyx-slate">Run #{r.run}</span>
                    </div>

                    <div className="flex-1 max-w-sm sm:mx-6 flex items-center gap-3">
                      <div className="relative h-2 w-full overflow-hidden rounded bg-white/5 border border-white/10">
                        <div 
                          className="h-full rounded transition-all duration-300 relative overflow-hidden"
                          style={{ 
                            background: CIRCUIT_COLOR[r.label], 
                            width: `${Math.min(r.elapsed / 15, 100)}%`,
                            boxShadow: `0 0 8px ${CIRCUIT_COLOR[r.label]}`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-semibold w-16 text-right text-nyx-fog">{r.elapsed}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* High-Tech Terminal Logger */}
          {logs.length > 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#07080a]/90 overflow-hidden shadow-2xl">
              <div className="px-4 py-2 border-b border-white/[0.04] bg-white/[0.02] flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-nyx-slate">prover console logs</span>
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="p-4 max-h-60 overflow-y-auto font-mono text-[11px] text-[#aeacb0]/90 space-y-1.5 leading-relaxed">
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-nyx-slate opacity-40 select-none">[{i.toString().padStart(2, "0")}]</span>
                    <span>{l}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          ) : null}

          {/* Error panel */}
          {error && (
            <div className="mt-6 rounded-xl border border-nyx-signal-red/20 bg-nyx-signal-red/5 p-4 text-[12px] font-mono text-nyx-signal-red leading-relaxed">
              <span className="font-bold block uppercase tracking-wider mb-1">Execution Fail</span>
              {error}
            </div>
          )}
        </div>
      </main>

      <NyxFooter tone="ink" />
    </div>
  );
}
