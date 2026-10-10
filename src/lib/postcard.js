// Draws the finished postcard on a canvas and returns it as a JPEG Blob.
// Runs entirely on the phone; the photos never leave it.
//
//   const blob = await drawPostcard({ photos, title, names, date, dog })
//   photos: Blob[] (1–8, straight from the camera input)   date: Date   dog: boolean

const W = 1500;
const H = 1000; // 3:2, the shape of a 6×4" postcard
const MARGIN = 48;
const TITLE_H = 150; // band across the top
const FOOTER_H = 90; // band across the bottom
const STAMP = 130;
const PAPER = "#f6efe2";
const INK = "#3b2a1a";
const ACCENT = "#c2571a";
const SERIF = 'Georgia, "Times New Roman", serif';
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const COLUMNS = [1, 1, 2, 3, 2, 3, 3, 4, 4]; // columns for 0–8 photos: big photos, balanced rows
const TILTS = [-2, 1.5, -1, 2, -1.5, 1, -2, 1.5]; // degrees; fixed so every render matches
const FRAME = 10; // white border around each photo

export async function drawPostcard({ photos, title, names, date = new Date(), dog = false }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Paper and a thin border
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.strokeRect(MARGIN / 2, MARGIN / 2, W - MARGIN, H - MARGIN);

  // Title, centered; leaves room on both sides for the stamp so it stays centered
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleWidth = W - 2 * MARGIN - (dog ? 2 * (STAMP + 20) : 0);
  fitText(ctx, title || "Postcard from Outside", W / 2, MARGIN + TITLE_H / 2, titleWidth, 96,
    (size) => `bold ${size}px ${SERIF}`);

  await drawPhotos(ctx, photos, {
    x: MARGIN,
    y: MARGIN + TITLE_H,
    w: W - 2 * MARGIN,
    h: H - 2 * MARGIN - TITLE_H - FOOTER_H,
  });

  // Footer: names on the left, date on the right
  const footerY = H - MARGIN - FOOTER_H / 2;
  ctx.fillStyle = INK;
  ctx.textAlign = "right";
  ctx.font = `italic 40px ${SERIF}`;
  const dateText = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  ctx.fillText(dateText, W - MARGIN, footerY);
  if (names) {
    ctx.textAlign = "left";
    const namesWidth = W - 2 * MARGIN - ctx.measureText(dateText).width - 60;
    fitText(ctx, names, MARGIN, footerY, namesWidth, 44, (size) => `italic ${size}px ${SERIF}`);
  }

  if (dog) drawPawStamp(ctx);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't draw the postcard"))), "image/jpeg", 0.9)
  );
}

async function drawPhotos(ctx, photos, area) {
  const n = Math.min(photos.length, 8);
  if (!n) return;
  const cols = COLUMNS[n];
  const rows = Math.ceil(n / cols);
  const cellW = area.w / cols;
  const cellH = area.h / rows;

  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inThisRow = Math.min(cols, n - row * cols);
    const offset = ((cols - inThisRow) * cellW) / 2; // center a short last row
    const cx = area.x + offset + (i % cols) * cellW + cellW / 2;
    const cy = area.y + row * cellH + cellH / 2;

    // Decode one photo at a time and free it right away: eight full-size
    // camera photos in memory at once can crash a phone browser.
    // "from-image" applies the EXIF rotation, so portrait photos stay upright.
    const bitmap = await createImageBitmap(photos[i], { imageOrientation: "from-image" });
    drawFramedPhoto(ctx, bitmap, cx, cy, cellW - 24, cellH - 24, TILTS[i]);
    bitmap.close();
  }
}

// A white-framed photo, slightly tilted, with a soft shadow.
function drawFramedPhoto(ctx, img, cx, cy, w, h, degrees) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#fff";
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent";

  // Cover-crop: fill the frame, trimming whichever side of the photo is too long.
  const iw = w - 2 * FRAME;
  const ih = h - 2 * FRAME;
  const scale = Math.max(iw / img.width, ih / img.height);
  const sw = iw / scale;
  const sh = ih / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, -iw / 2, -ih / 2, iw, ih);
  ctx.restore();
}

// A postage stamp in the top-right corner when Tucker (or any dog) came along.
function drawPawStamp(ctx) {
  ctx.save();
  ctx.translate(W - MARGIN - STAMP / 2, MARGIN + 10 + STAMP / 2);
  ctx.rotate((6 * Math.PI) / 180);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-STAMP / 2, -STAMP / 2, STAMP, STAMP);
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 4;
  ctx.strokeRect(-STAMP / 2 + 8, -STAMP / 2 + 8, STAMP - 16, STAMP - 16);
  ctx.font = `72px ${EMOJI}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐾", 0, 4);
  ctx.restore();
}

// Shrinks the font until the text fits; trims with "…" only as a last resort.
function fitText(ctx, text, x, y, maxWidth, size, font) {
  const MIN_SIZE = 28;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > MIN_SIZE) {
    size -= 4;
    ctx.font = font(size);
  }
  while (ctx.measureText(text).width > maxWidth && text.length > 1) {
    text = text.slice(0, -2) + "…";
  }
  ctx.fillText(text, x, y);
}
