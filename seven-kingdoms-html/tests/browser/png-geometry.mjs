// PNG 1x/2x geometry QA. Node built-ins only; never claims original 7KAA parity.
import {inflateSync} from 'node:zlib';
export function decodePng(png){
 const signature=Buffer.from([137,80,78,71,13,10,26,10]);
 if(!png.subarray(0,8).equals(signature))throw Error('Invalid PNG signature');
 let pos=8,width,height,depth,type,interlace;const parts=[];
 while(pos+12<=png.length){
  const len=png.readUInt32BE(pos),kind=png.toString('ascii',pos+4,pos+8);
  if(pos+12+len>png.length)throw Error('Truncated PNG chunk');
  const data=png.subarray(pos+8,pos+8+len);pos+=len+12;
  if(kind==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];interlace=data[12];}
  if(kind==='IDAT')parts.push(data);
  if(kind==='IEND')break;
 }
 if(!width||!height||depth!==8||![2,6].includes(type)||interlace!==0)throw Error('Unsupported PNG format '+JSON.stringify({width,height,depth,type,interlace}));
 const bpp=type===6?4:3,stride=width*bpp,raw=inflateSync(Buffer.concat(parts));
 if(raw.length!==(stride+1)*height)throw Error('Unexpected inflated PNG size');
 const pixels=Buffer.alloc(stride*height);let src=0;
 for(let y=0;y<height;y++){
  const filter=raw[src++],row=y*stride;
  for(let x=0;x<stride;x++){
   const left=x>=bpp?pixels[row+x-bpp]:0,up=y?pixels[row+x-stride]:0,ul=y&&x>=bpp?pixels[row+x-stride-bpp]:0;
   let pred=0;
   if(filter===1)pred=left;
   else if(filter===2)pred=up;
   else if(filter===3)pred=(left+up)>>1;
   else if(filter===4){const p=left+up-ul,a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-ul);pred=a<=b&&a<=c?left:b<=c?up:ul;}
   else if(filter!==0)throw Error('Unsupported PNG filter '+filter);
   pixels[row+x]=(raw[src++]+pred)&255;
  }
 }
 return {width,height,bpp,pixels};
}
export function compareScaleGeometry(one,two){
 if(two.width!==2*one.width||two.height!==2*one.height)throw Error('2x image geometry mismatch');
 let compared=0,changed=0,totalError=0;const step=4;
 for(let y=0;y<one.height;y+=step)for(let x=0;x<one.width;x+=step){
  const i=(y*one.width+x)*one.bpp,j=((y*2)*two.width+x*2)*two.bpp;
  let delta=0;for(let c=0;c<3;c++)delta+=Math.abs(one.pixels[i+c]-two.pixels[j+c]);
  totalError+=delta;changed+=delta>48?1:0;compared++;
 }
 return {sampleStep:step,samples:compared,differentSamples:changed,differentPercent:Number((100*changed/compared).toFixed(2)),meanRgbAbsoluteError:Number((totalError/(3*compared)).toFixed(2)),note:'Diagnostic only: animation, font rasterization and capture timing can differ; not 7KAA parity'};
}
