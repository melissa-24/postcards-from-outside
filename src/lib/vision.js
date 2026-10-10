// Main-thread side of the photo checker. Owns the one vision worker and turns
// its messages into promises, so screens never touch postMessage.
//
//   await loadVision((percent) => ...)       resolves when the model is ready
//   const r = await checkPhoto(blob, item)   r = { found, score, top, scores }

let worker = null;
let readyPromise = null; // shared by every caller, so StrictMode's double effect loads once
let loading = null; // { resolve, reject } for readyPromise while the model loads
let onProgressFn = null;
const pending = new Map(); // check id → { resolve, reject }
let nextId = 1;

function getWorker() {
  if (worker) return worker;
  // This exact `new URL(..., import.meta.url)` form lets Vite bundle the worker.
  worker = new Worker(new URL("./vision.worker.js", import.meta.url), { type: "module" });

  worker.onmessage = ({ data }) => {
    if (data.type === "progress") onProgressFn?.(data.progress);
    else if (data.type === "ready") loading?.resolve();
    else if (data.type === "result") settle(data.id, "resolve", data);
    else if (data.type === "error") {
      const err = new Error(data.message);
      if (data.id != null) settle(data.id, "reject", err);
      else failLoad(err); // errors without an id come from loading
    }
  };

  // The worker itself died (e.g. the phone ran low on memory).
  // Fail everything in flight; the next call starts a fresh worker.
  worker.onerror = (e) => {
    const err = new Error(e.message || "The photo checker stopped");
    failLoad(err);
    for (const p of pending.values()) p.reject(err);
    pending.clear();
    worker.terminate();
    worker = null;
  };
  return worker;
}

function settle(id, how, value) {
  pending.get(id)?.[how](value);
  pending.delete(id);
}

// Clear the cached promise so a later loadVision() can retry (e.g. signal came back).
function failLoad(err) {
  loading?.reject(err);
  loading = null;
  readyPromise = null;
}

export function loadVision(onProgress) {
  if (onProgress) onProgressFn = onProgress; // latest screen gets progress updates
  readyPromise ??= new Promise((resolve, reject) => {
    loading = { resolve, reject };
    getWorker().postMessage({ type: "load" });
  });
  return readyPromise;
}

export async function checkPhoto(blob, item) {
  await loadVision(); // instant if already loaded
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({
      type: "check",
      id,
      blob,
      match: item.match,
      decoys: item.decoys,
      skipBackground: item.skipBackground, // optional; worker defaults to []
    });
  });
}
