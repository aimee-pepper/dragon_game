// Dragon Import/Export — PNG with embedded metadata
//
// Exports a dragon as a PNG sprite image with the dragon's data
// (including full lineage) stored in a custom tEXt chunk. The PNG
// is a normal viewable image AND contains all the data needed to
// reconstruct the dragon and its entire family tree.
//
// Import reads the tEXt chunk back out, remaps all IDs to avoid
// collisions, and recreates the dragon + ancestors via Dragon.fromSaveData().

import { Dragon } from './dragon.js';
import { renderDragon } from './sprite-renderer.js';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const TEXT_CHUNK_KEY = 'DragonKeeper';

// ─── CRC32 (table-based) ────────────────────────────────────

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── PNG Chunk Helpers ───────────────────────────────────────

/**
 * Read a 4-byte big-endian unsigned int from a DataView.
 */
function readU32(view, offset) {
  return view.getUint32(offset, false); // big-endian
}

/**
 * Inject a tEXt chunk into a PNG ArrayBuffer.
 * Inserts right after the IHDR chunk (before any IDAT).
 *
 * tEXt chunk layout:
 *   [4 bytes: data length] [4 bytes: "tEXt"] [keyword\0text] [4 bytes: CRC]
 */
function injectPNGText(pngBuf, keyword, text) {
  const src = new Uint8Array(pngBuf);
  const view = new DataView(pngBuf);

  // Find the end of the IHDR chunk (8-byte signature + IHDR chunk)
  // IHDR chunk: 4 (length) + 4 (type) + length (data) + 4 (CRC)
  const ihdrLen = readU32(view, 8); // length field of IHDR
  const insertPos = 8 + 4 + 4 + ihdrLen + 4; // after signature + full IHDR chunk

  // Build the tEXt chunk
  const keyBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);
  const dataLen = keyBytes.length + 1 + textBytes.length; // keyword + null separator + text

  // Chunk: length(4) + type(4) + data(dataLen) + crc(4)
  const chunk = new Uint8Array(4 + 4 + dataLen + 4);
  const chunkView = new DataView(chunk.buffer);

  // Length
  chunkView.setUint32(0, dataLen, false);

  // Type: "tEXt"
  chunk[4] = 0x74; // t
  chunk[5] = 0x45; // E
  chunk[6] = 0x58; // X
  chunk[7] = 0x74; // t

  // Data: keyword + \0 + text
  chunk.set(keyBytes, 8);
  chunk[8 + keyBytes.length] = 0; // null separator
  chunk.set(textBytes, 8 + keyBytes.length + 1);

  // CRC (covers type + data)
  const crcData = chunk.slice(4, 4 + 4 + dataLen);
  chunkView.setUint32(4 + 4 + dataLen, crc32(crcData), false);

  // Assemble: [before insert] + [tEXt chunk] + [after insert]
  const result = new Uint8Array(src.length + chunk.length);
  result.set(src.subarray(0, insertPos), 0);
  result.set(chunk, insertPos);
  result.set(src.subarray(insertPos), insertPos + chunk.length);

  return result.buffer;
}

/**
 * Extract a tEXt chunk value from a PNG ArrayBuffer.
 * Scans all chunks for a tEXt with matching keyword.
 * Returns the text string, or null if not found.
 */
function extractPNGText(pngBuf, keyword) {
  const data = new Uint8Array(pngBuf);
  const view = new DataView(pngBuf);
  let offset = 8; // skip PNG signature

  while (offset < data.length - 8) {
    const chunkLen = readU32(view, offset);
    const typeBytes = data.subarray(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);

    if (type === 'tEXt') {
      // Parse keyword\0text
      const chunkData = data.subarray(offset + 8, offset + 8 + chunkLen);
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx >= 0) {
        const key = new TextDecoder().decode(chunkData.subarray(0, nullIdx));
        if (key === keyword) {
          return new TextDecoder().decode(chunkData.subarray(nullIdx + 1));
        }
      }
    }

    // Move to next chunk: length(4) + type(4) + data(chunkLen) + CRC(4)
    offset += 4 + 4 + chunkLen + 4;

    // Stop at IEND
    if (type === 'IEND') break;
  }

  return null;
}

// ─── Lineage Collection ──────────────────────────────────────

/**
 * Walk a dragon's parentIds to collect the full ancestor tree.
 * Returns a Map of id → dragon for the subject + all ancestors.
 */
function collectLineage(dragon, registry) {
  const collected = new Map();
  const queue = [dragon];

  while (queue.length > 0) {
    const d = queue.shift();
    if (collected.has(d.id)) continue;
    collected.set(d.id, d);

    if (d.parentIds) {
      for (const pid of d.parentIds) {
        if (!collected.has(pid)) {
          const parent = registry.get(pid);
          if (parent) queue.push(parent);
        }
      }
    }
  }

  return collected;
}

// ─── Export ──────────────────────────────────────────────────

/**
 * Export a dragon as a PNG with embedded metadata.
 * Includes the full lineage (all ancestors) in the export data.
 * Renders the sprite, injects dragon data as a tEXt chunk,
 * and triggers a file download.
 *
 * @param {Dragon} dragon - The dragon to export
 * @param {Object} registry - The dragon registry (for ancestor lookup)
 */
export async function exportDragonPNG(dragon, registry) {
  // 1. Render sprite to canvas (full size)
  const canvas = await renderDragon(dragon.phenotype, {
    compact: false,
    fallbackToTest: true,
  });

  if (!canvas) {
    throw new Error('Failed to render dragon sprite');
  }

  // 2. Canvas → PNG blob → ArrayBuffer
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/png'
    );
  });
  const buf = await blob.arrayBuffer();

  // 3. Collect the subject + all ancestors
  const lineage = collectLineage(dragon, registry);
  const dragons = {};
  for (const [id, d] of lineage) {
    dragons[id] = d.toSaveData();
  }

  // 4. Build export payload
  const payload = {
    v: 1,                   // export format version
    subjectId: dragon.id,   // which dragon is the "main" one
    dragons,                // all dragons keyed by original ID
  };
  const json = JSON.stringify(payload);

  // 5. Inject tEXt chunk
  const pngWithMeta = injectPNGText(buf, TEXT_CHUNK_KEY, json);

  // 6. Download
  const dlBlob = new Blob([pngWithMeta], { type: 'image/png' });
  const url = URL.createObjectURL(dlBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dragon.name}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ──────────────────────────────────────────────────

/**
 * Import a dragon (and its lineage) from a PNG file with embedded metadata.
 * All dragons get fresh IDs to avoid collisions. parentIds are remapped.
 * Returns { subject: Dragon, ancestors: Dragon[] }.
 * Throws if the image has no dragon data or it's invalid.
 */
export async function importDragonPNG(file) {
  // 1. Read file → ArrayBuffer
  const buf = await file.arrayBuffer();

  // 2. Verify it's a PNG
  const sig = new Uint8Array(buf, 0, 8);
  const isPNG = PNG_SIGNATURE.every((b, i) => sig[i] === b);
  if (!isPNG) {
    throw new Error('Not a valid PNG file');
  }

  // 3. Extract tEXt chunk
  const json = extractPNGText(buf, TEXT_CHUNK_KEY);
  if (!json) {
    throw new Error('No dragon data found in this image');
  }

  // 4. Parse payload
  let payload;
  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error('Invalid dragon data in image');
  }

  // 5. Handle both formats: new (v1 with lineage) and legacy (single dragon)
  if (payload.v === 1 && payload.dragons) {
    return importWithLineage(payload);
  } else {
    // Legacy format: single dragon object (no lineage wrapper)
    return importSingleDragon(payload);
  }
}

/**
 * Import a full lineage export (v1 format).
 * Remaps all IDs so nothing collides with existing dragons.
 */
function importWithLineage(payload) {
  const { subjectId, dragons } = payload;

  // Build ID remap: old ID → new Dragon instance
  // We create dragons in dependency order (parents before children)
  // so parentIds can be remapped correctly.

  // First pass: sort by generation (lowest first = oldest ancestors first)
  const entries = Object.entries(dragons).map(([id, data]) => ({
    oldId: Number(id),
    data,
  }));
  entries.sort((a, b) => (a.data.generation ?? 0) - (b.data.generation ?? 0));

  // Second pass: create dragons with remapped IDs
  const idMap = new Map(); // old ID → new Dragon
  const allDragons = [];

  for (const { oldId, data } of entries) {
    // Remap parentIds to new IDs
    if (data.parentIds) {
      data.parentIds = data.parentIds.map(pid => {
        const remapped = idMap.get(pid);
        return remapped ? remapped.id : null;
      });
      // If both parents couldn't be found, clear parentIds
      if (data.parentIds.every(p => p === null)) {
        data.parentIds = null;
      }
    }

    // Remap alleleOrigins is not needed — it's just 'A'/'B' labels

    // Create with fresh ID
    data.id = undefined;
    const dragon = Dragon.fromSaveData(data);
    idMap.set(oldId, dragon);
    allDragons.push(dragon);
  }

  // Find the subject dragon
  const subject = idMap.get(Number(subjectId));
  if (!subject) {
    throw new Error('Could not find subject dragon in export data');
  }

  const ancestors = allDragons.filter(d => d !== subject);
  return { subject, ancestors };
}

/**
 * Import a legacy single-dragon export (no lineage).
 */
function importSingleDragon(data) {
  data.id = undefined;
  data.parentIds = null;
  data.alleleOrigins = null;
  const dragon = Dragon.fromSaveData(data);
  return { subject: dragon, ancestors: [] };
}
