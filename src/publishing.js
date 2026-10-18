import { esc, svgMarkup } from './render.js';
import { zip } from './export.js';
export { safeLink } from './links.js';

/** Self-contained HTML: scalable SVG design pages, not a CSS layout builder. */
export function websiteHTML(doc) {
  if (!doc.pages?.length) throw Error('Das Projekt enthält keine Seiten.');
  const title = esc(doc.title), background = esc(doc.pages[0].bg);
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="Atelier Open Source"><meta name="description" content="${title}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'"><title>${title}</title><style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:${background};color:#252638;font:14px Arial,sans-serif}nav{position:sticky;top:0;background:#fffffff2;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px;z-index:1;box-shadow:0 1px 6px #0001}nav strong{margin-right:15px}a{color:inherit}nav a{text-decoration:none;padding:6px 10px;border:1px solid #ddd;border-radius:8px}main{max-width:1200px;margin:auto}section{scroll-margin-top:70px}section svg{display:block;width:100%;height:auto}footer{text-align:center;padding:20px;background:#fff;font-size:12px}a:focus-visible{outline:3px solid #7554e8;outline-offset:3px}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}</style></head><body><nav aria-label="Seiten"><strong>${title}</strong>${doc.pages.map((p, i) => `<a href="#seite-${i + 1}">Seite ${i + 1}</a>`).join('')}</nav><main>${doc.pages.map((p, i) => `<section id="seite-${i + 1}" aria-label="Seite ${i + 1}">${svgMarkup(p, doc.width, doc.height, {fonts:doc.fonts||[]})}</section>`).join('')}</main><footer>${title}</footer></body></html>`;
}

const xml = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + body;
const ns = 'http://schemas.openxmlformats.org';
const rel = `${ns}/officeDocument/2006/relationships`;
const pns = `${ns}/presentationml/2006/main`, ans = `${ns}/drawingml/2006/main`;
const relationships = entries => xml(`<Relationships xmlns="${ns}/package/2006/relationships">${entries.map(([id, type, target]) => `<Relationship Id="${id}" Type="${rel}/${type}" Target="${target}"/>`).join('')}</Relationships>`);
const emptyTree = '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>';

/** PowerPoint package with one rendered PNG per slide. Text is flattened. */
export function pptxFiles(doc, images) {
  if (!images.length || images.length !== doc.pages.length || images.length > 100) throw Error('Für jede Seite wird ein Folienbild benötigt.');
  const files = [], add = (name, body) => files.push({ name, blob: body instanceof Blob ? body : new Blob([body], { type: 'application/xml' }) });
  const cx = Math.round(doc.width / Math.max(doc.width, doc.height) * 12192000), cy = Math.round(doc.height / Math.max(doc.width, doc.height) * 12192000);
  const types = [['presentation.xml', 'presentation.main'], ['presProps.xml', 'presProps'], ['slideMasters/slideMaster1.xml', 'slideMaster'], ['slideLayouts/slideLayout1.xml', 'slideLayout']];
  add('[Content_Types].xml', xml(`<Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${types.map(([part, type]) => `<Override PartName="/ppt/${part}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.${type}+xml"/>`).join('')}${images.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>`));
  add('_rels/.rels', xml(`<Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="${ns}/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`));
  add('docProps/core.xml', xml(`<cp:coreProperties xmlns:cp="${ns}/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(doc.title).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'')}</dc:title><dc:creator>Atelier</dc:creator><dc:description>Bildfolien aus Atelier. Inhalte sind als Bilder eingebettet.</dc:description></cp:coreProperties>`));
  add('ppt/presentation.xml', xml(`<p:presentation xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rel}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${images.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${cx}" cy="${cy}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>`));
  add('ppt/_rels/presentation.xml.rels', relationships([['rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rId2', 'presProps', 'presProps.xml'], ...images.map((_, i) => [`rId${i + 3}`, 'slide', `slides/slide${i + 1}.xml`])]));
  add('ppt/presProps.xml', xml(`<p:presentationPr xmlns:p="${pns}"/>`));
  add('ppt/slideMasters/slideMaster1.xml', xml(`<p:sldMaster xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rel}"><p:cSld>${emptyTree}</p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`));
  add('ppt/slideMasters/_rels/slideMaster1.xml.rels', relationships([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'theme', '../theme/theme1.xml']]));
  add('ppt/slideLayouts/slideLayout1.xml', xml(`<p:sldLayout xmlns:p="${pns}" xmlns:a="${ans}" type="blank" preserve="1"><p:cSld name="Atelier Blank">${emptyTree}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`));
  add('ppt/slideLayouts/_rels/slideLayout1.xml.rels', relationships([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]));
  const scheme = [['dk1', '252638'], ['lt1', 'FFFFFF'], ['dk2', '1C3E36'], ['lt2', 'EEE8DF'], ['accent1', '7554E8'], ['accent2', 'FF7857'], ['accent3', 'C5F072'], ['accent4', 'BEDDE6'], ['accent5', 'F2C8D7'], ['accent6', 'F8D763'], ['hlink', '7554E8'], ['folHlink', '5C3BAB']];
  add('ppt/theme/theme1.xml', xml(`<a:theme xmlns:a="${ans}" name="Atelier"><a:themeElements><a:clrScheme name="Atelier">${scheme.map(([name, color]) => `<a:${name}><a:srgbClr val="${color}"/></a:${name}>`).join('')}</a:clrScheme><a:fontScheme name="Atelier"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Atelier"><a:fillStyleLst>${[1,2,3].map(() => '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>').join('')}</a:fillStyleLst><a:lnStyleLst>${[6350,12700,19050].map(w => `<a:ln w="${w}"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>`).join('')}</a:lnStyleLst><a:effectStyleLst>${[1,2,3].map(() => '<a:effectStyle><a:effectLst/></a:effectStyle>').join('')}</a:effectStyleLst><a:bgFillStyleLst>${[1,2,3].map(() => '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>').join('')}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`));
  images.forEach((image, i) => {
    const picture = `<p:pic><p:nvPicPr><p:cNvPr id="2" name="Atelier Seite ${i + 1}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
    add(`ppt/slides/slide${i + 1}.xml`, xml(`<p:sld xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rel}"><p:cSld>${emptyTree.replace('</p:spTree>', picture + '</p:spTree>')}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`));
    add(`ppt/slides/_rels/slide${i + 1}.xml.rels`, relationships([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'image', `../media/image${i + 1}.png`]]));
    add(`ppt/media/image${i + 1}.png`, image);
  });
  return files;
}

export async function powerPoint(doc, images) {
  const blob = await zip(pptxFiles(doc, images));
  return new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}
