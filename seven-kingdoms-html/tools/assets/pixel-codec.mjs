// Original 7KAA indexed bitmap decoder (GNU GPL v2 or later).
// References: include/COLCODE.h, src/imgfun/generic/IB_TD.cpp,
// src/OVGA.cpp::load_pal, src/ORESDB.cpp::read_imported.
// The imported format is [u32 payload length][u16 width][u16 height][RLE bytes].
// It is NOT the Emscripten LZ4 container format.
import {deflateSync} from 'node:zlib';

const check=(condition,message)=>{if(!condition)throw Error(message)};
const read32=(b,p)=>b.readUInt32LE(p);
export function decodeImportedBitmap(buffer,offset=0) {
 check(Buffer.isBuffer(buffer),'Original bitmap source must be Buffer');
 check(Number.isSafeInteger(offset)&&offset>=0&&offset+8<=buffer.length,'Invalid bitmap offset');
 const length=read32(buffer,offset), end=offset+4+length;
 check(length>=4&&end<=buffer.length,'Truncated imported bitmap payload');
 const width=buffer.readUInt16LE(offset+4),height=buffer.readUInt16LE(offset+6);
 check(width>0&&height>0&&width*height<=16777216,'Invalid original bitmap dimensions');
 const pixels=Buffer.alloc(width*height,255);
 let pos=offset+8,at=0,opaque=0,transparent=0,runs=0;
 while(at<pixels.length) {
  check(pos<end,'Truncated bitmap RLE stream');
  const code=buffer[pos++];
  if(code<0xf8) { pixels[at++]=code; opaque++; }
  else {
   check(code!==0xf8||pos<end,'Truncated extended transparency run');
   const count=code===0xf8?buffer[pos++]:256-code;
   check(count>0&&at+count<=pixels.length,'Invalid transparent run length');
   at+=count; transparent+=count; runs++;
  }
 }
 check(pos===end,'Bitmap RLE has unconsumed bytes');
 return {width,height,pixels,opaque,transparent,runs,offset,recordLength:length};
}
export function decodeStandardPalette(data) {
 check(Buffer.isBuffer(data)&&data.length===8+256*3,'Invalid PAL_STD.RES length');
 // src/OVGA.cpp::load_pal seeks to byte 8, then reads RGB triplets.
 return Buffer.from(data.subarray(8));
}
export function indexedToRgba(bitmap,palette,{mirror=false,remap=null}={}) {
 check(bitmap?.pixels?.length===bitmap.width*bitmap.height,'Invalid decoded bitmap');
 check(palette?.length===768,'Expected 256 RGB palette entries');
 check(remap===null||(remap.length===256&&Array.from({length:8},(_,i)=>remap[248+i]===248+i).every(Boolean)),
   'Unverified remap table: transparency opcodes must be preserved');
 const rgba=Buffer.alloc(bitmap.width*bitmap.height*4);
 for(let y=0;y<bitmap.height;y++)for(let x=0;x<bitmap.width;x++){
  const sourceIndex=y*bitmap.width+x,destIndex=(y*bitmap.width+(mirror?bitmap.width-1-x:x))*4;
  const raw=bitmap.pixels[sourceIndex];
  if(raw===255) continue; // transparent skip pixels have no colour
  const index=remap?remap[raw]:raw;
  // OGAME.cpp maps OUTLINE_CODE (0xf2) to TRANSPARENT_CODE (0xff)
  // for unselected buildings. This must produce alpha=0, not a palette tint.
  if(index===255)continue;
  check(index<248,'Remap produced unsupported transparent control code');
  rgba[destIndex]=palette[index*3];rgba[destIndex+1]=palette[index*3+1];
  rgba[destIndex+2]=palette[index*3+2];rgba[destIndex+3]=255;
 }
 return rgba;
}
const crcTable=(()=>{const t=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[i]=c>>>0}return t})();
function crc32(buffer){let c=0xffffffff;for(const x of buffer)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function chunk(name,data){const type=Buffer.from(name,'ascii'),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([size,type,data,crc])}
export function encodePng(width,height,rgba){
 check(Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&width*height<=16777216,'Invalid PNG dimensions');
 check(rgba?.length===width*height*4,'Invalid RGBA pixel length');
 const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const scan=Buffer.alloc(height*(1+width*4));
 for(let y=0;y<height;y++)rgba.copy(scan,y*(1+width*4)+1,y*width*4,(y+1)*width*4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
// src/OGAME.cpp::init_remap_table + get_color_remap_table; source shades E0-E7 only.
// Scheme 0 is independent, 1..7 match the original nation palette slots.
export function nationRemapTable(colorSchemeId=0,{selected=false}={}){
 check(Number.isInteger(colorSchemeId)&&colorSchemeId>=0&&colorSchemeId<=7,
  'Original nation colour scheme must be 0..7');
 const primary=[0xbc,0xa0,0xa4,0xa8,0xac,0xb0,0xb4,0xb8][colorSchemeId];
 const secondary=[0xdc,0xc0,0xc4,0xc8,0xcc,0xd0,0xd4,0xd8][colorSchemeId];
 const remap=Uint8Array.from({length:256},(_,i)=>i);
 for(let i=0;i<4;i++){remap[0xe0+i]=primary+i;remap[0xe4+i]=secondary+i}
 remap[0xf2]=selected?0xef:0xff;remap[0xf3]=selected?0xef:0;
 return remap;
}
export function mirrorForDirection(direction,turnResolution){
 check(Number.isInteger(direction)&&direction>=0&&direction<24,'Invalid source display direction');
 // src/OSPRITE.cpp::need_mirror; the bitmap metadata remains unchanged.
 return (direction<8||turnResolution<=8)?((direction&7)>=5):((direction&7)>=4);
}
