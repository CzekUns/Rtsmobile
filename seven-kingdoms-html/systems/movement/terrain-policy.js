/** Isolated 7KAA terrain policy. GPL-2.0-or-later.
 * Reference: 7kaa OSPATH.cpp can_move_to; OWORLD.cpp check_unit_space.
 * Search exceptions are NOT collision reservations or pixel movement.
 */
export const MOBILE_TYPES=Object.freeze({LAND:'land',SEA:'sea',AIR:'air'});
const isInt=Number.isSafeInteger;
export function canTraverseTile({tile,mobileType,unit,mode='normal',targetId,regionId,isNationPassable}={}){
  if(!tile||typeof tile.walkable!=='boolean'||typeof tile.sailable!=='boolean')throw new TypeError('tile must include walkable/sailable booleans');
  if(!Object.values(MOBILE_TYPES).includes(mobileType))throw new TypeError('unknown mobileType');
  if(!['normal','moving-group','attack-target'].includes(mode))throw new TypeError('unknown search mode');
  if(isNationPassable!==undefined&&typeof isNationPassable!=='function')throw new TypeError('invalid nation policy');
  if(regionId!==undefined&&(!isInt(regionId)||regionId<0))throw new TypeError('invalid regionId');
  if(mobileType!=='air'&&regionId!==undefined&&tile.regionId!==regionId)return false;
  if(mobileType==='land'){
    if(!tile.walkable)return false;
    if(isNationPassable&&tile.powerNation&&!isNationPassable(tile.powerNation))return false;
  }
  if(mobileType==='sea'&&!tile.sailable)return false;
  const occupant=mobileType==='air'?tile.airCargo:tile.cargo;
  if(!occupant)return true;
  if(unit&&unit.id===occupant.id)return true;
  if(mode==='attack-target')return targetId!==undefined&&occupant.id===targetId;
  if(mode==='moving-group')return occupant.moving===true&&(mobileType!=='land'||occupant.isCaravan!==true);
  return false;
}
/** Top-left rectangular footprint, includes optional buildFlag site restrictions. */
export function canPlaceFootprint({width,height,at,size={width:1,height:1},getTile,mobileType,unit,regionId,isNationPassable,build=false}={}){
  if(![width,height,at?.x,at?.y,size?.width,size?.height].every(isInt)||width<1||height<1||size.width<1||size.height<1||at.x<0||at.y<0||at.x+size.width>width||at.y+size.height>height)return false;
  if(typeof getTile!=='function')throw new TypeError('getTile required');
  for(let y=at.y;y<at.y+size.height;y++)for(let x=at.x;x<at.x+size.width;x++){
    const tile=getTile(x,y);
    if(!canTraverseTile({tile,mobileType,unit,regionId,isNationPassable}))return false;
    if(build&&(tile.powerOff===true||tile.hasSite===true))return false;
  }
  return true;
}
/** Validate caller-supplied tile sequence; does not run A* or reserve cells.
 * No corner cutting is a provisional conservative rule, NOT proven C++ parity.
 */
export function validateTileRoute({path,width,height,getTile,mobileType,unit,size,regionId}={}){
  if(!Array.isArray(path)||!path.length)return false;
  for(let i=0;i<path.length;i++){
    const at=path[i],base={width,height,at,getTile,mobileType,unit,size,regionId};
    if(!canPlaceFootprint(base))return false;
    if(i===0)continue;
    const prev=path[i-1],dx=at.x-prev.x,dy=at.y-prev.y;
    if((dx===0&&dy===0)||Math.abs(dx)>1||Math.abs(dy)>1)return false;
    if(dx&&dy&&(!canPlaceFootprint({...base,at:{x:prev.x+dx,y:prev.y}})||!canPlaceFootprint({...base,at:{x:prev.x,y:prev.y+dy}})))return false;
  }
  return true;
}
