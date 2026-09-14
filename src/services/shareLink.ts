import type { ForecastInputs } from '../domain/types';
import { packInputs, unpackInputs } from './serialization';

const HASH_PARAM = 's';

function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** A URL fragment carrying the whole document, so a plain link shares the data. */
export function encodeShareHash(inputs: ForecastInputs): string {
  return `#${HASH_PARAM}=${base64UrlEncode(JSON.stringify(packInputs(inputs)))}`;
}

export function buildShareUrl(inputs: ForecastInputs, location: Location): string {
  return location.origin + location.pathname + location.search + encodeShareHash(inputs);
}

/** Inputs from a share link's hash, or null when the hash carries none. */
export function decodeShareHash(hash: string): ForecastInputs | null {
  const match = new RegExp(`[#&]${HASH_PARAM}=([A-Za-z0-9_-]+)`).exec(hash);
  if (!match) return null;
  try {
    return unpackInputs(JSON.parse(base64UrlDecode(match[1])));
  } catch {
    return null;
  }
}
