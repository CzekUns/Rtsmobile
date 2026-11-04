"use strict";
// Run from quartieri-ombra/: node tests/defeat.test.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
const marker = /if\(owned\(ENEMY\)\.length===TOTAL\|\|\(!owned\(PLAYER\)\.length&&!game\.units\.some\(u=>u\.side===PLAYER\)\)\)\{finish\(false\);return\}/;
assert.match(source, marker, "Defeat check must not depend on unusable gold");
const defeat = new Function("playerBuildings", "playerUnits", "enemyBuildings", "total",
  "return enemyBuildings===total || (playerBuildings===0 && playerUnits===0)");
for (const [label, input, expected] of [
  ["no buildings or units, even with gold", [0,0,3,15], true],
  ["one surviving unit may retake territory", [0,1,3,15], false],
  ["one surviving building permits hiring", [1,0,3,15], false],
  ["enemy owns all buildings", [0,0,15,15], true],
  ["normal ongoing match", [3,2,4,15], false]
]) {
  assert.equal(defeat(...input), expected, label);
  console.log("PASS", label);
}
