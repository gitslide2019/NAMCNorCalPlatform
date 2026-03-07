#!/bin/bash
cd "$(dirname "$0")/.."

node -e "
const h=require('http'),n=require('net');
let ready=false,cp=parseInt(process.env.CHILD_PORT||'5001');
const srv=h.createServer((q,r)=>{
  if(!ready){r.writeHead(200);r.end('OK');return}
  const opt={hostname:'127.0.0.1',port:cp,path:q.url,method:q.method,headers:q.headers};
  const p=h.request(opt,pr=>{r.writeHead(pr.statusCode,pr.headers);pr.pipe(r)});
  p.on('error',()=>{r.writeHead(502);r.end('Bad Gateway')});
  q.pipe(p);
});
srv.listen(parseInt(process.env.PORT||'5000'),'0.0.0.0',()=>{
  console.log('Boot proxy ready on port '+(process.env.PORT||'5000'));
  const c=require('child_process').fork('./dist/index.cjs',{
    env:{...process.env,CHILD_PORT:String(cp),PORT:String(cp)}
  });
  c.on('message',m=>{if(m&&m.type==='ready'){ready=true;console.log('App ready, proxying to '+m.port)}});
  c.on('exit',code=>{console.error('Child exited '+code);process.exit(code||1)});
});
"
