// Resource ecology: one visual marker is one persistent resource point.
(() => {
  'use strict';

  const oldGenerate=World.prototype.generate;

  function setupResource(r){
    if(r.type==='wood'||r.type==='food'){
      r.renewable=true;
      if(!Number.isSafeInteger(r.regrowDelay))r.regrowDelay=r.type==='wood'?900:600;
      if(r.depletedAt===undefined)r.depletedAt=null;
      if(r.regrowing===undefined)r.regrowing=false;
    }else{
      r.renewable=false;
      r.regrowing=false;
      r.depletedAt=null;
    }
    return r;
  }

  World.prototype.generate=function(){
    oldGenerate.call(this);
    const s=this.size,seed=this.seed,rng=new RNG(seed^0x51f15e5d),next=[];

    const add=(type,x,y,amount,extra={})=>{
      if(x<1||y<1||x>=s-1||y>=s-1)return null;
      const r=setupResource(new ResourceNode(type,x,y,amount));
      Object.assign(r,extra);
      r.naturalScale=10;
      next.push(r);
      return r;
    };

    // Renewable resources: every hex is its own node and owns its own quantity.
    for(let y=2;y<s-2;y++)for(let x=2;x<s-2;x++){
      const t=this.tile(x,y);
      if(!t||!BIOME[t.biome].walk)continue;

      if(t.biome==='forest'&&hash(x,y,seed+1401)>.34){
        const px=x+.5+((y&1)?0.22:0);
        const r=add('wood',px,y+.5,rng.int(34,72)*10);
        if(r){r.regrowDelay=900;r.resourceShape='hex';}
      }else if((t.biome==='grass'||t.biome==='scrub')&&hash(x,y,seed+1402)>.958){
        const px=x+.5+((y&1)?0.22:0);
        const r=add('food',px,y+.5,rng.int(18,38)*10);
        if(r){r.regrowDelay=600;r.resourceShape='hex';}
      }
    }

    // Non-renewable terrain resources: a cluster is many individual triangle nodes.
    const centers=[];
    const farEnough=(x,y)=>centers.every(c=>Math.hypot(c.x-x,c.y-y)>=7);

    for(let y=5;y<s-5;y++)for(let x=5;x<s-5;x++){
      const t=this.tile(x,y);
      if(!t||!['mountain','scrub'].includes(t.biome))continue;
      if(hash(x,y,seed+2401)>.991&&farEnough(x,y))centers.push({x:x+.5,y:y+.5});
    }

    for(let tries=0;centers.length<8&&tries<1200;tries++){
      const x=rng.int(5,s-6),y=rng.int(5,s-6),t=this.tile(x,y);
      if(t&&['mountain','scrub'].includes(t.biome)&&farEnough(x,y))centers.push({x:x+.5,y:y+.5});
    }

    centers.forEach((c,ci)=>{
      const metalRich=hash(Math.floor(c.x),Math.floor(c.y),seed+3401)>.68;
      const clusterId='terrain-'+ci;

      for(let row=-4;row<=4;row++)for(let col=-5;col<=5;col++){
        const edge=(col/5)*(col/5)+(row/4)*(row/4);
        const irregular=(hash(col+ci*17,row-ci*11,seed+4401)-.5)*.22;
        if(edge>1+irregular)continue;

        const px=c.x+col*.44+((row&1)?0.22:0);
        const py=c.y+row*.39;
        const t=this.tile(Math.floor(px),Math.floor(py));
        if(!t||!BIOME[t.biome].walk||['sea','river','marsh'].includes(t.biome))continue;

        const orientation=((row+col)&1)?'down':'up';
        const ironChance=metalRich?.28:.07;
        const type=rng.next()<ironChance?'iron':'stone';
        const amount=(type==='iron'?rng.int(75,115):rng.int(95,150))*10;
        const r=add(type,px,py,amount,{orientation,clusterId,resourceShape:'triangle'});
        if(r)r.renewable=false;
      }
    });

    this.resources=next;
  };

  Game.prototype.ensureResourceRules=function(){
    for(const r of this.world.resources)setupResource(r);
  };

  Game.prototype.resourceRegenerationDay=function(){
    this.ensureResourceRules();
    for(const r of this.world.resources){
      if(!r.renewable||r.cleared)continue;

      if(r.amount<=0){
        if(r.regrowing){
          r.regrowing=false;
          r.depletedAt=this.totalDays;
        }else if(r.depletedAt===null){
          r.depletedAt=this.totalDays;
        }else if(this.totalDays-r.depletedAt>=r.regrowDelay){
          r.amount=Math.max(1,Math.ceil(r.max*.08));
          r.regrowing=true;
          r.depletedAt=null;
        }
        continue;
      }

      if(r.regrowing&&r.amount<r.max){
        r.amount=Math.min(r.max,r.amount+Math.max(1,Math.ceil(r.max/240)));
        if(r.amount>=r.max)r.regrowing=false;
      }
    }
  };

  const oldAdvanceDay=Game.prototype.advanceDay;
  Game.prototype.advanceDay=function(){
    oldAdvanceDay.call(this);
    this.resourceRegenerationDay();
  };
})();