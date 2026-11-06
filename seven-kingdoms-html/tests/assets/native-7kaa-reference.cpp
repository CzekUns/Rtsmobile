// GPL-2.0-or-later test-only native reference for 7KAA original bitmap draw logic.
// The RLE control flow follows 7kaa/src/imgfun/generic/IB_TD.cpp and IB_TRD.cpp.
// The shade remap follows 7kaa/src/OGAME.cpp::init_remap_table and the mirror
// selection follows 7kaa/src/OSPRITE.cpp::need_mirror.
// This is NOT a replacement engine; used only by tests to compare original bytes.
#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <iterator>
#include <vector>
static uint16_t read16(const std::vector<uint8_t>& b, size_t p) {
 if (p+2>b.size()) std::exit(3);
 return (uint16_t)b[p]|(uint16_t)(b[p+1]<<8);
}
static uint32_t read32(const std::vector<uint8_t>& b, size_t p) {
 if (p+4>b.size()) std::exit(3);
 return (uint32_t)b[p]|((uint32_t)b[p+1]<<8)|((uint32_t)b[p+2]<<16)|((uint32_t)b[p+3]<<24);
}
int main(int argc, char** argv) {
 if(argc!=3) return 2;
 const int scheme=std::atoi(argv[1]),direction=std::atoi(argv[2]);
 if (scheme<0||scheme>7||direction<0||direction>7) return 2;
 const std::vector<uint8_t> input(std::istreambuf_iterator<char>(std::cin),{});
 if (input.size()<8) return 3;
 const uint32_t payload=read32(input,0);
 const size_t end=4ull+payload;
 if (payload<4||input.size()!=end+776) return 3;
 const int width=read16(input,4),height=read16(input,6);
 if(width<=0||height<=0||width*height>16000000) return 3;
 const size_t pixelCount=(size_t)width*height;
 // Match the original IMGbltTransDecompress source loop, not the JS flat-loop.
 std::vector<uint8_t> decoded(pixelCount,255);
 size_t pos=8;
 int pixelsToSkip=0;
 for(int j=0;j<height;++j) {
  for(int i=0;i<width;++i) {
   if(pixelsToSkip!=0) {
    if(pixelsToSkip>=width-i) {
     pixelsToSkip-=width-i;
     break;
    }
    i+=pixelsToSkip;
    pixelsToSkip=0;
   }
   if(pos>=end) return 4;
   const int al=input[pos++];
   if(al<0xf8) decoded[(size_t)j*width+i]=al;
   else if(al==0xf8) {
    if(pos>=end) return 4;
    pixelsToSkip=(int)input[pos++]-1;
   } else pixelsToSkip=256-al-1;
  }
 }
 if(pos!=end) return 5;
 // Match OGAME.cpp get_color_remap_table for a non-selected unit.
 const int primary[8]={0xbc,0xa0,0xa4,0xa8,0xac,0xb0,0xb4,0xb8};
 const int secondary[8]={0xdc,0xc0,0xc4,0xc8,0xcc,0xd0,0xd4,0xd8};
 uint8_t mapping[256]; for(int i=0;i<256;i++) mapping[i]=(uint8_t)i;
 for(int i=0;i<4;i++) {mapping[0xe0+i]=primary[scheme]+i;mapping[0xe4+i]=secondary[scheme]+i;}
 mapping[0xf2]=0xff;mapping[0xf3]=0x00;
 const bool mirror=(direction>=5);
 std::vector<uint8_t> rgba(pixelCount*4,0);
 const size_t paletteBase=end+8;
 for(int y=0;y<height;y++)for(int x=0;x<width;x++) {
  const int raw=decoded[(size_t)y*width+x];
  if(raw==255) continue;
  const int index=mapping[raw];
  if(index==255)continue;
  if(index>=248) return 6;
  const size_t to=((size_t)y*width+(mirror?width-1-x:x))*4;
  for(int k=0;k<3;k++)rgba[to+k]=input[paletteBase+3*index+k];
  rgba[to+3]=255;
 }
 std::cout.write((const char*)rgba.data(),rgba.size());
 return std::cout.good()?0:7;
}
