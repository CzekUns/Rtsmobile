// Reproducible indexed (8-bit) PNG encoder with uncompressed zlib DEFLATE.
// Used for authentic 7KAA indexed coast atlas. No palette interpolation.
const assert=(yes,msg)=>{if(!yes)throw Error(msg)};
const u32=n=>Buffer.from([n>>>24&255,n>>>16&255,n>>>8&255,n&255]);
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1}return (crc^0xffffffff)>>>0}
function chunk(name,data){const tag=Buffer.from(name,'ascii');return Buffer.concat([u32(data.length),tag,data,u32(crc32(Buffer.concat([tag,data])))])}
function adler32(data){let a=1,b=0;for(const byte of data){a=(a+byte)%65521;b=(b+a)%65521}return ((b<<16)|a)>>>0}
function zlibStore(raw){const chunks=[Buffer.from([0x78,0x01])];for(let at=0;at<raw.length;){const len=Math.min(65535,raw.length-at),end=at+len===raw.length;chunks.push(Buffer.from([end?1:0,len&255,len>>>8,(len^255)&255,((len>>>8)^255)&255]),raw.subarray(at,at+len));at+=len}chunks.push(u32(adler32(raw)));return Buffer.concat(chunks)}
export function encodeIndexedPng(width,height,pixels,palette){
 assert(Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&width>0&&height>0&&width*height<=10000000,'invalid PNG size');
 assert(pixels instanceof Uint8Array&&pixels.length===width*height,'PNG indexed pixels length mismatch');
 assert(palette instanceof Uint8Array&&palette.length===768,'PNG must use full 256-entry RGB palette');
 const scan=Buffer.alloc(height*(width+1));
 for(let y=0;y<height;y++)Buffer.from(pixels.buffer,pixels.byteOffset+y*width,width).copy(scan,y*(width+1)+1);
 const header=Buffer.concat([u32(width),u32(height),Buffer.from([8,3,0,0,0])]);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('PLTE',Buffer.from(palette)),chunk('IDAT',zlibStore(scan)),chunk('IEND',Buffer.alloc(0))]);
}
