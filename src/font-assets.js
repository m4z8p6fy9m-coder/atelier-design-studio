export const MAX_FONTS = 6;
export const MAX_FONT_BYTES = 3 * 1024 * 1024;
const types = { woff: 'wOFF', woff2: 'wOF2', otf: 'OTTO' };

export function fontFamily(asset) {
  if (!asset || typeof asset.id !== 'string' || !/^[a-z\d-]{1,80}$/i.test(asset.id)) throw Error('Ungültige Schrift-ID.');
  return 'AtelierFont' + asset.id.replaceAll('-', '');
}

function identify(bytes) {
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  for (const [type, signature] of Object.entries(types)) if (magic === signature) return type;
  if (magic === 'true' || bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0) return 'ttf';
  throw Error('Bitte eine gültige TTF-, OTF-, WOFF- oder WOFF2-Datei verwenden.');
}

export function normalizeFontAssets(raw) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > MAX_FONTS) throw Error(`Maximal ${MAX_FONTS} eigene Schriften pro Projekt.`);
  const ids = new Set();
  return raw.map(asset => {
    fontFamily(asset);
    if (ids.has(fontFamily(asset))) throw Error('Doppelte Schrift-ID.');
    ids.add(fontFamily(asset));
    if (typeof asset.data !== 'string' || asset.data.length > Math.ceil(MAX_FONT_BYTES / 3) * 4 + 40 || !/^data:font\/(ttf|otf|woff|woff2);base64,[a-z\d+/]+={0,2}$/i.test(asset.data)) throw Error('Ungültige oder zu große Schriftdaten.');
    const [, encoded] = asset.data.split(','), header = Uint8Array.from(atob(encoded.slice(0, 24)), c => c.charCodeAt(0));
    const type = identify(header);
    if (!asset.data.startsWith(`data:font/${type};base64,`)) throw Error('Schriftformat und Daten stimmen nicht überein.');
    return { id: asset.id, label: typeof asset.label === 'string' ? asset.label.slice(0, 80) : 'Eigene Schrift', data: asset.data, type };
  });
}

export async function readFontFile(file) {
  if (file.size > MAX_FONT_BYTES) throw Error('Eine Schriftdatei darf maximal 3 MB groß sein.');
  const bytes = new Uint8Array(await file.arrayBuffer()), type = identify(bytes), parts = [];
  for (let i = 0; i < bytes.length; i += 32768) parts.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  const asset = { id: crypto.randomUUID(), label: file.name.replace(/\.[^.]+$/, '').slice(0, 80), data: `data:font/${type};base64,${btoa(parts.join(''))}`, type };
  return normalizeFontAssets([asset])[0];
}

export function fontStyle(assets = []) {
  const formats = { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' };
  return normalizeFontAssets(assets).map(a => `@font-face{font-family:'${fontFamily(a)}';src:url('${a.data}') format('${formats[a.type]}');font-style:normal;font-weight:100 900}`).join('');
}

const loaded = new Map();
export async function loadFontAssets(assets = []) {
  if (!assets.length) return;
  for (const asset of normalizeFontAssets(assets)) {
    const family = fontFamily(asset), previous = loaded.get(family);
    if (previous?.data === asset.data) continue;
    const face = new FontFace(family, `url(${asset.data})`, { weight: '100 900' });
    try { await face.load(); } catch { throw Error(`Die Schrift „${asset.label}“ konnte nicht geladen werden.`); }
    if (previous) document.fonts.delete(previous.face);
    document.fonts.add(face); loaded.set(family, { data: asset.data, face });
  }
  await document.fonts.ready;
}
