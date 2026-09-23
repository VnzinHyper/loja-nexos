// Nexos System — DB compartilhado Loja + Staff (v2 completo)
const DB_KEY = 'nexos_db_v1';
const DEFAULT_IMG = (id)=>`https://nexosystem.site/cdn/stores/21101/packages/${id}.png`;
function defaultDB(){ return {
 settings:{
  storeName:'Nexos System',
  banner:'🎮 ENTRE NA COMUNIDADE DA NEXOS E RECEBA OFERTAS!',
  discord:'https://discord.gg/HbH4bSktez',
  instagram:'https://www.instagram.com/nexossystem/',
  whatsapp:'', pixKey:'seu-pix@nexosystem.site', pixName:'NEXOS SYSTEM', pixCity:'FORTALEZA',
  autoConfirmUrl:'',
  supportEmail:'suporte@nexosystem.site', phone:'(85) 98887-2126',
  cnpj:'GLAZUL SERVICOS DIGITAIS LTDA — CNPJ 68.712.202/0001-08',
  primary:'#7c5cff', secondary:'#00d4ff',
  heroTitle:'Bem-vindo(a) à',
  heroSub:'Produtos digitais selecionados, pagamento seguro e entrega sem enrolação.',
  rating:'4,6'
 },
 commissions:{steam:30, assinaturas:15, outros:12},
 categories:[
  {id:'assinaturas',label:'Assinaturas',icon:'🎟️'},
  {id:'steam-offline',label:'Steam Offline',icon:'💻'},
  {id:'fortnite',label:'Fortnite',icon:'⚡'},
  {id:'minecraft',label:'Minecraft & Hytale',icon:'⛏️'},
  {id:'discord',label:'Discord',icon:'💜'},
  {id:'redes-sociais',label:'Redes Sociais',icon:'📱'}
 ],
 products:[],
 coupons:[{code:'NEXOS10',percent:10}],
 orders:[], users:[], tickets:[], withdrawals:[], clicks:[],
 _v:2,
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
    // migração v2: garante tabelas novas
    db.users=db.users||[]; db.tickets=db.tickets||[]; db.withdrawals=db.withdrawals||[]; db.clicks=db.clicks||[];
    db.settings.pixCity=db.settings.pixCity||'FORTALEZA';
    db.settings.pixName=db.settings.pixName||'NEXOS SYSTEM';
    if(db.settings.autoConfirmUrl===undefined) db.settings.autoConfirmUrl='';
    // limpeza única: remove todos os produtos antigos (pedido do dono)
    if(db._v!==2){ db.products=[]; db._v=2; }
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
 save(db){ localStorage.setItem(DB_KEY,JSON.stringify(db)); },
 reset(){ localStorage.removeItem(DB_KEY); return this.load(); }
};
// === PIX BR Code real (EMVCo) ===
function pixCRC16(s){let crc=0xFFFF;for(let i=0;i<s.length;i++){crc^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++){crc=(crc&0x8000)?((crc<<1)^0x1021):(crc<<1);crc&=0xFFFF}}return crc.toString(16).toUpperCase().padStart(4,'0')}
function tlv(id,v){return id+String(v.length).padStart(2,'0')+v}
function genPixCode(key,name,city,amount,txid){
 key=String(key||'').trim(); name=String(name||'NEXOS').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(0,25)||'NEXOS';
 city=String(city||'BRASIL').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(0,15)||'BRASIL';
 txid=String(txid||'NEXOS').replace(/[^a-zA-Z0-9]/g,'').slice(0,20)||'NEXOS';
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
