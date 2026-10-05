# Project brief: Postcards from Outside (Hacktoberfest "Touch Grass" challenge)

Repo: `postcards-from-outside`

## What we're building

**Postcards from Outside** is a phone-first web app that gets people outside on a fall scavenger hunt. You go out, find things, and come back with a postcard.

1. The user says **who's coming along** (pick any): Kids, Walking the dog, Easy pace (seniors, paved paths), Adults.
2. They enter **names for the postcard** (for example "Melissa, Mom & Tucker").
3. **Optional location**: they can type a city/state or zip code, or skip it. This is done at home before heading out.
4. The app builds a hunt of **5 (Quick) or 8 (Regular)** items suited to the group, the region, and the current month (from the device date).
5. **The hunt**: tap an item, the phone camera opens, snap a photo, and an open-weight vision model running on the device checks it. Results: "Found it!" or "Hmm, not sure that's it" with **Try again** and **Count it anyway** (the AI will sometimes be wrong; never trap the user).
6. **The postcard**: when done, the user types a title. The app draws a collage of their photos with the title, the date, and the names stamped on, plus a 🐾 stamp if the dog came. Buttons: **Save**, **Share**, **Challenge a friend**.

The real users: me (Melissa), my mom, and our dog Tucker, on phones, outdoors. The screen should be the shortest part of the experience: big buttons, one tap to the camera, minimal reading.

## Hard constraints

- **Dev machine is a Windows laptop with Intel UHD integrated graphics.** In a previous project, every WebGPU model (via WebLLM) hung the GPU (`DXGI_ERROR_DEVICE_HUNG`). So **do not use WebGPU or WebLLM.** Run models on the **CPU** with **Transformers.js** (`@huggingface/transformers`) using `device: "wasm"`.
- Check that any ONNX model and dtype actually runs on the wasm backend before building around it. (Last time a Gemma 3 ONNX build failed on wasm with an unsupported `GatherBlockQuantized` operation in both q4 and q8.) `q8` is usually the safe dtype for wasm.
- **Node is v22.11.0**, which is too old for Vite 7+. **Use Vite 6** and `@vitejs/plugin-react@4`.
- **`src/App.jsx` is the entry point** (it calls `createRoot` itself). `index.html` loads `/src/App.jsx`. There is no `main.jsx`.
- Plain **JavaScript** (not TypeScript). React.
- Terminal is **Git Bash** on Windows.

## AI: what it does and doesn't do

- **Photo checking is AI**: zero-shot image classification with an open-weight **CLIP** model in Transformers.js (for example `Xenova/clip-vit-base-patch32`; verify the model ID and that it loads on wasm). Compare the photo against the item's `match` label and its `decoys`. Count it as found if the match label scores highest (tune a threshold if needed).
- **The item list is NOT AI-generated.** It is a hand-written data file, filtered and shuffled by code. Small models are unreliable at inventing facts; keep AI where it's reliable.
- Load the model once and cache the loading promise (React StrictMode runs effects twice in dev). Show a friendly progress screen on first load.
- Before heavy model work, yield to the browser (`requestAnimationFrame` + `setTimeout(0)`) so spinners actually paint.
- Add a `DEBUG` flag that logs model inputs, scores, and timing to the console in collapsible groups; off for production.

## Item data format

```js
{
  id: "red-maple-leaf",
  label: "A red maple leaf",
  emoji: "🍁",
  who: ["kids", "adults", "easy"],      // company types it suits: kids | dog | easy | adults
  regions: ["north", "middle"],         // "north" | "middle" | "south", or "anywhere"
  months: [9, 10, 11],                  // 1-12, when it's findable
  match: "a red maple leaf",            // label the vision model looks for
  decoys: ["a green leaf", "grass", "a rock"], // labels it compares against
}
```

- **Regions** are rough latitude bands (approximately: south below 31°N, middle 31–39°N, north above 39°N). It's an honest approximation of growing zones; say so in the UI or post rather than pretending it's precise.
- No location given: use only items marked `"anywhere"`, still filtered by month.
- Dog-walk items should be things on a dog route (fire hydrant, another dog, park bench). Easy-pace items should be spottable from a paved path or bench.

## Privacy and network rules

- **Photos never leave the phone.** They exist only in memory/on device and in the postcard the user chooses to save or share.
- **Location is optional** and is a typed city/state/zip, geocoded once with OpenStreetMap **Nominatim** to get a latitude (for the region band). Respect its usage policy: one request at a time, no autocomplete-on-every-keystroke, cache the result. Be honest in the UI that this lookup goes to OpenStreetMap.
- **Sharing** uses the Web Share API (`navigator.share` with files) so it goes through the user's own apps. Fallback: download the image. On iPhone, Share → "Save Image" is the reliable way into Photos.
- **Challenge a friend**: encode the hunt (item ids, plus anything else needed) in the URL **hash** (`#challenge=...`) so it's never sent to the server. Opening such a link shows "You've been challenged!" and loads the same items.
- No accounts, no backend, no leaderboard.

## Offline

- The vision model is cached by the browser after first load.
- Make the app an installable **PWA** with a service worker (`vite-plugin-pwa`) so it opens with no signal on the trail. The location lookup needs internet, so it happens during setup at home.

## Screens

1. **Home**: "Start a hunt", or "You've been challenged!" when opened from a challenge link.
2. **Setup**: who's coming, names, optional location, hunt size.
3. **Getting ready**: model loading with progress. Friendly wording (avoid scary "download" language; explain nothing gets installed).
4. **Hunt**: checklist of item cards → camera → checking → result.
5. **Postcard**: title input, collage preview, Save / Share / Challenge a friend.

Nice-to-haves, only if time allows: a seasonal **sticker book** saved in localStorage; a "You earned a treat!" link to my other app, Just Pick For Me.

## Hosting

- Static site on **DigitalOcean App Platform** (build `npm run build`, output `dist`). Add `"engines": { "node": "22.x" }` to package.json.
- Deploy early and test on a real phone, outdoors.

## How I like to work

- Small steps. Propose a plan before large changes.
- Explain *why* briefly when making a non-obvious choice; I'll be writing a DEV post about the build.
- Ask before adding new dependencies.
- Keep the code readable with short comments; I'm an experienced developer and former instructor.
- Never run git commands (not even status or log). I handle all version control myself.
- I write the React screens, data/items.js, and lib/buildHunt.js. Claude writes the other lib/ files and PWA setup.
- Keep changes small, explain them briefly, and tell me how to test them. Don't run tests or the app unless I ask.
- When I write code, review it and suggest fixes; don't rewrite it.