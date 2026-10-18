import test from 'node:test';
import assert from 'node:assert/strict';
import { removeBackground, sampleBorderColor, brush, invertImage } from '../src/image-tools.js';

function fixture() {
  const image = { width: 7, height: 7, data: new Uint8ClampedArray(7 * 7 * 4).fill(255) };
  for (let y = 1; y <= 5; y++) for (let x = 1; x <= 5; x++) {
    const i = (y * 7 + x) * 4;
    image.data[i] = 200; image.data[i + 1] = 20; image.data[i + 2] = 30;
  }
  // Interior white island should survive removal of border-connected white.
  const center = (3 * 7 + 3) * 4;
  image.data.set([255, 255, 255, 255], center);
  return image;
}
test('dominant border color is sampled independently of the foreground', () => {
  assert.deepEqual(sampleBorderColor(fixture()), [255, 255, 255]);
});
test('background removal only removes connected regions and preserves source data', () => {
  const image = fixture(), result = removeBackground(image, { tolerance: 10 });
  assert.equal(result.data[3], 0);
  assert.equal(result.data[(3 * 7 + 3) * 4 + 3], 255);
  assert.equal(result.data[(2 * 7 + 2) * 4 + 3], 255);
  assert.equal(image.data[3], 255);
});
test('seeded removal can remove an interior region without touching other matching pixels', () => {
  const result = removeBackground(fixture(), { color: [255, 255, 255], tolerance: 0, seed: [3, 3] });
  assert.equal(result.data[(3 * 7 + 3) * 4 + 3], 0);
  assert.equal(result.data[3], 255);
});
test('erase and restore brushes cover a continuous segment and retain source alpha', () => {
  const original = fixture(), working = { ...original, data: new Uint8ClampedArray(original.data) };
  brush(working, original, [1, 2], [5, 2], 1);
  for (let x = 1; x <= 5; x++) assert.equal(working.data[(2 * 7 + x) * 4 + 3], 0);
  brush(working, original, [1, 2], [5, 2], 1, true);
  assert.deepEqual(working.data, original.data);
});
test('color inversion preserves transparency', () => {
  const image = { width: 1, height: 1, data: new Uint8ClampedArray([10, 20, 30, 128]) };
  assert.deepEqual([...invertImage(image).data], [245, 235, 225, 128]);
});
test('malformed images, seeds and brush positions are rejected', () => {
  assert.throws(() => removeBackground({ width: 2, height: 2, data: new Uint8ClampedArray(1) }));
  assert.throws(() => removeBackground(fixture(), { seed: [10, 10] }));
  assert.throws(() => removeBackground(fixture(), { tolerance: NaN }));
  assert.throws(() => brush(fixture(), fixture(), [Infinity, 0], [0, 0], 2));
});
