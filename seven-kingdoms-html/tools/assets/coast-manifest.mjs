// SKH-TERRAIN-001: fail-closed registry for verified 7KAA coast records.
// This module deliberately does not synthesize coast art or assume upstream record IDs.
export function validateCoastManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { ok: false, errors: ['manifest must be an object'] };
  const source = manifest.source;
  if (!source || typeof source !== 'object' || !/^https:\/\//.test(source.url || '')) errors.push('source.url must be HTTPS');
  if (!source || !/^[0-9a-f]{40}$/.test(source.commit || '')) errors.push('source.commit must be a full Git SHA');
  if (!source || source.license !== 'GPL-2.0-or-later' && source?.license !== 'GPL-2.0-only') errors.push('source.license must be verified GPL-2.0');
  if (!source || !/^[0-9a-f]{64}$/.test(source.sha256 || '')) errors.push('source.sha256 must be a verified SHA-256');
  if (!Array.isArray(manifest.records) || !manifest.records.length) errors.push('records must be nonempty');
  const seen = new Set();
  for (const [i, record] of (Array.isArray(manifest.records) ? manifest.records : []).entries()) {
    if (!record || !Number.isSafeInteger(record.id) || record.id < 0) { errors.push('records[' + i + '].id invalid'); continue; }
    if (seen.has(record.id)) errors.push('duplicate record id ' + record.id);
    seen.add(record.id);
    if (!Number.isSafeInteger(record.offset) || record.offset < 0) errors.push('records[' + i + '].offset invalid');
    if (!Number.isSafeInteger(record.length) || record.length <= 0) errors.push('records[' + i + '].length invalid');
    if (!Array.isArray(record.corners) || record.corners.length !== 4 || record.corners.some(v => !['land','water'].includes(v))) errors.push('records[' + i + '].corners invalid');
    if (!record.upstreamLookup || typeof record.upstreamLookup !== 'string') errors.push('records[' + i + '].upstreamLookup required');
  }
  return { ok: errors.length === 0, errors };
}

export function resolveVerifiedCoastRecord(manifest, corners) {
  if (!validateCoastManifest(manifest).ok) return null;
  if (!Array.isArray(corners) || corners.length !== 4) return null;
  // Corner order must be documented by upstream before callers use this lookup.
  const matches = manifest.records.filter(r => r.corners.every((v, i) => v === corners[i]));
  return matches.length === 1 ? matches[0] : null;
}
