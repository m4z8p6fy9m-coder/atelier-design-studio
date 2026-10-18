import {newDoc,newPage,item,txt} from './model.js';

export const starterKits=[
  {id:'creator',name:'Creator Carousel',tag:'SOCIAL MEDIA',description:'Hook, Geschichte, Mehrwert und Abschluss. Vier Seiten für deine nächste Idee.',bg:'#201a32',accent:'#c5afff',ink:'#faf7ff',label:'Ideen, die\nhängen bleiben.',slides:[['Deine Idee.\nDein Moment.','Ein Gedanke, den es sich zu teilen lohnt.'],['So hat alles\nangefangen.','Erzähle deine Geschichte in zwei klaren Sätzen.'],['Drei Dinge.\nEin neuer Blick.','01  Klar anfangen.\n02  Etwas Eigenes zeigen.\n03  Menschen mitnehmen.'],['Mach etwas\ndaraus.','Speichern. Ausprobieren. Weitererzählen.']]},
  {id:'launch',name:'Product Story',tag:'BUSINESS',description:'Problem, Lösung und nächster Schritt. Präsentiere deine Idee mit einem klaren roten Faden.',bg:'#eff1e6',accent:'#c6dd8a',ink:'#263d32',label:'Kleine Idee.\nGroßer Auftritt.',slides:[['Etwas Neues\nbeginnt hier.','Dein Produkt. Ein Versprechen, das zählt.'],['Kennst du\ndieses Problem?','Beschreibe die Hürde, die deine Zielgruppe wirklich kennt.'],['Weniger Umwege.\nMehr Möglichkeiten.','Deine Lösung in einem Satz.\nEin Vorteil. Ein konkretes Beispiel.'],['Bereit für den\nnächsten Schritt?','Ergänze deine Website und eine klare Einladung.']]},
  {id:'study',name:'Study Notes',tag:'LERNEN',description:'Vom Überblick bis zur Selbstkontrolle. Erstelle eine visuelle Lernserie für dein nächstes Thema.',bg:'#f5e8df',accent:'#ffab87',ink:'#492d3d',label:'Wissen, das\nwirklich bleibt.',slides:[['Ein Thema.\nEin klarer Kopf.','Dein Lernziel: Was möchtest du heute verstehen?'],['Die Grundidee\nin 30 Sekunden.','Erkläre das Konzept in deinen eigenen Worten.'],['Vom Wissen\nzum Anwenden.','Aufgabe → Lösungsweg → Ergebnis\nErgänze ein eigenes Beispiel.'],['Kannst du es\nselbst erklären?','01  Was ist die Kernidee?\n02  Wo nutzt du sie?\n03  Was musst du noch üben?']]}
];

export function starterPage(kit,index){
  const page=newPage(kit.bg),[headline,body]=kit.slides[index];
  page.elements=[
    item('circle',735,-100,420,420,{fill:kit.accent,opacity:.22}),
    txt(kit.tag,76,75,18,kit.ink,{weight:600,w:800,h:30,spacing:3}),
    item('rect',76,152,82,6,{fill:kit.accent}),
    txt(headline,70,285,100,kit.ink,{w:940,h:300,weight:800,lineHeight:1.05}),
    txt(body,78,670,28,kit.ink,{w:875,h:190,weight:400,lineHeight:1.6}),
    item('line',78,954,924,2,{fill:kit.ink,opacity:.2}),
    txt('DEIN STUDIO / DEINE IDEEN',78,988,16,kit.ink,{w:800,h:30,weight:400,spacing:2}),
    txt(String(index+1).padStart(2,'0')+' / 04',875,988,16,kit.ink,{w:140,h:30,weight:600})
  ];
  page.notes='Ersetze die Beispieltexte durch deine eigenen Inhalte. Prüfe vor dem Teilen Fakten, Rechte und Kontaktdaten.';
  return page;
}

export function createStarterKit(id){
  const kit=starterKits.find(kit=>kit.id===id);
  if(!kit)throw Error('Dieses Starter-Kit ist nicht verfügbar.');
  const doc=newDoc(1080,1080,kit.name);
  doc.pages=kit.slides.map((_,index)=>starterPage(kit,index));
  return doc;
}
