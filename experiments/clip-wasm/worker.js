// Throwaway test worker: does CLIP run on the wasm backend, and how fast?
import { pipeline, env, RawImage } from "@huggingface/transformers";

const MODEL_ID = "Xenova/clip-vit-base-patch32";
env.allowLocalModels = false; // always fetch from the Hub (then browser cache)

let classifierPromise = null;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") {
      const t0 = performance.now();
      classifierPromise ??= pipeline("zero-shot-image-classification", MODEL_ID, {
        device: "wasm",
        dtype: "q8",
        progress_callback: (p) => {
          if (p.status === "progress_total") {
            self.postMessage({ type: "progress", progress: p.progress });
          }
        },
      });
      await classifierPromise;
      self.postMessage({
        type: "loaded",
        ms: performance.now() - t0,
        numThreads: env.backends.onnx.wasm.numThreads,
        crossOriginIsolated: self.crossOriginIsolated,
      });
    }

    if (data.type === "classify") {
      const classifier = await classifierPromise;
      const t0 = performance.now();
      const image = await RawImage.fromBlob(data.blob); // same path the app will use
      const tDecode = performance.now();
      const scores = await classifier(image, data.labels);
      const t1 = performance.now();
      self.postMessage({
        type: "classified",
        id: data.id,
        scores,
        decodeMs: tDecode - t0,
        inferMs: t1 - tDecode,
      });
    }
  } catch (err) {
    self.postMessage({ type: "error", message: String(err?.stack || err) });
  }
};
