import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCoastManifest, resolveVerifiedCoastRecord } from '../../tools/assets/coast-manifest.mjs';

const source = {url:'https://github.com/example/upstream',commit:'a'.repeat(40),license:'GPL-2.0-or-later',sha256:'b'.repeat(64)};
const rec = (id,corners) => ({id,offset:id*64,length:64,corners,upstreamLookup:'OTERRAIN.cpp:verified lookup'});
test('rejects missing provenance and empty records',()=> {
  assert.equal(validateCoastManifest({records:[]}).ok,false);
  assert.equal(resolveVerifiedCoastRecord({},['land','land','water','water']),null);
});
test('rejects duplicate IDs and unverified corner labels',()=> {
  assert.equal(validateCoastManifest({source,records:[rec(1,['land','land','water','water']),rec(1,['land','land','water','water'])]}).ok,false);
  assert.equal(validateCoastManifest({source,records:[rec(1,['land','land','water','unknown'])]}).ok,false);
});
test('matches only uniquely verified records and otherwise falls back',()=> {
  const m={source,records:[rec(1,['land','land','water','water']),rec(2,['water','water','land','land'])]};
  assert.equal(validateCoastManifest(m).ok,true);
  assert.equal(resolveVerifiedCoastRecord(m,['land','land','water','water']).id,1);
  assert.equal(resolveVerifiedCoastRecord(m,['water','land','water','land']),null);
  assert.equal(resolveVerifiedCoastRecord({...m,records:[m.records[0],rec(3,['land','land','water','water'])]},['land','land','water','water']),null);
});
