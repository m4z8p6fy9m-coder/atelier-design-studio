const color = value => typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value);

export function normalizeGradient(value) {
  if (!value || !['linear', 'radial'].includes(value.type) || !color(value.from) || !color(value.to)) return null;
  return { type: value.type, from: value.from, to: value.to, angle: Number.isFinite(value.angle) ? Math.max(-360, Math.min(360, value.angle)) : 0 };
}

export function gradientDefinition(id, value) {
  const g = normalizeGradient(value);
  if (!g) return '';
  const key = String(id).replace(/[^a-z\d-]/gi, '');
  const stops = `<stop offset="0%" stop-color="${g.from}"/><stop offset="100%" stop-color="${g.to}"/>`;
  if (g.type === 'radial') return `<radialGradient id="${key}">${stops}</radialGradient>`;
  const a = g.angle * Math.PI / 180;
  return `<linearGradient id="${key}" x1="${50 - Math.cos(a) * 50}%" y1="${50 - Math.sin(a) * 50}%" x2="${50 + Math.cos(a) * 50}%" y2="${50 + Math.sin(a) * 50}%">${stops}</linearGradient>`;
}

export function curveGeometry(element) {
  const curve = Math.max(-100, Math.min(100, element.curve || 0));
  const rise = Math.abs(curve) / 100 * Math.min(element.w / 2, element.size * 4);
  const baseline = curve > 0 ? rise + element.size : element.size;
  const controlY = baseline + (curve > 0 ? -2 : 2) * rise;
  const left = Math.min(element.size / 2, element.w / 4), right = element.w - left;
  let length = 0, last = [left, baseline];
  for (let i = 1; i <= 40; i++) {
    const t = i / 40, u = 1 - t;
    const next = [u * u * left + 2 * u * t * element.w / 2 + t * t * right, u * u * baseline + 2 * u * t * controlY + t * t * baseline];
    length += Math.hypot(next[0] - last[0], next[1] - last[1]); last = next;
  }
  return { path: `M ${left} ${baseline} Q ${element.w / 2} ${controlY} ${right} ${baseline}`, height: rise + element.size * 1.5, length };
}
