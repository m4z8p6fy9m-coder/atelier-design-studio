/** Pixel operations, fully local; no AI model, network, premium API or telemetry. */
function validate(image) {
  if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.width * image.height > 5760000 || image.data?.length !== image.width * image.height * 4) {
    throw Error('Ungültige Bildabmessungen oder mehr als 5,76 Millionen Pixel.');
  }
}
export function sampleBorderColor(image) {
  validate(image);
  const groups = new Map(), { width: w, height: h, data } = image;
  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 128) return;
    const key = (data[i] >> 4) * 256 + (data[i + 1] >> 4) * 16 + (data[i + 2] >> 4);
    const group = groups.get(key) || { count: 0, color: [0, 0, 0] };
    group.count++; for (let c = 0; c < 3; c++) group.color[c] += data[i + c];
    groups.set(key, group);
  };
  for (let x = 0; x < w; x++) { sample(x, 0); if (h > 1) sample(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { sample(0, y); if (w > 1) sample(w - 1, y); }
  const common = [...groups.values()].sort((a, b) => b.count - a.count)[0];
  return common ? common.color.map(c => Math.round(c / common.count)) : [255, 255, 255];
}

/** Remove only color-matching regions connected to the border or chosen seed. */
export function removeBackground(image, { color = sampleBorderColor(image), tolerance = 45, seed = null } = {}) {
  validate(image);
  if (!Array.isArray(color) || color.length !== 3 || !color.every(c => Number.isFinite(c) && c >= 0 && c <= 255) || !Number.isFinite(tolerance) || tolerance < 0 || tolerance > 442) throw Error('Ungültige Farbtoleranz.');
  const { width: w, height: h } = image, data = new Uint8ClampedArray(image.data);
  const visited = new Uint8Array(w * h), queue = new Uint32Array(w * h);
  const threshold = tolerance * tolerance;
  let head = 0, tail = 0;
  const enqueue = pixel => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    const i = pixel * 4;
    if (data[i + 3] === 0 || (data[i] - color[0]) ** 2 + (data[i + 1] - color[1]) ** 2 + (data[i + 2] - color[2]) ** 2 <= threshold) queue[tail++] = pixel;
  };
  if (seed) {
    if (!Array.isArray(seed) || seed.length !== 2 || !seed.every(Number.isInteger) || seed[0] < 0 || seed[0] >= w || seed[1] < 0 || seed[1] >= h) throw Error('Ungültiger Auswahlpunkt.');
    enqueue(seed[1] * w + seed[0]);
  } else {
    for (let x = 0; x < w; x++) { enqueue(x); enqueue((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { enqueue(y * w); enqueue(y * w + w - 1); }
  }
  while (head < tail) {
    const p = queue[head++], x = p % w, y = Math.floor(p / w);
    data[p * 4 + 3] = 0;
    if (x > 0) enqueue(p - 1); if (x < w - 1) enqueue(p + 1);
    if (y > 0) enqueue(p - w); if (y < h - 1) enqueue(p + w);
  }
  return { width: w, height: h, data };
}

/** Apply an erase/restore brush along a continuous segment, including alpha. */
export function brush(image, original, from, to, radius, restore = false) {
  validate(image); validate(original);
  if (image.width !== original.width || image.height !== original.height || !Number.isFinite(radius) || radius < 1 || radius > 200) throw Error('Ungültiger Pinsel.');
  if (![from,to].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=-radius&&p[0]<=image.width+radius&&p[1]>=-radius&&p[1]<=image.height+radius)) throw Error('Ungültige Pinselposition.');
  const w = image.width, h = image.height, dx = to[0] - from[0], dy = to[1] - from[1];
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(1, radius / 3)));
  for (let step = 0; step <= steps; step++) {
    const cx = from[0] + dx * step / steps, cy = from[1] + dy * step / steps;
    const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(w - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(h - 1, Math.ceil(cy + radius));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > radius * radius) continue;
      const i = (y * w + x) * 4;
      if (restore) for (let c = 0; c < 4; c++) image.data[i + c] = original.data[i + c];
      else image.data[i + 3] = 0;
    }
  }
  return image;
}

export function invertImage(image) {
  validate(image);
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) data[i + c] = 255 - data[i + c];
  return { width: image.width, height: image.height, data };
}
