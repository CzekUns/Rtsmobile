(() => {
  'use strict';
  const CHUNK_SIZE=8,MAX_CACHED=20;
  const chunkKey=(x,y)=>`${x},${y}`;
  World.prototype.ensureChunkCache=function(){if(!(this.chunkCache instanceof Map))this.chunkCache=new Map();return this.chunkCache};
  World.prototype.loadChunk=function(cx,cy,pinned=false){
    const cols=Math.ceil(this.size/CHUNK_SIZE);if(cx<0||cy<0||cx>=cols||cy>=cols)return null;
    const cache=this.ensureChunkCache(),k=chunkKey(cx,cy);let chunk=cache.get(k);
    if(!chunk){const tiles=[];for(let y=cy*CHUNK_SIZE;y<Math.min(this.size,(cy+1)*CHUNK_SIZE);y++)for(let x=cx*CHUNK_SIZE;x<Math.min(this.size,(cx+1)*CHUNK_SIZE);x++)tiles.push(this.tiles[this.idx(x,y)]);chunk={key:k,cx,cy,tiles,lastUsed:0,pinned:false};cache.set(k,chunk)}
    chunk.lastUsed=(this.chunkClock=(this.chunkClock||0)+1);chunk.pinned=chunk.pinned||pinned;return chunk;
  };
  World.prototype.trimChunkCache=function(){
    const cache=this.ensureChunkCache();if(cache.size<=MAX_CACHED)return;
    for(const c of [...cache.values()].sort((a,b)=>a.lastUsed-b.lastUsed))if(cache.size>MAX_CACHED&&!c.pinned)cache.delete(c.key);
    for(const c of [...cache.values()].sort((a,b)=>a.lastUsed-b.lastUsed))if(cache.size>MAX_CACHED)cache.delete(c.key);
    for(const c of cache.values())c.pinned=false;
  };
  Game.prototype.refreshStreaming=function(){
    if(!this.world)return;const w=this.viewW||390,h=this.viewH||600,z=this.camera.zoom||1,x0=Math.floor((this.camera.x-w/2/z)/TILE/CHUNK_SIZE),x1=Math.floor((this.camera.x+w/2/z)/TILE/CHUNK_SIZE),y0=Math.floor((this.camera.y-h/2/z)/TILE/CHUNK_SIZE),y1=Math.floor((this.camera.y+h/2/z)/TILE/CHUNK_SIZE);
    for(let cy=y0-1;cy<=y1+1;cy++)for(let cx=x0-1;cx<=x1+1;cx++)this.world.loadChunk(cx,cy);
    const targets=new Set(this.units.map(u=>u.task?.target).filter(Boolean));for(const e of [...this.units,...this.buildings,...this.animals,...this.raiders,...this.world.resources])if(targets.has(e.id))this.world.loadChunk(Math.floor(e.x/CHUNK_SIZE),Math.floor(e.y/CHUNK_SIZE),true);
    this.world.trimChunkCache();
  };
  const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.pathBudget={maxExpansions:5000,lastExpansions:0};this.refreshStreaming()};
  const draw=Game.prototype.draw;Game.prototype.draw=function(){this.refreshStreaming();draw.call(this)};
  const snapshot=Game.prototype.snapshot;Game.prototype.snapshot=function(){const d=snapshot.call(this);d.streamingRules=1;d.streaming={chunkSize:CHUNK_SIZE,maxCached:MAX_CACHED};return d};
  const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok){this.pathBudget={maxExpansions:5000,lastExpansions:0};this.refreshStreaming()}return ok};
  window.TERRA_STREAMING={chunkSize:CHUNK_SIZE,maxCached:MAX_CACHED};
})();
