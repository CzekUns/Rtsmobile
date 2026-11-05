// Seven Kingdoms HTML Edition — independent tile movement primitives.
// Deterministic, no DOM, clock, random numbers or global state.
// GPL-2.0-or-later; movement behavior is provisional until C++ parity fixtures.
const DIRS = Object.freeze([[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]);
const key=(x,y,width)=>y*width+x;
const integer=(n)=>Number.isSafeInteger(n);
function dimensions(width,height) {
  if(!integer(width)||!integer(height)||width<1||height<1||width*height>10000000) throw new RangeError('invalid grid dimensions');
}
function sizeOf(size) {
  const w=size?.width??1,h=size?.height??1;
  if(!integer(w)||!integer(h)||w<1||h<1) throw new RangeError('invalid footprint');
  return {width:w,height:h};
}
function point(p) {if(!p||!integer(p.x)||!integer(p.y)) throw new TypeError('tile coordinates must be integers');}
const inside=(x,y,w,h)=>x>=0&&y>=0&&x<w&&y<h;
export function createGrid(width,height,{blocked=[],terrainBlocked}={}) {
  dimensions(width,height);
  const cells=new Uint8Array(width*height);
  for(const p of blocked) {point(p);if(!inside(p.x,p.y,width,height)) throw new RangeError('blocked tile outside grid');cells[key(p.x,p.y,width)]=1;}
  if(terrainBlocked!==undefined) {
    if(typeof terrainBlocked!=='function') throw new TypeError('terrainBlocked must be a function');
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(terrainBlocked(x,y))cells[key(x,y,width)]=1;
  }
  return Object.freeze({width,height,isBlocked:(x,y)=>!inside(x,y,width,height)||cells[key(x,y,width)]===1,
    snapshot:()=>Array.from(cells)});
}
// isBlocked receives (x,y), returns true if an obstacle OR another unit occupies tile.
export function canOccupy({width,height,at,size,isBlocked,ignore}={}) {
  dimensions(width,height);point(at);const s=sizeOf(size);
  if(typeof isBlocked!=='function')throw new TypeError('isBlocked callback required');
  if(!inside(at.x,at.y,width,height)||at.x+s.width>width||at.y+s.height>height)return false;
  for(let y=at.y;y<at.y+s.height;y++)for(let x=at.x;x<at.x+s.width;x++){
    if(ignore&&ignore(x,y))continue;
    if(isBlocked(x,y))return false;
  }
  return true;
}
function legalStep(a,b,params) {
  const dx=b.x-a.x,dy=b.y-a.y;
  if(Math.abs(dx)>1||Math.abs(dy)>1||(!dx&&!dy))return false;
  if(!canOccupy({...params,at:b}))return false;
  // Diagonal corner-cutting is forbidden, including for large units.
  if(dx&&dy) return canOccupy({...params,at:{x:a.x+dx,y:a.y}})
                   &&canOccupy({...params,at:{x:a.x,y:a.y+dy}});
  return true;
}
export function findPath({width,height,start,goal,isBlocked,maxNodes=width*height,size,allowDiagonal=true}={}) {
  dimensions(width,height);point(start);point(goal);sizeOf(size);
  if(typeof isBlocked!=='function')throw new TypeError('isBlocked callback required');
  if(!integer(maxNodes)||maxNodes<1)throw new RangeError('maxNodes must be positive integer');
  const params={width,height,size,isBlocked};
  if(!canOccupy({...params,at:start})||!canOccupy({...params,at:goal}))return [];
  if(start.x===goal.x&&start.y===goal.y)return [{x:start.x,y:start.y}];
  const n=width*height, g=new Float64Array(n).fill(Infinity),parent=new Int32Array(n).fill(-1),
    closed=new Uint8Array(n),opened=new Uint8Array(n),frontier=[];
  const startId=key(start.x,start.y,width),goalId=key(goal.x,goal.y,width);
  const heuristic=(x,y)=>{const dx=Math.abs(goal.x-x),dy=Math.abs(goal.y-y);return allowDiagonal?10*Math.max(dx,dy)+4*Math.min(dx,dy):10*(dx+dy);};
  g[startId]=0;frontier.push(startId);opened[startId]=1;
  let visited=0;
  while(frontier.length&&visited<maxNodes){
    // Tie-break: f, h, then insertion order (fixed N,NE,E,SE,S,SW,W,NW).
    let best=0,bf=Infinity,bh=Infinity;
    for(let i=0;i<frontier.length;i++){
      const id=frontier[i],x=id%width,y=Math.floor(id/width),h=heuristic(x,y),f=g[id]+h;
      if(f<bf||(f===bf&&h<bh)){best=i;bf=f;bh=h;}
    }
    const id=frontier.splice(best,1)[0];opened[id]=0;
    if(closed[id])continue;closed[id]=1;visited++;
    if(id===goalId) {
      const path=[];let current=id;
      while(current!==-1){path.push({x:current%width,y:Math.floor(current/width)});current=parent[current];}
      return path.reverse();
    }
    const a={x:id%width,y:Math.floor(id/width)};
    for(let d=0;d<DIRS.length;d++){
      if(!allowDiagonal&&d%2===1)continue;
      const [dx,dy]=DIRS[d],b={x:a.x+dx,y:a.y+dy};
      if(!legalStep(a,b,params))continue;
      const next=key(b.x,b.y,width),tentative=g[id]+(dx&&dy?14:10);
      if(tentative<g[next]) {
        g[next]=tentative;parent[next]=id;
        if(closed[next])closed[next]=0;
        if(!opened[next]){opened[next]=1;frontier.push(next);}
      }
    }
  }
  return [];
}
const orderedId=(a,b)=>String(a).localeCompare(String(b),'en',{numeric:false});
export function createOccupancy(width,height,{isTerrainBlocked=()=>false}={}) {
  dimensions(width,height);
  if(typeof isTerrainBlocked!=='function')throw new TypeError('isTerrainBlocked must be a function');
  const objects=new Map(),cells=new Map();
  const tiles=(at,size)=>{point(at);const s=sizeOf(size),result=[];
    if(!inside(at.x,at.y,width,height)||at.x+s.width>width||at.y+s.height>height)return null;
    for(let y=at.y;y<at.y+s.height;y++)for(let x=at.x;x<at.x+s.width;x++)result.push(key(x,y,width));
    return result;
  };
  const blocked=(x,y,excludeId)=>!inside(x,y,width,height)||isTerrainBlocked(x,y)||
    (cells.has(key(x,y,width))&&cells.get(key(x,y,width))!==excludeId);
  const place=(id,at,size={width:1,height:1})=>{
    if(id===undefined||id===null)throw new TypeError('entity id required');
    const area=tiles(at,size);if(!area||area.some(i=>blocked(i%width,Math.floor(i/width),id)))return false;
    const old=objects.get(id);if(old)for(const i of old.tiles)cells.delete(i);
    for(const i of area)cells.set(i,id);
    objects.set(id,{at:{...at},size:sizeOf(size),tiles:area});return true;
  };
  const remove=(id)=>{const old=objects.get(id);if(!old)return false;for(const i of old.tiles)cells.delete(i);objects.delete(id);return true;};
  return {width,height,place,remove,has:(id)=>objects.has(id),
    get:(id)=>{const o=objects.get(id);return o?{at:{...o.at},size:{...o.size}}:null;},
    occupant:(x,y)=>cells.get(key(x,y,width))??null,
    isBlocked:(x,y,excludeId)=>blocked(x,y,excludeId),
    canOccupy:(at,size,excludeId)=>canOccupy({width,height,at,size,isBlocked:(x,y)=>blocked(x,y,excludeId)}),
    findPath:(id,goal,options={})=>{const o=objects.get(id);if(!o)return [];return findPath({width,height,start:o.at,goal,size:o.size,
      ...options,isBlocked:(x,y)=>blocked(x,y,id)});},
    // A batch is atomic per tick: no same-target overlap, direct swaps or moving into occupied footprints.
    // Deterministic priority: explicit lexicographic ID ordering; losers remain in place and retry later.
    step:(moves)=>{
      if(!Array.isArray(moves))throw new TypeError('moves array required');
      const result=[];const seen=new Set();
      for(const m of [...moves].sort((a,b)=>orderedId(a.id,b.id))){
        if(seen.has(m.id)){result.push({id:m.id,moved:false,reason:'duplicate'});continue;}seen.add(m.id);
        const o=objects.get(m.id);
        if(!o){result.push({id:m.id,moved:false,reason:'missing'});continue;}
        point(m.to);
        const dx=m.to.x-o.at.x,dy=m.to.y-o.at.y;
        if(dx===0&&dy===0){result.push({id:m.id,moved:false,reason:'stationary'});continue;}
        if(!legalStep(o.at,m.to,{width,height,size:o.size,isBlocked:(x,y)=>blocked(x,y,m.id)})){
          result.push({id:m.id,moved:false,reason:'blocked'});continue;
        }
        place(m.id,m.to,o.size);result.push({id:m.id,moved:true,at:{...m.to}});
      }
      return result;
    },
    snapshot:()=>[...objects.entries()].sort((a,b)=>orderedId(a[0],b[0])).map(([id,o])=>({id,at:{...o.at},size:{...o.size}}))
  };
}
