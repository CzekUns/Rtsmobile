import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {decodePng,compareScaleGeometry} from './png-geometry.mjs';

const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function chunk(name,data){
 const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
 // Decoder currently ignores CRC. Supply a placeholder CRC only in synthetic fixtures.
 return Buffer.concat([length,Buffer.from(name),data,Buffer.alloc(4)]);
}
function png(width,height,type,filters){
 const bpp=type===6?4:3,ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=type;
 const source=Buffer.from(Array.from({length:width*height*bpp},(_,i)=>(i*31+17)%256));
 const rows=[];let previous=Buffer.alloc(width*bpp);
 for(let y=0;y<height;y++){
  const row=source.subarray(y*width*bpp,(y+1)*width*bpp);
  const filter=filters[y%filters.length],encoded=Buffer.alloc(row.length+1);encoded[0]=filter;
  for(let x=0;x<row.length;x++){
   const a=x>=bpp?row[x-bpp]:0,b=previous[x],c=x>=bpp?previous[x-bpp]:0;
   let predictor=0;
   if(filter===1)predictor=a;
   if(filter===2)predictor=b;
   if(filter===3)predictor=(a+b)>>1;
   if(filter===4){const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);predictor=da<=db&&da<=dc?a:db<=dc?b:c;}
   encoded[x+1]=(row[x]-predictor+256)&255;
  }
  rows.push(encoded);previous=row;
 }
 return {source,bytes:Buffer.concat([signature,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))])};
}
test('PNG geometry decoder reconstructs all five PNG filters for RGB and RGBA',()=>{
 for(const type of [2,6]){
  const {source,bytes}=png(7,5,type,[0,1,2,3,4]);
  const decoded=decodePng(bytes);
  assert.equal(decoded.width,7);assert.equal(decoded.height,5);
  assert.equal(decoded.bpp,type===6?4:3);
  assert.deepEqual(decoded.pixels,source);
 }
});
test('2x geometry comparison is zero for exact nearest-neighbor scaling',()=>{
 const one=decodePng(png(8,8,2,[0]).bytes);
 const bpp=one.bpp,twoPixels=Buffer.alloc(16*16*bpp);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const src=(Math.floor(y/2)*8+Math.floor(x/2))*bpp;
  one.pixels.copy(twoPixels,(y*16+x)*bpp,src,src+bpp);
 }
 const report=compareScaleGeometry(one,{width:16,height:16,bpp,pixels:twoPixels});
 assert.equal(report.differentPercent,0);
 assert.equal(report.meanRgbAbsoluteError,0);
 assert.equal(report.samples,4);
});
test('2x geometry rejects mismatched dimensions and decoder rejects malformed input',()=>{
 const one=decodePng(png(8,8,2,[0]).bytes);
 assert.throws(()=>compareScaleGeometry(one,{width:15,height:16,bpp:3,pixels:Buffer.alloc(15*16*3)}),/geometry mismatch/);
 assert.throws(()=>decodePng(Buffer.from('not a png')),/signature/);
 const truncated=png(4,4,2,[0]).bytes.subarray(0,40);
 assert.throws(()=>decodePng(truncated),/Truncated PNG chunk|Unsupported PNG format/);
});
