const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=function createGame(initialStorage=[]){
const root=path.join(__dirname,'..');
const html=readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
const context2d=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function node(dataset={}){const classes=new Set();return {dataset,style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},listeners:{},addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)},setAttribute(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:390,height:600}),getContext:()=>context2d,showModal(){this.open=true},close(){this.open=false;for(const fn of this.listeners.close||[])fn()},querySelectorAll(){return [...(this.innerHTML||'').matchAll(/data-person="([^"]+)"/g)].map(m=>node({person:m[1]}))}}}
const byId=Object.fromEntries(ids.map(id=>[id,node()]));
const tabs=[...html.matchAll(/data-panel="([^"]+)"/g)].map(m=>node({panel:m[1]}));
const orders=[...html.matchAll(/data-order="([^"]+)"/g)].map(m=>node({order:m[1]}));
const builds=[...html.matchAll(/data-build="([^"]+)"/g)].map(m=>node({build:m[1]}));
const lists={'.dock-tab':tabs,'.dock-panel':tabs.map(t=>byId[t.dataset.panel]),'[data-order]':orders,'[data-build]':builds,'[data-order],[data-build]':[...orders,...builds]};
const storage=new Map(initialStorage);
const sandbox={console,performance,Math,Date,setTimeout:()=>0,clearTimeout(){},devicePixelRatio:1,crypto:require('node:crypto').webcrypto,requestAnimationFrame(){},addEventListener(){},navigator:{},confirm:()=>true,localStorage:{removeItem:k=>storage.delete(k),setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},document:{querySelector:s=>byId[s.slice(1)],querySelectorAll:s=>lists[s]||[],getElementById:id=>byId[id],addEventListener(){}},Image:class{constructor(){this.complete=true;this.naturalWidth=16}}};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const m of html.matchAll(/<script src="\.\/([^?]+)\?[^\"]+"><\/script>/g)){let code=readFileSync(path.join(root,m[1]),'utf8');if(m[1]==='boot.js')code=code.replace('const game = new Game();','globalThis.game=new Game();');vm.runInContext(code,sandbox,{filename:m[1]});}

return {g:sandbox.game,sandbox,storage,byId,tabs,orders,builds,run:code=>vm.runInContext(code,sandbox)};
};
