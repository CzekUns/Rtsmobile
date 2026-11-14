// 7KAA ROCK record linkage, 1-based recnos and original indexed bitmap bytes.
// Sources: the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc
// include/OROCKRES.h and src/OROCKRES.cpp (GPL-2.0-or-later).
import {parseNatureDatabase} from './nature-database.mjs';
import {readPlantBitmap} from './nature-bitmap.mjs';

export function linkRockResources({rockDb,blockDb,bitmapDb,animDb,bitmapArchive}) {
  const rocks=parseNatureDatabase('ROCK',rockDb).records;
  const blocks=parseNatureDatabase('ROCKBLK',blockDb).records;
  const bitmaps=parseNatureDatabase('ROCKBMP',bitmapDb).records;
  const animations=parseNatureDatabase('ROCKANI',animDb).records;
  if(!(bitmapArchive instanceof Uint8Array))throw Error('invalid ROCK imported bitmap archive');
  const linkedBitmaps=bitmaps.map(b=>({...b,bitmap:readPlantBitmap(bitmapArchive,b.bitmapOffset)}));
  const linkedRocks=rocks.map(r=>{
    if(!r.id||!['R','D','E'].includes(r.type))throw Error('unknown ROCK type: '+r.id);
    if(r.width<1||r.width>4||r.height<1||r.height>4)throw Error('invalid ROCK footprint: '+r.id);
    const maxFrame=r.firstAnim? r.maxFrame:1;
    if(maxFrame<1||maxFrame>99)throw Error('invalid ROCK frame count: '+r.id);
    return {...r,maxFrame,blocks:[]};
  });
  // The source uses 1-based ROCKBLK.rock_recno, not the text rock_id.
  for(const block of blocks){
    const rock=linkedRocks[block.rockRecno-1];
    if(!rock||block.id!==rock.id)throw Error('ROCKBLK owner mismatch: '+block.id);
    if(block.x>=rock.width||block.y>=rock.height)throw Error('ROCKBLK outside footprint: '+block.id);
    if(rock.blocks.some(b=>b.x===block.x&&b.y===block.y))throw Error('duplicate ROCKBLK cell: '+block.id);
    const frames=[];
    for(let frame=1;frame<=rock.maxFrame;frame++){
      const bmp=linkedBitmaps[block.firstBitmap+frame-2];
      if(!bmp||bmp.id!==rock.id||bmp.x!==block.x||bmp.y!==block.y||bmp.frame!==frame)
        throw Error('ROCKBMP frame mismatch: '+rock.id+' '+block.x+','+block.y+' frame '+frame);
      frames.push({recordId:bmp.idNumber??(block.firstBitmap+frame-1),frame,bitmap:bmp.bitmap});
    }
    rock.blocks.push({recordId:block.idNumber??null,x:block.x,y:block.y,frames});
  }
  for(const rock of linkedRocks){
    if(!rock.blocks.length)throw Error('ROCK missing blocks: '+rock.id);
    if(rock.firstAnim){
      for(let frame=1;frame<=rock.maxFrame;frame++){
        const anim=animations[rock.firstAnim+frame-2];
        if(!anim||anim.id!==rock.id||anim.frame!==frame||
           anim.nextFrame<1||anim.nextFrame>rock.maxFrame||
           (anim.alternateFrame!==0&&(anim.alternateFrame<1||anim.alternateFrame>rock.maxFrame)))
          throw Error('ROCKANI sequence mismatch: '+rock.id+' frame '+frame);
      }
    }
  }
  return {rocks:linkedRocks,bitmapCount:linkedBitmaps.length,animationCount:animations.length};
}
