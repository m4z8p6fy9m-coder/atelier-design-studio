import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let pathname=decodeURIComponent(url.pathname);const target=path.resolve(root,'.'+pathname);if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}if(path.relative(root,target).split(path.sep).some(p=>p.startsWith('.'))){res.writeHead(403);res.end();return}const relative=path.relative(root,target).replaceAll('\\','/');if(!['','index.html','style.css','icon.svg','tests/browser.html','tests/browser.js'].includes(relative)&&!/^src\/[a-z0-9-]+\.js$/.test(relative)){res.writeHead(404);res.end('Not found');return}const file=(await stat(target)).isDirectory()?path.join(target,'index.html'):target;const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`Atelier: http://127.0.0.1:${server.address().port}/`));
