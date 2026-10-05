// Throwaway test page: cold load, warm load (fresh worker, cached files),
// then each photo checked against its own item and against a wrong item.

const ITEMS = [
  { photo: "maple-leaf", match: "a red maple leaf", decoys: ["a green leaf", "grass", "a rock"] },
  { photo: "fire-hydrant", match: "a fire hydrant", decoys: ["a mailbox", "a trash can", "a traffic cone"] },
  { photo: "pine-cone", match: "a pine cone", decoys: ["a rock", "a brown leaf", "a stick"] },
  { photo: "pumpkin", match: "a pumpkin", decoys: ["an orange ball", "a flower pot", "a rock"] },
  { photo: "squirrel", match: "a squirrel", decoys: ["a cat", "a bird", "a dog"] },
  { photo: "park-bench", match: "a park bench", decoys: ["a picnic table", "a fence", "a chair"] },
];

const out = document.getElementById("out");
const log = (line) => (out.textContent += line + "\n");

// Wrap the worker in a tiny request/response helper.
function startWorker() {
  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  let waiting = null;
  worker.onmessage = ({ data }) => {
    if (data.type === "progress") return; // keep the log readable
    if (data.type === "error") log("ERROR: " + data.message);
    waiting?.(data);
  };
  const send = (msg) => new Promise((resolve) => { waiting = resolve; worker.postMessage(msg); });
  return { worker, send };
}

async function run() {
  const results = { userAgent: navigator.userAgent, cores: navigator.hardwareConcurrency, checks: [] };

  log("Cold load (downloads model on first visit)...");
  let w = startWorker();
  const cold = await w.send({ type: "load" });
  if (cold.type === "error") return finish(results);
  Object.assign(results, { coldLoadMs: cold.ms, numThreads: cold.numThreads, crossOriginIsolated: cold.crossOriginIsolated });
  log(`  ${cold.ms.toFixed(0)} ms (threads: ${cold.numThreads}, isolated: ${cold.crossOriginIsolated})`);

  // A fresh worker simulates reopening the app: files come from the browser cache.
  w.worker.terminate();
  log("Warm load (fresh worker, cached files)...");
  w = startWorker();
  const warm = await w.send({ type: "load" });
  results.warmLoadMs = warm.ms;
  log(`  ${warm.ms.toFixed(0)} ms`);

  for (const [i, item] of ITEMS.entries()) {
    const blob = await (await fetch(`./photos/${item.photo}.jpg`)).blob();
    const wrong = ITEMS[(i + 1) % ITEMS.length]; // check the photo against the next item too
    for (const [kind, target] of [["right", item], ["wrong", wrong]]) {
      const labels = [target.match, ...target.decoys];
      const r = await w.send({ type: "classify", id: item.photo, blob, labels });
      const top = r.scores[0];
      const found = top.label === target.match;
      const check = {
        photo: item.photo, kind, lookingFor: target.match, found,
        top: top.label, topScore: +top.score.toFixed(3),
        matchScore: +r.scores.find((s) => s.label === target.match).score.toFixed(3),
        decodeMs: Math.round(r.decodeMs), inferMs: Math.round(r.inferMs),
      };
      results.checks.push(check);
      log(`  ${item.photo} vs "${target.match}" → ${found ? "FOUND" : "not found"} (top: ${top.label} ${check.topScore}) ${check.inferMs} ms`);
    }
  }
  finish(results);
}

// Send results to the dev server so they can be read from disk.
async function finish(results) {
  log("\n" + JSON.stringify(results, null, 2));
  await fetch(`/__results?mode=${new URLSearchParams(location.search).get("mode") || "plain"}`, {
    method: "POST",
    body: JSON.stringify(results),
  });
  document.title = "DONE";
}

run();
