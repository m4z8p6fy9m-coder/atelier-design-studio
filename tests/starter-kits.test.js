import test from 'node:test';
import assert from 'node:assert/strict';
import {starterKits,createStarterKit} from '../src/starter-kits.js';
import {normalizeDocument} from '../src/model.js';
import {svgMarkup} from '../src/render.js';

test('starter kits survive project export and reimport with four editable pages',()=>{
  for(const kit of starterKits){
    const doc=normalizeDocument(JSON.parse(JSON.stringify(createStarterKit(kit.id))));
    assert.equal(doc.pages.length,4);
    assert.equal(doc.width,1080);
    for(const page of doc.pages){
      assert.ok(page.elements.some(e=>e.type==='text'&&e.text.length>10));
      assert.ok(page.elements.every(e=>!e.locked));
      assert.ok(svgMarkup(page,doc.width,doc.height).includes('<svg'));
    }
  }
});
test('opening a kit twice creates independent editable documents without shared content',()=>{
  const first=createStarterKit('creator'),second=createStarterKit('creator');
  assert.notEqual(first.id,second.id);
  assert.notEqual(first.pages[0].id,second.pages[0].id);
  assert.notEqual(first.pages[0].elements[0].id,second.pages[0].elements[0].id);
  first.pages[0].elements.find(e=>e.type==='text').text='Changed';
  assert.notEqual(second.pages[0].elements.find(e=>e.type==='text').text,'Changed');
  assert.throws(()=>createStarterKit('missing'));
});
