/* 7KAA preview catalog: only source-backed Norman sheets already shipped.
 * This is a visual catalog, not a claim of full building DBF parity.
 * The BASE:NORMAN art is 4x4; the current demo fort collision is 3x3.
 */
import {ORIGINAL_SHEETS} from './original-sprites.js';

const frozen = value => Object.freeze(value);
export const ORIGINAL_STRUCTURE_CATALOG = frozen({
  'BASE:NORMAN': frozen({
    sourceId:'BASE:NORMAN',
    race:'NORMAN',
    atlas:ORIGINAL_SHEETS.firm.path,
    atlasWidth:ORIGINAL_SHEETS.firm.width,
    atlasHeight:ORIGINAL_SHEETS.firm.height,
    sourceFootprint: frozen({width:4,height:4,unit:'tile'}),
    phases:frozen([0,1,2,3]),
    constructionPhaseCount:4,
    frameWidth:ORIGINAL_SHEETS.firm.cellWidth,
    frameHeight:ORIGINAL_SHEETS.firm.cellHeight,
    phaseColumns:ORIGINAL_SHEETS.firm.columns,
    status:'preview-only',
    collisionParity:false
  })
});
export const ORIGINAL_UNIT_CATALOG = frozen({
  'NORMAN:M': frozen({
    sourceId:'NORMAN:M',
    atlas:ORIGINAL_SHEETS.unit.path,
    atlasWidth:ORIGINAL_SHEETS.unit.width,
    atlasHeight:ORIGINAL_SHEETS.unit.height,
    frameWidth:ORIGINAL_SHEETS.unit.cellWidth,
    frameHeight:ORIGINAL_SHEETS.unit.cellHeight,
    directions:8,
    walkingFrames:6,
    directionOrder:'N,NE,E,SE,S,SW,W,NW',
    status:'preview-only'
  })
});
export function getOriginalStructure(id){return ORIGINAL_STRUCTURE_CATALOG[id]??null}
export function getOriginalUnit(id){return ORIGINAL_UNIT_CATALOG[id]??null}
export function validateOriginalCatalog(){
  const errors=[];
  for(const [id,entry] of Object.entries({...ORIGINAL_STRUCTURE_CATALOG,...ORIGINAL_UNIT_CATALOG})){
    const columns=entry.phaseColumns??entry.directions;
    const rows=entry.walkingFrames??1;
    const positiveInt=value=>Number.isSafeInteger(value)&&value>0;
    if(![entry.frameWidth,entry.frameHeight,entry.atlasWidth,entry.atlasHeight,columns,rows].every(positiveInt)){
      errors.push(id+': invalid atlas geometry');
      continue;
    }
    if(entry.frameWidth*columns!==entry.atlasWidth)errors.push(id+': atlas width mismatch');
    if(entry.frameHeight*rows!==entry.atlasHeight)errors.push(id+': atlas height mismatch');
    if(entry.sourceFootprint&&(!positiveInt(entry.sourceFootprint.width)||!positiveInt(entry.sourceFootprint.height)))errors.push(id+': invalid footprint');
    if(entry.phases){
      if(!Array.isArray(entry.phases)||entry.phases.length!==columns||
        entry.phases.some((phase,index)=>phase!==index)||
        entry.constructionPhaseCount!==entry.phases.length)errors.push(id+': invalid construction phases');
    }
    if(entry.directions&&entry.directionOrder!=='N,NE,E,SE,S,SW,W,NW')errors.push(id+': unverified direction order');
    if(!entry.atlas||entry.status!=='preview-only')errors.push(id+': source or preview status missing');
  }
  return errors;
}
