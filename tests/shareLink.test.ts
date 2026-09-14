import { describe, expect, it } from 'vitest';
import { decodeShareHash, encodeShareHash } from '../src/services/shareLink';
import { fromJson, toJson } from '../src/services/serialization';
import { DEFAULT_INPUTS } from '../src/state/defaults';

const inputs = { ...DEFAULT_INPUTS, sprints: [{ name: 'Sprint 24 (M1 due) — ünïcode', points: 21, stories: 6 }] };

describe('share link', () => {
  it('round-trips inputs through the URL hash', () => {
    const hash = encodeShareHash(inputs);
    expect(hash).toMatch(/^#s=[A-Za-z0-9_-]+$/);
    expect(decodeShareHash(hash)).toEqual(inputs);
  });

  it('ignores hashes without data', () => {
    expect(decodeShareHash('')).toBeNull();
    expect(decodeShareHash('#section-2')).toBeNull();
    expect(decodeShareHash('#s=not-base64-json')).toBeNull();
  });
});

describe('JSON transfer', () => {
  it('round-trips inputs through a file', () => {
    expect(fromJson(toJson(inputs))).toEqual(inputs);
  });

  it('writes the compact tuple form', () => {
    expect(JSON.parse(toJson(inputs)).sprints[0]).toEqual(['Sprint 24 (M1 due) — ünïcode', 21, 6]);
  });
});
