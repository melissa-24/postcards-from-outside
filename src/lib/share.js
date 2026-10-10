// Save and share through the user's own apps (Web Share API). We never upload
// anything; the share sheet hands the file to whichever app they pick.
//
// Each function resolves with what happened, so the screen can say the right thing:
//   "shared" | "cancelled" | "downloaded" | "copied"
//
// Call these directly from a click handler, with the postcard Blob already made:
// browsers only allow share() shortly after a tap.

// iPhone or iPad (iPadOS reports itself as a Mac, so also check for touch).
export const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// "Tucker's Fall Walk" → tucker-s-fall-walk-2026-10-10.jpg
function toFile(blob, title = "") {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "postcard";
  const day = new Date().toLocaleDateString("en-CA"); // en-CA formats as YYYY-MM-DD, in local time
  return new File([blob], `${slug}-${day}.jpg`, { type: "image/jpeg" });
}

function canShareFile(file) {
  return Boolean(navigator.canShare?.({ files: [file] }));
}

// Open the share sheet; if the browser refuses, use the fallback so the user is never stuck.
async function shareOr(data, fallback) {
  try {
    await navigator.share(data);
    return "shared";
  } catch (err) {
    if (err.name === "AbortError") return "cancelled"; // they closed the share sheet
    return fallback();
  }
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000); // revoking immediately can cancel the download
  return "downloaded";
}

async function copy(text) {
  await navigator.clipboard.writeText(text); // rejects if not allowed; the screen can show the link instead
  return "copied";
}

// Share button: the share sheet if this browser can share files, otherwise a download.
export async function sharePostcard(blob, { title, text } = {}) {
  const file = toFile(blob, title);
  if (canShareFile(file)) return shareOr({ files: [file], text }, () => download(file));
  return download(file);
}

// Save button. On iPhone a download lands in the Files app, not Photos, so use the
// share sheet there: its "Save Image" puts the postcard in Photos. Elsewhere, download.
export async function savePostcard(blob, { title } = {}) {
  const file = toFile(blob, title);
  if (isIOS && canShareFile(file)) return shareOr({ files: [file] }, () => download(file));
  return download(file);
}

// Challenge a friend: share the link, or copy it where sharing isn't available.
export async function shareLink(url, text) {
  if (navigator.share) return shareOr({ url, text }, () => copy(url));
  return copy(url);
}
