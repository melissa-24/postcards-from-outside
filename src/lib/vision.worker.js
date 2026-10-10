// Photo checker. Runs CLIP in a Web Worker so the UI never freezes during a check.
//
// Messages in:
//   { type: "load" }
//   { type: "check", id, blob, match, decoys, skipBackground? }
// Messages out:
//   { type: "progress", progress }   0–100 while model files load
//   { type: "ready" }
//   { type: "result", id, found, score, top, scores }   scores: every label, highest first
//   { type: "error", id?, message }
import { pipeline, env, RawImage } from "@huggingface/transformers";

const MODEL_ID = "Xenova/clip-vit-base-patch32";
// Tuned in experiments/clip-wasm with background decoys: true matches ≥ 0.599, false ones ≤ 0.232.
const THRESHOLD = 0.4;
const DEBUG = import.meta.env.DEV; // logs to the console in dev, silent in production

// Added to every check. Without them, a photo that matches none of the item's
// labels still gives its confidence to one of them, often the match label.
// An item can opt out of any of these with skipBackground (e.g. a cloud skips "the sky").
const BACKGROUND_DECOYS = ["grass", "pavement", "the sky"];

env.allowLocalModels = false; // always use the Hub, then the browser cache

// One loading promise for the life of the worker, so the model loads once per hunt.
let classifierPromise = null;

function loadModel() {
  classifierPromise ??= pipeline("zero-shot-image-classification", MODEL_ID, {
    device: "wasm", // CPU only; WebGPU hung this laptop's GPU before
    dtype: "q8",
    progress_callback: (p) => {
      if (p.status === "progress_total") {
        self.postMessage({ type: "progress", progress: p.progress });
      }
    },
  }).catch((err) => {
    classifierPromise = null; // let a later "load" retry (e.g. signal came back)
    throw err;
  });
  return classifierPromise;
}

async function check({ id, blob, match, decoys, skipBackground = [] }) {
  const classifier = await loadModel();
  const background = BACKGROUND_DECOYS.filter((label) => !skipBackground.includes(label));
  // Dedupe in case an item already lists a background label as a decoy.
  const labels = [...new Set([match, ...decoys, ...background])];

  const t0 = performance.now();
  const image = await RawImage.fromBlob(blob);
  const scores = await classifier(image, labels); // sorted, highest first
  const ms = performance.now() - t0;

  const top = scores[0];
  const found = top.label === match && top.score >= THRESHOLD;

  if (DEBUG) {
    console.groupCollapsed(`[vision] "${match}" → ${found ? "FOUND" : "not found"} (${ms.toFixed(0)} ms)`);
    console.table(scores);
    console.groupEnd();
  }
  return { id, found, score: scores.find((s) => s.label === match).score, top: top.label, scores };
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") {
      await loadModel();
      self.postMessage({ type: "ready" });
    } else if (data.type === "check") {
      self.postMessage({ type: "result", ...(await check(data)) });
    }
  } catch (err) {
    self.postMessage({ type: "error", id: data.id, message: String(err?.message || err) });
  }
};
