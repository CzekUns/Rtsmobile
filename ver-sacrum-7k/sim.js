// Ver Sacrum · Le Genti - editable strategy simulation.
// Independent engine: no WebAssembly, no Seven Kingdoms source or assets.
export const MAP_W=64, MAP_H=48, TILE=28;
export const SAVE_KEY='ver-sacrum-le-genti-save-v1';
export const BUILDINGS=Object.freeze({
  village:{name:'Villaggio',size:4,cost:{wood:24,stone:10}},
  warehouse:{name:'Magazzino',size:3,cost:{wood:18,stone:8}},
  farm:{name:'Campo',size:3,cost:{wood:10}},
  market:{name:'Mercato',size:3,cost:{wood:22,stone:10}}
});
export const FACTIONS=Object.freeze([
  {id:0,name:'Genti della Primavera',color:'#d0a56f'},
  {id:1,name:'Genti del Guado',color:'#90b8c5'},
  {id:2,name:'Lega dei Colli',color:'#c49a92'}
]);
export const RESOURCE_NAMES={wood:'Legname',stone:'Pietra',food:'Cibo'};
const NAMES=['Aulo','Tana','Neria','Vibio','Velia','Maro','Ovia','Silio','Tita','Larth','Ruma','Numa','Festo','Atria','Volco','Caia','Numisia','Velsna'];
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function random(x,y,seed){
  let n=Math.imul(x+43,374761393)^Math.imul(y+83,668265263)^Math.imul(seed+9,2246822519);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
}
export function terrain(x,y,seed){
  const h=random(Math.floor(x/8),Math.floor(y/8),seed+119);
  const t=random(Math.floor(x/3),Math.floor(y/3),seed)*.75+random(x,y,seed+71)*.25;
  if(h>.83)return 'hill';
  if(t>.55)return 'forest';
  if(t<.2)return 'brush';
  return 'plain';
}
export class Strategy {
  constructor(seed=45172){
    this.seed=seed;this.day=1;this.dayFraction=0;this.paused=false;this.seq=1;
    this.people=[];this.buildings=[];this.resources=[];this.events=[];this.neighbours=[
      {owner:1,name:'Genti del Guado',influence:12,loyalty:48,relation:'Neutrali'},
      {owner:2,name:'Lega dei Colli',influence:5,loyalty:37,relation:'Neutrali'}
    ];
    this.createInitialWorld();
  }
  id(prefix){return prefix+(this.seq++);}
  event(message){
    this.events.unshift({day:this.day,message});
    if(this.events.length>45)this.events.length=45;
  }
  addBuilding(type,x,y,owner=0,done=true,initial={}){
    const b={id:this.id('b'),type,x,y,owner,done,progress:done?1:.05,
      stock:{food:0,wood:0,stone:0},production:0};
    Object.assign(b.stock,initial);this.buildings.push(b);return b;
  }
  addPerson(name,homeId,inside=true){
    const b=this.building(homeId);
    const p={id:this.id('p'),name,homeId,inside,owner:0,x:b.x+2,y:b.y+5,
      health:100,skills:{gather:1,build:1,farm:1,combat:1},soldier:false,
      cargo:{type:null,amount:0},task:null,progress:0};
    this.people.push(p);return p;
  }
  createInitialWorld(){
    const town=this.addBuilding('village',23,22);
    this.addBuilding('warehouse',30,23,0,true,{food:85,wood:76,stone:34});
    this.addBuilding('village',44,10,1);
    this.addBuilding('market',49,17,1);
    this.addBuilding('village',10,34,2);
    this.addBuilding('market',15,37,2);
    for(let i=0;i<10;i++)this.addPerson(NAMES[i],town.id,i>=5);
    for(let y=2;y<MAP_H-2;y++)for(let x=2;x<MAP_W-2;x++){
      const gap=Math.min(Math.hypot(x-25,y-24),Math.hypot(x-46,y-14),Math.hypot(x-13,y-36));
      if(gap<7)continue;
      const n=random(x,y,this.seed+33),kind=terrain(x,y,this.seed);
      let type;
      if(kind==='forest'&&n>.72)type='wood';
      else if(kind==='hill'&&n>.80)type='stone';
      else if(kind==='plain'&&n>.968)type='food';
      if(type)this.resources.push({id:this.id('r'),type,x:x+.5,y:y+.5,quantity:type==='food'?34:90,
        maximum:type==='food'?34:90});
    }
    this.event('Dieci persone hanno raggiunto il territorio delle Genti della Primavera.');
    this.event('Un villaggio e un magazzino sono già presenti.');
  }
  person(id){return this.people.find(p=>p.id===id);}
  building(id){return this.buildings.find(b=>b.id===id);}
  resource(id){return this.resources.find(r=>r.id===id);}
  get town(){return this.buildings.find(b=>b.type==='village'&&b.owner===0&&b.done);}
  get warehouses(){return this.buildings.filter(b=>b.type==='warehouse'&&b.owner===0&&b.done);}
  get villagers(){return this.people.filter(p=>p.owner===0);}
  get capacity(){return this.buildings.filter(b=>b.type==='village'&&b.owner===0&&b.done).length*16;}
  stocks(){
    const result={food:0,wood:0,stone:0};
    for(const b of this.warehouses)for(const k of Object.keys(result))result[k]+=(b.stock[k]||0);
    return result;
  }
  canPay(cost){
    const s=this.stocks();
    return Object.entries(cost).every(([key,val])=>(s[key]||0)>=val);
  }
  pay(cost){
    if(!this.canPay(cost))return false;
    for(const [type,amount] of Object.entries(cost)){
      let remaining=amount;
      for(const b of this.warehouses){
        const draw=Math.min(remaining,b.stock[type]||0);
        b.stock[type]-=draw;remaining-=draw;
        if(!remaining)break;
      }
    }
    return true;
  }
  footprint(b){return BUILDINGS[b.type].size;}
  center(b){return {x:b.x+this.footprint(b)/2,y:b.y+this.footprint(b)/2};}
  isOccupied(x,y,size){
    if(x<1||y<1||x+size>=MAP_W-1||y+size>=MAP_H-1)return true;
    return this.buildings.some(b=>x<b.x+this.footprint(b)&&x+size>b.x&&y<b.y+this.footprint(b)&&y+size>b.y);
  }
  createConstruction(type,x,y){
    const def=BUILDINGS[type];
    if(!def)return {ok:false,error:'Tipo di struttura sconosciuto.'};
    if(this.isOccupied(x,y,def.size))return {ok:false,error:'Terreno occupato o fuori dalla mappa.'};
    if(!this.pay(def.cost))return {ok:false,error:'Risorse insufficienti nei magazzini.'};
    const b=this.addBuilding(type,x,y,0,false);
    this.event('Fondato il cantiere: '+def.name+'.');
    const available=this.people.filter(p=>!p.inside&&!p.task);
    available.sort((a,c)=>distance(a,this.center(b))-distance(c,this.center(b)));
    if(available[0])this.assign(available[0],'build',b.id);
    return {ok:true,building:b};
  }
  mobilize(p){
    if(!p||!p.inside)return false;
    const town=this.building(p.homeId);
    if(!town||town.owner!==0||!town.done)return false;
    p.inside=false;p.x=town.x+2;p.y=town.y+this.footprint(town)+.7;p.task=null;
    this.event(p.name+' è uscito dal villaggio.');
    return true;
  }
  demobilize(p){if(!p)return false;p.soldier=false;this.event(p.name+' è tornato civile.');return true;}
  train(p){if(!p||p.inside)return false;p.soldier=true;p.skills.combat+=.3;this.event(p.name+' è stato mobilitato come soldato.');return true;}
  assign(p,kind,idOrPoint){
    if(!p||p.inside)return false;
    if(kind==='move')p.task={kind,x:idOrPoint.x,y:idOrPoint.y};
    else p.task={kind,id:idOrPoint,phase:'going'};
    p.progress=0;
    return true;
  }
  cancel(p){if(p)p.task=null;}
  nearestWarehouse(point){
    const list=this.warehouses.slice();
    list.sort((a,b)=>distance(this.center(a),point)-distance(this.center(b),point));
    return list[0]||null;
  }
  walk(p,target,dt,stop=.65){
    const d=distance(p,target);
    if(d<=stop)return true;
    const delta=Math.min(dt*2.9,d-stop);
    if(d>0){p.x+=(target.x-p.x)*delta/d;p.y+=(target.y-p.y)*delta/d;}
    return false;
  }
  deliver(p,dt){
    const dest=this.nearestWarehouse(p);
    if(!dest)return false;
    if(!this.walk(p,this.center(dest),dt,1.65))return false;
    if(p.cargo.amount){
      dest.stock[p.cargo.type]=(dest.stock[p.cargo.type]||0)+p.cargo.amount;
      this.event(p.name+' ha consegnato '+p.cargo.amount+' '+RESOURCE_NAMES[p.cargo.type].toLowerCase()+'.');
      p.cargo={type:null,amount:0};
    }
    return true;
  }
  updatePerson(p,dt){
    if(p.inside||!p.task)return;
    const t=p.task;
    if(t.kind==='move'){if(this.walk(p,t,dt,.14))p.task=null;return;}
    if(t.kind==='home'){
      const b=this.building(t.id);
      if(!b){p.task=null;return;}
      if(this.walk(p,this.center(b),dt,1.5)){p.inside=true;p.task=null;this.event(p.name+' è rientrato nel villaggio.');}
      return;
    }
    if(t.kind==='build'){
      const b=this.building(t.id);
      if(!b||b.done||b.owner!==0){p.task=null;return;}
      if(this.walk(p,this.center(b),dt,1.75)){
        b.progress=clamp(b.progress+dt*(.047+.006*p.skills.build),0,1);
        if(b.progress>=1){b.done=true;p.task=null;p.skills.build+=.4;this.event(p.name+' ha completato '+BUILDINGS[b.type].name+'.');}
      }
      return;
    }
    if(t.kind==='gather'){
      const node=this.resource(t.id);
      if(!node){p.task=null;return;}
      if(t.phase==='going'){
        if(!node.quantity){p.task=null;return;}
        if(this.walk(p,node,dt,.55))t.phase='collecting';
      }else if(t.phase==='collecting'){
        p.progress+=dt*(1.3+p.skills.gather*.12);
        while(p.progress>=1&&p.cargo.amount<8&&node.quantity>0){
          p.progress--;p.cargo.type=node.type;p.cargo.amount++;node.quantity--;
        }
        if(p.cargo.amount>=8||!node.quantity){t.phase='returning';p.skills.gather+=.02;}
      }else if(t.phase==='returning'){
        if(this.deliver(p,dt))t.phase=node.quantity>0?'going':'finished';
      }else p.task=null;
      return;
    }
    if(t.kind==='farm'){
      const b=this.building(t.id);
      if(!b||!b.done||b.type!=='farm'||b.owner!==0){p.task=null;return;}
      if(t.phase==='going'){
        if(this.walk(p,this.center(b),dt,1.2))t.phase='working';
      }else if(t.phase==='working'){
        p.progress+=dt*(.75+p.skills.farm*.12);
        while(p.progress>=1&&p.cargo.amount<8){p.progress--;p.cargo.type='food';p.cargo.amount++;}
        if(p.cargo.amount>=8){t.phase='returning';p.skills.farm+=.03;}
      }else if(t.phase==='returning'){
        if(this.deliver(p,dt))t.phase='going';
      }
    }
  }
  neighbour(owner){return this.neighbours.find(n=>n.owner===owner);}
  relation(n){
    return n.influence>=75&&n.loyalty>=55?'Alleate':n.influence>=30?'Amichevoli':'Neutrali';
  }
  gift(owner){
    const n=this.neighbour(owner);
    if(!n)return {ok:false,error:'Questa gente non esiste.'};
    if(!this.pay({food:5}))return {ok:false,error:'Servono 5 unità di cibo.'};
    n.influence=clamp(n.influence+12,0,100);n.loyalty=clamp(n.loyalty+4,0,100);
    n.relation=this.relation(n);
    this.event('Inviato un dono alle '+n.name+': influenza '+n.influence+'.');
    return {ok:true,relation:n.relation};
  }
  annex(owner){
    const n=this.neighbour(owner);
    if(!n)return {ok:false,error:'Fazione inesistente.'};
    if(n.influence<75||n.loyalty<55)return {ok:false,error:'La comunità non è ancora favorevole all’unione.'};
    const villages=this.buildings.filter(b=>b.owner===owner);
    for(const b of villages)b.owner=0;
    this.neighbours=this.neighbours.filter(a=>a.owner!==owner);
    this.event(n.name+' ha aderito alla nostra comunità senza combattere.');
    return {ok:true};
  }
  nextDay(){
    this.day++;
    const ration=Math.ceil(this.people.length/5);
    if(!this.pay({food:ration})){
      if(this.day%3===0)this.event('Le scorte alimentari sono insufficienti per la comunità.');
    }
    if(this.day%12===0&&this.stocks().food>=8&&this.people.length<this.capacity){
      const town=this.town;if(town){
        const p=this.addPerson(NAMES[(this.seq+this.day)%NAMES.length],town.id,true);
        this.event('La comunità accoglie un nuovo abitante: '+p.name+'.');
      }
    }
    if(this.day%8===0)for(const r of this.resources){
      if(r.type!=='stone'&&r.quantity<r.maximum)r.quantity=Math.min(r.maximum,r.quantity+3);
    }
  }
  update(dt){
    if(this.paused)return;
    for(const p of this.people)this.updatePerson(p,dt);
    this.dayFraction+=dt;
    while(this.dayFraction>=14){this.dayFraction-=14;this.nextDay();}
  }
  save(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(this));return true;}
    catch(_){return false;}
  }
  static restore(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(!raw)return null;
      const obj=JSON.parse(raw);
      if(obj.version!==1||!Array.isArray(obj.people)||!Array.isArray(obj.buildings)||!Array.isArray(obj.resources))return null;
      const game=Object.assign(Object.create(Strategy.prototype),obj);
      if(!game.neighbours||!Array.isArray(game.neighbours))return null;
      return game;
    }catch(_){return null;}
  }
  get version(){return 1;}
}
