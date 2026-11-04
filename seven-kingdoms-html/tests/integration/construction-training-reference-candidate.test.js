import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/construction-training-reference-candidate.json', import.meta.url), 'utf8'));

test('construction training fixture is explicitly unverified, never a golden parity result', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.status, 'candidate-not-validated-against-wasm');
  assert.equal(fixture.source.wasmBuildMatch, 'unverified');
  assert.match(fixture.source.commit, /^[a-f0-9]{40}$/);
  assert.ok(fixture.evidenceRequiredBeforeParityClaim.some(x => /checksum/i.test(x)));
  assert.ok(fixture.evidenceRequiredBeforeParityClaim.some(x => /race/i.test(x)));
});

test('construction reference candidate pins race selection, cost, duration, skill and non-instant result', () => {
  const { scenario } = fixture;
  assert.deepEqual(scenario.actionSequence.slice(0, 3), ['select race row', 'select Train', 'select Construction']);
  assert.equal(scenario.expectedCandidate.costPerTrainee, 30);
  assert.equal(scenario.expectedCandidate.normalTrainingDays, 5);
  assert.equal(scenario.expectedCandidate.initialSkillLevel, 20);
  assert.equal(scenario.expectedCandidate.skill, 'construction');
  assert.equal(scenario.expectedCandidate.noCrossRacePopulationDebit, true);
  assert.equal(scenario.expectedCandidate.noInstantUnitOnEnqueue, true);
});

test('reference candidate requires failure and mid-training save/load observations', () => {
  const cases = fixture.scenario.failureCasesToVerify.join(' ');
  assert.match(cases, /insufficient treasury/);
  assert.match(cases, /no jobless residents/);
  assert.match(cases, /save\/load during active training/);
});
