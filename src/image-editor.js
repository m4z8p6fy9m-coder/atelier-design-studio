import { removeBackground, sampleBorderColor, brush, invertImage } from './image-tools.js';

export async function openImageEditor({ source, modal, onApply, toast }) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const original = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let working = { width: original.width, height: original.height, data: new Uint8ClampedArray(original.data) };
  let mode = 'pick', color = sampleBorderColor(original), seed = null, drawing = false, last, history = [];
  const checkpoint = () => { history.push(new Uint8ClampedArray(working.data)); if (history.length > 8) history.shift(); };
  const $ = s => document.querySelector(s);
  modal('Freistellen & Radieren', `<p class="sub">Vollständig lokal und ohne Bezahlsperre. Farbige Hintergründe entfernen oder mit dem Pinsel nacharbeiten. Keine KI-Motiverkennung; schwierige Motive erfordern Handarbeit. Bearbeitung mit maximal 1600 Pixel Kantenlänge.</p><div class="image-workbench"><div id="pixelMount" class="pixel-mount"></div><div class="pixel-controls"><label for="pixelMode">Werkzeug</label><select id="pixelMode"><option value="pick">Hintergrundfarbe auswählen</option><option value="erase">Radieren</option><option value="restore">Original wiederherstellen</option></select><label for="pixelTolerance">Farbtoleranz</label><input id="pixelTolerance" type="range" min="0" max="180" value="45"><label for="pixelRadius">Pinselradius</label><input id="pixelRadius" type="range" min="2" max="100" value="25"><div id="pickedColor" class="picked-color"></div><button id="pixelRemove" class="primary wide">Farbfläche entfernen</button><button id="pixelInvert" class="wide">Farben invertieren</button><button id="pixelUndo" class="wide">↶ Schritt zurück</button><button id="pixelReset" class="wide">Original zurücksetzen</button></div></div><p class="sub">Ohne Klick wird die häufigste Randfarbe verwendet. Mit Klick entfernst du die zusammenhängende Fläche an diesem Punkt. Radieren macht Pixel transparent; „Original wiederherstellen“ holt sie zurück.</p><button id="pixelApply" class="primary wide">Bild übernehmen</button>`, true);
  $('#pixelMount').append(canvas);
  canvas.style.touchAction = 'none';
  canvas.setAttribute('aria-label', 'Bildbearbeitung: Hintergrund auswählen oder mit Pinsel bearbeiten');
  function paint() {
    ctx.putImageData(new ImageData(working.data, working.width, working.height), 0, 0);
    $('#pixelUndo').disabled = !history.length;
    $('#pickedColor').style.background = `rgb(${color.join(',')})`;
    $('#pickedColor').textContent = `RGB ${color.join(' / ')}`;
  }
  function point(ev) {
    const rect = canvas.getBoundingClientRect();
    return [Math.max(0, Math.min(canvas.width - 1, Math.floor((ev.clientX - rect.left) * canvas.width / rect.width))), Math.max(0, Math.min(canvas.height - 1, Math.floor((ev.clientY - rect.top) * canvas.height / rect.height)))];
  }
  $('#pixelMode').onchange = e => mode = e.target.value;
  canvas.onpointerdown = ev => {
    if (ev.button !== 0) return;
    const p = point(ev);
    if (mode === 'pick') {
      const i = (p[1] * canvas.width + p[0]) * 4;
      color = [...working.data.slice(i, i + 3)]; seed = p; paint(); return;
    }
    checkpoint(); drawing = true; last = p;
    brush(working, original, p, p, +$('#pixelRadius').value, mode === 'restore');
    canvas.setPointerCapture(ev.pointerId); paint();
  };
  canvas.onpointermove = ev => {
    if (!drawing) return;
    const p = point(ev);
    brush(working, original, last, p, +$('#pixelRadius').value, mode === 'restore'); last = p; paint();
  };
  canvas.onpointerup = canvas.onpointercancel = () => drawing = false;
  $('#pixelRemove').onclick = () => {
    checkpoint();
    working = removeBackground(working, { color, tolerance: +$('#pixelTolerance').value, seed }); paint();
  };
  $('#pixelInvert').onclick = () => { checkpoint(); working = invertImage(working); paint(); };
  $('#pixelUndo').onclick = () => { if (history.length) { working.data = history.pop(); paint(); } };
  $('#pixelReset').onclick = () => {
    checkpoint(); working.data = new Uint8ClampedArray(original.data); color = sampleBorderColor(original); seed = null; paint();
  };
  $('#pixelApply').onclick = async () => {
    try {
      await onApply({ src: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height });
      $('#modal').close(); toast('Bild bearbeitet. Das vorherige Bild bleibt über Rückgängig erreichbar.');
    } catch (error) { toast(error.message); }
  };
  paint();
}
