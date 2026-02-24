// Dragon URL encoding/decoding — compact genotype representation for NFC stickers
//
// Encodes a full 23-gene genotype (46 allele values) into ~24 base64url characters.
// Each allele needs 3 bits (max value is 6 for body_size), so 46 × 3 = 138 bits = 18 bytes.
//
// URL format: ?d=BASE64&s=f&n=Emberclaw&de=1
//   d  = base64url-encoded genotype
//   s  = sex ('m' or 'f')
//   n  = name (URL-encoded, optional — auto-generated if missing)
//   de = dark energy flag (optional, '1' if true)

import { GENE_DEFS } from './gene-config.js';

// Deterministic gene order (alphabetical) — must be identical for encode and decode
export const GENE_ORDER = Object.keys(GENE_DEFS).sort();

// ─── Encode ─────────────────────────────────────────────────

/**
 * Pack a genotype into a base64url string.
 * Reads alleleA and alleleB for each gene in GENE_ORDER.
 */
export function encodeGenotype(genotype) {
  // Collect all 46 allele values in order
  const values = [];
  for (const gene of GENE_ORDER) {
    const pair = genotype[gene];
    values.push(pair[0]); // alleleA
    values.push(pair[1]); // alleleB
  }

  // Pack into 3-bit groups → bytes
  // 46 values × 3 bits = 138 bits → ceil(138/8) = 18 bytes
  const totalBits = values.length * 3;
  const byteCount = Math.ceil(totalBits / 8);
  const bytes = new Uint8Array(byteCount);

  let bitPos = 0;
  for (const val of values) {
    // Write 3 bits of val starting at bitPos
    const byteIdx = Math.floor(bitPos / 8);
    const bitOffset = bitPos % 8;

    // Place value in current byte (may span two bytes)
    bytes[byteIdx] |= (val & 0x7) << bitOffset;
    if (bitOffset > 5) {
      // Overflow into next byte
      bytes[byteIdx + 1] |= (val & 0x7) >> (8 - bitOffset);
    }

    bitPos += 3;
  }

  // Convert to base64url (no padding)
  return uint8ToBase64url(bytes);
}

/**
 * Decode a base64url string back into a genotype object.
 */
export function decodeGenotype(base64str) {
  const bytes = base64urlToUint8(base64str);
  const genotype = {};

  let bitPos = 0;
  for (const gene of GENE_ORDER) {
    const a = readBits(bytes, bitPos, 3);
    bitPos += 3;
    const b = readBits(bytes, bitPos, 3);
    bitPos += 3;

    // Clamp to valid range
    const def = GENE_DEFS[gene];
    genotype[gene] = [
      Math.min(Math.max(a, def.min), def.max),
      Math.min(Math.max(b, def.min), def.max),
    ];
  }

  return genotype;
}

/**
 * Build a full claim URL from dragon parameters.
 * @param {string} baseURL — the game's base URL (e.g. "https://example.com/")
 * @param {object} genotype
 * @param {string} sex — 'male' or 'female'
 * @param {string} name
 * @param {boolean} isDarkEnergy
 * @returns {string} full URL
 */
export function encodeDragonURL(baseURL, genotype, sex, name, isDarkEnergy) {
  const params = new URLSearchParams();
  params.set('d', encodeGenotype(genotype));
  params.set('s', sex === 'male' ? 'm' : 'f');
  if (name) params.set('n', name.slice(0, 20));
  if (isDarkEnergy) params.set('de', '1');
  return `${baseURL}?${params.toString()}`;
}

/**
 * Decode dragon parameters from URL search params.
 * Returns { genotype, sex, name, isDarkEnergy } or throws on invalid data.
 */
export function decodeDragonParams(urlParams) {
  const encoded = urlParams.get('d');
  if (!encoded) throw new Error('Missing dragon data parameter');

  const genotype = decodeGenotype(encoded);

  const sexParam = urlParams.get('s');
  const sex = sexParam === 'm' ? 'male' : 'female';

  const name = urlParams.get('n') || null; // null = auto-generate

  const isDarkEnergy = urlParams.get('de') === '1';

  return { genotype, sex, name, isDarkEnergy };
}

// ─── Bit Helpers ────────────────────────────────────────────

function readBits(bytes, bitPos, count) {
  let val = 0;
  for (let i = 0; i < count; i++) {
    const byteIdx = Math.floor((bitPos + i) / 8);
    const bitIdx = (bitPos + i) % 8;
    if (bytes[byteIdx] & (1 << bitIdx)) {
      val |= (1 << i);
    }
  }
  return val;
}

// ─── Base64url ──────────────────────────────────────────────
// Standard base64 with + → -, / → _, no padding (URL-safe)

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function uint8ToBase64url(bytes) {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++] || 0;
    const b1 = bytes[i++] || 0;
    const b2 = bytes[i++] || 0;

    result += B64_CHARS[(b0 >> 2) & 0x3F];
    result += B64_CHARS[((b0 & 0x3) << 4) | ((b1 >> 4) & 0xF)];
    if (i - 1 <= bytes.length) {
      result += B64_CHARS[((b1 & 0xF) << 2) | ((b2 >> 6) & 0x3)];
    }
    if (i <= bytes.length) {
      result += B64_CHARS[b2 & 0x3F];
    }
  }
  return result;
}

function base64urlToUint8(str) {
  // Build reverse lookup
  const lookup = {};
  for (let i = 0; i < B64_CHARS.length; i++) {
    lookup[B64_CHARS[i]] = i;
  }

  const bytes = [];
  let i = 0;
  while (i < str.length) {
    const c0 = lookup[str[i++]] || 0;
    const c1 = lookup[str[i++]] || 0;
    const c2 = (i < str.length) ? (lookup[str[i++]] || 0) : 0;
    const c3 = (i < str.length) ? (lookup[str[i++]] || 0) : 0;

    bytes.push((c0 << 2) | (c1 >> 4));
    bytes.push(((c1 & 0xF) << 4) | (c2 >> 2));
    bytes.push(((c2 & 0x3) << 6) | c3);
  }

  // Trim to expected length: ceil(46 * 3 / 8) = 18
  const expectedLen = Math.ceil(GENE_ORDER.length * 2 * 3 / 8);
  return new Uint8Array(bytes.slice(0, expectedLen));
}
