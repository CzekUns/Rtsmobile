const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","street-webgl.js"),"utf8");
assert.match(source,/webglcontextlost[\s\S]*?event\.preventDefault\(\)/);
assert.match(source,/webglcontextrestored[\s\S]*?stopped=false;[\s\S]*?resize\(\);[\s\S]*?requestFrame\(\)/);
assert.match(source,/function requestFrame\(\)[\s\S]*?if\(stopped\|\|frameRequested\)return/);
assert.match(source,/function frame\(\)[\s\S]*?frameRequested=false;[\s\S]*?if\(stopped\)return/);
console.log("WebGL context recovery source invariants passed");
