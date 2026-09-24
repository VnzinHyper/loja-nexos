// Legend Store — DB compartilhado Loja + Staff (v2 completo)
const DB_KEY = 'nexos_db_v1';
const DEFAULT_IMG = (id)=>`https://nexosystem.site/cdn/stores/21101/packages/${id}.png`;
function defaultDB(){ return {
 settings:{
  storeName:'Legend Store',
  banner:'🎮 ENTRE NA COMUNIDADE DA LEGEND E RECEBA OFERTAS!',
  discord:'https://discord.gg/HbH4bSktez',
  instagram:'https://www.instagram.com/nexossystem/',
  whatsapp:'', pixKey:'seu-pix@legendstore.site', pixName:'LEGEND STORE', pixCity:'FORTALEZA',
  autoConfirmUrl:'',
  supportEmail:'suporte@legendstore.site', phone:'',
  cnpj:'',
  primary:'#7c5cff', secondary:'#00d4ff',
  heroTitle:'Bem-vindo(a) à',
  heroSub:'Produtos digitais selecionados, pagamento seguro e entrega sem enrolação.',
  rating:'4,6'
 },
 commissions:{steam:30, assinaturas:15, outros:12},
 categories:[],
 products:[],
 coupons:[{code:'LEGEND10',percent:10}],
 orders:[], users:[], tickets:[], withdrawals:[], clicks:[],
 _v:3,
 reviews:[
  {n:'Luciano Dos Santos',d:'20/09/2026',t:'Entrega rápida',p:'Minecraft Java & Bedrock'},
  {n:'Thiago Oliveira',d:'19/09/2026',t:'Muito bom',p:'Game Pass Ultimate 30 Dias'},
  {n:'Maria Zelandia',d:'11/09/2026',t:'Muito bom, Entrega rápida, Confiável',p:'Game Pass Ultimate'},
  {n:'Luiz Oliveira',d:'05/09/2026',t:'Pode comprar sem medo. Chega de vdd',p:'GTA V'},
  {n:'Ivan Da Silva',d:'04/09/2026',t:'Confiável',p:'Disney Plus - 30 dias'}
 ]
}}
const Store = {
 load(){
  try{
   const r=localStorage.getItem(DB_KEY);
   if(r){ const db=JSON.parse(r);
    const OLD=['https://discord.com/invite/nexosystem','https://discord.gg/nexosystem'];
    if(db.settings&&OLD.includes(db.settings.discord)) db.settings.discord='https://discord.gg/HbH4bSktez';
    // renomeação: Nexos System → Legend Store (só onde ainda está o padrão antigo)
    if(db.settings.storeName==='Nexos System') db.settings.storeName='Legend Store';
    if(db.settings.banner==='🎮 ENTRE NA COMUNIDADE DA NEXOS E RECEBA OFERTAS!') db.settings.banner='🎮 ENTRE NA COMUNIDADE DA LEGEND E RECEBA OFERTAS!';
    if(db.settings.pixName==='NEXOS SYSTEM') db.settings.pixName='LEGEND STORE';
    if(db.settings.pixKey==='seu-pix@nexosystem.site') db.settings.pixKey='seu-pix@legendstore.site';
    if(db.settings.supportEmail==='suporte@nexosystem.site') db.settings.supportEmail='suporte@legendstore.site';
    // remove dados da empresa que ainda venham do padrão antigo
    if(db.settings.phone==='(85) 98887-2126') db.settings.phone='';
    if(typeof db.settings.cnpj==='string'&&db.settings.cnpj.includes('68.712.202')) db.settings.cnpj='';
    if(db.coupons.find(c=>c.code==='NEXOS10')&&!db.coupons.find(c=>c.code==='LEGEND10')) db.coupons.find(c=>c.code==='NEXOS10').code='LEGEND10';
    // migração v2: garante tabelas novas
    db.users=db.users||[]; db.tickets=db.tickets||[]; db.withdrawals=db.withdrawals||[]; db.clicks=db.clicks||[];
    db.settings.pixCity=db.settings.pixCity||'FORTALEZA';
    db.settings.pixName=db.settings.pixName||'LEGEND STORE';
    if(db.settings.autoConfirmUrl===undefined) db.settings.autoConfirmUrl='';
    // limpeza única v3: remove as categorias que vinham com o site (dono cria as próprias)
    if(db._v!==3){ const SEED=['assinaturas','steam-offline','minecraft','fortnite','discord','redes-sociais']; db.categories=(db.categories||[]).filter(c=>!SEED.includes(c.id)); db._v=3; }
    // mescla novidades do padrão sem apagar o que o staff editou
    const d=defaultDB();
    d.categories.forEach(c=>{ if(!db.categories.find(x=>x.id===c.id)) db.categories.push(c); });
    d.products.forEach(p=>{ if(!db.products.find(x=>x.id===p.id)) db.products.push(p); });
    if(!db.coupons) db.coupons=d.coupons;
    if(!db.reviews) db.reviews=d.reviews;
    if(!db.commissions) db.commissions=d.commissions;
    localStorage.setItem(DB_KEY,JSON.stringify(db));
    return db;
   }
  }catch(e){}
  const d=defaultDB(); localStorage.setItem(DB_KEY,JSON.stringify(d)); return d;
 },
 save(db){ localStorage.setItem(DB_KEY,JSON.stringify(db)); if(Store.mode==='staff') Store.pushRemote(); },
 reset(){ localStorage.removeItem(DB_KEY); return this.load(); }
};

// ===== BACKEND COMPARTILHADO (Vercel + Upstash) =====
// Quando configurado, tudo que o staff muda no painel passa a valer para
// todos os clientes, em qualquer dispositivo. Sem configuracao, continua
// funcionando com localStorage (modo offline).
const SITE_ID='legend';
const API='/api/store';
const PUB='/api/public';
let remoteOnline=false, pushTimer=null, inFlight=false, queued=false;

async function sha256hex(text){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function hashSenha(senha){ return await sha256hex(SITE_ID+'::'+senha); }
function passHashSalvo(){ return localStorage.getItem(DB_KEY+'_hash')||''; }

Object.assign(Store,{
 mode:'client',          // 'staff' faz o save() subir para o banco
 get online(){ return remoteOnline; },

 async apiGet(){
  const r=await fetch(API+'?site='+SITE_ID,{cache:'no-store'});
  const j=await r.json();
  if(!r.ok||!j.ok) throw new Error(j.error||('http '+r.status));
  return j.data;
 },
 async apiPut(data,passHash){
  const r=await fetch(API+'?site='+SITE_ID,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({passHash,data})});
  const j=await r.json();
  if(!r.ok||!j.ok) throw new Error(j.error||('http '+r.status));
  return j;
 },
 async apiAuth(passHash){
  const r=await fetch(API+'?site='+SITE_ID,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passHash})});
  const j=await r.json();
  if(!r.ok) throw new Error(j.error||('http '+r.status));
  return j;
 },
 async pub(body){
  const r=await fetch(PUB+'?site='+SITE_ID,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();
  if(!r.ok||!j.ok) throw new Error(j.error||('http '+r.status));
  return j;
 },

 // baixa a versao do servidor (fonte da verdade) para o navegador
 async hydrate(){
  try{
   let remoto=await this.apiGet();
   // o servidor pode devolver objeto ou texto JSON (ex.: bancos antigos)
   if(typeof remoto==='string'){ try{remoto=JSON.parse(remoto)}catch(e){remoto=null} }
   remoteOnline=true;
   if(remoto&&typeof remoto==='object'&&Array.isArray(remoto.products)){
    localStorage.setItem(DB_KEY,JSON.stringify(remoto));
    localStorage.setItem(DB_KEY+'_sync','1');
   }
   return true;
  }catch(e){ remoteOnline=false; return false; }
 },

 // sobe o catalogo/pedidos do painel para o servidor
 async pushRemote(){
  if(remoteOnline===false) return false;
  const passHash=passHashSalvo();
  if(!passHash) return false;
  if(inFlight){ queued=true; return false; }
  inFlight=true;
  try{
   const db=Store.load();
   delete db.passHash;
   await this.apiPut(db,passHash);
   remoteOnline=true;
  }catch(e){
   if(/Senha incorreta/.test(e.message||'')) remoteOnline=false;
  }finally{
   inFlight=false;
   if(queued){ queued=false; setTimeout(()=>Store.pushRemote(),1200); }
  }
  return true;
 },
 pushSoon(){ if(remoteOnline) setTimeout(()=>Store.pushRemote(),700); },

 async setSenha(senha){
  const h=await hashSenha(senha);
  localStorage.setItem(DB_KEY+'_hash',h);
  return h;
 }
});
// === PIX BR Code real (EMVCo) ===
function pixCRC16(s){let crc=0xFFFF;for(let i=0;i<s.length;i++){crc^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++){crc=(crc&0x8000)?((crc<<1)^0x1021):(crc<<1);crc&=0xFFFF}}return crc.toString(16).toUpperCase().padStart(4,'0')}
function tlv(id,v){return id+String(v.length).padStart(2,'0')+v}
function genPixCode(key,name,city,amount,txid){
 key=String(key||'').trim(); name=String(name||'LEGEND').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(0,25)||'LEGEND';
 city=String(city||'BRASIL').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(0,15)||'BRASIL';
 txid=String(txid||'LEGEND').replace(/[^a-zA-Z0-9]/g,'').slice(0,20)||'LEGEND';
 const gui=tlv('00','br.gov.bcb.pix')+tlv('01',key);
 let p=tlv('00','01')+tlv('26',gui)+tlv('52','0000')+tlv('53','986')+(amount>0?tlv('54',Number(amount).toFixed(2)):'')+tlv('58','BR')+tlv('59',name)+tlv('60',city)+tlv('62',tlv('05',txid))+tlv('63','04');
 return p+pixCRC16(p+'6304');
}
// Modelos para o staff recomeçar o catálogo em 1 clique (painel → Produtos)
function sampleProducts(){ return [
 {id:'samp-gamepass',name:'Xbox Game Pass Ultimate — 30 Dias',cat:'assinaturas',price:24.9,old:49.9,emoji:'🎮',img:DEFAULT_IMG('7997f56a-541a-4960-a5b2-93df755ea286'),stock:20,delivery:'Automática',desc:'Conta compartilhada, 30 dias.'},
 {id:'samp-minecraft',name:'Minecraft Java & Bedrock',cat:'minecraft',price:29.9,old:99.9,emoji:'⛏️',img:DEFAULT_IMG('e7332bab-95b1-4097-9df3-73e6dd2e7ef3'),stock:20,delivery:'Automática',desc:'Full acesso Java + Bedrock.'},
 {id:'samp-vbucks',name:'100 V-Bucks Fortnite',cat:'fortnite',price:7.9,old:12.9,emoji:'⚡',img:DEFAULT_IMG('568c647a-faf3-489c-bb88-60666644e150'),stock:50,delivery:'Automática',desc:'Gift via Epic.'}
];}
