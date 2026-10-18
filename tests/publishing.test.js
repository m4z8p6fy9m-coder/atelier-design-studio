import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { safeLink, websiteHTML, pptxFiles, powerPoint } from '../src/publishing.js';
import { newDoc, newPage, txt, normalizeDocument } from '../src/model.js';
import { shape } from '../src/render.js';

test('links allow web, mail and telephone addresses but reject executable URLs', () => {
  assert.equal(safeLink('https://example.com'), 'https://example.com/');
  assert.equal(safeLink('mailto:test@example.com'), 'mailto:test@example.com');
  for (const input of ['javascript:alert(1)', 'data:text/html,<script>', '//evil.example', 'file:///secret', 'not a URL']) assert.equal(safeLink(input), '');
});
test('project import preserves valid links and discards executable ones', () => {
  const d = newDoc(); d.pages[0].elements = [txt('Go', 0, 0, 20, '#252638', { link: 'https://example.com' })];
  assert.equal(normalizeDocument(d).pages[0].elements[0].link, 'https://example.com/');
  d.pages[0].elements[0].link = 'javascript:alert(1)';
  assert.equal(normalizeDocument(d).pages[0].elements[0].link, '');
});
test('exported SVG contains links while the editor never navigates from element clicks', () => {
  const e = txt('Go', 0, 0, 20, '#252638', { link: 'https://example.com' });
  assert.match(shape(e), /<a href="https:\/\/example.com\/"/);
  assert.ok(!shape(e, true).includes('<a '));
});
test('website export is self-contained and escapes title and user text', () => {
  const d = newDoc(); d.title = '<script>bad</script>'; d.pages.push(newPage());
  d.pages[0].elements = [txt('<img onerror=x>', 0, 0, 20)];
  const html = websiteHTML(d);
  assert.equal((html.match(/<section /g) || []).length, 2);
  assert.ok(html.includes('id="seite-2"'));
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img onerror'));
  assert.ok(!html.includes('<script src='));
});
const png = () => new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' });
test('PowerPoint package includes masters, layouts, theme and one picture per slide', async () => {
  const d = newDoc(1920, 1080, 'My deck & data'); d.pages.push(newPage());
  const files = pptxFiles(d, [png(), png()]), names = new Set(files.map(f => f.name));
  for (const name of ['[Content_Types].xml', '_rels/.rels', 'ppt/presentation.xml', 'ppt/presProps.xml', 'ppt/slideMasters/slideMaster1.xml', 'ppt/slideLayouts/slideLayout1.xml', 'ppt/theme/theme1.xml', 'ppt/slides/slide2.xml', 'ppt/media/image2.png']) assert.ok(names.has(name), name);
  const slide = await files.find(f => f.name === 'ppt/slides/slide1.xml').blob.text();
  assert.match(slide, /<p:pic>/); assert.ok(!slide.includes('<a:t>'));
  const metadata = await files.find(f => f.name === 'docProps/core.xml').blob.text();
  assert.ok(metadata.includes('My deck &amp; data'));
});
test('all internal PowerPoint relationships resolve to package parts', async () => {
  const d = newDoc(), files = pptxFiles(d, [png()]), names = new Set(files.map(f => f.name));
  for (const file of files.filter(f => f.name.endsWith('.rels'))) {
    const xml = await file.blob.text();
    const sourceDirectory = file.name === '_rels/.rels' ? '' : path.posix.dirname(path.posix.dirname(file.name));
    for (const match of xml.matchAll(/Target="([^"]+)"/g)) {
      const target = path.posix.normalize(path.posix.join(sourceDirectory, match[1]));
      assert.ok(names.has(target), `${file.name} -> ${target}`);
    }
  }
  assert.equal((await powerPoint(d, [png()])).type, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  assert.throws(() => pptxFiles(d, []));
});
