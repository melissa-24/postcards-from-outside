// Experiment page for the real vision worker.
// - Default: load the model, then check your own photo with the form.
// - ?mode=<name>: also run the 12 sample checks and save results-<name>.json.

const SAMPLES = [
  { photo: "maple-leaf", match: "a red maple leaf", decoys: ["a green leaf", "grass", "a rock"] },
  { photo: "fire-hydrant", match: "a fire hydrant", decoys: ["a mailbox", "a trash can", "a traffic cone"] },
  { photo: "pine-cone", match: "a pine cone", decoys: ["a rock", "a brown leaf", "a stick"] },
  { photo: "pumpkin", match: "a pumpkin", decoys: ["an orange ball", "a flower pot", "a rock"] },
  { photo: "squirrel", match: "a squirrel", decoys: ["a cat", "a bird", "a dog"] },
  { photo: "park-bench", match: "a park bench", decoys: ["a picnic table", "a fence", "a chair"] },
];

const $ = (id) => document.getElementById(id);
const log = (line) => ($("out").textContent += line + "\n");
const split = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

// The same worker file the app uses.
const worker = new Worker(new URL("../../src/lib/vision.worker.js", import.meta.url), { type: "module" });

// Turn worker messages into promises keyed by id.
let nextId = 1;
const pending = new Map();
let onReady;
worker.onmessage = ({ data }) => {
  if (data.type === "progress") $("status").textContent = `Loading model… ${Math.round(data.progress)}%`;
  else if (data.type === "ready") onReady();
  else if (data.id != null) pending.get(data.id)?.(data), pending.delete(data.id);
  else if (data.type === "error") $("status").textContent = "Error: " + data.message;
};
const check = (msg) => new Promise((resolve) => {
  const id = nextId++;
  pending.set(id, resolve);
  worker.postMessage({ type: "check", id, ...msg });
});

function formatResult(r) {
  if (r.type === "error") return "ERROR: " + r.message;
  const rows = r.scores.map((s) => `  ${s.score.toFixed(3)}  ${s.label}`).join("\n");
  return `${r.found ? "FOUND" : "not found"} (match score ${r.score.toFixed(3)})\n${rows}`;
}

// Your own photo.
$("form").onsubmit = async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const blob = f.get("photo");
  $("preview").src = URL.createObjectURL(blob);
  $("preview").hidden = false;
  $("out").textContent = "Checking…";
  const r = await check({ blob, match: f.get("match").trim(), decoys: split(f.get("decoys")), skipBackground: split(f.get("skip")) });
  $("out").textContent = formatResult(r);
};

// The 12 sample checks: each photo against its own item and the next one.
async function runSamples(mode) {
  const checks = [];
  for (const [i, item] of SAMPLES.entries()) {
    const blob = await (await fetch(`./photos/${item.photo}.jpg`)).blob();
    const wrong = SAMPLES[(i + 1) % SAMPLES.length];
    for (const [kind, target] of [["right", item], ["wrong", wrong]]) {
      const r = await check({ blob, match: target.match, decoys: target.decoys });
      checks.push({ photo: item.photo, kind, lookingFor: target.match, found: r.found, matchScore: +r.score.toFixed(3), top: r.top,
        scores: r.scores.map((s) => `${s.score.toFixed(3)} ${s.label}`) });
      log(`${item.photo} vs "${target.match}": ${formatResult(r)}\n`);
    }
  }
  await fetch(`/__results?mode=${mode}`, { method: "POST", body: JSON.stringify({ checks }) });
  document.title = "DONE";
}

const t0 = performance.now();
worker.postMessage({ type: "load" });
await new Promise((resolve) => (onReady = resolve));
$("status").textContent = `Model ready in ${((performance.now() - t0) / 1000).toFixed(1)} s`;
$("form").querySelector("button").disabled = false;

const mode = new URLSearchParams(location.search).get("mode");
if (mode) runSamples(mode);
